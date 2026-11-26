"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaatiReplyModel = exports.VaatiOutboundMessageModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VaatiOutboundMessageSchema = new mongoose_1.Schema({
    waMessageId: { type: String, required: true, unique: true, index: true },
    waStanzaId: { type: String, index: true },
    session: { type: String, default: 'tenant_efs' },
    chatId: { type: String, required: true, index: true },
    recipientPhone: { type: String, required: true, index: true },
    recipientName: { type: String },
    templateId: { type: String, required: true, index: true },
    templateName: { type: String, required: true },
    templateTitle: { type: String, required: true },
    campaignId: { type: String, index: true },
    campaignTitle: { type: String },
    messageType: {
        type: String,
        enum: ['text', 'url_text', 'image_text', 'pdf_text', 'poll'],
        default: 'text',
    },
    sentText: { type: String, required: true },
    allowReplies: { type: Boolean, default: false, index: true },
    replyPrompt: { type: String },
    sentBy: { type: String, default: 'Authorized Staff' },
    sentAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });
exports.VaatiOutboundMessageModel = mongoose_1.default.model('VaatiOutboundMessage', VaatiOutboundMessageSchema);
const VaatiReplySchema = new mongoose_1.Schema({
    replyId: { type: String, required: true, unique: true, index: true },
    waMessageId: { type: String, required: true, unique: true, index: true },
    session: { type: String, default: 'tenant_efs' },
    senderPhone: { type: String, required: true, index: true },
    senderChatId: { type: String, required: true },
    senderName: { type: String, required: true },
    employeeId: { type: String, index: true },
    department: { type: String },
    designation: { type: String },
    templateId: { type: String, required: true, index: true },
    templateName: { type: String, required: true },
    templateTitle: { type: String, required: true },
    campaignId: { type: String, index: true },
    campaignTitle: { type: String },
    questionText: { type: String, required: true },
    outboundWaMessageId: { type: String, index: true },
    replyType: { type: String, enum: ['text', 'poll_vote', 'media'], default: 'text' },
    replyText: { type: String, required: true },
    selectedOptions: [{ type: String }],
    hasMedia: { type: Boolean, default: false },
    mediaType: { type: String },
    quotedMatch: { type: Boolean, default: false },
    repliedAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['NEW', 'REVIEWED'], default: 'NEW', index: true },
    adminNote: { type: String },
}, { timestamps: true });
exports.VaatiReplyModel = mongoose_1.default.model('VaatiReply', VaatiReplySchema);
