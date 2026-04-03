import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

import { ApiError, DEFAULT_BASE_URL, buildTextMessage, getUpdates, sendMessage, getConfig, sendTyping as apiSendTyping } from './api.js'
import { clearCredentials, loadCredentials, login, type Credentials } from './auth.js'
import { uploadMediaToCdn } from './cdn.js'
import { buildFileMessage, buildImageMessage, buildRefMessage, buildVideoMessage, buildVoiceMessage } from './media.js'
import {
  MessageItemType,
  MessageState,
  MessageType,
  UploadMediaType,
  type IncomingMessage,
  type MessageItem,
  type RefMessage,
  type WeixinMessage,
} from './types.js'

type MessageHandler = (msg: IncomingMessage) => void | Promise<void>

export interface WeixinBotOptions {
  baseUrl?: string
  tokenPath?: string
  onError?: (error: unknown) => void
}

export class WeixinBot {
  private baseUrl: string
  private readonly tokenPath?: string
  private readonly onErrorCallback?: (error: unknown) => void
  private readonly handlers: MessageHandler[] = []
  private readonly contextTokens = new Map<string, string>()
  private credentials?: Credentials
  private cursor = ''
  private stopped = false
  private currentPollController: AbortController | null = null
  private runPromise: Promise<void> | null = null

  constructor(options: WeixinBotOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL
    this.tokenPath = options.tokenPath
    this.onErrorCallback = options.onError
  }

  async login(options: { force?: boolean } = {}): Promise<Credentials> {
    const previousToken = this.credentials?.token
    const credentials = await login({
      baseUrl: this.baseUrl,
      tokenPath: this.tokenPath,
      force: options.force,
    })

    this.credentials = credentials
    this.baseUrl = credentials.baseUrl

    if (previousToken && previousToken !== credentials.token) {
      this.cursor = ''
      this.contextTokens.clear()
    }

    this.log(`Logged in as ${credentials.userId}`)
    return credentials
  }

  onMessage(handler: MessageHandler): this {
    this.handlers.push(handler)
    return this
  }

  on(event: 'message', handler: MessageHandler): this {
    if (event !== 'message') {
      throw new Error(`Unsupported event: ${event}`)
    }

    return this.onMessage(handler)
  }

  async reply(message: IncomingMessage, text: string): Promise<void> {
    this.contextTokens.set(message.userId, message._contextToken)
    await this.sendText(message.userId, text, message._contextToken)
    // Auto-cancel typing indicator after reply
    this.stopTyping(message.userId).catch(() => {})
  }

  async sendTyping(userId: string): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) {
      throw new Error(`No cached context token for user ${userId}. Reply to an incoming message first.`)
    }

    const credentials = await this.ensureCredentials()
    const config = await getConfig(this.baseUrl, credentials.token, userId, contextToken)
    if (!config.typing_ticket) {
      this.log('sendTyping: no typing_ticket returned by getconfig')
      return
    }

    await apiSendTyping(this.baseUrl, credentials.token, userId, config.typing_ticket, 1)
  }

  async stopTyping(userId: string): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) return

    const credentials = await this.ensureCredentials()
    const config = await getConfig(this.baseUrl, credentials.token, userId, contextToken)
    if (!config.typing_ticket) return

    await apiSendTyping(this.baseUrl, credentials.token, userId, config.typing_ticket, 2)
  }

  async send(userId: string, text: string): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) {
      throw new Error(`No cached context token for user ${userId}. Reply to an incoming message first.`)
    }

    await this.sendText(userId, text, contextToken)
  }

  async run(): Promise<void> {
    if (this.runPromise) {
      return this.runPromise
    }

    this.stopped = false
    this.runPromise = this.runLoop()

    try {
      await this.runPromise
    } finally {
      this.runPromise = null
      this.currentPollController = null
    }
  }

  stop(): void {
    this.stopped = true
    this.currentPollController?.abort()
  }

  private async runLoop(): Promise<void> {
    await this.ensureCredentials()
    this.log('Long-poll loop started.')
    let retryDelayMs = 1_000

    while (!this.stopped) {
      try {
        const credentials = await this.ensureCredentials()
        this.currentPollController = new AbortController()
        const updates = await getUpdates(
          this.baseUrl,
          credentials.token,
          this.cursor,
          this.currentPollController.signal,
        )

        this.currentPollController = null
        this.cursor = updates.get_updates_buf || this.cursor
        retryDelayMs = 1_000

        for (const raw of updates.msgs ?? []) {
          this.rememberContext(raw)
          const incoming = this.toIncomingMessage(raw)
          if (!incoming) {
            continue
          }

          await this.dispatchMessage(incoming)
        }
      } catch (error) {
        this.currentPollController = null

        if (this.stopped && isAbortError(error)) {
          break
        }

        if (isSessionExpired(error)) {
          this.log('Session expired. Waiting for a fresh QR login...')
          this.credentials = undefined
          this.cursor = ''
          this.contextTokens.clear()

          try {
            await clearCredentials(this.tokenPath)
            await this.login({ force: true })
            retryDelayMs = 1_000
            continue
          } catch (loginError) {
            this.reportError(loginError)
          }
        } else {
          this.reportError(error)
        }

        await delay(retryDelayMs)
        retryDelayMs = Math.min(retryDelayMs * 2, 10_000)
      }
    }

    this.log('Long-poll loop stopped.')
  }

  private async ensureCredentials(): Promise<Credentials> {
    if (this.credentials) {
      return this.credentials
    }

    const stored = await loadCredentials(this.tokenPath)
    if (stored) {
      this.credentials = stored
      this.baseUrl = stored.baseUrl
      return stored
    }

    return this.login()
  }

  private async sendText(userId: string, text: string, contextToken: string): Promise<void> {
    if (text.length === 0) {
      throw new Error('Message text cannot be empty.')
    }

    const credentials = await this.ensureCredentials()
    for (const chunk of chunkText(text, 2_000)) {
      await sendMessage(this.baseUrl, credentials.token, buildTextMessage(userId, contextToken, chunk))
    }
  }

  async sendImage(userId: string, filePath: string): Promise<void>
  async sendImage(userId: string, buffer: Buffer, filename?: string): Promise<void>
  async sendImage(userId: string, filePathOrBuffer: string | Buffer, filename?: string): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) {
      throw new Error(`No cached context token for user ${userId}. Reply to an incoming message first.`)
    }

    const buf = typeof filePathOrBuffer === 'string' ? await readFile(filePathOrBuffer) : filePathOrBuffer
    const credentials = await this.ensureCredentials()

    const uploaded = await uploadMediaToCdn({
      buf,
      toUserId: userId,
      baseUrl: this.baseUrl,
      token: credentials.token,
      mediaType: UploadMediaType.IMAGE,
      label: 'sendImage',
    })

    const imageItem = buildImageMessage(uploaded)
    await sendMessage(this.baseUrl, credentials.token, {
      from_user_id: '',
      to_user_id: userId,
      client_id: randomUUID(),
      message_type: MessageType.BOT,
      message_state: MessageState.FINISH,
      context_token: contextToken,
      item_list: [{ type: MessageItemType.IMAGE, image_item: imageItem }],
    })
  }

  async sendVideo(userId: string, filePath: string, opts?: { playLength?: number }): Promise<void>
  async sendVideo(userId: string, buffer: Buffer, filename?: string, opts?: { playLength?: number }): Promise<void>
  async sendVideo(
    userId: string,
    filePathOrBuffer: string | Buffer,
    filenameOrOpts?: string | { playLength?: number },
    opts?: { playLength?: number },
  ): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) {
      throw new Error(`No cached context token for user ${userId}. Reply to an incoming message first.`)
    }

    const buf = typeof filePathOrBuffer === 'string' ? await readFile(filePathOrBuffer) : filePathOrBuffer
    const actualOpts: { playLength?: number } | undefined =
      typeof filenameOrOpts === 'object' ? filenameOrOpts : opts
    const credentials = await this.ensureCredentials()

    const uploaded = await uploadMediaToCdn({
      buf,
      toUserId: userId,
      baseUrl: this.baseUrl,
      token: credentials.token,
      mediaType: UploadMediaType.VIDEO,
      label: 'sendVideo',
    })

    const videoItem = buildVideoMessage(uploaded, actualOpts)
    await sendMessage(this.baseUrl, credentials.token, {
      from_user_id: '',
      to_user_id: userId,
      client_id: randomUUID(),
      message_type: MessageType.BOT,
      message_state: MessageState.FINISH,
      context_token: contextToken,
      item_list: [{ type: MessageItemType.VIDEO, video_item: videoItem }],
    })
  }

  async sendVoice(userId: string, filePath: string): Promise<void>
  async sendVoice(userId: string, buffer: Buffer, filename?: string): Promise<void>
  async sendVoice(userId: string, filePathOrBuffer: string | Buffer, filename?: string): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) {
      throw new Error(`No cached context token for user ${userId}. Reply to an incoming message first.`)
    }

    const buf = typeof filePathOrBuffer === 'string' ? await readFile(filePathOrBuffer) : filePathOrBuffer
    const credentials = await this.ensureCredentials()

    const uploaded = await uploadMediaToCdn({
      buf,
      toUserId: userId,
      baseUrl: this.baseUrl,
      token: credentials.token,
      mediaType: UploadMediaType.VOICE,
      label: 'sendVoice',
    })

    const voiceItem = buildVoiceMessage(uploaded)
    await sendMessage(this.baseUrl, credentials.token, {
      from_user_id: '',
      to_user_id: userId,
      client_id: randomUUID(),
      message_type: MessageType.BOT,
      message_state: MessageState.FINISH,
      context_token: contextToken,
      item_list: [{ type: MessageItemType.VOICE, voice_item: voiceItem }],
    })
  }

  async sendFile(userId: string, filePath: string, fileName?: string): Promise<void>
  async sendFile(userId: string, buffer: Buffer, fileName?: string): Promise<void>
  async sendFile(userId: string, filePathOrBuffer: string | Buffer, fileName?: string): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) {
      throw new Error(`No cached context token for user ${userId}. Reply to an incoming message first.`)
    }

    const buf = typeof filePathOrBuffer === 'string' ? await readFile(filePathOrBuffer) : filePathOrBuffer
    const actualFileName = typeof filePathOrBuffer === 'string' ? (fileName ?? filePathOrBuffer.split('/').pop() ?? 'file') : (fileName ?? 'file')
    const credentials = await this.ensureCredentials()

    const uploaded = await uploadMediaToCdn({
      buf,
      toUserId: userId,
      baseUrl: this.baseUrl,
      token: credentials.token,
      mediaType: UploadMediaType.FILE,
      label: 'sendFile',
    })

    const fileItem = buildFileMessage(uploaded, actualFileName)
    await sendMessage(this.baseUrl, credentials.token, {
      from_user_id: '',
      to_user_id: userId,
      client_id: randomUUID(),
      message_type: MessageType.BOT,
      message_state: MessageState.FINISH,
      context_token: contextToken,
      item_list: [{ type: MessageItemType.FILE, file_item: fileItem }],
    })
  }

  /**
   * Send a reference (quote) message.
   * @param userId - The recipient user ID
   * @param title - The reference title/description
   * @param refItem - The MessageItem to reference (e.g., text_item, image_item, etc.)
   * @param content - The actual message content to send (default is text)
   */
  async sendRefMessage(
    userId: string,
    title: string,
    refItem: MessageItem,
    content: { text?: string } = {},
  ): Promise<void> {
    const contextToken = this.contextTokens.get(userId)
    if (!contextToken) {
      throw new Error(`No cached context token for user ${userId}. Reply to an incoming message first.`)
    }

    const credentials = await this.ensureCredentials()
    const refMsg: RefMessage = buildRefMessage(title, refItem)

    const itemList: MessageItem[] = []
    if (content.text) {
      itemList.push({
        type: MessageItemType.TEXT,
        text_item: { text: content.text },
        ref_msg: refMsg,
      })
    } else {
      // If no text content, just send the ref message without text_item
      itemList.push({
        type: MessageItemType.TEXT,
        ref_msg: refMsg,
      })
    }

    await sendMessage(this.baseUrl, credentials.token, {
      from_user_id: '',
      to_user_id: userId,
      client_id: randomUUID(),
      message_type: MessageType.BOT,
      message_state: MessageState.FINISH,
      context_token: contextToken,
      item_list: itemList,
    })
  }

  private async dispatchMessage(message: IncomingMessage): Promise<void> {
    if (this.handlers.length === 0) {
      return
    }

    const results = await Promise.allSettled(this.handlers.map(async (handler) => handler(message)))
    for (const result of results) {
      if (result.status === 'rejected') {
        this.reportError(result.reason)
      }
    }
  }

  private rememberContext(message: WeixinMessage): void {
    const userId = message.message_type === MessageType.USER ? message.from_user_id : message.to_user_id
    if (userId && message.context_token) {
      this.contextTokens.set(userId, message.context_token)
    }
  }

  private toIncomingMessage(message: WeixinMessage): IncomingMessage | null {
    if (message.message_type !== MessageType.USER) {
      return null
    }

    return {
      userId: message.from_user_id,
      text: extractText(message.item_list),
      type: detectType(message.item_list),
      raw: message,
      _contextToken: message.context_token,
      timestamp: new Date(message.create_time_ms),
    }
  }

  private reportError(error: unknown): void {
    this.log(error instanceof Error ? error.message : String(error))
    this.onErrorCallback?.(error)
  }

  private log(message: string): void {
    process.stderr.write(`[weixin-bot] ${message}\n`)
  }
}

function detectType(items: MessageItem[]): IncomingMessage['type'] {
  const first = items[0]

  switch (first?.type) {
    case MessageItemType.IMAGE:
      return 'image'
    case MessageItemType.VOICE:
      return 'voice'
    case MessageItemType.FILE:
      return 'file'
    case MessageItemType.VIDEO:
      return 'video'
    default:
      return 'text'
  }
}

function extractText(items: MessageItem[]): string {
  const parts = items
    .map((item) => {
      switch (item.type) {
        case MessageItemType.TEXT:
          return item.text_item?.text ?? ''
        case MessageItemType.IMAGE:
          return item.image_item?.url ?? '[image]'
        case MessageItemType.VOICE:
          return item.voice_item?.text ?? '[voice]'
        case MessageItemType.FILE:
          return item.file_item?.file_name ?? '[file]'
        case MessageItemType.VIDEO:
          return '[video]'
        default:
          return ''
      }
    })
    .filter(Boolean)

  return parts.join('\n')
}

function chunkText(text: string, limit: number): string[] {
  const chars = Array.from(text)
  const chunks: string[] = []

  for (let index = 0; index < chars.length; index += limit) {
    chunks.push(chars.slice(index, index + limit).join(''))
  }

  return chunks.length > 0 ? chunks : ['']
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

function isSessionExpired(error: unknown): boolean {
  return error instanceof ApiError && error.code === -14
}
