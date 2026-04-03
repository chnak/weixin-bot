/** Build a CDN upload URL from upload_param and filekey. */
export function buildCdnUploadUrl(params: {
  cdnBaseUrl: string
  uploadParam: string
  filekey: string
}): string {
  return `${params.cdnBaseUrl}/upload?encrypted_query_param=${encodeURIComponent(params.uploadParam)}&filekey=${encodeURIComponent(params.filekey)}`
}
