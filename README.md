# @chnak/weixin-bot

微信 iLink 机器人 API 的零依赖 Node.js SDK。

## 安装

```bash
npm install @chnak/weixin-bot
```

## 快速开始

```typescript
import { WeixinBot } from '@chnak/weixin-bot'

const bot = new WeixinBot()
await bot.login()

bot.onMessage(async (msg) => {
  console.log(`[${msg.timestamp.toLocaleTimeString()}] ${msg.userId}: ${msg.text}`)
  await bot.reply(msg, `你说了: ${msg.text}`)
})

await bot.run()
```

## API 参考

### `new WeixinBot(options?)`

创建一个机器人客户端。

- `baseUrl?: string` 覆盖 iLink API 的基础 URL。
- `tokenPath?: string` 覆盖凭证文件路径。默认：`~/.weixin-bot/credentials.json`
- `onError?: (error: unknown) => void` 接收轮询或处理器错误。

### `await bot.login(options?)`

在需要时启动二维码登录，将凭证存储在本地，并返回活动会话。

- `force?: boolean` 忽略缓存的凭证并要求重新二维码登录。

### `bot.onMessage(handler)`

注册一个异步或同步消息处理器。每条收到的用户消息都会被转换为以下格式：

```typescript
interface IncomingMessage {
  userId: string
  text: string
  type: 'text' | 'image' | 'voice' | 'file' | 'video'
  raw: WeixinMessage
  _contextToken: string
  timestamp: Date
}
```

### `await bot.reply(msg, text)`

使用该消息的 `context_token` 回复收到的消息。

### `await bot.sendTyping(userId)`

在微信聊天中显示"对方正在输入中..."（正在输入指示器）。自动通过 `getconfig` 获取所需的 `typing_ticket`。仅在 SDK 收到过该用户的至少一条上行消息后才能使用。

### `await bot.stopTyping(userId)`

取消正在输入指示器。

### `await bot.send(userId, text)`

使用该用户最新缓存的 `context_token` 发送主动文本消息。此方法仅在 SDK 收到过该用户的至少一条上行消息后才能使用。

### `await bot.sendImage(userId, filePath)`
### `await bot.sendImage(userId, buffer, filename?)`

发送图片消息。接受文件路径或 Buffer。

```typescript
await bot.sendImage(userId, '/path/to/image.png')
await bot.sendImage(userId, imageBuffer, 'photo.png')
```

### `await bot.sendVideo(userId, filePath, opts?)`
### `await bot.sendVideo(userId, buffer, filename?, opts?)`

发送视频消息。接受文件路径或 Buffer。选项：

- `playLength?: number` 视频时长（秒）。

```typescript
await bot.sendVideo(userId, '/path/to/video.mp4', { playLength: 30 })
await bot.sendVideo(userId, videoBuffer, 'video.mp4', { playLength: 60 })
```

### `await bot.sendVoice(userId, filePath)`
### `await bot.sendVoice(userId, buffer, filename?)`

发送语音消息。接受文件路径或 Buffer。

```typescript
await bot.sendVoice(userId, '/path/to/voice.silk')
await bot.sendVoice(userId, voiceBuffer, 'voice.silk')
```

### `await bot.sendFile(userId, filePath, fileName?)`
### `await bot.sendFile(userId, buffer, fileName?)`

发送文件附件。接受文件路径或 Buffer。如果未提供文件名，则从路径中推断。

```typescript
await bot.sendFile(userId, '/path/to/document.pdf')
await bot.sendFile(userId, fileBuffer, 'report.pdf')
```

### `await bot.sendRefMessage(userId, title, refItem, content?)`

发送引用（回复/引用）消息，引用另一条消息。参数：

- `title: string` 引用的标题/描述。
- `refItem: MessageItem` 要引用的消息项（例如 text_item、image_item）。
- `content?: { text?: string }` 可选的回复内容。如果省略，则只发送引用而不发送文本。

```typescript
// 回复文本，引用另一条文本消息
await bot.sendRefMessage(userId, '原消息', {
  type: MessageItemType.TEXT,
  text_item: { text: '这是原消息' }
}, { text: '这是我的回复' })

// 引用图片
const uploaded = await uploadMediaToCdn({ ... })
await bot.sendRefMessage(userId, '看这张图', {
  type: MessageItemType.IMAGE,
  image_item: buildImageMessage(uploaded)
})
```

### `downloadAndDecryptMedia(params)`

从 CDN 下载媒体文件并解密。返回解密后的原始文件数据（Buffer）。

- `url: string` CDN 媒体的 URL。
- `aesKey: string` AES 密钥（hex 编码）。

```typescript
import { downloadAndDecryptMedia } from '@chnak/weixin-bot'

// 从收到的图片消息中下载
const buffer = await downloadAndDecryptMedia({
  url: imageItem.url,
  aesKey: Buffer.from(imageItem.media.aes_key, 'base64').toString('hex')
})

// 保存到文件
import { writeFile } from 'node:fs/promises'
await writeFile('image.png', buffer)

// 或转为 base64
const base64 = buffer.toString('base64')
```

### `decryptAesEcb(ciphertext, key)`

使用 AES-128-ECB 解密数据（PKCS7 padding 会自动移除）。

```typescript
import { decryptAesEcb } from '@chnak/weixin-bot'

const plaintext = decryptAesEcb(encryptedBuffer, key)
```

### `await downloadMediaToFile(url, aesKey, destPath)`

下载 CDN 媒体文件并解密，直接保存到指定路径。

- `url` - CDN 媒体 URL
- `aesKey` - AES key（base64 编码）
- `destPath` - 保存路径

```typescript
import { downloadMediaToFile } from '@chnak/weixin-bot'

// 从收到的图片消息下载并保存
await downloadMediaToFile(
  imageItem.url,
  imageItem.media.aes_key,  // base64 编码
  './downloads/image.png'
)
```

### `await bot.run()`

启动长轮询循环，将收到的消息分发给已注册的处理程序，在临时故障时重连，并在会话过期时触发重新登录。

### `bot.stop()`

优雅地停止长轮询循环。

## 工作原理

1. `login()` 获取二维码登录 URL，等待微信确认，并保存返回的机器人令牌。
2. `run()` 对 `getupdates` 执行长轮询。
3. 每条收到的消息都会被规范化为 `IncomingMessage` 并发送到您的回调函数。
4. `reply()` 和 `send()` 重用协议要求的内部管理的 `context_token`。

## 协议

有关此 SDK 使用的线协议参考，请参阅 [../PROTOCOL.md](../PROTOCOL.md)。

## License

MIT
