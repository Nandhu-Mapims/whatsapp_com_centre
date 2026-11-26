import mongoose, { Schema, Document } from 'mongoose';

export type CampaignStatus = 
  | 'Draft' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Rejected' 
  | 'Scheduled' 
  | 'Processing' 
  | 'Completed' 
  | 'Partial Failure' 
  | 'Cancelled';

export interface ICampaign extends Document {
  campaignId: string;
  title: string;
  description: string;
  categoryScope: string;
  departmentScope: string;
  designationScope?: string;
  templateId: string;
  templateName: string;
  templateVariables: Map<string, string>;
  headerMediaUrl?: string;
  recipientBreakdown: {
    totalMatching: number;
    selected: number;
    eligible: number;
    optedOut: number;
    duplicate: number;
    invalid: number;
  };
  selectedRecipientsCount: number;
  createdBy: string;
  createdById: string;
  status: CampaignStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionComment?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  submittedCount: number;
  deliveredCount: number;
  sentCount?: number;
  readCount: number;
  failedCount: number;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  gateway?: 'WATI' | 'VAATI';
  customTextMessage?: string;
  messageType?: 'text' | 'url_text' | 'image_text' | 'pdf_text' | 'poll';
  ctaUrl?: string;
  mediaUrl?: string;
  mediaFilename?: string;
  mediaMimetype?: string;
  pollOptions?: string[];
  multipleAnswers?: boolean;
  allowReplies?: boolean;
  replyPrompt?: string;
  idempotencyKey?: string;
}

const CampaignSchema = new Schema<ICampaign>(
  {
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
    gateway: { type: String, enum: ['WATI', 'VAATI'], default: 'WATI' },
    customTextMessage: { type: String },
    messageType: { type: String, enum: ['text', 'url_text', 'image_text', 'pdf_text', 'poll'], default: 'text' },
    ctaUrl: { type: String },
    mediaUrl: { type: String },
    mediaFilename: { type: String },
    mediaMimetype: { type: String },
    pollOptions: [{ type: String }],
    multipleAnswers: { type: Boolean, default: false },
    allowReplies: { type: Boolean, default: false },
    replyPrompt: { type: String },
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

export const CampaignModel = mongoose.model<ICampaign>('Campaign', CampaignSchema);

export interface IDeliveryLog extends Document {
  campaignId: string;
  campaignName: string;
  employeeId: string;
  employeeName: string;
  maskedNumber: string;
  whatsappNumber: string;
  templateName: string;
  gateway?: 'WATI' | 'VAATI';
  submittedAt: Date;
  providerStatus: 'queued' | 'submitted' | 'sent' | 'delivered' | 'read' | 'failed';
  statusTimestamp: Date;
  errorCode?: string;
  errorDescription?: string;
  canRetry: boolean;
  retryAttempts: number;
}

const DeliveryLogSchema = new Schema<IDeliveryLog>(
  {
    campaignId: { type: String, required: true },
    campaignName: { type: String, required: true },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    maskedNumber: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    templateName: { type: String, required: true },
    gateway: { type: String, enum: ['WATI', 'VAATI'], default: 'WATI' },
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
  },
  { timestamps: true }
);

export const DeliveryLogModel = mongoose.model<IDeliveryLog>('DeliveryLog', DeliveryLogSchema);

export interface IAuditLog extends Document {
  actor: string;
  actorRole: string;
  action: string;
  module: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    resourceId: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: '127.0.0.1' },
    status: { type: String, enum: ['SUCCESS', 'WARNING', 'FAILED'], default: 'SUCCESS' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
