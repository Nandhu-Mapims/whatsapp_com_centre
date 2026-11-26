import mongoose, { Schema, Document } from 'mongoose';
import { VaatiMessageType } from '../services/vaatiService.js';

export interface IVaatiOutboundMessage extends Document {
  waMessageId: string;
  waStanzaId: string;
  session: string;
  chatId: string;
  recipientPhone: string;
  recipientName?: string;
  templateId: string;
  templateName: string;
  templateTitle: string;
  campaignId?: string;
  campaignTitle?: string;
  messageType: VaatiMessageType;
  sentText: string;
  allowReplies: boolean;
  replyPrompt?: string;
  sentBy: string;
  sentAt: Date;
}

const VaatiOutboundMessageSchema = new Schema<IVaatiOutboundMessage>(
  {
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
  },
  { timestamps: true }
);

export const VaatiOutboundMessageModel = mongoose.model<IVaatiOutboundMessage>(
  'VaatiOutboundMessage',
  VaatiOutboundMessageSchema
);

export interface IVaatiReply extends Document {
  replyId: string;
  waMessageId: string;
  session: string;
  senderPhone: string;
  senderChatId: string;
  senderName: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  templateId: string;
  templateName: string;
  templateTitle: string;
  campaignId?: string;
  campaignTitle?: string;
  questionText: string;
  outboundWaMessageId?: string;
  replyType: 'text' | 'poll_vote' | 'media';
  replyText: string;
  selectedOptions?: string[];
  hasMedia: boolean;
  mediaType?: string;
  quotedMatch: boolean;
  repliedAt: Date;
  status: 'NEW' | 'REVIEWED';
  adminNote?: string;
}

const VaatiReplySchema = new Schema<IVaatiReply>(
  {
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
  },
  { timestamps: true }
);

export const VaatiReplyModel = mongoose.model<IVaatiReply>('VaatiReply', VaatiReplySchema);

