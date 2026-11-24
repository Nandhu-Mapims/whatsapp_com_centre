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
exports.AuditLogModel = exports.DeliveryLogModel = exports.CampaignModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CampaignSchema = new mongoose_1.Schema({
    campaignId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    categoryScope: { type: String, required: true },
    departmentScope: { type: String, required: true },
    designationScope: { type: String, default: 'All' },
    templateId: { type: String, required: true },
    templateName: { type: String, required: true },
    templateVariables: { type: Map, of: String },
    headerMediaUrl: { type: String },
    recipientBreakdown: {
        totalMatching: { type: Number, default: 0 },
        selected: { type: Number, default: 0 },
        eligible: { type: Number, default: 0 },
        optedOut: { type: Number, default: 0 },
        duplicate: { type: Number, default: 0 },
        invalid: { type: Number, default: 0 },
    },
    selectedRecipientsCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    createdById: { type: String, required: true },
    status: {
        type: String,
        enum: [
            'Draft',
            'Pending Approval',
            'Approved',
            'Rejected',
            'Scheduled',
            'Processing',
            'Completed',
            'Partial Failure',
            'Cancelled',
        ],
        default: 'Draft',
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    rejectionComment: { type: String },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    submittedCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    priority: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], default: 'Normal' },
    idempotencyKey: { type: String },
}, { timestamps: true });
exports.CampaignModel = mongoose_1.default.model('Campaign', CampaignSchema);
const DeliveryLogSchema = new mongoose_1.Schema({
    campaignId: { type: String, required: true },
    campaignName: { type: String, required: true },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    maskedNumber: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    templateName: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    providerStatus: {
        type: String,
        enum: ['queued', 'submitted', 'sent', 'delivered', 'read', 'failed'],
        default: 'queued',
    },
    statusTimestamp: { type: Date, default: Date.now },
    errorCode: { type: String },
    errorDescription: { type: String },
    canRetry: { type: Boolean, default: false },
    retryAttempts: { type: Number, default: 0 },
}, { timestamps: true });
exports.DeliveryLogModel = mongoose_1.default.model('DeliveryLog', DeliveryLogSchema);
const AuditLogSchema = new mongoose_1.Schema({
    actor: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    resourceId: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: '127.0.0.1' },
    status: { type: String, enum: ['SUCCESS', 'WARNING', 'FAILED'], default: 'SUCCESS' },
}, { timestamps: { createdAt: true, updatedAt: false } });
exports.AuditLogModel = mongoose_1.default.model('AuditLog', AuditLogSchema);
