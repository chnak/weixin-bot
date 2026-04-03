/**
 * CDN upload utilities for Weixin media files.
 * File → CDN upload (AES-128-ECB encrypted) → sendMessage sends CDN reference.
 */
import { createCipheriv } from 'node:crypto'
import https from 'node:https'
import { readFile } from 'node:fs/promises'
import crypto from 'node:crypto'

import { buildCdnUploadUrl } from './cdn-url.js'
import { getUploadUrl } from './api.js'
import type { GetUploadUrlResp } from './types.js'

/** AES-128-ECB ciphertext size with PKCS7 padding. */
export function aesEcbPaddedSize(plaintextSize: number): number {
  return Math.ceil((plaintextSize + 1) / 16) * 16
}

/** Encrypt buffer with AES-128-ECB (PKCS7 padding). */
export function encryptAesEcb(plaintext: Buffer, key: Buffer): Buffer {
  const cipher = createCipheriv('aes-128-ecb', key, null)
  return Buffer.concat([cipher.update(plaintext), cipher.final()])
}

export interface UploadedFileInfo {
  filekey: string
  /** CDN returns this as x-encrypted-param header after upload */
  downloadEncryptedQueryParam: string
  /** AES-128-ECB key, hex-encoded */
  aeskey: string
  /** Plaintext file size in bytes */
  fileSize: number
  /** Ciphertext size (PKCS7 padded) */
  fileSizeCiphertext: number
}

/** Upload one buffer to the Weixin CDN with AES-128-ECB encryption. */
async function uploadBufferToCdn(params: {
  buf: Buffer
  uploadFullUrl?: string
  uploadParam?: string
  filekey: string
  cdnBaseUrl: string
  aeskey: Buffer
}): Promise<{ downloadParam: string }> {
  const { buf, uploadFullUrl, uploadParam, filekey, cdnBaseUrl, aeskey } = params
  const ciphertext = encryptAesEcb(buf, aeskey)
  const trimmedFull = uploadFullUrl?.trim()

  let cdnUrl: string
  if (trimmedFull) {
    cdnUrl = trimmedFull
  } else if (uploadParam) {
    cdnUrl = buildCdnUploadUrl({ cdnBaseUrl, uploadParam, filekey })
  } else {
    throw new Error('CDN upload URL missing (need upload_full_url or upload_param)')
  }

  return await cdnHttpsPost(cdnUrl, ciphertext)
}

/** HTTPS POST helper for CDN upload with 120s timeout */
function cdnHttpsPost(url: string, body: Buffer): Promise<{ downloadParam: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': body.length,
      },
      timeout: 120_000,
    }

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        const errMsg = res.headers['x-error-message']?.[0] ?? `status ${res.statusCode}`
        reject(new Error(`CDN upload failed: ${errMsg}`))
        return
      }
      const headerVal = res.headers['x-encrypted-param']
      const downloadParam = Array.isArray(headerVal) ? headerVal[0] : headerVal
      if (!downloadParam) {
        reject(new Error('x-encrypted-param header missing'))
        return
      }
      resolve({ downloadParam })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('CDN upload timeout'))
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.write(body)
    req.end()
  })
}

/**
 * Upload a media buffer to the Weixin CDN.
 * Returns UploadedFileInfo to be used in ImageItem/VideoItem.
 */
export async function uploadMediaToCdn(params: {
  buf: Buffer
  toUserId: string
  baseUrl: string
  token: string
  mediaType: 1 | 2 | 3 | 4
  label: string
}): Promise<UploadedFileInfo> {
  const { buf, toUserId, baseUrl, token, mediaType, label } = params

  const rawsize = buf.length
  const rawfilemd5 = crypto.createHash('md5').update(buf).digest('hex')
  const filesize = aesEcbPaddedSize(rawsize)
  const filekey = crypto.randomBytes(16).toString('hex')
  const aeskey = crypto.randomBytes(16)

  let uploadUrlResp: GetUploadUrlResp
  try {
    uploadUrlResp = await getUploadUrl(baseUrl, token, {
      filekey,
      media_type: mediaType,
      to_user_id: toUserId,
      rawsize,
      rawfilemd5,
      filesize,
      no_need_thumb: true,
      aeskey: aeskey.toString('hex'),
    })
  } catch (err) {
    throw new Error(`${label}: getUploadUrl failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  const uploadFullUrl = uploadUrlResp.upload_full_url?.trim()
  const uploadParam = uploadUrlResp.upload_param

  if (!uploadFullUrl && !uploadParam) {
    throw new Error(`${label}: getUploadUrl returned no upload URL, resp=${JSON.stringify(uploadUrlResp)}`)
  }

  const cdnBaseUrl = 'https://novac2c.cdn.weixin.qq.com/c2c'

  let downloadEncryptedQueryParam: string
  try {
    const result = await uploadBufferToCdn({
      buf,
      uploadFullUrl: uploadFullUrl || undefined,
      uploadParam: uploadParam ?? undefined,
      filekey,
      cdnBaseUrl,
      aeskey,
    })
    downloadEncryptedQueryParam = result.downloadParam
  } catch (err) {
    throw new Error(`${label}: uploadBufferToCdn failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  return {
    filekey,
    downloadEncryptedQueryParam,
    aeskey: aeskey.toString('hex'),
    fileSize: rawsize,
    fileSizeCiphertext: filesize,
  }
}
