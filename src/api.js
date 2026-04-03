"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ApiError = exports.CHANNEL_VERSION = exports.DEFAULT_BASE_URL = void 0;
exports.getUploadUrl = getUploadUrl;
exports.randomWechatUin = randomWechatUin;
exports.buildHeaders = buildHeaders;
exports.apiFetch = apiFetch;
exports.apiGet = apiGet;
exports.getUpdates = getUpdates;
exports.sendMessage = sendMessage;
exports.getConfig = getConfig;
exports.sendTyping = sendTyping;
exports.fetchQrCode = fetchQrCode;
exports.pollQrStatus = pollQrStatus;
exports.buildTextMessage = buildTextMessage;
var node_crypto_1 = require("node:crypto");
var types_js_1 = require("./types.js");
exports.DEFAULT_BASE_URL = 'https://ilinkai.weixin.qq.com';
exports.CHANNEL_VERSION = '1.0.0';
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(message, options) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ApiError';
        _this.status = options.status;
        _this.code = options.code;
        _this.payload = options.payload;
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
function normalizeBaseUrl(baseUrl) {
    return baseUrl.replace(/\/+$/, '');
}
function buildBaseInfo() {
    return { channel_version: exports.CHANNEL_VERSION };
}
function getUploadUrl(baseUrl, token, params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiFetch(baseUrl, '/ilink/bot/getuploadurl', __assign(__assign({}, params), { base_info: buildBaseInfo() }), token, 15000)];
        });
    });
}
function parseJsonResponse(response, label) {
    return __awaiter(this, void 0, void 0, function () {
        var text, payload, message, body;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, response.text()];
                case 1:
                    text = _d.sent();
                    payload = text ? JSON.parse(text) : {};
                    if (!response.ok) {
                        message = (_a = payload === null || payload === void 0 ? void 0 : payload.errmsg) !== null && _a !== void 0 ? _a : "".concat(label, " failed with HTTP ").concat(response.status);
                        throw new ApiError(message, {
                            status: response.status,
                            code: payload === null || payload === void 0 ? void 0 : payload.errcode,
                            payload: payload,
                        });
                    }
                    if (typeof (payload === null || payload === void 0 ? void 0 : payload.ret) === 'number' && payload.ret !== 0) {
                        body = payload;
                        throw new ApiError((_b = body.errmsg) !== null && _b !== void 0 ? _b : "".concat(label, " failed"), {
                            status: response.status,
                            code: (_c = body.errcode) !== null && _c !== void 0 ? _c : body.ret,
                            payload: payload,
                        });
                    }
                    return [2 /*return*/, payload];
            }
        });
    });
}
function randomWechatUin() {
    var value = (0, node_crypto_1.randomBytes)(4).readUInt32BE(0);
    return Buffer.from(String(value), 'utf8').toString('base64');
}
function buildHeaders(token) {
    return {
        'Content-Type': 'application/json',
        AuthorizationType: 'ilink_bot_token',
        Authorization: "Bearer ".concat(token),
        'X-WECHAT-UIN': randomWechatUin(),
    };
}
function apiFetch(baseUrl_1, endpoint_1, body_1, token_1) {
    return __awaiter(this, arguments, void 0, function (baseUrl, endpoint, body, token, timeoutMs, signal) {
        var url, timeoutSignal, requestSignal, response;
        if (timeoutMs === void 0) { timeoutMs = 40000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = new URL(endpoint, "".concat(normalizeBaseUrl(baseUrl), "/"));
                    timeoutSignal = AbortSignal.timeout(timeoutMs);
                    requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
                    return [4 /*yield*/, fetch(url, {
                            method: 'POST',
                            headers: buildHeaders(token),
                            body: JSON.stringify(body),
                            signal: requestSignal,
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, parseJsonResponse(response, endpoint)];
            }
        });
    });
}
function apiGet(baseUrl_1, path_1) {
    return __awaiter(this, arguments, void 0, function (baseUrl, path, headers) {
        var url, response;
        if (headers === void 0) { headers = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = new URL(path, "".concat(normalizeBaseUrl(baseUrl), "/"));
                    return [4 /*yield*/, fetch(url, {
                            method: 'GET',
                            headers: headers,
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, parseJsonResponse(response, path)];
            }
        });
    });
}
function getUpdates(baseUrl, token, buf, signal) {
    return __awaiter(this, void 0, void 0, function () {
        var body;
        return __generator(this, function (_a) {
            body = {
                get_updates_buf: buf,
                base_info: buildBaseInfo(),
            };
            return [2 /*return*/, apiFetch(baseUrl, '/ilink/bot/getupdates', body, token, 40000, signal)];
        });
    });
}
function sendMessage(baseUrl, token, msg) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiFetch(baseUrl, '/ilink/bot/sendmessage', {
                    msg: msg,
                    base_info: buildBaseInfo(),
                }, token, 15000)];
        });
    });
}
function getConfig(baseUrl, token, userId, contextToken) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiFetch(baseUrl, '/ilink/bot/getconfig', {
                    ilink_user_id: userId,
                    context_token: contextToken,
                    base_info: buildBaseInfo(),
                }, token, 15000)];
        });
    });
}
function sendTyping(baseUrl, token, userId, ticket, status) {
    return __awaiter(this, void 0, void 0, function () {
        var body;
        return __generator(this, function (_a) {
            body = {
                ilink_user_id: userId,
                typing_ticket: ticket,
                status: status,
                base_info: buildBaseInfo(),
            };
            return [2 /*return*/, apiFetch(baseUrl, '/ilink/bot/sendtyping', body, token, 15000)];
        });
    });
}
function fetchQrCode(baseUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiGet(baseUrl, '/ilink/bot/get_bot_qrcode?bot_type=3')];
        });
    });
}
function pollQrStatus(baseUrl, qrcode) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiGet(baseUrl, "/ilink/bot/get_qrcode_status?qrcode=".concat(encodeURIComponent(qrcode)), {
                    'iLink-App-ClientVersion': '1',
                })];
        });
    });
}
function buildTextMessage(userId, contextToken, text) {
    return {
        from_user_id: '',
        to_user_id: userId,
        client_id: (0, node_crypto_1.randomUUID)(),
        message_type: types_js_1.MessageType.BOT,
        message_state: types_js_1.MessageState.FINISH,
        context_token: contextToken,
        item_list: [
            {
                type: types_js_1.MessageItemType.TEXT,
                text_item: { text: text },
            },
        ],
    };
}
