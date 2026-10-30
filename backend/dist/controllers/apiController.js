"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.handleWatiWebhook = exports.rejectCampaign = exports.approveCampaign = exports.createCampaign = exports.getCampaigns = exports.createEmployee = exports.getEmployees = exports.getMe = void 0;
const watiService_js_1 = require("../services/watiService.js");
// Realistic in-memory state store with database synchronization fallback
let employeesStore = [
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
// 3. Campaigns Controller with Separation of Duties
const getCampaigns = (req, res) => {
    res.json({ success: true, count: campaignsStore.length, data: campaignsStore });
};
exports.getCampaigns = getCampaigns;
const createCampaign = (req, res) => {
    const { title, templateId, templateName, categoryScope, departmentScope, priority, selectedCount, isDraft } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, message: 'Campaign title is required.' });
    }
    const newCampaign = {
        id: `cmp-${Date.now()}`,
        campaignId: `CMP-2026-09${campaignsStore.length + 5}`,
        title,
        categoryScope: categoryScope || 'All',
        departmentScope: departmentScope || 'All',
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
