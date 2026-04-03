"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImageMessage = buildImageMessage;
exports.buildVideoMessage = buildVideoMessage;
exports.buildVoiceMessage = buildVoiceMessage;
exports.buildFileMessage = buildFileMessage;
exports.buildRefMessage = buildRefMessage;
/** Build an ImageItem from CDN upload result. */
function buildImageMessage(uploaded) {
    var aesKeyBase64 = Buffer.from(uploaded.aeskey, 'hex').toString('base64');
    console.error("[buildImageMessage] aeskey hex=".concat(uploaded.aeskey, " base64=").concat(aesKeyBase64));
    console.error("[buildImageMessage] encrypt_query_param=".concat(uploaded.downloadEncryptedQueryParam.slice(0, 50), "..."));
    return {
        media: {
            encrypt_query_param: uploaded.downloadEncryptedQueryParam,
            aes_key: aesKeyBase64,
            encrypt_type: 1,
        },
        mid_size: uploaded.fileSizeCiphertext,
    };
}
/** Build a VideoItem from CDN upload result. */
function buildVideoMessage(uploaded, opts) {
    return {
        media: {
            encrypt_query_param: uploaded.downloadEncryptedQueryParam,
            aes_key: Buffer.from(uploaded.aeskey, 'hex').toString('base64'),
            encrypt_type: 1,
        },
        video_size: uploaded.fileSizeCiphertext,
        play_length: opts === null || opts === void 0 ? void 0 : opts.playLength,
    };
}
/** Build a VoiceItem from CDN upload result. */
function buildVoiceMessage(uploaded, opts) {
    return {
        media: {
            encrypt_query_param: uploaded.downloadEncryptedQueryParam,
            aes_key: Buffer.from(uploaded.aeskey, 'hex').toString('base64'),
            encrypt_type: 1,
        },
        playtime: opts === null || opts === void 0 ? void 0 : opts.playtime,
        encode_type: opts === null || opts === void 0 ? void 0 : opts.encodeType,
    };
}
/** Build a FileItem from CDN upload result. */
function buildFileMessage(uploaded, fileName) {
    return {
        media: {
            encrypt_query_param: uploaded.downloadEncryptedQueryParam,
            aes_key: Buffer.from(uploaded.aeskey, 'hex').toString('base64'),
            encrypt_type: 1,
        },
        file_name: fileName,
        len: String(uploaded.fileSize),
    };
}
/** Build a RefMessage (quote/reply to a message). */
function buildRefMessage(title, messageItem) {
    return {
        title: title,
        message_item: messageItem,
    };
}
