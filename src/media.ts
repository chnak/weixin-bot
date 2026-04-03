/**
 * Build ImageItem and VideoItem structures for sending media via sendMessage.
 */
import type { FileItem, ImageItem, MessageItem, RefMessage, VideoItem, VoiceItem } from './types.js'
import type { UploadedFileInfo } from './cdn.js'

/** Build an ImageItem from CDN upload result. */
export function buildImageMessage(uploaded: UploadedFileInfo): ImageItem {
  return {
    media: {
      encrypt_query_param: uploaded.downloadEncryptedQueryParam,
      aes_key: Buffer.from(uploaded.aeskey).toString('base64'),
      encrypt_type: 1,
    },
    mid_size: uploaded.fileSizeCiphertext,
  }
}

/** Build a VideoItem from CDN upload result. */
export function buildVideoMessage(
  uploaded: UploadedFileInfo,
  opts?: { playLength?: number },
): VideoItem {
  return {
    media: {
      encrypt_query_param: uploaded.downloadEncryptedQueryParam,
      aes_key: Buffer.from(uploaded.aeskey).toString('base64'),
      encrypt_type: 1,
    },
    video_size: uploaded.fileSizeCiphertext,
    play_length: opts?.playLength,
  }
}

/** Build a VoiceItem from CDN upload result. */
export function buildVoiceMessage(
  uploaded: UploadedFileInfo,
  opts?: { playtime?: number; encodeType?: number },
): VoiceItem {
  return {
    media: {
      encrypt_query_param: uploaded.downloadEncryptedQueryParam,
      aes_key: Buffer.from(uploaded.aeskey).toString('base64'),
      encrypt_type: 1,
    },
    playtime: opts?.playtime,
    encode_type: opts?.encodeType,
  }
}

/** Build a FileItem from CDN upload result. */
export function buildFileMessage(uploaded: UploadedFileInfo, fileName: string): FileItem {
  return {
    media: {
      encrypt_query_param: uploaded.downloadEncryptedQueryParam,
      aes_key: Buffer.from(uploaded.aeskey).toString('base64'),
      encrypt_type: 1,
    },
    file_name: fileName,
    len: String(uploaded.fileSize),
  }
}

/** Build a RefMessage (quote/reply to a message). */
export function buildRefMessage(title: string, messageItem: MessageItem): RefMessage {
  return {
    title,
    message_item: messageItem,
  }
}
