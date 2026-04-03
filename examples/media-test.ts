#!/usr/bin/env npx tsx
/**
 * 媒体发送测试机器人
 *
 * 功能：
 *   1. 首次运行扫码登录（终端渲染二维码），凭证自动保存
 *   2. 后续运行自动加载已保存凭证，跳过扫码
 *   3. 收到用户消息后，根据命令发送不同类型的媒体
 *
 * 用法：
 *   npx tsx examples/media-test.ts
 *   npx tsx examples/media-test.ts --force-login   # 强制重新扫码
 *
 * 测试命令：
 *   图片 / image  - 发送图片
 *   视频 / video  - 发送视频
 *   语音 / voice  - 发送语音
 *   文件 / file   - 发送文件
 *   引用 / ref    - 发送引用消息
 *   帮助 / help   - 显示帮助
 */

import { WeixinBot, MessageItemType } from '../src/index.js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import qrcodeTerminal from 'qrcode-terminal'

const forceLogin = process.argv.includes('--force-login')

// 媒体文件目录（修改为你实际的测试文件路径）
const MEDIA_DIR = resolve(process.cwd(), 'test-media')
const ROOT_DIR=resolve(process.cwd())

function log(level: string, msg: string) {
  console.log(`${new Date().toISOString()} [${level}] ${msg}`)
}

// 二维码渲染
const origStderrWrite = process.stderr.write.bind(process.stderr)
process.stderr.write = ((chunk: any, ...args: any[]) => {
  const str = typeof chunk === 'string' ? chunk : chunk.toString()
  if (str.startsWith('https://') && str.includes('qrcode=')) {
    const url = str.trim()
    qrcodeTerminal.generate(url, { small: true }, (qr: string) => {
      origStderrWrite(qr + '\n')
    })
  }
  return origStderrWrite(chunk, ...args)
}) as typeof process.stderr.write

const HELP = `媒体测试机器人 - 支持的命令：
  图片 / image  - 发送测试图片
  视频 / video  - 发送测试视频（需配置 VIDEO_PATH 和 VIDEO_DURATION）
  语音 / voice  - 发送测试语音
  文件 / file   - 发送测试文件
  引用 / ref    - 发送引用消息
  帮助 / help   - 显示此帮助`

// 修改为你实际的测试文件路径
const IMAGE_PATH = join(MEDIA_DIR, 'test-image.png')
const VIDEO_PATH = join(MEDIA_DIR, 'test-video.mp4')
const VOICE_PATH = join(MEDIA_DIR, 'test-voice.silk')
const FILE_PATH = join(MEDIA_DIR, 'test-file.pdf')
const VIDEO_DURATION = 10 // 视频时长（秒）

const bot = new WeixinBot({
  tokenPath:join(ROOT_DIR,`weixin.json`),
  onError: (err) => {
    log('ERROR', err instanceof Error ? err.message : String(err))
  },
})

log('INFO', '正在登录...')
const creds = await bot.login({ force: forceLogin })
log('INFO', `登录成功 - Bot ID: ${creds.accountId}, 用户: ${creds.userId}`)

bot.onMessage(async (msg) => {
  const text = msg.text.trim().toLowerCase()
  log('RECV', `用户 ${msg.userId}: ${msg.text}`)

  try {
    if (text === '帮助' || text === 'help') {
      await bot.send(msg.userId, HELP)
      log('SEND', '已发送帮助')
      return
    }

    if (text === '图片' || text === 'image') {
      if (!existsSync(IMAGE_PATH)) {
        await bot.send(msg.userId, `图片不存在: ${IMAGE_PATH}\n请修改 media-test.ts 中的 IMAGE_PATH`)
        return
      }
      await bot.sendImage(msg.userId, IMAGE_PATH)
      log('SEND', '已发送图片')
      return
    }

    if (text === '视频' || text === 'video') {
      if (!existsSync(VIDEO_PATH)) {
        await bot.send(msg.userId, `视频不存在: ${VIDEO_PATH}\n请修改 media-test.ts 中的 VIDEO_PATH`)
        return
      }
      await bot.sendVideo(msg.userId, VIDEO_PATH, { playLength: VIDEO_DURATION })
      log('SEND', '已发送视频')
      return
    }

    if (text === '语音' || text === 'voice') {
      if (!existsSync(VOICE_PATH)) {
        await bot.send(msg.userId, `语音不存在: ${VOICE_PATH}\n请修改 media-test.ts 中的 VOICE_PATH`)
        return
      }
      await bot.sendVoice(msg.userId, VOICE_PATH)
      log('SEND', '已发送语音')
      return
    }

    if (text === '文件' || text === 'file') {
      if (!existsSync(FILE_PATH)) {
        await bot.send(msg.userId, `文件不存在: ${FILE_PATH}\n请修改 media-test.ts 中的 FILE_PATH`)
        return
      }
      await bot.sendFile(msg.userId, FILE_PATH, '测试文件.pdf')
      log('SEND', '已发送文件')
      return
    }

    if (text === '引用' || text === 'ref') {
      await bot.sendRefMessage(
        msg.userId,
        '原消息',
        {
          type: MessageItemType.TEXT,
          text_item: { text: '这是被引用的内容' },
        },
        { text: '这是回复内容' },
      )
      log('SEND', '已发送引用消息')
      return
    }

    // 默认回显
    await bot.reply(msg, `收到: ${msg.text}`)
  } catch (err) {
    log('ERROR', `处理失败: ${err instanceof Error ? err.message : String(err)}`)
  }
})

process.on('SIGINT', () => {
  log('INFO', '停止中...')
  bot.stop()
})

log('INFO', '开始接收消息，发送"帮助"查看命令')
await bot.run()
log('INFO', 'Bot 已停止')
