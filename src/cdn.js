"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aesEcbPaddedSize = aesEcbPaddedSize;
exports.encryptAesEcb = encryptAesEcb;
exports.uploadMediaToCdn = uploadMediaToCdn;
/**
 * CDN upload utilities for Weixin media files.
 * File → CDN upload (AES-128-ECB encrypted) → sendMessage sends CDN reference.
 */
var node_crypto_1 = require("node:crypto");
var node_crypto_2 = require("node:crypto");
var cdn_url_js_1 = require("./cdn-url.js");
var api_js_1 = require("./api.js");
/** AES-128-ECB ciphertext size with PKCS7 padding. */
function aesEcbPaddedSize(plaintextSize) {
    return Math.ceil((plaintextSize + 1) / 16) * 16;
}
/** Encrypt buffer with AES-128-ECB (PKCS7 padding). */
function encryptAesEcb(plaintext, key) {
    var cipher = (0, node_crypto_1.createCipheriv)('aes-128-ecb', key, null);
    return Buffer.concat([cipher.update(plaintext), cipher.final()]);
}
/** Upload one buffer to the Weixin CDN with AES-128-ECB encryption. */
function uploadBufferToCdn(params) {
    return __awaiter(this, void 0, void 0, function () {
        var buf, uploadFullUrl, uploadParam, filekey, cdnBaseUrl, aeskey, ciphertext, trimmedFull, cdnUrl, res, errMsg, downloadParam;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    buf = params.buf, uploadFullUrl = params.uploadFullUrl, uploadParam = params.uploadParam, filekey = params.filekey, cdnBaseUrl = params.cdnBaseUrl, aeskey = params.aeskey;
                    ciphertext = encryptAesEcb(buf, aeskey);
                    trimmedFull = uploadFullUrl === null || uploadFullUrl === void 0 ? void 0 : uploadFullUrl.trim();
                    if (trimmedFull) {
                        cdnUrl = trimmedFull;
                    }
                    else if (uploadParam) {
                        cdnUrl = (0, cdn_url_js_1.buildCdnUploadUrl)({ cdnBaseUrl: cdnBaseUrl, uploadParam: uploadParam, filekey: filekey });
                    }
                    else {
                        throw new Error('CDN upload URL missing (need upload_full_url or upload_param)');
                    }
                    return [4 /*yield*/, fetch(cdnUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/octet-stream' },
                            body: new Uint8Array(ciphertext),
                        })];
                case 1:
                    res = _b.sent();
                    if (res.status !== 200) {
                        errMsg = (_a = res.headers.get('x-error-message')) !== null && _a !== void 0 ? _a : "status ".concat(res.status);
                        throw new Error("CDN upload failed: ".concat(errMsg));
                    }
                    downloadParam = res.headers.get('x-encrypted-param');
                    if (!downloadParam) {
                        throw new Error('CDN response missing x-encrypted-param header');
                    }
                    return [2 /*return*/, { downloadParam: downloadParam }];
            }
        });
    });
}
/**
 * Upload a media buffer to the Weixin CDN.
 * Returns UploadedFileInfo to be used in ImageItem/VideoItem.
 */
function uploadMediaToCdn(params) {
    return __awaiter(this, void 0, void 0, function () {
        var buf, toUserId, baseUrl, token, mediaType, label, rawsize, rawfilemd5, filesize, filekey, aeskey, uploadUrlResp, err_1, uploadFullUrl, uploadParam, cdnBaseUrl, cdnUrl, downloadEncryptedQueryParam, err_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    buf = params.buf, toUserId = params.toUserId, baseUrl = params.baseUrl, token = params.token, mediaType = params.mediaType, label = params.label;
                    rawsize = buf.length;
                    rawfilemd5 = node_crypto_2.default.createHash('md5').update(buf).digest('hex');
                    filesize = aesEcbPaddedSize(rawsize);
                    filekey = node_crypto_2.default.randomBytes(16).toString('hex');
                    aeskey = node_crypto_2.default.randomBytes(16);
                    console.error("[".concat(label, "] rawsize=").concat(rawsize, ", filesize=").concat(filesize, ", md5=").concat(rawfilemd5));
                    console.error("[".concat(label, "] calling getUploadUrl..."));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, api_js_1.getUploadUrl)(baseUrl, token, {
                            filekey: filekey,
                            media_type: mediaType,
                            to_user_id: toUserId,
                            rawsize: rawsize,
                            rawfilemd5: rawfilemd5,
                            filesize: filesize,
                            no_need_thumb: true,
                            aeskey: aeskey.toString('hex'),
                        })];
                case 2:
                    uploadUrlResp = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    throw new Error("".concat(label, ": getUploadUrl failed: ").concat(err_1 instanceof Error ? err_1.message : String(err_1)));
                case 4:
                    console.error("[".concat(label, "] getUploadUrl response:"), JSON.stringify(uploadUrlResp));
                    uploadFullUrl = (_a = uploadUrlResp.upload_full_url) === null || _a === void 0 ? void 0 : _a.trim();
                    uploadParam = uploadUrlResp.upload_param;
                    if (!uploadFullUrl && !uploadParam) {
                        throw new Error("".concat(label, ": getUploadUrl returned no upload URL, resp=").concat(JSON.stringify(uploadUrlResp)));
                    }
                    cdnBaseUrl = 'https://novac2c.cdn.weixin.qq.com/c2c';
                    cdnUrl = uploadFullUrl || (0, cdn_url_js_1.buildCdnUploadUrl)({ cdnBaseUrl: cdnBaseUrl, uploadParam: uploadParam, filekey: filekey });
                    console.error("[".concat(label, "] CDN upload URL: ").concat(cdnUrl));
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, uploadBufferToCdn({
                            buf: buf,
                            uploadFullUrl: uploadFullUrl || undefined,
                            uploadParam: uploadParam !== null && uploadParam !== void 0 ? uploadParam : undefined,
                            filekey: filekey,
                            cdnBaseUrl: cdnBaseUrl,
                            aeskey: aeskey,
                        }).then(function (r) { return r.downloadParam; })];
                case 6:
                    downloadEncryptedQueryParam = _b.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_2 = _b.sent();
                    throw new Error("".concat(label, ": uploadBufferToCdn failed: ").concat(err_2 instanceof Error ? err_2.message : String(err_2)));
                case 8: return [2 /*return*/, {
                        filekey: filekey,
                        downloadEncryptedQueryParam: downloadEncryptedQueryParam,
                        aeskey: aeskey.toString('hex'),
                        fileSize: rawsize,
                        fileSizeCiphertext: filesize,
                    }];
            }
        });
    });
}
