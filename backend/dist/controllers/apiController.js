"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTemplates = exports.createTemplate = exports.getTemplates = exports.getAuditLogs = exports.handleWatiWebhook = exports.rejectCampaign = exports.approveCampaign = exports.createCampaign = exports.getCampaigns = exports.bulkImportEmployees = exports.createEmployee = exports.getEmployees = exports.getMe = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const watiService_js_1 = require("../services/watiService.js");
const hospitalUsers = [
    {
        id: 'u-1',
        name: 'Dr. S. Sundararajan',
        email: 'medical.director@mapims.org',
        role: 'Super Admin',
    },
    {
        id: 'u-2',
        name: 'Mrs. K. Kavitha',
        email: 'kavitha.hr@mapims.org',
        role: 'Admin',
    },
    {
        id: 'u-3',
        name: 'P. Rajesh Kumar',
        email: 'rajesh.comms@mapims.org',
        role: 'Campaign Creator',
    },
    {
        id: 'u-4',
        name: 'Prof. M. Vijayalakshmi',
        email: 'dean.approver@mapims.org',
        role: 'Approver',
    },
    {
        id: 'u-5',
        name: 'R. Ananth',
        email: 'ananth.auditor@mapims.org',
        role: 'Viewer',
    },
];
// Realistic in-memory state store with database synchronization fallback
let employeesStore = [
    {
        id: 'emp-test-9551',
        employeeId: 'MAP-9551',
        name: 'Shreya (Test Lead)',
        category: 'Medical / Clinical',
        department: 'Emergency & Trauma Care',
        designation: 'Senior Consultant - ER',
        whatsappNumber: '+919551382296',
        maskedNumber: '+91 95513 82296',
        consentStatus: 'Opted-In',
        consentSource: 'WATI Verified Contact',
        consentDate: '2026-11-16',
        active: true,
    },
    {
        id: 'emp-01',
        employeeId: 'MAP-1021',
        name: 'Dr. A. Saravanan',
        category: 'Medical / Clinical',
        department: 'Emergency & Trauma Care',
        designation: 'Senior Consultant - ER',
        whatsappNumber: '+919840123456',
        maskedNumber: '+91 98401 ••••••',
        consentStatus: 'Opted-In',
        consentSource: 'Employee Induction Form E-Sign',
        consentDate: '2026-01-15',
        active: true,
    },
    {
        id: 'emp-02',
        employeeId: 'MAP-1045',
        name: 'Dr. Priya Radhakrishnan',
        category: 'Medical / Clinical',
        department: 'Cardiology & Cath Lab',
        designation: 'Associate Cardiologist',
        whatsappNumber: '+919884567890',
        maskedNumber: '+91 98845 ••••••',
        consentStatus: 'Opted-In',
        consentSource: 'Annual HR Verification Portal',
        consentDate: '2026-02-10',
        active: true,
    },
    {
        id: 'emp-03',
        employeeId: 'MAP-2018',
        name: 'Sister Mary Varghese',
        category: 'Nursing Staff',
        department: 'Intensive Care Unit (ICU & CCU)',
        designation: 'ICU Nursing Supervisor',
        whatsappNumber: '+919710345678',
        maskedNumber: '+91 97103 ••••••',
        consentStatus: 'Opted-In',
        consentSource: 'Physical Form Signed',
        consentDate: '2026-01-20',
        active: true,
    },
    {
        id: 'emp-05',
        employeeId: 'MAP-2099',
        name: 'Staff Nurse R. Sathya',
        category: 'Nursing Staff',
        department: 'Emergency & Trauma Care',
        designation: 'Trauma Staff Nurse',
        whatsappNumber: '+919600456123',
        maskedNumber: '+91 96004 ••••••',
        consentStatus: 'Opted-Out',
        consentSource: 'WhatsApp STOP Keyword Response',
        optOutDate: '2026-08-19',
        active: true,
    },
];
let campaignsStore = [
    {
        id: 'cmp-01',
        campaignId: 'CMP-2026-089',
        title: 'Emergency Night Shift Roster Announcement',
        categoryScope: 'Medical / Clinical, Nursing Staff',
        departmentScope: 'Emergency & Trauma Care, Intensive Care Unit (ICU & CCU)',
        templateId: 'tmpl-01',
        templateName: 'mapims_emergency_duty_alert_v1',
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
        templateName: 'mapims_nabh_mock_audit_circular',
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
        actor: 'Dr. S. Sundararajan',
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
// 3. Campaigns Controller with Separation of Duties
const getCampaigns = (req, res) => {
    res.json({ success: true, count: campaignsStore.length, data: campaignsStore });
};
exports.getCampaigns = getCampaigns;
const createCampaign = (req, res) => {
    const { title, templateId, templateName, categoryScope, departmentScope, designationScope, priority, selectedCount, isDraft } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, message: 'Campaign title is required.' });
    }
    const newCampaign = {
        id: `cmp-${Date.now()}`,
        campaignId: `CMP-2026-09${campaignsStore.length + 5}`,
        title,
        categoryScope: categoryScope || 'All',
        departmentScope: departmentScope || 'All',
        designationScope: designationScope || 'All',
        templateId: templateId || 'tmpl-01',
        templateName: templateName || 'mapims_duty_alert',
        selectedRecipientsCount: selectedCount || 100,
        createdBy: req.user?.name || 'Authorized Staff',
        createdById: req.user?.id || 'u-user',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: isDraft ? 'Draft' : 'Pending Approval',
        submittedCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        priority: priority || 'Normal',
    };
    campaignsStore.unshift(newCampaign);
    res.status(201).json({ success: true, data: newCampaign });
};
exports.createCampaign = createCampaign;
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
// 6. WhatsApp WATI Templates Controller
let templatesStore = [
    {
        id: 'tmpl-test-01',
        watiTemplateId: 'aph_system_test_alert_v1',
        name: 'aph_system_test_alert_v1',
        category: 'UTILITY',
        language: 'en',
        headerType: 'TEXT',
        headerContent: '🧪 APH CONNECT SYSTEM TEST',
        body: 'Hello {{1}},\n\nThis is an official test notification from APH Connect Employee Communication Platform at MAPIMS / Adhiparasakthi Hospitals.\n\nTest Timestamp: {{2}}\nPlatform Status: Operational\n\nPlease acknowledge receipt by tapping the button below.',
        footer: 'APH Connect • System Health Test',
        buttons: [
            { type: 'QUICK_REPLY', text: 'Confirm Test Receipt' },
        ],
        variables: [
            { key: '1', sampleValue: 'Dr. A. Saravanan', description: 'Employee Name' },
            { key: '2', sampleValue: '16 Nov 2026, 12:30 PM', description: 'Test Timestamp' },
        ],
        status: 'APPROVED',
        createdAt: '2026-11-16',
    },
    {
        id: 'tmpl-01',
        watiTemplateId: 'aph_emergency_duty_alert_v1',
        name: 'aph_emergency_duty_alert_v1',
        category: 'UTILITY',
        language: 'en',
        headerType: 'TEXT',
        headerContent: '🚨 APH EMERGENCY ROSTER NOTICE',
        body: 'Dear {{1}},\n\nPlease be advised that your duty shift at {{2}} has been scheduled as {{3}} on {{4}}.\n\nKindly acknowledge this alert and report to {{5}}.\n\nFor queries, contact Medical Admin at {{6}}.\n\nRegards,\nMAPIMS / Adhiparasakthi Hospitals',
        footer: 'APH Connect • Employee Communication Platform',
        buttons: [
            { type: 'QUICK_REPLY', text: 'Acknowledge Shift' },
            { type: 'PHONE_NUMBER', text: 'Call Medical Admin', value: '+914427568100' },
        ],
        variables: [
            { key: '1', sampleValue: 'Dr. Saravanan', description: 'Employee Name' },
            { key: '2', sampleValue: 'Emergency Department', description: 'Department/Wing' },
            { key: '3', sampleValue: 'Night Shift', description: 'Shift Timing' },
            { key: '4', sampleValue: '20 Nov 2026', description: 'Duty Date' },
            { key: '5', sampleValue: 'ER Nursing Station 1', description: 'Reporting Station' },
            { key: '6', sampleValue: 'Ext 104', description: 'Admin Contact' },
        ],
        status: 'APPROVED',
        createdAt: '2026-10-30',
    },
    {
        id: 'tmpl-02',
        watiTemplateId: 'aph_cme_clinical_seminar_v2',
        name: 'aph_cme_clinical_seminar_v2',
        category: 'UTILITY',
        language: 'en',
        headerType: 'IMAGE',
        body: 'Dear {{1}},\n\nYou are cordially invited to attend the CME seminar on "{{2}}" organized by the Department of {{3}}.\n\n📅 Date: {{4}}\n⏰ Time: {{5}}\n📍 Venue: {{6}}\n\nCredit Hours: {{7}}.',
        footer: 'Academic Council — MAPIMS',
        buttons: [
            { type: 'QUICK_REPLY', text: 'Attending CME' },
            { type: 'QUICK_REPLY', text: 'Cannot Attend' },
        ],
        status: 'APPROVED',
        createdAt: '2026-11-01',
    },
    {
        id: 'tmpl-03',
        watiTemplateId: 'aph_nabh_mock_audit_circular',
        name: 'aph_nabh_mock_audit_circular',
        category: 'UTILITY',
        language: 'en',
        headerType: 'DOCUMENT',
        body: 'Dear {{1}},\n\nIn preparation for our NABH re-accreditation, an internal assessment for {{2}} is scheduled on {{3}}.\n\nPlease ensure all departmental SOPs and logs are updated.\n\nLead Auditor: {{4}}.',
        footer: 'Quality & Accreditation Cell',
        buttons: [{ type: 'QUICK_REPLY', text: 'Checklist Reviewed' }],
        status: 'APPROVED',
        createdAt: '2026-11-02',
    },
];
const getTemplates = (req, res) => {
    res.json({ success: true, count: templatesStore.length, data: templatesStore });
};
exports.getTemplates = getTemplates;
const createTemplate = (req, res) => {
    const { name, category, language, headerType, headerContent, body, footer, buttons, variables } = req.body;
    if (!name || !body) {
        return res.status(400).json({ success: false, message: 'Template name and body are required.' });
    }
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
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
        variables: variables || [],
        status: 'PENDING',
        submittedBy: req.user?.name || 'Staff',
        createdAt: new Date().toISOString().split('T')[0],
    };
    templatesStore.unshift(newTemplate);
    res.status(201).json({
        success: true,
        message: `Template "${cleanName}" submitted successfully and queued for WATI / Meta review.`,
        data: newTemplate,
    });
};
exports.createTemplate = createTemplate;
const syncTemplates = async (req, res) => {
    try {
        const liveTemplates = await watiService_js_1.WatiService.fetchTemplates();
        if (liveTemplates && liveTemplates.length > 0) {
            const existingNames = new Set(liveTemplates.map((t) => t.name));
            const kept = templatesStore.filter((t) => !existingNames.has(t.name));
            templatesStore = [...liveTemplates, ...kept];
        }
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
