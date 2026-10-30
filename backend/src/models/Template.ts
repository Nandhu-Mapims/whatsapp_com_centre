import mongoose, { Schema, Document } from 'mongoose';

export type TemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
export type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';

export interface ITemplate extends Document {
  watiTemplateId?: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: HeaderType;
  headerContent?: string;
  body: string;
  footer?: string;
  buttons: Array<{
    type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
    text: string;
    value?: string;
  }>;
  variables: Array<{
    key: string;
    sampleValue: string;
    description: string;
  }>;
  status: TemplateStatus;
  rejectionReason?: string;
  lastSynced?: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    watiTemplateId: { type: String, sparse: true },
    name: { type: String, required: true, unique: true },
    category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], default: 'UTILITY' },
    language: { type: String, default: 'en' },
    headerType: { type: String, enum: ['NONE', 'TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO'], default: 'NONE' },
    headerContent: { type: String },
    body: { type: String, required: true },
    footer: { type: String },
    buttons: [
      {
        type: { type: String, enum: ['QUICK_REPLY', 'PHONE_NUMBER', 'URL'] },
        text: { type: String },
        value: { type: String },
      },
    ],
    variables: [
      {
        key: { type: String },
        sampleValue: { type: String },
        description: { type: String },
      },
    ],
    status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED', 'DRAFT'], default: 'DRAFT' },
    rejectionReason: { type: String },
    lastSynced: { type: Date },
  },
  { timestamps: true }
);

export const TemplateModel = mongoose.model<ITemplate>('Template', TemplateSchema);
