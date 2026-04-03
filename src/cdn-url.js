"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCdnUploadUrl = buildCdnUploadUrl;
/** Build a CDN upload URL from upload_param and filekey. */
function buildCdnUploadUrl(params) {
    return "".concat(params.cdnBaseUrl, "/upload?encrypted_query_param=").concat(encodeURIComponent(params.uploadParam), "&filekey=").concat(encodeURIComponent(params.filekey));
}
