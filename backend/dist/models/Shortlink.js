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
exports.ShortlinkModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ShortlinkClickSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    timestamp: { type: String, required: true },
    timestampIst: { type: String, required: true },
    isLikelyHuman: { type: Boolean, default: true },
    isBot: { type: Boolean, default: false },
    clickType: { type: String, enum: ['human', 'crawler', 'preview'], default: 'human' },
    deviceType: { type: String, enum: ['Mobile', 'Tablet', 'Desktop', 'Bot', 'Unknown'], default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown' },
    region: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    referrer: { type: String, default: 'Unavailable' },
    userAgentSummary: { type: String },
}, { _id: false });
const ShortlinkSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    destinationUrl: { type: String, required: true, trim: true },
    alias: { type: String, required: true, unique: true, trim: true, lowercase: true },
    campaignChannel: { type: String, default: 'General', trim: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    createdBy: { type: String, default: 'Super Admin' },
    createdById: { type: String, default: 'u-1' },
    updatedBy: { type: String },
    totalOpens: { type: Number, default: 0 },
    humanOpens: { type: Number, default: 0 },
    botOpens: { type: Number, default: 0 },
    lastOpenedAt: { type: Date, default: null },
    clicks: { type: [ShortlinkClickSchema], default: [] },
}, { timestamps: true });
// Indexes for fast resolution and analytics queries
ShortlinkSchema.index({ createdAt: -1 });
exports.ShortlinkModel = mongoose_1.default.model('Shortlink', ShortlinkSchema);
