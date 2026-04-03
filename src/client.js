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
exports.WeixinBot = void 0;
var promises_1 = require("node:timers/promises");
var promises_2 = require("node:fs/promises");
var node_crypto_1 = require("node:crypto");
var api_js_1 = require("./api.js");
var auth_js_1 = require("./auth.js");
var cdn_js_1 = require("./cdn.js");
var media_js_1 = require("./media.js");
var types_js_1 = require("./types.js");
var WeixinBot = /** @class */ (function () {
    function WeixinBot(options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.handlers = [];
        this.contextTokens = new Map();
        this.cursor = '';
        this.stopped = false;
        this.currentPollController = null;
        this.runPromise = null;
        this.baseUrl = (_a = options.baseUrl) !== null && _a !== void 0 ? _a : api_js_1.DEFAULT_BASE_URL;
        this.tokenPath = options.tokenPath;
        this.onErrorCallback = options.onError;
    }
    WeixinBot.prototype.login = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var previousToken, credentials;
            var _a;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        previousToken = (_a = this.credentials) === null || _a === void 0 ? void 0 : _a.token;
                        return [4 /*yield*/, (0, auth_js_1.login)({
                                baseUrl: this.baseUrl,
                                tokenPath: this.tokenPath,
                                force: options.force,
                            })];
                    case 1:
                        credentials = _b.sent();
                        this.credentials = credentials;
                        this.baseUrl = credentials.baseUrl;
                        if (previousToken && previousToken !== credentials.token) {
                            this.cursor = '';
                            this.contextTokens.clear();
                        }
                        this.log("Logged in as ".concat(credentials.userId));
                        return [2 /*return*/, credentials];
                }
            });
        });
    };
    WeixinBot.prototype.onMessage = function (handler) {
        this.handlers.push(handler);
        return this;
    };
    WeixinBot.prototype.on = function (event, handler) {
        if (event !== 'message') {
            throw new Error("Unsupported event: ".concat(event));
        }
        return this.onMessage(handler);
    };
    WeixinBot.prototype.reply = function (message, text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.contextTokens.set(message.userId, message._contextToken);
                        return [4 /*yield*/, this.sendText(message.userId, text, message._contextToken)
                            // Auto-cancel typing indicator after reply
                        ];
                    case 1:
                        _a.sent();
                        // Auto-cancel typing indicator after reply
                        this.stopTyping(message.userId).catch(function () { });
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.sendTyping = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var contextToken, credentials, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken) {
                            throw new Error("No cached context token for user ".concat(userId, ". Reply to an incoming message first."));
                        }
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 1:
                        credentials = _a.sent();
                        return [4 /*yield*/, (0, api_js_1.getConfig)(this.baseUrl, credentials.token, userId, contextToken)];
                    case 2:
                        config = _a.sent();
                        if (!config.typing_ticket) {
                            this.log('sendTyping: no typing_ticket returned by getconfig');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, api_js_1.sendTyping)(this.baseUrl, credentials.token, userId, config.typing_ticket, 1)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.stopTyping = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var contextToken, credentials, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 1:
                        credentials = _a.sent();
                        return [4 /*yield*/, (0, api_js_1.getConfig)(this.baseUrl, credentials.token, userId, contextToken)];
                    case 2:
                        config = _a.sent();
                        if (!config.typing_ticket)
                            return [2 /*return*/];
                        return [4 /*yield*/, (0, api_js_1.sendTyping)(this.baseUrl, credentials.token, userId, config.typing_ticket, 2)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.send = function (userId, text) {
        return __awaiter(this, void 0, void 0, function () {
            var contextToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken) {
                            throw new Error("No cached context token for user ".concat(userId, ". Reply to an incoming message first."));
                        }
                        return [4 /*yield*/, this.sendText(userId, text, contextToken)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.runPromise) {
                            return [2 /*return*/, this.runPromise];
                        }
                        this.stopped = false;
                        this.runPromise = this.runLoop();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        return [4 /*yield*/, this.runPromise];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        this.runPromise = null;
                        this.currentPollController = null;
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.stop = function () {
        var _a;
        this.stopped = true;
        (_a = this.currentPollController) === null || _a === void 0 ? void 0 : _a.abort();
    };
    WeixinBot.prototype.runLoop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var retryDelayMs, credentials, updates, _i, _a, raw, incoming, error_1, loginError_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.ensureCredentials()];
                    case 1:
                        _c.sent();
                        this.log('Long-poll loop started.');
                        retryDelayMs = 1000;
                        _c.label = 2;
                    case 2:
                        if (!!this.stopped) return [3 /*break*/, 20];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 10, , 19]);
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 4:
                        credentials = _c.sent();
                        this.currentPollController = new AbortController();
                        return [4 /*yield*/, (0, api_js_1.getUpdates)(this.baseUrl, credentials.token, this.cursor, this.currentPollController.signal)];
                    case 5:
                        updates = _c.sent();
                        this.currentPollController = null;
                        this.cursor = updates.get_updates_buf || this.cursor;
                        retryDelayMs = 1000;
                        _i = 0, _a = (_b = updates.msgs) !== null && _b !== void 0 ? _b : [];
                        _c.label = 6;
                    case 6:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        raw = _a[_i];
                        this.rememberContext(raw);
                        incoming = this.toIncomingMessage(raw);
                        if (!incoming) {
                            return [3 /*break*/, 8];
                        }
                        return [4 /*yield*/, this.dispatchMessage(incoming)];
                    case 7:
                        _c.sent();
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9: return [3 /*break*/, 19];
                    case 10:
                        error_1 = _c.sent();
                        this.currentPollController = null;
                        if (this.stopped && isAbortError(error_1)) {
                            return [3 /*break*/, 20];
                        }
                        if (!isSessionExpired(error_1)) return [3 /*break*/, 16];
                        this.log('Session expired. Waiting for a fresh QR login...');
                        this.credentials = undefined;
                        this.cursor = '';
                        this.contextTokens.clear();
                        _c.label = 11;
                    case 11:
                        _c.trys.push([11, 14, , 15]);
                        return [4 /*yield*/, (0, auth_js_1.clearCredentials)(this.tokenPath)];
                    case 12:
                        _c.sent();
                        return [4 /*yield*/, this.login({ force: true })];
                    case 13:
                        _c.sent();
                        retryDelayMs = 1000;
                        return [3 /*break*/, 2];
                    case 14:
                        loginError_1 = _c.sent();
                        this.reportError(loginError_1);
                        return [3 /*break*/, 15];
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        this.reportError(error_1);
                        _c.label = 17;
                    case 17: return [4 /*yield*/, (0, promises_1.setTimeout)(retryDelayMs)];
                    case 18:
                        _c.sent();
                        retryDelayMs = Math.min(retryDelayMs * 2, 10000);
                        return [3 /*break*/, 19];
                    case 19: return [3 /*break*/, 2];
                    case 20:
                        this.log('Long-poll loop stopped.');
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.ensureCredentials = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stored;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.credentials) {
                            return [2 /*return*/, this.credentials];
                        }
                        return [4 /*yield*/, (0, auth_js_1.loadCredentials)(this.tokenPath)];
                    case 1:
                        stored = _a.sent();
                        if (stored) {
                            this.credentials = stored;
                            this.baseUrl = stored.baseUrl;
                            return [2 /*return*/, stored];
                        }
                        return [2 /*return*/, this.login()];
                }
            });
        });
    };
    WeixinBot.prototype.sendText = function (userId, text, contextToken) {
        return __awaiter(this, void 0, void 0, function () {
            var credentials, _i, _a, chunk;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (text.length === 0) {
                            throw new Error('Message text cannot be empty.');
                        }
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 1:
                        credentials = _b.sent();
                        _i = 0, _a = chunkText(text, 2000);
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        chunk = _a[_i];
                        return [4 /*yield*/, (0, api_js_1.sendMessage)(this.baseUrl, credentials.token, (0, api_js_1.buildTextMessage)(userId, contextToken, chunk))];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.sendImage = function (userId, filePathOrBuffer, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var contextToken, buf, _a, credentials, uploaded, imageItem;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken) {
                            throw new Error("No cached context token for user ".concat(userId, ". Reply to an incoming message first."));
                        }
                        if (!(typeof filePathOrBuffer === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, promises_2.readFile)(filePathOrBuffer)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = filePathOrBuffer;
                        _b.label = 3;
                    case 3:
                        buf = _a;
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 4:
                        credentials = _b.sent();
                        return [4 /*yield*/, (0, cdn_js_1.uploadMediaToCdn)({
                                buf: buf,
                                toUserId: userId,
                                baseUrl: this.baseUrl,
                                token: credentials.token,
                                mediaType: types_js_1.UploadMediaType.IMAGE,
                                label: 'sendImage',
                            })];
                    case 5:
                        uploaded = _b.sent();
                        imageItem = (0, media_js_1.buildImageMessage)(uploaded);
                        return [4 /*yield*/, (0, api_js_1.sendMessage)(this.baseUrl, credentials.token, {
                                from_user_id: '',
                                to_user_id: userId,
                                client_id: (0, node_crypto_1.randomUUID)(),
                                message_type: types_js_1.MessageType.BOT,
                                message_state: types_js_1.MessageState.FINISH,
                                context_token: contextToken,
                                item_list: [{ type: types_js_1.MessageItemType.IMAGE, image_item: imageItem }],
                            })];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.sendVideo = function (userId, filePathOrBuffer, filenameOrOpts, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var contextToken, buf, _a, actualOpts, credentials, uploaded, videoItem;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken) {
                            throw new Error("No cached context token for user ".concat(userId, ". Reply to an incoming message first."));
                        }
                        if (!(typeof filePathOrBuffer === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, promises_2.readFile)(filePathOrBuffer)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = filePathOrBuffer;
                        _b.label = 3;
                    case 3:
                        buf = _a;
                        actualOpts = typeof filenameOrOpts === 'object' ? filenameOrOpts : opts;
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 4:
                        credentials = _b.sent();
                        return [4 /*yield*/, (0, cdn_js_1.uploadMediaToCdn)({
                                buf: buf,
                                toUserId: userId,
                                baseUrl: this.baseUrl,
                                token: credentials.token,
                                mediaType: types_js_1.UploadMediaType.VIDEO,
                                label: 'sendVideo',
                            })];
                    case 5:
                        uploaded = _b.sent();
                        videoItem = (0, media_js_1.buildVideoMessage)(uploaded, actualOpts);
                        return [4 /*yield*/, (0, api_js_1.sendMessage)(this.baseUrl, credentials.token, {
                                from_user_id: '',
                                to_user_id: userId,
                                client_id: (0, node_crypto_1.randomUUID)(),
                                message_type: types_js_1.MessageType.BOT,
                                message_state: types_js_1.MessageState.FINISH,
                                context_token: contextToken,
                                item_list: [{ type: types_js_1.MessageItemType.VIDEO, video_item: videoItem }],
                            })];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.sendVoice = function (userId, filePathOrBuffer, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var contextToken, buf, _a, credentials, uploaded, voiceItem;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken) {
                            throw new Error("No cached context token for user ".concat(userId, ". Reply to an incoming message first."));
                        }
                        if (!(typeof filePathOrBuffer === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, promises_2.readFile)(filePathOrBuffer)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = filePathOrBuffer;
                        _b.label = 3;
                    case 3:
                        buf = _a;
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 4:
                        credentials = _b.sent();
                        return [4 /*yield*/, (0, cdn_js_1.uploadMediaToCdn)({
                                buf: buf,
                                toUserId: userId,
                                baseUrl: this.baseUrl,
                                token: credentials.token,
                                mediaType: types_js_1.UploadMediaType.VOICE,
                                label: 'sendVoice',
                            })];
                    case 5:
                        uploaded = _b.sent();
                        voiceItem = (0, media_js_1.buildVoiceMessage)(uploaded);
                        return [4 /*yield*/, (0, api_js_1.sendMessage)(this.baseUrl, credentials.token, {
                                from_user_id: '',
                                to_user_id: userId,
                                client_id: (0, node_crypto_1.randomUUID)(),
                                message_type: types_js_1.MessageType.BOT,
                                message_state: types_js_1.MessageState.FINISH,
                                context_token: contextToken,
                                item_list: [{ type: types_js_1.MessageItemType.VOICE, voice_item: voiceItem }],
                            })];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.sendFile = function (userId, filePathOrBuffer, fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var contextToken, buf, _a, actualFileName, credentials, uploaded, fileItem;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken) {
                            throw new Error("No cached context token for user ".concat(userId, ". Reply to an incoming message first."));
                        }
                        if (!(typeof filePathOrBuffer === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, promises_2.readFile)(filePathOrBuffer)];
                    case 1:
                        _a = _c.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = filePathOrBuffer;
                        _c.label = 3;
                    case 3:
                        buf = _a;
                        actualFileName = typeof filePathOrBuffer === 'string' ? ((_b = fileName !== null && fileName !== void 0 ? fileName : filePathOrBuffer.split('/').pop()) !== null && _b !== void 0 ? _b : 'file') : (fileName !== null && fileName !== void 0 ? fileName : 'file');
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 4:
                        credentials = _c.sent();
                        return [4 /*yield*/, (0, cdn_js_1.uploadMediaToCdn)({
                                buf: buf,
                                toUserId: userId,
                                baseUrl: this.baseUrl,
                                token: credentials.token,
                                mediaType: types_js_1.UploadMediaType.FILE,
                                label: 'sendFile',
                            })];
                    case 5:
                        uploaded = _c.sent();
                        fileItem = (0, media_js_1.buildFileMessage)(uploaded, actualFileName);
                        return [4 /*yield*/, (0, api_js_1.sendMessage)(this.baseUrl, credentials.token, {
                                from_user_id: '',
                                to_user_id: userId,
                                client_id: (0, node_crypto_1.randomUUID)(),
                                message_type: types_js_1.MessageType.BOT,
                                message_state: types_js_1.MessageState.FINISH,
                                context_token: contextToken,
                                item_list: [{ type: types_js_1.MessageItemType.FILE, file_item: fileItem }],
                            })];
                    case 6:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send a reference (quote) message.
     * @param userId - The recipient user ID
     * @param title - The reference title/description
     * @param refItem - The MessageItem to reference (e.g., text_item, image_item, etc.)
     * @param content - The actual message content to send (default is text)
     */
    WeixinBot.prototype.sendRefMessage = function (userId_1, title_1, refItem_1) {
        return __awaiter(this, arguments, void 0, function (userId, title, refItem, content) {
            var contextToken, credentials, refMsg, itemList;
            if (content === void 0) { content = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contextToken = this.contextTokens.get(userId);
                        if (!contextToken) {
                            throw new Error("No cached context token for user ".concat(userId, ". Reply to an incoming message first."));
                        }
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 1:
                        credentials = _a.sent();
                        refMsg = (0, media_js_1.buildRefMessage)(title, refItem);
                        itemList = [];
                        if (content.text) {
                            itemList.push({
                                type: types_js_1.MessageItemType.TEXT,
                                text_item: { text: content.text },
                                ref_msg: refMsg,
                            });
                        }
                        else {
                            // If no text content, just send the ref message without text_item
                            itemList.push({
                                type: types_js_1.MessageItemType.TEXT,
                                ref_msg: refMsg,
                            });
                        }
                        return [4 /*yield*/, (0, api_js_1.sendMessage)(this.baseUrl, credentials.token, {
                                from_user_id: '',
                                to_user_id: userId,
                                client_id: (0, node_crypto_1.randomUUID)(),
                                message_type: types_js_1.MessageType.BOT,
                                message_state: types_js_1.MessageState.FINISH,
                                context_token: contextToken,
                                item_list: itemList,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.dispatchMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, results_1, result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.handlers.length === 0) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Promise.allSettled(this.handlers.map(function (handler) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, handler(message)];
                            }); }); }))];
                    case 1:
                        results = _a.sent();
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            result = results_1[_i];
                            if (result.status === 'rejected') {
                                this.reportError(result.reason);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    WeixinBot.prototype.rememberContext = function (message) {
        var userId = message.message_type === types_js_1.MessageType.USER ? message.from_user_id : message.to_user_id;
        if (userId && message.context_token) {
            this.contextTokens.set(userId, message.context_token);
        }
    };
    WeixinBot.prototype.toIncomingMessage = function (message) {
        if (message.message_type !== types_js_1.MessageType.USER) {
            return null;
        }
        return {
            userId: message.from_user_id,
            text: extractText(message.item_list),
            type: detectType(message.item_list),
            raw: message,
            _contextToken: message.context_token,
            timestamp: new Date(message.create_time_ms),
        };
    };
    WeixinBot.prototype.reportError = function (error) {
        var _a;
        this.log(error instanceof Error ? error.message : String(error));
        (_a = this.onErrorCallback) === null || _a === void 0 ? void 0 : _a.call(this, error);
    };
    WeixinBot.prototype.log = function (message) {
        process.stderr.write("[weixin-bot] ".concat(message, "\n"));
    };
    return WeixinBot;
}());
exports.WeixinBot = WeixinBot;
function detectType(items) {
    var first = items[0];
    switch (first === null || first === void 0 ? void 0 : first.type) {
        case types_js_1.MessageItemType.IMAGE:
            return 'image';
        case types_js_1.MessageItemType.VOICE:
            return 'voice';
        case types_js_1.MessageItemType.FILE:
            return 'file';
        case types_js_1.MessageItemType.VIDEO:
            return 'video';
        default:
            return 'text';
    }
}
function extractText(items) {
    var parts = items
        .map(function (item) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        switch (item.type) {
            case types_js_1.MessageItemType.TEXT:
                return (_b = (_a = item.text_item) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : '';
            case types_js_1.MessageItemType.IMAGE:
                return (_d = (_c = item.image_item) === null || _c === void 0 ? void 0 : _c.url) !== null && _d !== void 0 ? _d : '[image]';
            case types_js_1.MessageItemType.VOICE:
                return (_f = (_e = item.voice_item) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : '[voice]';
            case types_js_1.MessageItemType.FILE:
                return (_h = (_g = item.file_item) === null || _g === void 0 ? void 0 : _g.file_name) !== null && _h !== void 0 ? _h : '[file]';
            case types_js_1.MessageItemType.VIDEO:
                return '[video]';
            default:
                return '';
        }
    })
        .filter(Boolean);
    return parts.join('\n');
}
function chunkText(text, limit) {
    var chars = Array.from(text);
    var chunks = [];
    for (var index = 0; index < chars.length; index += limit) {
        chunks.push(chars.slice(index, index + limit).join(''));
    }
    return chunks.length > 0 ? chunks : [''];
}
function isAbortError(error) {
    return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}
function isSessionExpired(error) {
    return error instanceof api_js_1.ApiError && error.code === -14;
}
