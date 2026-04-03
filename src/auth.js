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
exports.DEFAULT_TOKEN_PATH = void 0;
exports.loadCredentials = loadCredentials;
exports.clearCredentials = clearCredentials;
exports.login = login;
var promises_1 = require("node:fs/promises");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var promises_2 = require("node:timers/promises");
var api_js_1 = require("./api.js");
var DEFAULT_TOKEN_DIR = node_path_1.default.join(node_os_1.default.homedir(), '.weixin-bot');
var DEFAULT_TOKEN_PATH = node_path_1.default.join(DEFAULT_TOKEN_DIR, 'credentials.json');
exports.DEFAULT_TOKEN_PATH = DEFAULT_TOKEN_PATH;
var QR_POLL_INTERVAL_MS = 2000;
function resolveTokenPath(tokenPath) {
    return tokenPath !== null && tokenPath !== void 0 ? tokenPath : DEFAULT_TOKEN_PATH;
}
function log(message) {
    process.stderr.write("[weixin-bot] ".concat(message, "\n"));
}
function saveCredentials(credentials, tokenPath) {
    return __awaiter(this, void 0, void 0, function () {
        var targetPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetPath = resolveTokenPath(tokenPath);
                    return [4 /*yield*/, (0, promises_1.mkdir)(node_path_1.default.dirname(targetPath), { recursive: true, mode: 448 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, promises_1.writeFile)(targetPath, "".concat(JSON.stringify(credentials, null, 2), "\n"), { mode: 384 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, promises_1.chmod)(targetPath, 384)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function isCredentials(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    var candidate = value;
    return typeof candidate.token === 'string'
        && typeof candidate.baseUrl === 'string'
        && typeof candidate.accountId === 'string'
        && typeof candidate.userId === 'string';
}
function printQrInstructions(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            log('在微信中打开以下链接完成登录:');
            process.stderr.write("".concat(url, "\n"));
            return [2 /*return*/];
        });
    });
}
function loadCredentials(tokenPath) {
    return __awaiter(this, void 0, void 0, function () {
        var targetPath, raw, parsed, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetPath = resolveTokenPath(tokenPath);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readFile)(targetPath, 'utf8')];
                case 2:
                    raw = _a.sent();
                    parsed = JSON.parse(raw);
                    if (!isCredentials(parsed)) {
                        throw new Error("Invalid credentials format in ".concat(targetPath));
                    }
                    return [2 /*return*/, parsed];
                case 3:
                    error_1 = _a.sent();
                    if (error_1.code === 'ENOENT') {
                        return [2 /*return*/, undefined];
                    }
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function clearCredentials(tokenPath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, promises_1.rm)(resolveTokenPath(tokenPath), { force: true })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function login() {
    return __awaiter(this, arguments, void 0, function (options) {
        var baseUrl, existing, qr, lastStatus, status_1, credentials;
        var _a, _b;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    baseUrl = (_a = options.baseUrl) !== null && _a !== void 0 ? _a : api_js_1.DEFAULT_BASE_URL;
                    if (!!options.force) return [3 /*break*/, 2];
                    return [4 /*yield*/, loadCredentials(options.tokenPath)];
                case 1:
                    existing = _c.sent();
                    if (existing) {
                        return [2 /*return*/, existing];
                    }
                    _c.label = 2;
                case 2: return [4 /*yield*/, (0, api_js_1.fetchQrCode)(baseUrl)];
                case 3:
                    qr = _c.sent();
                    return [4 /*yield*/, printQrInstructions(qr.qrcode_img_content)];
                case 4:
                    _c.sent();
                    lastStatus = void 0;
                    _c.label = 5;
                case 5: return [4 /*yield*/, (0, api_js_1.pollQrStatus)(baseUrl, qr.qrcode)];
                case 6:
                    status_1 = _c.sent();
                    if (status_1.status !== lastStatus) {
                        if (status_1.status === 'scaned') {
                            log('QR code scanned. Confirm the login inside WeChat.');
                        }
                        else if (status_1.status === 'confirmed') {
                            log('Login confirmed.');
                        }
                        else if (status_1.status === 'expired') {
                            log('QR code expired. Requesting a new one...');
                        }
                        lastStatus = status_1.status;
                    }
                    if (!(status_1.status === 'confirmed')) return [3 /*break*/, 8];
                    if (!status_1.bot_token || !status_1.ilink_bot_id || !status_1.ilink_user_id) {
                        throw new Error('QR login confirmed, but the API did not return bot credentials');
                    }
                    credentials = {
                        token: status_1.bot_token,
                        baseUrl: (_b = status_1.baseurl) !== null && _b !== void 0 ? _b : baseUrl,
                        accountId: status_1.ilink_bot_id,
                        userId: status_1.ilink_user_id,
                    };
                    return [4 /*yield*/, saveCredentials(credentials, options.tokenPath)];
                case 7:
                    _c.sent();
                    return [2 /*return*/, credentials];
                case 8:
                    if (status_1.status === 'expired') {
                        return [3 /*break*/, 11];
                    }
                    return [4 /*yield*/, (0, promises_2.setTimeout)(QR_POLL_INTERVAL_MS)];
                case 9:
                    _c.sent();
                    _c.label = 10;
                case 10: return [3 /*break*/, 5];
                case 11: return [3 /*break*/, 2];
                case 12: return [2 /*return*/];
            }
        });
    });
}
