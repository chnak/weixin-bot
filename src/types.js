"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadMediaType = exports.MessageItemType = exports.MessageState = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType[MessageType["USER"] = 1] = "USER";
    MessageType[MessageType["BOT"] = 2] = "BOT";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessageState;
(function (MessageState) {
    MessageState[MessageState["NEW"] = 0] = "NEW";
    MessageState[MessageState["GENERATING"] = 1] = "GENERATING";
    MessageState[MessageState["FINISH"] = 2] = "FINISH";
})(MessageState || (exports.MessageState = MessageState = {}));
var MessageItemType;
(function (MessageItemType) {
    MessageItemType[MessageItemType["TEXT"] = 1] = "TEXT";
    MessageItemType[MessageItemType["IMAGE"] = 2] = "IMAGE";
    MessageItemType[MessageItemType["VOICE"] = 3] = "VOICE";
    MessageItemType[MessageItemType["FILE"] = 4] = "FILE";
    MessageItemType[MessageItemType["VIDEO"] = 5] = "VIDEO";
})(MessageItemType || (exports.MessageItemType = MessageItemType = {}));
var UploadMediaType;
(function (UploadMediaType) {
    UploadMediaType[UploadMediaType["IMAGE"] = 1] = "IMAGE";
    UploadMediaType[UploadMediaType["VIDEO"] = 2] = "VIDEO";
    UploadMediaType[UploadMediaType["FILE"] = 3] = "FILE";
    UploadMediaType[UploadMediaType["VOICE"] = 4] = "VOICE";
})(UploadMediaType || (exports.UploadMediaType = UploadMediaType = {}));
