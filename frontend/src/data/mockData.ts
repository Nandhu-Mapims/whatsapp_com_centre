import {
  Employee,
  StaffDesignation,
  EmployeeCategory,
  Department,
  WhatsAppTemplate,
  MediaAsset,
  Campaign,
  DeliveryMessage,
  AuditLog,
  ExportJob,
  WatiConfig,
  User,
} from '../types';
import realEmployees from './employees.json';
import realDesignations from './designations.json';
import realCategories from './categories.json';
import realDepartments from './departments.json';

export const mockUsers: User[] = [
  {
    id: 'u-1',
    name: 'Super Admin',
    email: 'superadmin@mapims.org',
    role: 'Super Admin',
    active: true,
    lastLogin: '2026-11-20 14:15:22',
  },
  {
    id: 'u-2',
    name: 'Admin',
    email: 'admin@mapims.org',
    role: 'Admin',
    active: true,
    lastLogin: '2026-11-20 13:40:10',
  },
];

export const mockDesignations: StaffDesignation[] = realDesignations as StaffDesignation[];

export const mockCategories: EmployeeCategory[] = realCategories as EmployeeCategory[];

export const mockDepartments: Department[] = realDepartments as Department[];

export const mockEmployees: Employee[] = realEmployees as Employee[];

export const mockTemplates: WhatsAppTemplate[] = [
  {
    id: '6b03bd79e103c1329b7f7604',
    watiTemplateId: 'aph_notice_url',
    name: 'aph_notice_url',
    category: 'MARKETING',
    language: 'en',
    headerType: 'NONE',
    body: 'Dear {{1}},\n{{2}}\nYou can access the application using the link below:\n{{3}}\n\nRegards,\nAdhiparasakthi Hospitals',
    footer: 'APH Connect • MAPIMS Hospitals',
    buttons: [],
    variables: [
      { key: '1', sampleValue: 'Shreya', description: 'Recipient Name' },
      { key: '2', sampleValue: 'Incident reporting is live !', description: 'Notice Content' },
      { key: '3', sampleValue: 'https://inc.mapims.edu.in/login', description: 'Portal URL' },
    ],
    status: 'APPROVED',
    lastSynced: '2026-11-23',
    createdAt: '2026-11-23',
  },
  {
    id: '6afff3776d38731f1c011455',
    watiTemplateId: 'aph_test_sample',
    name: 'aph_test_sample',
    category: 'MARKETING',
    language: 'en',
    headerType: 'NONE',
    body: 'Dear {{1}}, welcome to APH Connect hospital broadcast test.',
    footer: 'APH Connect • MAPIMS Hospitals',
    buttons: [],
    variables: [
      { key: '1', sampleValue: 'Dr. Saravanan', description: 'Staff Name' },
    ],
    status: 'APPROVED',
    lastSynced: '2026-11-20',
    createdAt: '2026-11-20',
  },
  {
    id: '6afff35ad80fe3a79aff1ab8',
    watiTemplateId: 'aph_sample_test',
    name: 'aph_sample_test',
    category: 'UTILITY',
    language: 'en',
    headerType: 'NONE',
    body: '',
    footer: '',
    buttons: [],
    variables: [],
    status: 'DRAFT',
    lastSynced: '2026-11-20',
    createdAt: '2026-11-20',
  },
];

export const mockMediaAssets: MediaAsset[] = [
  {
    id: 'med-01',
    filename: 'hospital_accreditation_banner.jpg',
    fileType: 'image',
    mimeType: 'image/jpeg',
    size: '1.2 MB',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=60',
    uploadedBy: 'Admin',
    uploadDate: '2026-10-15',
    usageCount: 4,
  },
  {
    id: 'med-02',
    filename: 'cme_cardiology_october.png',
    fileType: 'image',
    mimeType: 'image/png',
    size: '2.4 MB',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60',
    uploadedBy: 'Admin',
    uploadDate: '2026-10-20',
    usageCount: 2,
  },
  {
    id: 'med-03',
    filename: 'nabh_infection_control_sop.pdf',
    fileType: 'pdf',
    mimeType: 'application/pdf',
    size: '3.8 MB',
    url: 'https://mapims.org/docs/sop-sample.pdf',
    uploadedBy: 'Admin',
    uploadDate: '2026-10-22',
    usageCount: 6,
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp-01',
    campaignId: 'CMP-2026-001',
    title: 'Hospital Clinical Staff Official Communication',
    description: 'Mandatory clinical circular sent to Teaching Doctors and Staff Nurses.',
    categoryScope: 'Medical / Clinical, Nursing Staff',
    departmentScope: 'General Medicine, Emergency',
    templateId: '6afff3776d38731f1c011455',
    templateName: 'aph_test_sample',
    templateVariables: {
      '1': '{{employee.name}}',
    },
    recipientBreakdown: {
      totalMatching: 157,
      selected: 157,
      eligible: 157,
      optedOut: 0,
      duplicate: 0,
      invalid: 0,
    },
    selectedRecipientsCount: 157,
    createdBy: 'Admin',
    createdById: 'u-2',
    createdAt: '2026-11-20 10:30',
    status: 'Completed',
    approvedBy: 'Super Admin',
    approvedAt: '2026-11-20 11:45',
    completedAt: '2026-11-20 12:15',
    submittedCount: 157,
    deliveredCount: 155,
    readCount: 148,
    failedCount: 2,
    priority: 'Normal',
  },
];

export const mockDeliveryMessages: DeliveryMessage[] = [
  {
    id: 'msg-01',
    campaignId: 'cmp-01',
    campaignName: 'Hospital Clinical Staff Official Communication',
    employeeId: 'MAP-9551',
    employeeName: 'Shreya (Test Lead)',
    maskedNumber: '+91 95513 ••••••',
    templateName: 'aph_test_sample',
    submittedAt: '2026-11-20 11:46:10',
    providerStatus: 'read',
    statusTimestamp: '2026-11-20 11:48:32',
    canRetry: false,
    retryAttempts: 0,
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-01',
    timestamp: '2026-11-20 11:45:10',
    actor: 'Super Admin',
    actorRole: 'Super Admin',
    action: 'CAMPAIGN_DISPATCHED',
    module: 'Campaign Management',
    resourceId: 'CMP-2026-001',
    details: "Dispatched broadcast Hospital Clinical Staff Official Communication to 157 clinical staff.",
    ipAddress: '192.168.10.45',
    status: 'SUCCESS',
  },
  {
    id: 'aud-02',
    timestamp: '2026-11-20 10:30:00',
    actor: 'Admin',
    actorRole: 'Admin',
    action: 'ROSTER_IMPORT_SYNC',
    module: 'Employee Directory',
    resourceId: 'EMP-ROSTER-2026',
    details: 'Synchronized official employee list from Employee List-19.11.2026.xlsx (1,046 staff + 1 Test Lead).',
    ipAddress: '192.168.10.18',
    status: 'SUCCESS',
  },
  {
    id: 'aud-03',
    timestamp: '2026-11-20 08:00:12',
    actor: 'System Automated Job',
    actorRole: 'Super Admin',
    action: 'WATI_TEMPLATES_SYNCED',
    module: 'WhatsApp Templates',
    resourceId: 'WATI-SYNC-BATCH',
    details: 'Synchronized approved template aph_test_sample from live WATI gateway.',
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
  },
];

export const mockWatiConfig: WatiConfig = {
  endpoint: 'https://live-mt-server.wati.io/10190409',
  accountName: 'MAPIMS / Adhiparasakthi Hospitals',
  maskedToken: 'wati_23e7b9c8-••••••••••••••••••••••••JUsx',
  connectionStatus: 'CONNECTED',
  lastSyncedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  webhookStatus: 'ACTIVE',
  webhookLastReceived: 'Just now (Live Gateway Connected)',
  dailyQuotaUsed: 13,
  dailyQuotaLimit: 10000,
};

export const mockExportJobs: ExportJob[] = [
  {
    id: 'exp-01',
    reportType: 'Delivery Status Summary',
    dateRange: '01 Nov 2026 - 20 Nov 2026',
    format: 'XLSX',
    requestedBy: 'Admin',
    requestedAt: '2026-11-20 11:30',
    status: 'READY',
    fileSize: '480 KB',
    downloadUrl: '#',
  },
];
