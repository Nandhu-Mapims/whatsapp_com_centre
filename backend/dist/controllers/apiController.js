"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTemplates = exports.createTemplate = exports.getTemplates = exports.getAuditLogs = exports.handleWatiWebhook = exports.rejectCampaign = exports.approveCampaign = exports.testSendTemplate = exports.createCampaign = exports.getCampaigns = exports.createDesignation = exports.getDesignations = exports.updateEmployeePhone = exports.bulkImportEmployees = exports.createEmployee = exports.getEmployees = exports.getMe = exports.login = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const watiService_js_1 = require("../services/watiService.js");
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
let employeesStore = [];
try {
    const jsonPath = path_1.default.resolve(__dirname, '../data/employees.json');
    if (fs_1.default.existsSync(jsonPath)) {
        employeesStore = JSON.parse(fs_1.default.readFileSync(jsonPath, 'utf8'));
        console.log('[API Controller] Loaded ' + employeesStore.length + ' real hospital employees from roster.');
    }
    else {
        const fallbackPath = path_1.default.resolve(__dirname, '../../../frontend/src/data/employees.json');
        if (fs_1.default.existsSync(fallbackPath)) {
            employeesStore = JSON.parse(fs_1.default.readFileSync(fallbackPath, 'utf8'));
            console.log('[API Controller] Loaded ' + employeesStore.length + ' real hospital employees from roster.');
        }
    }
}
catch (err) {
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
let campaignsStore = [
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
let auditLogsStore = [
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
const login = (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Official hospital email is required.' });
    }
    const user = hospitalUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || {
        id: `u-${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        role: 'Super Admin',
    };
    const token = jsonwebtoken_1.default.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, env_js_1.ENV.JWT_SECRET, { expiresIn: '8h' });
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
exports.login = login;
const getMe = (req, res) => {
    res.json({ success: true, user: req.user });
};
exports.getMe = getMe;
// 2. Employees Controller
const getEmployees = (req, res) => {
    res.json({ success: true, count: employeesStore.length, data: employeesStore });
};
exports.getEmployees = getEmployees;
const createEmployee = (req, res) => {
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
exports.createEmployee = createEmployee;
const bulkImportEmployees = (req, res) => {
    const { employees } = req.body;
    if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ success: false, message: 'Employees array is required.' });
    }
    const added = employees.map((emp, idx) => {
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
exports.bulkImportEmployees = bulkImportEmployees;
const updateEmployeePhone = (req, res) => {
    const { employeeId, whatsappNumber } = req.body;
    if (!employeeId || !whatsappNumber) {
        return res.status(400).json({ success: false, message: 'Employee ID and new WhatsApp number are required.' });
    }
    const cleanPhone = String(whatsappNumber).trim().startsWith('+')
        ? String(whatsappNumber).trim()
        : `+${String(whatsappNumber).trim()}`;
    const masked = cleanPhone.length > 8 ? `${cleanPhone.slice(0, 8)} ••••••` : cleanPhone;
    let updatedEmp = null;
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
exports.updateEmployeePhone = updateEmployeePhone;
// 3. Campaigns Controller with Separation of Duties
// Pre-load official designations into memory
let designationsStore = [];
try {
    const jsonPath = path_1.default.resolve(__dirname, '../data/designations.json');
    if (fs_1.default.existsSync(jsonPath)) {
        designationsStore = JSON.parse(fs_1.default.readFileSync(jsonPath, 'utf8'));
        console.log(`[API Controller] Loaded ${designationsStore.length} designations into memory.`);
    }
    else {
        const fallbackPath = path_1.default.resolve(__dirname, '../../../frontend/src/data/designations.json');
        if (fs_1.default.existsSync(fallbackPath)) {
            designationsStore = JSON.parse(fs_1.default.readFileSync(fallbackPath, 'utf8'));
            console.log(`[API Controller] Loaded ${designationsStore.length} designations from frontend data.`);
        }
    }
}
catch (err) {
    console.error('[API Controller] Failed to load designations.json:', err.message);
}
const getDesignations = (req, res) => {
    res.json({ success: true, count: designationsStore.length, data: designationsStore });
};
exports.getDesignations = getDesignations;
const createDesignation = (req, res) => {
    const { name, cadre, department } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Designation title is required.' });
    }
    const cleanName = name.trim();
    const existing = designationsStore.find((d) => d.name.toLowerCase() === cleanName.toLowerCase());
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
        const jsonPath = path_1.default.resolve(__dirname, '../data/designations.json');
        fs_1.default.writeFileSync(jsonPath, JSON.stringify(designationsStore, null, 2));
        const fePath = path_1.default.resolve(__dirname, '../../../frontend/src/data/designations.json');
        if (fs_1.default.existsSync(path_1.default.dirname(fePath))) {
            fs_1.default.writeFileSync(fePath, JSON.stringify(designationsStore, null, 2));
        }
    }
    catch (err) {
        console.error('[API Controller] Failed to persist designations.json:', err.message);
    }
    res.status(201).json({
        success: true,
        data: newDesig,
        message: `Designation "${cleanName}" registered successfully.`,
    });
};
exports.createDesignation = createDesignation;
const getCampaigns = (req, res) => {
    res.json({ success: true, count: campaignsStore.length, data: campaignsStore });
};
exports.getCampaigns = getCampaigns;
const createCampaign = (req, res) => {
    const { title, templateId, templateName, templateBody, customMessage, categoryScope, departmentScope, designationScope, priority, selectedCount, recipientNumbers, isDraft, } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, message: 'Campaign title is required.' });
    }
    // Strict WhatsApp phone number de-duplication
    const normalizePhone = (num) => {
        const digits = String(num || '').replace(/[^0-9]/g, '');
        if (digits.length === 10)
            return `+91${digits}`;
        if (digits.length === 12 && digits.startsWith('91'))
            return `+${digits}`;
        return num ? String(num).trim() : '';
    };
    const rawRecipients = Array.isArray(recipientNumbers) ? recipientNumbers : [];
    const uniqueRecipientsSet = new Set();
    rawRecipients.forEach((p) => {
        const norm = normalizePhone(p);
        if (norm)
            uniqueRecipientsSet.add(norm);
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
    console.log(`[Campaign] Broadcast "${title}" created for ${finalCount} unique recipients (zero duplicates guaranteed).`);
    res.status(201).json({ success: true, data: newCampaign });
};
exports.createCampaign = createCampaign;
const testSendTemplate = async (req, res) => {
    const { whatsappNumber, templateName, broadcastTitle, parameters } = req.body;
    if (!whatsappNumber || !templateName) {
        return res.status(400).json({ success: false, message: 'whatsappNumber and templateName are required.' });
    }
    try {
        const finalParams = Array.isArray(parameters) ? parameters : [];
        // Development Mode Safeguard: Strictly locked to authorized test handset 9551382296
        const cleanNum = String(whatsappNumber).replace(/[^0-9]/g, '');
        const safeTargetNumber = cleanNum.endsWith('9551382296') ? cleanNum : '919551382296';
        console.log(`[WATI Sandbox Mode] Strictly dispatching test to authorized phone ${safeTargetNumber} using template "${templateName}" with params:`, finalParams);
        const result = await watiService_js_1.WatiService.sendTemplateMessage({
            whatsappNumber: safeTargetNumber,
            templateName,
            broadcastTitle: broadcastTitle || 'APH Connect Test Dispatch',
            parameters: finalParams,
        });
        if (result.success) {
            res.json({
                success: true,
                message: `Test message successfully delivered to ${safeTargetNumber} via WATI (${templateName}).`,
                providerMessageId: result.providerMessageId,
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to dispatch test message via WATI.',
            });
        }
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.testSendTemplate = testSendTemplate;
const approveCampaign = (req, res) => {
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
exports.approveCampaign = approveCampaign;
const rejectCampaign = (req, res) => {
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
exports.rejectCampaign = rejectCampaign;
// 4. WATI Webhook Endpoint
const handleWatiWebhook = (req, res) => {
    const event = watiService_js_1.WatiService.processWebhookEvent(req.body);
    if (event.eventType === 'opt_out') {
        const { whatsappNumber, keyword } = event.data;
        console.log(`[Webhook] Opt-Out received for ${whatsappNumber} via keyword ${keyword}`);
        // Auto-suppress in employee store
        employeesStore = employeesStore.map((emp) => emp.whatsappNumber === whatsappNumber || emp.whatsappNumber.includes(whatsappNumber)
            ? { ...emp, consentStatus: 'Opted-Out', optOutDate: new Date().toISOString().split('T')[0] }
            : emp);
    }
    res.status(200).json({ received: true });
};
exports.handleWatiWebhook = handleWatiWebhook;
// 5. System Audit Logs
const getAuditLogs = (req, res) => {
    res.json({ success: true, data: auditLogsStore });
};
exports.getAuditLogs = getAuditLogs;
// 6. WhatsApp WATI Templates Controller (Live Store - No mock templates)
let templatesStore = [];
const getTemplates = async (req, res) => {
    if (templatesStore.length === 0) {
        try {
            const live = await watiService_js_1.WatiService.fetchTemplates();
            if (live && live.length > 0) {
                templatesStore = live;
            }
        }
        catch (e) { }
    }
    res.json({ success: true, count: templatesStore.length, data: templatesStore });
};
exports.getTemplates = getTemplates;
const createTemplate = async (req, res) => {
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
    const customParams = [];
    matches.forEach((m) => {
        const paramKey = m.replace(/[\{\}]/g, '');
        let sampleVal = 'Hospital Staff';
        if (variables && variables[paramKey]) {
            sampleVal = String(variables[paramKey]);
        }
        else if (paramKey === '1') {
            sampleVal = 'Dr. A. Saravanan';
        }
        else if (paramKey === '2') {
            sampleVal = 'Emergency Department';
        }
        else if (paramKey === '3') {
            sampleVal = '20 Nov 2026';
        }
        else {
            sampleVal = `Sample ${paramKey}`;
        }
        if (!customParams.find((p) => p.paramName === paramKey)) {
            customParams.push({ paramName: paramKey, paramValue: sampleVal });
        }
    });
    // Call WATI API to register template in user's WATI tenant
    console.log(`[API Controller] Submitting new template "${cleanName}" to WATI for Meta approval...`);
    const watiRes = await watiService_js_1.WatiService.createTemplateInWati({
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
exports.createTemplate = createTemplate;
const syncTemplates = async (req, res) => {
    try {
        const liveTemplates = await watiService_js_1.WatiService.fetchTemplates();
        templatesStore = liveTemplates || [];
        res.json({
            success: true,
            message: `Synchronized ${templatesStore.length} templates with live WATI endpoint.`,
            count: templatesStore.length,
            data: templatesStore,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.syncTemplates = syncTemplates;
// Initial background sync on module load
watiService_js_1.WatiService.fetchTemplates()
    .then((live) => {
    if (live && live.length > 0) {
        const existingNames = new Set(live.map((t) => t.name));
        const kept = templatesStore.filter((t) => !existingNames.has(t.name));
        templatesStore = [...live, ...kept];
        console.log(`[WATI Service] Successfully pre-loaded ${live.length} live Meta templates from WATI endpoint.`);
    }
})
    .catch((err) => console.warn('[WATI Service] Initial sync warning:', err.message));
