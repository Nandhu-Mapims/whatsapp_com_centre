import mongoose, { Schema, Document } from 'mongoose';

export interface IShortlinkClick {
  id: string;
  timestamp: string; // UTC ISO 8601
  timestampIst: string; // Asia/Kolkata formatted string
  isLikelyHuman: boolean;
  isBot: boolean;
  clickType: 'human' | 'crawler' | 'preview';
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Bot' | 'Unknown';
  browser: string;
  os: string;
  country: string;
  region: string;
  city: string;
  referrer: string; // Stripped of query strings
  userAgentSummary?: string;
}

export interface IShortlink extends Document {
  id: string;
  title: string;
  destinationUrl: string;
  alias: string;
  campaignChannel: string; // e.g. 'WhatsApp', 'QR Code', 'Website', 'SMS', 'Notice Board', 'General'
  isActive: boolean;
  expiresAt?: Date | null;
  createdBy: string;
  createdById?: string;
  updatedBy?: string;
  totalOpens: number;
  humanOpens: number;
  botOpens: number;
  lastOpenedAt?: Date | null;
  clicks: IShortlinkClick[];
  createdAt: Date;
  updatedAt: Date;
}

const ShortlinkClickSchema = new Schema<IShortlinkClick>(
  {
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
  },
  { _id: false }
);

const ShortlinkSchema = new Schema<IShortlink>(
  {
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
  },
  { timestamps: true }
);

// Indexes for fast resolution and analytics queries
ShortlinkSchema.index({ createdAt: -1 });

export const ShortlinkModel = mongoose.model<IShortlink>('Shortlink', ShortlinkSchema);

