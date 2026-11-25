// Types for APH Connect - Employee Communication Platform (MAPIMS / Adhiparasakthi Hospitals)
// "One Platform. Every Employee. Connected."

export type UserRole = 'Super Admin' | 'HR' | 'MS' | 'MD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentScope?: string;
  active: boolean;
  lastLogin: string;
  avatar?: string;
}

export type ConsentStatus = 'Opted-In' | 'Opted-Out' | 'Pending Verification' | 'Unknown';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  category: string;
  staffType?: 'Teaching' | 'Non-Teaching';
  department: string;
  designation: string;
  whatsappNumber: string;
  maskedNumber: string;
  consentStatus: ConsentStatus;
  consentSource?: string;
  consentDate?: string;
  optOutDate?: string;
  active: boolean;
  lastUpdated: string;
}

export interface StaffDesignation {
  id: string;
  name: string;
  cadre: 'Teaching' | 'Non-Teaching' | 'Both';
  employeeCount: number;
  departmentCount: number;
  departments: string[];
  active: boolean;
  updatedAt: string;
}

export interface EmployeeCategory {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
  departmentCount: number;
  active: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  categoryName: string;
  employeeCount: number;
  hodName?: string;
  active: boolean;
  updatedAt: string;
}

export type TemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
export type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';

export interface TemplateVariable {
  key: string;
  sampleValue: string;
  description: string;
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
  text: string;
  value?: string;
}

export interface WhatsAppTemplate {
  id: string;
  watiTemplateId?: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: HeaderType;
  headerContent?: string;
  body: string;
  footer?: string;
  buttons: TemplateButton[];
  variables: TemplateVariable[];
  status: TemplateStatus;
  rejectionReason?: string;
  lastSynced?: string;
  createdAt: string;
  isDeleted?: boolean;
  inTrash?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  fileType: 'image' | 'pdf' | 'video';
  mimeType: string;
  size: string;
  url: string;
  uploadedBy: string;
  uploadDate: string;
  usageCount: number;
}

export type CampaignStatus = 
  | 'Draft' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Rejected' 
  | 'Scheduled' 
  | 'Processing' 
  | 'Completed' 
  | 'Sent'
  | 'Partial Failure' 
  | 'Cancelled';

export interface RecipientBreakdown {
  totalMatching: number;
  selected: number;
  eligible: number;
  optedOut: number;
  duplicate: number;
  invalid: number;
}

export interface Campaign {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  categoryScope: string;
  departmentScope: string;
  designationScope?: string;
  templateId: string;
  templateName: string;
  templateVariables: Record<string, string>;
  headerMediaUrl?: string;
  recipientBreakdown: RecipientBreakdown;
  selectedRecipientsCount: number;
  recipientNumbers?: string[];
  createdBy: string;
  createdById: string;
  createdAt: string;
  status: CampaignStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionComment?: string;
  scheduledAt?: string;
  completedAt?: string;
  submittedCount: number;
  deliveredCount: number;
  sentCount?: number;
  readCount: number;
  failedCount: number;
  priority: 'Normal' | 'Urgent' | 'Emergency';
}

export interface DeliveryMessage {
  id: string;
  campaignId: string;
  campaignName: string;
  employeeId: string;
  employeeName: string;
  maskedNumber: string;
  rawNumber?: string;
  templateName: string;
  submittedAt: string;
  providerStatus: 'queued' | 'submitted' | 'sent' | 'delivered' | 'read' | 'failed';
  statusTimestamp: string;
  errorCode?: string;
  errorDescription?: string;
  canRetry: boolean;
  retryAttempts: number;
  autoRetryStage?: 1 | 2 | 'exhausted';
  nextAutoRetryTime?: string;
  autoRetryStatus?: string;
  finalText?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  module: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface ExportJob {
  id: string;
  reportType: string;
  dateRange: string;
  format: 'CSV' | 'XLSX';
  requestedBy: string;
  requestedAt: string;
  status: 'QUEUED' | 'GENERATING' | 'READY' | 'FAILED';
  fileSize?: string;
  downloadUrl?: string;
}

export interface WatiConfig {
  endpoint: string;
  accountName: string;
  maskedToken: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  lastSyncedAt: string;
  webhookStatus: 'ACTIVE' | 'INACTIVE';
  webhookLastReceived: string;
  dailyQuotaUsed: number;
  dailyQuotaLimit: number;
}

export type ShortlinkStatus = 'Active' | 'Disabled' | 'Expired';

export interface ShortlinkClick {
  id: string;
  timestampIst: string;
  timestampUtc: string;
  isLikelyHuman: boolean;
  clickType: 'human' | 'crawler' | 'preview';
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Bot' | 'Unknown';
  browser: string;
  os: string;
  location: string;
  referrer: string;
}

export interface Shortlink {
  id: string;
  title: string;
  destinationUrl: string;
  alias: string;
  shortUrl: string;
  campaignChannel: string;
  isActive: boolean;
  computedStatus: ShortlinkStatus;
  expiresAt?: string | null;
  expiresAtIst?: string;
  createdAt: string;
  createdAtIst?: string;
  updatedAt: string;
  updatedAtIst?: string;
  createdBy: string;
  totalOpens: number;
  humanOpens: number;
  botOpens: number;
  lastOpenedAt?: string | null;
  lastOpenedAtIst?: string;
}

export interface ShortlinkAnalytics {
  range: string;
  totalOpens: number;
  humanOpens: number;
  botOpens: number;
  previewOpens: number;
  crawlerOpens: number;
  humanPercentage: number;
  lastOpenedAtIst: string;
  opensOverTime: Array<{
    date: string;
    human: number;
    automated: number;
    total: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  browserBreakdown: Array<{
    browser: string;
    count: number;
  }>;
  osBreakdown: Array<{
    os: string;
    count: number;
  }>;
  geoBreakdown: Array<{
    country: string;
    region: string;
    city: string;
    count: number;
  }>;
  referrerBreakdown: Array<{
    referrer: string;
    count: number;
  }>;
  recentActivity: ShortlinkClick[];
}

