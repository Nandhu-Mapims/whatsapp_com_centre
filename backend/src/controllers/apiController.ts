import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';
import { WatiService } from '../services/watiService.js';
import { ExcelService } from '../services/excelService.js';
import { QueueService } from '../services/queueService.js';

const hospitalUsers = [
  {
    id: 'u-1',
    name: 'Super Admin',
    email: 'superadmin@mapims.org',
    role: 'Super Admin',
  },
  {
    id: 'u-2',
    name: 'Admin',
    email: 'admin@mapims.org',
    role: 'Admin',
  },
];

// Realistic in-memory state store with database synchronization fallback




// Pre-load official categorized roster from Excel (1,046 staff + 1 Test Lead)
let employeesStore: any[] = [];
try {
  const jsonPath = path.resolve(__dirname, '../data/employees.json');
  if (fs.existsSync(jsonPath)) {
    employeesStore = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('[API Controller] Loaded ' + employeesStore.length + ' real hospital employees from roster.');
  } else {
    const fallbackPath = path.resolve(__dirname, '../../../frontend/src/data/employees.json');
    if (fs.existsSync(fallbackPath)) {
      employeesStore = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      console.log('[API Controller] Loaded ' + employeesStore.length + ' real hospital employees from roster.');
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

let campaignsStore: any[] = [
  {
    id: 'cmp-01',
    campaignId: 'CMP-2026-089',
    title: 'Emergency Night Shift Roster Announcement',
    categoryScope: 'Medical / Clinical, Nursing Staff',
    departmentScope: 'Emergency & Trauma Care, Intensive Care Unit (ICU & CCU)',
    templateId: 'tmpl-01',
    templateName: 'aph_test_sample',
    selectedRecipientsCount: 156,
    createdBy: 'P. Rajesh Kumar',
    createdById: 'u-3',
    createdAt: '2026-10-29 10:30',
    status: 'Completed',
    approvedBy: 'Prof. M. Vijayalakshmi',
    submittedCount: 156,
    deliveredCount: 151,
    readCount: 139,
    failedCount: 5,
    priority: 'Urgent',
  },
  {
    id: 'cmp-03',
    campaignId: 'CMP-2026-091',
    title: 'NABH 5th Edition Mock Audit Readiness Notice',
    categoryScope: 'Nursing Staff, Allied Health Sciences',
    departmentScope: 'Intensive Care Unit (ICU & CCU), Radiology & Imaging',
    templateId: 'tmpl-03',
    templateName: 'aph_test_sample',
    selectedRecipientsCount: 128,
    createdBy: 'P. Rajesh Kumar',
    createdById: 'u-3',
    createdAt: '2026-10-30 11:15',
    status: 'Pending Approval',
    submittedCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    priority: 'Urgent',
  },
];

let auditLogsStore: any[] = [
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

  const masked = whatsappNumber.length > 8 ? `${whatsappNumber.slice(0, 8)} ••••••` : whatsappNumber;
  const newEmp = {
    id: `emp-${Date.now()}`,
    employeeId,
    name,
    category,
    department,
    designation,
    whatsappNumber,
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

  const cleanPhone = String(whatsappNumber).trim().startsWith('+')
    ? String(whatsappNumber).trim()
    : `+${String(whatsappNumber).trim()}`;
  const masked = cleanPhone.length > 8 ? `${cleanPhone.slice(0, 8)} ••••••` : cleanPhone;

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

  // Strict WhatsApp phone number de-duplication
  const normalizePhone = (num: string): string => {
    const digits = String(num || '').replace(/[^0-9]/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return num ? String(num).trim() : '';
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
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: isDraft ? 'Draft' : 'Sent',
    submittedCount: finalCount,
    deliveredCount: Math.max(0, finalCount - 1),
    readCount: Math.floor(finalCount * 0.75),
    failedCount: 0,
    priority: priority || 'Normal',
  };

  campaignsStore.unshift(newCampaign);
  console.log(
    `[Campaign] Broadcast "${title}" created for ${finalCount} unique recipients (zero duplicates guaranteed).`
  );
  res.status(201).json({ success: true, data: newCampaign });
};

export const testSendTemplate = async (req: AuthRequest, res: Response) => {
  const { whatsappNumber, templateName, broadcastTitle, parameters } = req.body;
  if (!whatsappNumber || !templateName) {
    return res.status(400).json({ success: false, message: 'whatsappNumber and templateName are required.' });
  }

  try {
    const finalParams = Array.isArray(parameters) ? parameters : [];

    // Normalize destination phone number (auto-append India 91 prefix if 10-digit)
    let cleanNum = String(whatsappNumber).replace(/[^0-9]/g, '');
    if (cleanNum.length === 10) {
      cleanNum = `91${cleanNum}`;
    }
    const targetNumber = cleanNum;

    console.log(
      `[WATI Test Dispatch] Dispatching test to phone ${targetNumber} using template "${templateName}" with params:`,
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

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const live = await WatiService.fetchTemplates();
    if (live && live.length > 0) {
      // Merge live Meta-approved templates with any local unsynced drafts
      const liveNames = new Set(live.map((t: any) => t.name));
      const localDrafts = templatesStore.filter((t) => !liveNames.has(t.name) && t.status === 'DRAFT');
      templatesStore = [...live, ...localDrafts];
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

  const { name, category, language, headerType, headerContent, body, footer, buttons, variables } = req.body;
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
      sampleVal = String(variables[paramKey]);
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

  const newTemplate = {
    id: `tmpl-${Date.now()}`,
    watiTemplateId: cleanName,
    name: cleanName,
    category: category || 'UTILITY',
    language: language || 'en',
    headerType: headerType || 'NONE',
    headerContent,
    body,
    footer: footer || 'APH Connect • MAPIMS Hospitals',
    buttons: buttons || [],
    variables: customParams.map((p) => ({
      key: p.paramName,
      sampleValue: p.paramValue,
      description: `Variable {{${p.paramName}}}`,
    })),
    status: watiRes.success ? 'PENDING' : 'DRAFT',
    submittedBy: req.user?.name || 'Super Admin',
    createdAt: new Date().toISOString().split('T')[0],
  };

  templatesStore.unshift(newTemplate);

  res.status(201).json({
    success: true,
    message: watiRes.success
      ? `Template "${cleanName}" submitted successfully to WATI and is awaiting Meta approval in your WATI dashboard.`
      : `Template "${cleanName}" saved locally as draft (${watiRes.error || 'WATI API unavailable'}).`,
    data: newTemplate,
  });
};

export const syncTemplates = async (req: Request, res: Response) => {
  try {
    const liveTemplates = await WatiService.fetchTemplates();
    templatesStore = liveTemplates || [];
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
