"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const apiController_js_1 = require("../controllers/apiController.js");
const shortlinkController_js_1 = require("../controllers/shortlinkController.js");
const vaatiTemplateController_js_1 = require("../controllers/vaatiTemplateController.js");
const vaatiReplyController_js_1 = require("../controllers/vaatiReplyController.js");
const router = (0, express_1.Router)();
// Auth routes
router.post('/auth/login', apiController_js_1.login);
router.get('/auth/me', auth_js_1.authenticate, apiController_js_1.getMe);
// Employee routes
router.get('/employees', auth_js_1.authenticate, apiController_js_1.getEmployees);
router.post('/employees', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MD'), apiController_js_1.createEmployee);
router.post('/employees/bulk', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MD'), apiController_js_1.bulkImportEmployees);
router.patch('/employees/phone', auth_js_1.authenticate, apiController_js_1.updateEmployeePhone);
// Designation routes
router.get('/designations', auth_js_1.authenticate, apiController_js_1.getDesignations);
router.post('/designations', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MD'), apiController_js_1.createDesignation);
// Campaign routes
router.get('/campaigns', auth_js_1.authenticate, apiController_js_1.getCampaigns);
router.post('/campaigns', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), apiController_js_1.createCampaign);
router.post('/campaigns/test-send', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), apiController_js_1.testSendTemplate);
router.post('/campaigns/:id/approve', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'MS', 'MD'), apiController_js_1.approveCampaign);
router.post('/campaigns/:id/reject', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'MS', 'MD'), apiController_js_1.rejectCampaign);
router.post('/campaigns/:id/dispatch', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), apiController_js_1.dispatchCampaign);
// Template routes
router.get('/templates', auth_js_1.authenticate, apiController_js_1.getTemplates);
router.post('/templates', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), apiController_js_1.createTemplate);
router.post('/templates/sync', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'MS', 'MD'), apiController_js_1.syncTemplates);
router.delete('/templates/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'MD', 'HR'), apiController_js_1.deleteTemplate);
router.post('/templates/:id/restore', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'MD', 'HR'), apiController_js_1.restoreTemplate);
// Reports routes (Live WATI delivery receipts & Retry)
router.get('/reports/delivery', apiController_js_1.getDeliveryReports);
router.post('/reports/retry', apiController_js_1.retryMessage);
// WATI Webhook callback route (called by WATI servers, unauthenticated by JWT but verified by payload)
router.post('/wati/webhook', apiController_js_1.handleWatiWebhook);
// Audit logs (Strictly Super Admin Alone)
router.get('/audit', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), apiController_js_1.getAuditLogs);
// Shortlink Creation & Management (Admin RBAC restricted)
router.get('/shortlinks', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), shortlinkController_js_1.getShortlinks);
router.post('/shortlinks', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), shortlinkController_js_1.createShortlink);
router.get('/shortlinks/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), shortlinkController_js_1.getShortlinkById);
router.put('/shortlinks/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), shortlinkController_js_1.updateShortlink);
router.patch('/shortlinks/:id/toggle', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), shortlinkController_js_1.toggleShortlinkStatus);
router.get('/shortlinks/:id/analytics', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin'), shortlinkController_js_1.getShortlinkAnalytics);
// System mode (Safe Working Sandbox vs Live Production)
router.get('/system/mode', apiController_js_1.getSystemMode);
router.post('/system/mode', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'MD'), apiController_js_1.setSystemMode);
// Gateway Management (WATI vs VAATI)
router.get('/gateway/status', apiController_js_1.getGatewayStatus);
router.post('/gateway/toggle', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'MD', 'HR'), apiController_js_1.toggleGateway);
// VAATI Custom Templates Management
router.get('/vaati/templates', auth_js_1.authenticate, vaatiTemplateController_js_1.getVaatiTemplates);
router.get('/vaati/templates/:id', auth_js_1.authenticate, vaatiTemplateController_js_1.getVaatiTemplateById);
router.post('/vaati/templates', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiTemplateController_js_1.createVaatiTemplate);
router.put('/vaati/templates/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiTemplateController_js_1.updateVaatiTemplate);
router.patch('/vaati/templates/:id/reply-toggle', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiTemplateController_js_1.toggleVaatiTemplateReply);
router.delete('/vaati/templates/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiTemplateController_js_1.deleteVaatiTemplate);
router.post('/vaati/templates/test-send', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiTemplateController_js_1.testSendVaatiTemplate);
// VAATI Webhook & User Replies Inbox (Saved to MongoDB)
router.post('/vaati/webhook', vaatiReplyController_js_1.handleVaatiWebhook);
router.get('/vaati/replies', auth_js_1.authenticate, vaatiReplyController_js_1.getVaatiReplies);
router.post('/vaati/replies/sync', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiReplyController_js_1.syncVaatiRepliesNow);
router.patch('/vaati/replies/:id/status', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiReplyController_js_1.updateVaatiReplyStatus);
router.delete('/vaati/replies/:id', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'HR', 'MS', 'MD'), vaatiReplyController_js_1.deleteVaatiReply);
exports.default = router;
