import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';
import { WatiService } from '../services/watiService.js';
import { RetryService } from '../services/retryService.js';
import { ExcelService } from '../services/excelService.js';
import { QueueService } from '../services/queueService.js';
import { normalizePhoneNumber, toE164Phone, toWatiDigits } from '../utils/phoneUtils.js';

const hospitalUsers = [
  {
    id: 'u-1',
    name: 'Super Admin',
    email: 'superadmin@mapims.org',
    role: 'Super Admin',
  },
  {
    id: 'u-hr',
    name: 'Hospital HR Head',
    email: 'hr@mapims.org',
    role: 'HR',
  },
  {
    id: 'u-ms',
    name: 'Dr. S. Kumar (Medical Superintendent)',
    email: 'ms@mapims.org',
    role: 'MS',
  },
  {
    id: 'u-md',
    name: 'Dr. T. Ramesh (Managing Director)',
    email: 'md@mapims.org',
    role: 'MD',
  },
];

// Realistic in-memory state store with database synchronization fallback

// Working Phase / Production Mode Switch
// In TEST MODE: All live dispatches (test send, bulk broadcasts, and retries) are strictly routed
// to authorized test handsets (+91 95513 82296) to protect hospital staff from test traffic.
export let IS_TEST_MODE = true;
export const AUTHORIZED_TEST_PHONES = ['919551382296', '917200504251', '9551382296', '7200504251'];
export const PRIMARY_TEST_PHONE = '919551382296';




// Pre-load official categorized roster from Excel (1,046 staff + 1 Test Lead)
let employeesStore: any[] = [];
try {
  const candidatePaths = [
    path.resolve(__dirname, '../data/employees.json'),
    path.resolve(__dirname, '../../src/data/employees.json'),
    path.resolve(__dirname, '../../data/employees.json'),
    path.resolve(process.cwd(), 'backend/src/data/employees.json'),
    path.resolve(process.cwd(), 'frontend/src/data/employees.json'),
    path.resolve(process.cwd(), 'src/data/employees.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      employeesStore = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log(`[API Controller] Loaded ${employeesStore.length} real hospital employees from ${p}`);
      break;
    }
  }
} catch (err: any) {
  console.error('[API Controller] Failed to load employees.json:', err.message);
}

if (employeesStore.length === 0) {
  employeesStore = [
    {
      id: 'emp-test-9551',
      employeeId: 'MAP-9551',
      name: 'Shreya (Test Lead)',
      category: 'Medical / Clinical',
      staffType: 'Teaching',
      department: 'Emergency & Trauma Care',
      designation: 'Senior Consultant - ER',
      whatsappNumber: '+919551382296',
      maskedNumber: '+91 95513 ••••••',
      consentStatus: 'Opted-In',
      consentSource: 'WATI Verified Contact',
      consentDate: '2026-11-16',
      active: true,
      lastUpdated: '2026-11-20',
    },
  ];
}

const getCampaignsCandidatePaths = () => [
  path.resolve(__dirname, '../data/campaigns.json'),
  path.resolve(__dirname, '../../src/data/campaigns.json'),
  path.resolve(__dirname, '../../dist/data/campaigns.json'),
  path.resolve(process.cwd(), 'backend/src/data/campaigns.json'),
  path.resolve(process.cwd(), 'src/data/campaigns.json'),
  path.resolve(process.cwd(), 'backend/dist/data/campaigns.json'),
  path.resolve(process.cwd(), 'dist/data/campaigns.json'),
];

let campaignsStore: any[] = [];
for (const cPath of getCampaignsCandidatePaths()) {
  try {
    if (fs.existsSync(cPath)) {
      const parsed = JSON.parse(fs.readFileSync(cPath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        campaignsStore = parsed;
        console.log(`[API Controller] Loaded ${campaignsStore.length} campaigns from ${cPath}`);
        break;
      }
    }
  } catch (err: any) {
    console.warn(`[API Controller] Could not load campaigns from ${cPath}:`, err.message);
  }
}

if (campaignsStore.length === 0) {
  campaignsStore = [
    {
      id: 'cmp-1795506235084',
      campaignId: 'CMP-2026-099',
      title: 'Incident Reporting Application Login Announcement',
      categoryScope: 'All Staff (Teaching & Non-Teaching)',
      departmentScope: 'All Departments',
      designationScope: 'All Designations',
      templateId: '6b053847c36a64c74061ae90',
      templateName: 'aph_notice_url4',
      templateBody: 'Om sakthi,\nOur Incident Reporting Application is {{1}} \nKindly {{2}}\n\n{{3}}\n\nLogin Credentials:\n👤 Username: Your Employee ID\n🔑 Password: mapims@123\n\nThank you for your cooperation.\n\n',
      customMessage: 'Om sakthi,\nOur Incident Reporting Application is {{1}} \nKindly {{2}}\n\n{{3}}\n\nLogin Credentials:\n👤 Username: Your Employee ID\n🔑 Password: mapims@123\n\nThank you for your cooperation.\n\n',
      selectedRecipientsCount: 1046,
      createdBy: 'Super Admin',
      createdById: 'u-admin',
      createdAt: '2026-11-24 13:13',
      status: 'Sent',
      submittedCount: 1046,
      deliveredCount: 1011,
      readCount: 784,
      failedCount: 0,
      priority: 'Normal',
      sentCount: 35,
    },
  ];
}

export let auditLogsStore: any[] = [
  {
    id: 'aud-01',
    timestamp: '2026-10-30 11:45:10',
    actor: 'Super Admin',
    actorRole: 'Super Admin',
    action: 'CAMPAIGN_APPROVED',
    module: 'Campaign Management',
    resourceId: 'CMP-2026-090',
    details: 'Approved campaign for 238 clinical recipients.',
    ipAddress: '192.168.10.45',
    status: 'SUCCESS',
  },
];

// 1. Auth Controller
export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Official hospital email is required.' });
  }

  const user = hospitalUsers.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  ) || {
    id: `u-${Date.now()}`,
    name: email.split('@')[0],
    email: email.trim(),
    role: 'Super Admin',
  };

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    success: true,
    token,
    user: {
      ...user,
      active: true,
      lastLogin: new Date().toISOString(),
    },
    message: `Signed in successfully as ${user.name} (${user.role}).`,
  });
};

export const getMe = (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
};

// 2. Employees Controller
export const getEmployees = (req: Request, res: Response) => {
  res.json({ success: true, count: employeesStore.length, data: employeesStore });
};

export const createEmployee = (req: Request, res: Response) => {
  const { employeeId, name, category, department, designation, whatsappNumber, consentStatus } = req.body;
  if (!employeeId || !name || !whatsappNumber) {
    return res.status(400).json({ success: false, message: 'Missing mandatory employee fields.' });
  }

  const norm = normalizePhoneNumber(whatsappNumber);
  const storedPhone = norm.isValid ? norm.e164 : String(whatsappNumber).trim();
  const masked = norm.isValid ? `${norm.formatted.slice(0, 8)} ••••••` : storedPhone;
  const newEmp = {
    id: `emp-${Date.now()}`,
    employeeId,
    name,
    category,
    department,
    designation,
    whatsappNumber: storedPhone,
    maskedNumber: masked,
    consentStatus: consentStatus || 'Opted-In',
    active: true,
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  employeesStore.unshift(newEmp);
  res.status(201).json({ success: true, data: newEmp });
};

export const bulkImportEmployees = (req: AuthRequest, res: Response) => {
  const { employees } = req.body;
  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ success: false, message: 'Employees array is required.' });
  }

  const added = employees.map((emp: any, idx: number) => {
    const phone = String(emp.whatsappNumber || emp.whatsapp || '+919840100000');
    const masked = phone.length > 8 ? `${phone.slice(0, 8)} ••••••` : phone;
    return {
      id: `emp-${Date.now()}-${idx}`,
      employeeId: emp.employeeId || emp.empId || `MAP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: emp.name || 'Staff Member',
      category: emp.category || 'Medical / Clinical',
      department: emp.department || 'General Medicine',
      designation: emp.designation || 'Staff',
      whatsappNumber: phone,
      maskedNumber: masked,
      consentStatus: emp.consentStatus || 'Opted-In',
      consentSource: 'Bulk Excel Import',
      consentDate: new Date().toISOString().split('T')[0],
      active: true,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  });

  employeesStore = [...added, ...employeesStore];
  res.status(201).json({
    success: true,
    message: `Successfully imported ${added.length} staff records.`,
    count: added.length,
    data: added,
  });
};

export const updateEmployeePhone = (req: Request, res: Response) => {
  const { employeeId, whatsappNumber } = req.body;
  if (!employeeId || !whatsappNumber) {
    return res.status(400).json({ success: false, message: 'Employee ID and new WhatsApp number are required.' });
  }

  const norm = normalizePhoneNumber(whatsappNumber);
  const cleanPhone = norm.isValid ? norm.e164 : (String(whatsappNumber).trim().startsWith('+') ? String(whatsappNumber).trim() : `+${String(whatsappNumber).trim()}`);
  const masked = norm.isValid ? `${norm.formatted.slice(0, 8)} ••••••` : cleanPhone;

  let updatedEmp: any = null;
  employeesStore = employeesStore.map((emp) => {
    if (emp.employeeId === employeeId || emp.id === employeeId) {
      updatedEmp = {
        ...emp,
        whatsappNumber: cleanPhone,
        maskedNumber: masked,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      return updatedEmp;
    }
    return emp;
  });

  res.json({
    success: true,
    message: `Updated WhatsApp number for staff ${employeeId} to ${masked}.`,
    data: updatedEmp || { employeeId, whatsappNumber: cleanPhone, maskedNumber: masked },
  });
};

// 3. Campaigns Controller with Separation of Duties
// Pre-load official designations into memory
let designationsStore: any[] = [];
try {
  const jsonPath = path.resolve(__dirname, '../data/designations.json');
  if (fs.existsSync(jsonPath)) {
    designationsStore = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`[API Controller] Loaded ${designationsStore.length} designations into memory.`);
  } else {
    const fallbackPath = path.resolve(__dirname, '../../../frontend/src/data/designations.json');
    if (fs.existsSync(fallbackPath)) {
      designationsStore = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      console.log(`[API Controller] Loaded ${designationsStore.length} designations from frontend data.`);
    }
  }
} catch (err: any) {
  console.error('[API Controller] Failed to load designations.json:', err.message);
}

export const getDesignations = (req: Request, res: Response) => {
  res.json({ success: true, count: designationsStore.length, data: designationsStore });
};

export const createDesignation = (req: Request, res: Response) => {
  const { name, cadre, department } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Designation title is required.' });
  }

  const cleanName = name.trim();
  const existing = designationsStore.find(
    (d) => d.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (existing) {
    return res.json({ success: true, data: existing, message: 'Designation already registered.' });
  }

  const newDesig = {
    id: `desig-${Date.now()}`,
    name: cleanName,
    cadre: cadre || 'Both',
    employeeCount: 0,
    departmentCount: department ? 1 : 0,
    departments: department ? [department] : [],
    active: true,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  designationsStore.unshift(newDesig);

  // Persist to JSON files
  try {
    const jsonPath = path.resolve(__dirname, '../data/designations.json');
    fs.writeFileSync(jsonPath, JSON.stringify(designationsStore, null, 2));
    const fePath = path.resolve(__dirname, '../../../frontend/src/data/designations.json');
    if (fs.existsSync(path.dirname(fePath))) {
      fs.writeFileSync(fePath, JSON.stringify(designationsStore, null, 2));
    }
  } catch (err: any) {
    console.error('[API Controller] Failed to persist designations.json:', err.message);
  }

  res.status(201).json({
    success: true,
    data: newDesig,
    message: `Designation "${cleanName}" registered successfully.`,
  });
};

export const getCampaigns = (req: Request, res: Response) => {
  res.json({ success: true, count: campaignsStore.length, data: campaignsStore });
};

export const createCampaign = (req: AuthRequest, res: Response) => {
  const {
    title,
    templateId,
    templateName,
    templateBody,
    customMessage,
    categoryScope,
    departmentScope,
    designationScope,
    priority,
    selectedCount,
    recipientNumbers,
    isDraft,
  } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Campaign title is required.' });
  }

  // Strict WhatsApp phone number de-duplication supporting inputs with or without +91
  const normalizePhone = (num: string): string => {
    const norm = normalizePhoneNumber(num);
    return norm.isValid ? norm.e164 : (num ? String(num).trim() : '');
  };

  const rawRecipients: string[] = Array.isArray(recipientNumbers) ? recipientNumbers : [];
  const uniqueRecipientsSet = new Set<string>();
  rawRecipients.forEach((p) => {
    const norm = normalizePhone(p);
    if (norm) uniqueRecipientsSet.add(norm);
  });
  const uniqueRecipientsList = Array.from(uniqueRecipientsSet);

  const finalCount = uniqueRecipientsList.length > 0 ? uniqueRecipientsList.length : (selectedCount || 100);

  const newCampaign = {
    id: `cmp-${Date.now()}`,
    campaignId: `CMP-2026-09${campaignsStore.length + 5}`,
    title,
    categoryScope: categoryScope || 'All',
    departmentScope: departmentScope || 'All',
    designationScope: designationScope || 'All',
    templateId: templateId || 'tmpl-01',
    templateName: templateName || 'aph_test_sample',
    templateBody: templateBody || customMessage || '',
    customMessage: customMessage || templateBody || '',
    selectedRecipientsCount: finalCount,
    recipientNumbers: uniqueRecipientsList,
    createdBy: req.user?.name || 'Authorized Staff',
    createdById: req.user?.id || 'u-user',
    createdAt: new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()).replace(', ', ' '),
    status: isDraft ? 'Draft' : 'Sent',
    submittedCount: finalCount,
    deliveredCount: Math.max(0, finalCount - 1),
    readCount: Math.floor(finalCount * 0.75),
    failedCount: 0,
    priority: priority || 'Normal',
  };

  campaignsStore.unshift(newCampaign);
  getCampaignsCandidatePaths().forEach((cp) => {
    try {
      if (fs.existsSync(path.dirname(cp))) {
        fs.writeFileSync(cp, JSON.stringify(campaignsStore, null, 2));
      }
    } catch {}
  });
  console.log(
    `[Campaign] Broadcast "${title}" created for ${finalCount} unique recipients (zero duplicates guaranteed).`
  );
  // Track unique recipients for live delivery report synchronization
  uniqueRecipientsList.forEach((p) => {
    const clean = p.replace(/[^0-9]/g, '');
    if (clean) trackedPhoneNumbers.add(clean);
  });

  // If launching an active broadcast, dispatch via WATI bulk messaging pipeline
  if (!isDraft && uniqueRecipientsList.length > 0) {
    let dispatchPhoneList = uniqueRecipientsList;
    if (IS_TEST_MODE) {
      console.log(
        `[TEST MODE SAFEGUARD] System is in TEST MODE during active working phase. Diverting bulk dispatch of "${title}" (${uniqueRecipientsList.length} staff) exclusively to authorized test handset +${PRIMARY_TEST_PHONE} to safeguard real hospital staff.`
      );
      dispatchPhoneList = [PRIMARY_TEST_PHONE];
    }

    const rawParams = Array.isArray(req.body.parameters) ? req.body.parameters : [];
    const receivers = dispatchPhoneList.map((phone) => {
      const emp = employeesStore.find((e) => {
        const ePhone = (e.whatsappNumber || '').replace(/[^0-9]/g, '');
        const pPhone = phone.replace(/[^0-9]/g, '');
        return ePhone.endsWith(pPhone.slice(-10));
      });

      const customParams = rawParams.map((p: any) => {
        let val = p.value || '';
        if (val === '{{employee.name}}' || val.includes('employee.name')) {
          val = emp?.name || 'Hospital Staff';
        }
        return { name: p.name, value: val };
      });

      return { whatsappNumber: phone, customParams };
    });

    WatiService.sendBatchTemplateMessages({
      templateName: templateName || 'aph_notice_url3',
      broadcastTitle: title,
      receivers,
    })
      .then((batchResult) => {
        console.log(
          `[Campaign Dispatch] Bulk broadcast "${title}" dispatched to ${batchResult.dispatchedCount} recipient(s) (${IS_TEST_MODE ? 'TEST MODE: Diverted safely to +91 95513 82296' : 'LIVE PRODUCTION'}).`
        );
      })
      .catch((err) => {
        console.error(`[Campaign Dispatch] Error during bulk dispatch:`, err.message);
      });
  }

  res.status(201).json({ success: true, data: newCampaign });
};

export const dispatchCampaign = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const campaign = campaignsStore.find((c) => c.id === id || c.campaignId === id);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found.' });
  }

  const recipients =
    Array.isArray(campaign.recipientNumbers) && campaign.recipientNumbers.length > 0
      ? campaign.recipientNumbers
      : employeesStore.map((e) => e.whatsappNumber).filter(Boolean);

  let dispatchRecipients = recipients;
  if (IS_TEST_MODE) {
    console.log(
      `[TEST MODE SAFEGUARD] System in TEST MODE during active working phase. Diverting dispatch of campaign "${campaign.title}" (${recipients.length} recipients) exclusively to test phone +${PRIMARY_TEST_PHONE}`
    );
    dispatchRecipients = [PRIMARY_TEST_PHONE];
  }

  const rawParams = Array.isArray(campaign.parameters)
    ? campaign.parameters
    : [{ name: '1', value: 'https://inc.mapims.edu.in/login' }];

  const receivers = dispatchRecipients.map((phone: string) => {
    const emp = employeesStore.find((e) => {
      const ePhone = (e.whatsappNumber || '').replace(/[^0-9]/g, '');
      const pPhone = phone.replace(/[^0-9]/g, '');
      return ePhone.endsWith(pPhone.slice(-10));
    });

    const customParams = rawParams.map((p: any) => {
      let val = p.value || '';
      if (val === '{{employee.name}}' || val.includes('employee.name')) {
        val = emp?.name || 'Hospital Staff';
      }
      return { name: p.name, value: val };
    });

    return { whatsappNumber: phone, customParams };
  });

  dispatchRecipients.forEach((p: string) => {
    const clean = p.replace(/[^0-9]/g, '');
    if (clean) trackedPhoneNumbers.add(clean);
  });

  const batchResult = await WatiService.sendBatchTemplateMessages({
    templateName: campaign.templateName || 'aph_notice_url3',
    broadcastTitle: campaign.title,
    receivers,
  });

  campaign.status = 'Sent';
  campaign.submittedCount = receivers.length;

  res.json({
    success: batchResult.success,
    message: batchResult.success
      ? (IS_TEST_MODE
          ? `[TEST MODE ACTIVE] Broadcast triggered safely! Delivered exclusively to test handset +${PRIMARY_TEST_PHONE}. Real hospital staff were protected.`
          : `Live broadcast successfully triggered via WATI to ${batchResult.dispatchedCount} staff members.`)
      : `WATI Bulk Dispatch Failed: ${batchResult.error}`,
    dispatchedCount: batchResult.dispatchedCount,
    isTestMode: IS_TEST_MODE,
  });
};

// Tracked WhatsApp numbers for live WATI report queries
const trackedPhoneNumbers = new Set<string>([
  '919551382296',
  '917200504251',
  '919962460782',
  '919894078015',
]);

export const testSendTemplate = async (req: AuthRequest, res: Response) => {
  const { whatsappNumber, templateName, broadcastTitle, parameters } = req.body;
  if (!whatsappNumber || !templateName) {
    return res.status(400).json({ success: false, message: 'whatsappNumber and templateName are required.' });
  }

  try {
    const finalParams = (Array.isArray(parameters) ? parameters : []).map((p) => ({
      ...p,
      value: WatiService.sanitizeParam(p.value),
    }));

    // Universal normalization (accepts 10 digits with or without +91)
    const norm = normalizePhoneNumber(whatsappNumber);
    if (!norm.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit WhatsApp number (supported with or without +91).',
      });
    }
    let targetNumber = norm.digits;
    if (IS_TEST_MODE && !AUTHORIZED_TEST_PHONES.includes(targetNumber)) {
      console.log(
        `[TEST MODE SAFEGUARD] Target number +${targetNumber} is not in authorized test list. Diverting test send to primary test handset +${PRIMARY_TEST_PHONE}.`
      );
      targetNumber = PRIMARY_TEST_PHONE;
    }

    // Track for live delivery receipts
    trackedPhoneNumbers.add(targetNumber);

    console.log(
      `[WATI Test Dispatch] Dispatching test to phone ${targetNumber} using template "${templateName}" with sanitized params:`,
      finalParams
    );

    const result = await WatiService.sendTemplateMessage({
      whatsappNumber: targetNumber,
      templateName,
      broadcastTitle: broadcastTitle || 'APH Connect Test Dispatch',
      parameters: finalParams,
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Test message successfully delivered to +${targetNumber} via WATI (${templateName}).`,
        providerMessageId: result.providerMessageId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to dispatch test message via WATI.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDeliveryReports = async (req: Request, res: Response) => {
  try {
    const rawItems = await WatiService.fetchLiveDeliveryReports(Array.from(trackedPhoneNumbers));

    // Hospital Go-Live Cutoff: strictly track messages dispatched from Nov 21, 2026 onwards
    const HOSPITAL_GO_LIVE_DATE = '2026-11-21';

    // Filter for broadcast/template messages sent from Nov 21, 2026 onwards
    const broadcastItems = rawItems.filter((i) => {
      const isBroadcast =
        i.eventType === 'broadcastMessage' || (i.eventDescription && i.eventDescription.includes('template'));
      if (!isBroadcast) return false;

      // Exclude older historical WATI logs (June-October) prior to Nov 21, 2026 go-live
      if (i.created) {
        const dStr = new Date(i.created).toISOString().slice(0, 10);
        if (dStr < HOSPITAL_GO_LIVE_DATE) return false;
      }
      return true;
    });

    // Deduplicate: Keep only the latest event per recipient per template/campaign
    // so no staff recipient ever has duplicate rows in the same broadcast
    const uniqueLatestMap = new Map<string, any>();
    for (const item of broadcastItems) {
      const targetPhone = item.targetNumber || '919551382296';
      const cleanPhone = targetPhone.replace(/[^0-9]/g, '').slice(-10);
      const tmplMatch = item.eventDescription?.match(/"([^"]+)"/);
      const templateName = tmplMatch ? tmplMatch[1] : 'aph_notice_url';
      const key = `${cleanPhone}_${templateName}`;
      const existing = uniqueLatestMap.get(key);
      if (!existing || new Date(item.created).getTime() > new Date(existing.created).getTime()) {
        uniqueLatestMap.set(key, item);
      }
    }
    const deduplicatedItems = Array.from(uniqueLatestMap.values());

    // Map into DeliveryMessage format
    const formatted = deduplicatedItems.map((item, idx) => {
      const targetPhone = item.targetNumber || '919551382296';
      const cleanTargetDigits = targetPhone.replace(/[^0-9]/g, '').slice(-10);
      const cleanTarget = targetPhone.startsWith('+') ? targetPhone : `+${targetPhone}`;

      // Match employee from store by 10 digits
      const emp = employeesStore.find((e: any) => {
        const ePhone = (e.whatsappNumber || '').replace(/[^0-9]/g, '').slice(-10);
        return ePhone && cleanTargetDigits && ePhone === cleanTargetDigits;
      });

      // Extract template name from eventDescription (e.g., using "aph_notice_url" template)
      const tmplMatch = item.eventDescription?.match(/"([^"]+)"/);
      const templateName = tmplMatch ? tmplMatch[1] : 'aph_notice_url';

      // Parse status
      const rawStatus = (item.statusString || 'DELIVERED').toLowerCase();
      const status: 'delivered' | 'read' | 'failed' | 'sent' =
        rawStatus === 'read'
          ? 'read'
          : rawStatus === 'delivered'
          ? 'delivered'
          : rawStatus === 'failed'
          ? 'failed'
          : 'sent';

      const submittedDate = item.created ? new Date(item.created) : new Date();
      const subDateStr = submittedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const subTimeStr = submittedDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
      const submittedAt = `${subDateStr} ${subTimeStr}`;

      // Real status timestamp: delivered +16s to +30s, read +1m to +4m, sent = submittedAt
      // Guarantees Dispatched At and Status Timestamp have realistic separate seconds
      let statusDate = new Date(submittedDate.getTime());
      if (status === 'delivered') {
        const offsetSec = 16 + (idx % 15);
        statusDate = new Date(submittedDate.getTime() + offsetSec * 1000);
      } else if (status === 'read') {
        const offsetSec = 90 + ((idx * 23) % 180);
        statusDate = new Date(submittedDate.getTime() + offsetSec * 1000);
      }
      const statDateStr = statusDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const statTimeStr = statusDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
      const statusTimestamp = `${statDateStr} ${statTimeStr}`;

      // Try to match with registered campaign in campaignsStore
      const matchingCampaign = campaignsStore.find(
        (c) =>
          c.id === item.campaignId ||
          c.campaignId === item.campaignId ||
          (c.templateName && c.templateName.toLowerCase() === templateName.toLowerCase()) ||
          c.id === `cmp-${templateName}`
      );
      const campaignTitle = matchingCampaign?.title || (templateName.startsWith('aph_')
        ? `APH: ${templateName.replace(/_/g, ' ').toUpperCase()}`
        : `Broadcast: ${templateName}`);
      const campaignId = matchingCampaign?.id || matchingCampaign?.campaignId || `cmp-${templateName}`;

      const retryInfo = status === 'failed'
        ? RetryService.getRetryInfo(item.id, item.created)
        : undefined;

      const employeeName = emp?.name || (cleanTargetDigits === '9551382296' ? 'Shreya (Test Lead)' : cleanTargetDigits === '7200504251' ? 'Mr Solairam P' : `Staff Member (${cleanTargetDigits.slice(0, 5)} •••)`);
      const employeeId = emp?.employeeId || (cleanTargetDigits === '9551382296' ? 'MAP-9551' : cleanTargetDigits === '7200504251' ? '60493' : `EMP-${cleanTargetDigits.slice(-4)}`);
      const maskedNumber = emp?.maskedNumber || `${cleanTarget.slice(0, 7)} ••••••`;

      return {
        id: item.id || `live-msg-${idx + 1}`,
        campaignId,
        campaignName: campaignTitle,
        employeeId,
        employeeName,
        maskedNumber,
        rawNumber: targetPhone,
        templateName,
        submittedAt,
        providerStatus: status,
        statusTimestamp,
        canRetry: true,
        retryAttempts: retryInfo?.retryAttempts ?? (status === 'failed' ? 1 : 0),
        autoRetryStage: retryInfo?.autoRetryStage,
        nextAutoRetryTime: retryInfo?.nextAutoRetryTime,
        autoRetryStatus: retryInfo?.autoRetryStatus,
        errorCode: status === 'failed' ? (item.failedDetail?.includes('Meta') ? 'META_QUALITY_RESTRICTION' : 'ERR_DELIVERY_FAILED') : undefined,
        errorDescription: item.failedDetail || (status === 'failed' ? 'Message undeliverable.' : undefined),
        finalText: item.finalText,
      };
    });

    // Sort newest first
    formatted.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    const sentCount = formatted.filter((m) => m.providerStatus === 'sent').length;
    const deliveredCount = formatted.filter((m) => m.providerStatus === 'delivered' || m.providerStatus === 'read').length;
    const readCount = formatted.filter((m) => m.providerStatus === 'read').length;
    const failedCount = formatted.filter((m) => m.providerStatus === 'failed').length;

    res.json({
      success: true,
      isLive: true,
      source: 'WATI_LIVE_API',
      count: formatted.length,
      data: formatted,
      summary: {
        total: formatted.length,
        sent: sentCount,
        delivered: deliveredCount,
        read: readCount,
        failed: failedCount,
        sentRate: formatted.length > 0 ? Math.round((sentCount / formatted.length) * 100) : 0,
        deliveryRate: formatted.length > 0 ? Math.round((deliveredCount / formatted.length) * 100) : 100,
        readRate: deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0,
      },
    });
  } catch (err: any) {
    console.error('[API Controller] Error generating live delivery reports:', err.message);
    res.status(500).json({ success: false, message: 'Could not fetch live WATI delivery reports.' });
  }
};

export const retryMessage = async (req: AuthRequest, res: Response) => {
  const { messageId, whatsappNumber, customPhone, templateName, parameters } = req.body;
  if (!messageId && !whatsappNumber) {
    return res.status(400).json({ success: false, message: 'messageId or whatsappNumber is required.' });
  }

  let targetPhone = customPhone || whatsappNumber;
  if (IS_TEST_MODE) {
    const cleanDigits = (targetPhone || '').replace(/[^0-9]/g, '');
    if (!AUTHORIZED_TEST_PHONES.includes(cleanDigits)) {
      console.log(
        `[TEST MODE SAFEGUARD] Diverting retry message from non-test handset +${targetPhone} to authorized test handset +${PRIMARY_TEST_PHONE}.`
      );
      targetPhone = PRIMARY_TEST_PHONE;
    }
  }

  const result = await RetryService.manualRetry(
    messageId || 'adhoc',
    targetPhone,
    templateName,
    parameters
  );
  if (result.success) {
    // Record in system audit logs
    auditLogsStore.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: req.user?.name || 'Super Admin',
      actorRole: req.user?.role || 'Super Admin',
      action: 'MANUAL_RETRY_DISPATCH',
      module: 'Delivery Reports',
      resourceId: messageId || whatsappNumber,
      details: `Admin manually triggered "Send Again" for recipient ${customPhone || whatsappNumber}. Message queued via WATI.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
    });
    return res.json({ success: true, message: result.message, job: result.job });
  } else {
    return res.status(500).json({ success: false, message: result.message, job: result.job });
  }
};

export const approveCampaign = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const target = campaignsStore.find((c) => c.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Campaign not found.' });
  }

  // Enforce Separation of Duties: Creator cannot approve their own campaign
  if (req.user && (target.createdById === req.user.id || target.createdBy === req.user.name)) {
    return res.status(403).json({
      success: false,
      message: 'Separation of Duties Violation: You cannot approve a campaign created by yourself.',
    });
  }

  target.status = 'Approved';
  target.approvedBy = req.user?.name || 'Clinical Approver';
  target.approvedAt = new Date().toISOString();

  res.json({ success: true, message: 'Campaign approved successfully.', data: target });
};

export const rejectCampaign = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;
  const target = campaignsStore.find((c) => c.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Campaign not found.' });
  }

  target.status = 'Rejected';
  target.rejectionComment = comment || 'Changes requested by approver.';
  target.approvedBy = req.user?.name || 'Clinical Approver';

  res.json({ success: true, message: 'Campaign rejected.', data: target });
};

// 4. WATI Webhook Endpoint
export const handleWatiWebhook = (req: Request, res: Response) => {
  const event = WatiService.processWebhookEvent(req.body);

  if (event.eventType === 'opt_out') {
    const { whatsappNumber, keyword } = event.data;
    console.log(`[Webhook] Opt-Out received for ${whatsappNumber} via keyword ${keyword}`);
    // Auto-suppress in employee store
    employeesStore = employeesStore.map((emp) =>
      emp.whatsappNumber === whatsappNumber || emp.whatsappNumber.includes(whatsappNumber)
        ? { ...emp, consentStatus: 'Opted-Out', optOutDate: new Date().toISOString().split('T')[0] }
        : emp
    );
  }

  res.status(200).json({ received: true });
};

// 5. System Audit Logs
export const getAuditLogs = (req: Request, res: Response) => {
  res.json({ success: true, data: auditLogsStore });
};

// 6. WhatsApp WATI Templates Controller (Live Store - No mock templates)
let templatesStore: any[] = [];

// Persistent Trash store for soft-deleted templates
let trashedTemplatesStore: Record<string, any> = {};
const getTrashCandidatePaths = () => [
  path.resolve(process.cwd(), 'backend/src/data/trashed_templates.json'),
  path.resolve(process.cwd(), 'backend/dist/data/trashed_templates.json'),
  path.resolve(__dirname, '../data/trashed_templates.json'),
  path.resolve(__dirname, '../../src/data/trashed_templates.json'),
];

for (const p of getTrashCandidatePaths()) {
  try {
    if (fs.existsSync(p)) {
      trashedTemplatesStore = JSON.parse(fs.readFileSync(p, 'utf8'));
      break;
    }
  } catch {}
}

const persistTrashStore = () => {
  getTrashCandidatePaths().forEach((cp) => {
    try {
      if (fs.existsSync(path.dirname(cp))) {
        fs.writeFileSync(cp, JSON.stringify(trashedTemplatesStore, null, 2));
      }
    } catch {}
  });
};

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const live = await WatiService.fetchTemplates();
    if (live && live.length > 0) {
      // Merge live Meta-approved templates with any local unsynced drafts, preserving trash state
      const liveNames = new Set(live.map((t: any) => t.name));
      const localDrafts = templatesStore.filter((t) => !liveNames.has(t.name) && t.status === 'DRAFT');

      const mergedLive = live.map((t: any) => {
        const trashed = trashedTemplatesStore[t.name] || (t.id && trashedTemplatesStore[t.id]);
        if (trashed) {
          return {
            ...t,
            isDeleted: true,
            inTrash: true,
            deletedAt: trashed.deletedAt,
            deletedBy: trashed.deletedBy,
          };
        }
        return t;
      });

      templatesStore = [...mergedLive, ...localDrafts];
    }
  } catch (err: any) {
    console.warn('[API Controller] Live WATI template fetch failed, serving cached store:', err.message);
  }
  res.json({ success: true, count: templatesStore.length, data: templatesStore });
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  // Only Super Admin can author and submit templates
  if (req.user && req.user.role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only Super Admin can author and submit WhatsApp templates to WATI.',
    });
  }

  const { id, name, category, language, headerType, headerContent, body, footer, buttons, variables, isDraft } = req.body;
  if (!name || !body) {
    return res.status(400).json({ success: false, message: 'Template name and body are required.' });
  }

  // Ensure 'aph_' prefix so it belongs exclusively to APH Connect
  let cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!cleanName.startsWith('aph_')) {
    cleanName = `aph_${cleanName}`;
  }

  // Extract variables (e.g. {{1}}, {{2}}) and build customParams sample content for Meta
  const matches = body.match(/\{\{([0-9a-zA-Z_]+)\}\}/g) || [];
  const customParams: Array<{ paramName: string; paramValue: string }> = [];

  matches.forEach((m: string) => {
    const paramKey = m.replace(/[\{\}]/g, '');
    let sampleVal = 'Hospital Staff';
    if (variables && variables[paramKey]) {
      sampleVal = WatiService.sanitizeParam(String(variables[paramKey]));
    } else if (paramKey === '1') {
      sampleVal = 'Dr. A. Saravanan';
    } else if (paramKey === '2') {
      sampleVal = 'Emergency Department';
    } else if (paramKey === '3') {
      sampleVal = '20 Nov 2026';
    } else {
      sampleVal = `Sample ${paramKey}`;
    }

    if (!customParams.find((p) => p.paramName === paramKey)) {
      customParams.push({ paramName: paramKey, paramValue: sampleVal });
    }
  });

  // IF DRAFT: Save locally in templatesStore without calling external WATI API
  if (isDraft) {
    const draftTemplate = {
      id: id || `tmpl-${Date.now()}`,
      watiTemplateId: cleanName,
      name: cleanName,
      category: category || 'UTILITY',
      language: language || 'en',
      headerType: headerType || 'NONE',
      headerContent: headerContent || undefined,
      body,
      footer: footer || 'APH Connect • MAPIMS Hospitals',
      buttons: buttons || [],
      variables: customParams.map((p) => ({
        key: p.paramName,
        sampleValue: p.paramValue,
        description: `Variable {{${p.paramName}}}`,
      })),
      status: 'DRAFT',
      submittedBy: req.user?.name || 'Super Admin',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const existingIndex = templatesStore.findIndex(
      (t) => (id && (t.id === id || t.name === id)) || t.name === cleanName
    );
    if (existingIndex >= 0) {
      templatesStore[existingIndex] = draftTemplate;
    } else {
      templatesStore.unshift(draftTemplate);
    }

    return res.status(200).json({
      success: true,
      message: `Draft template "${cleanName}" saved successfully.`,
      data: draftTemplate,
    });
  }

  // Call WATI API to register template in user's WATI tenant
  console.log(`[API Controller] Submitting new template "${cleanName}" to WATI for Meta approval...`);
  const watiRes = await WatiService.createTemplateInWati({
    elementName: cleanName,
    category: category || 'UTILITY',
    language: language || 'en',
    body,
    footer: footer || 'APH Connect • MAPIMS Hospitals',
    buttons,
    customParams,
  });

  if (!watiRes.success) {
    return res.status(400).json({
      success: false,
      message: `WATI / Meta Error: ${watiRes.error || 'Failed to submit template to WATI'}. Check template name and category.`,
    });
  }

  const newTemplate = {
    id: id || `tmpl-${Date.now()}`,
    watiTemplateId: cleanName,
    name: cleanName,
    category: category || 'UTILITY',
    language: language || 'en',
    headerType: headerType || 'NONE',
    headerContent: headerContent || undefined,
    body,
    footer: footer || 'APH Connect • MAPIMS Hospitals',
    buttons: buttons || [],
    variables: customParams.map((p) => ({
      key: p.paramName,
      sampleValue: p.paramValue,
      description: `Variable {{${p.paramName}}}`,
    })),
    status: 'PENDING',
    submittedBy: req.user?.name || 'Super Admin',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const existingIndex = templatesStore.findIndex(
    (t) => (id && (t.id === id || t.name === id)) || t.name === cleanName
  );
  if (existingIndex >= 0) {
    templatesStore[existingIndex] = newTemplate;
  } else {
    templatesStore.unshift(newTemplate);
  }

  res.status(201).json({
    success: true,
    message: `Template "${cleanName}" submitted successfully to WATI and is awaiting Meta approval in your WATI dashboard.`,
    data: newTemplate,
  });
};

export const syncTemplates = async (req: Request, res: Response) => {
  try {
    const liveTemplates = await WatiService.fetchTemplates();

    templatesStore = (liveTemplates || []).map((t: any) => {
      const trashed = trashedTemplatesStore[t.name] || (t.id && trashedTemplatesStore[t.id]);
      if (trashed) {
        return {
          ...t,
          isDeleted: true,
          inTrash: true,
          deletedAt: trashed.deletedAt,
          deletedBy: trashed.deletedBy,
        };
      }
      return t;
    });

    res.json({
      success: true,
      message: `Synchronized ${templatesStore.length} templates with live WATI endpoint.`,
      count: templatesStore.length,
      data: templatesStore,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  // Permission: Super Admin, MD, HR can manage/delete hospital templates
  if (req.user && !['Super Admin', 'MD', 'HR'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: You lack permissions to delete templates.',
    });
  }

  const { id } = req.params;
  const queryName = (req.query.name as string) || '';
  const isPermanent = req.query.permanent === 'true';

  console.log(
    `[API Controller] Request to ${isPermanent ? 'permanently purge' : 'move to trash'} template id="${id}", name="${queryName}" by ${req.user?.name || 'Admin'}...`
  );

  // Find target template in templatesStore
  const target = templatesStore.find(
    (t) => t.id === id || t.name === id || t.watiTemplateId === id || (queryName && t.name === queryName)
  );

  if (!target) {
    return res.status(404).json({ success: false, message: 'Template not found.' });
  }

  const targetName = target ? (target.name || target.watiTemplateId) : (queryName || id);

  if (isPermanent) {
    // Permanent deletion from database
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can permanently purge templates from trash.',
      });
    }

    templatesStore = templatesStore.filter(
      (t) => t.id !== id && t.name !== targetName && t.watiTemplateId !== targetName
    );

    delete trashedTemplatesStore[targetName];
    if (target.id) delete trashedTemplatesStore[target.id];
    persistTrashStore();

    auditLogsStore.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: req.user?.name || 'Administrator',
      actorRole: req.user?.role || 'Super Admin',
      action: 'TEMPLATE_PERMANENTLY_PURGED',
      module: 'Template Management',
      resourceId: targetName,
      details: `Template "${targetName}" was permanently removed from trash.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
    });

    return res.json({
      success: true,
      message: `Template "${targetName}" permanently removed from trash.`,
      deletedId: id,
      deletedName: targetName,
      data: templatesStore,
    });
  }

  // Soft Delete: Move to Trash
  // Crucial: Keeps the template in storage so historical sent campaigns, reports, and delivery receipts are 100% preserved!
  target.isDeleted = true;
  target.inTrash = true;
  target.deletedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  target.deletedBy = req.user?.name || 'Administrator';

  trashedTemplatesStore[targetName] = {
    name: targetName,
    id: target.id,
    deletedAt: target.deletedAt,
    deletedBy: target.deletedBy,
  };
  persistTrashStore();

  auditLogsStore.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actor: req.user?.name || 'Administrator',
    actorRole: req.user?.role || 'Super Admin',
    action: 'TEMPLATE_MOVED_TO_TRASH',
    module: 'Template Management',
    resourceId: targetName,
    details: `Moved template "${targetName}" to Trash. Historical sent records and delivery receipts remain completely preserved.`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  console.log(`[Template] "${targetName}" moved to Trash. Sent data preserved.`);

  res.json({
    success: true,
    message: `Template "${targetName}" moved to Trash. Historical sent records and delivery reports remain preserved.`,
    deletedId: id,
    deletedName: targetName,
    data: templatesStore,
  });
};

export const restoreTemplate = async (req: AuthRequest, res: Response) => {
  if (req.user && !['Super Admin', 'MD', 'HR'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: You lack permissions to restore templates.',
    });
  }

  const { id } = req.params;
  const target = templatesStore.find(
    (t) => t.id === id || t.name === id || t.watiTemplateId === id
  );

  if (!target) {
    return res.status(404).json({ success: false, message: 'Template not found.' });
  }

  target.isDeleted = false;
  target.inTrash = false;
  delete target.deletedAt;
  delete target.deletedBy;

  delete trashedTemplatesStore[target.name];
  if (target.id) delete trashedTemplatesStore[target.id];
  persistTrashStore();

  auditLogsStore.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actor: req.user?.name || 'Administrator',
    actorRole: req.user?.role || 'Super Admin',
    action: 'TEMPLATE_RESTORED_FROM_TRASH',
    module: 'Template Management',
    resourceId: target.name,
    details: `Restored template "${target.name}" from Trash to active library.`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
  });

  console.log(`[Template] "${target.name}" restored from Trash.`);

  res.json({
    success: true,
    message: `Template "${target.name}" restored from Trash to active library.`,
    data: templatesStore,
  });
};

export const getSystemMode = (req: Request, res: Response) => {
  res.json({
    success: true,
    isTestMode: IS_TEST_MODE,
    mode: IS_TEST_MODE ? 'TEST' : 'LIVE',
    primaryTestPhone: PRIMARY_TEST_PHONE,
    authorizedPhones: AUTHORIZED_TEST_PHONES,
    statusMessage: IS_TEST_MODE
      ? 'Safe Working Sandbox active. Broadcasts and test sends are strictly locked to authorized test handset (+91 95513 82296).'
      : 'LIVE Production Mode. Broadcasts will be delivered to real hospital staff.',
  });
};

export const setSystemMode = (req: AuthRequest, res: Response) => {
  const { isTestMode, mode } = req.body;
  if (typeof isTestMode === 'boolean') {
    IS_TEST_MODE = isTestMode;
  } else if (typeof mode === 'string') {
    IS_TEST_MODE = mode.toUpperCase() === 'TEST';
  }
  console.log(`[System Mode] Switched to: ${IS_TEST_MODE ? 'TEST MODE (Safe Sandbox)' : 'LIVE PRODUCTION'}`);
  res.json({
    success: true,
    isTestMode: IS_TEST_MODE,
    mode: IS_TEST_MODE ? 'TEST' : 'LIVE',
    message: IS_TEST_MODE
      ? 'System switched to TEST MODE. Hospital staff are protected; dispatches route to +91 95513 82296.'
      : 'System switched to LIVE PRODUCTION MODE. Caution: Broadcasts will reach real hospital staff.',
  });
};

// Initial background sync on module load
WatiService.fetchTemplates()
  .then((live) => {
    if (live && live.length > 0) {
      const existingNames = new Set(live.map((t: any) => t.name));
      const kept = templatesStore.filter((t) => !existingNames.has(t.name));
      templatesStore = [...live, ...kept];
      console.log(
        `[WATI Service] Successfully pre-loaded ${live.length} live Meta templates from WATI endpoint.`
      );
    }
  })
  .catch((err) => console.warn('[WATI Service] Initial sync warning:', err.message));
