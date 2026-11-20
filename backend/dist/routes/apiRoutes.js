"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const apiController_js_1 = require("../controllers/apiController.js");
const router = (0, express_1.Router)();
// Auth routes
router.post('/auth/login', apiController_js_1.login);
router.get('/auth/me', auth_js_1.authenticate, apiController_js_1.getMe);
// Employee routes
router.get('/employees', auth_js_1.authenticate, apiController_js_1.getEmployees);
router.post('/employees', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin'), apiController_js_1.createEmployee);
router.post('/employees/bulk', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin'), apiController_js_1.bulkImportEmployees);
// Campaign routes
router.get('/campaigns', auth_js_1.authenticate, apiController_js_1.getCampaigns);
router.post('/campaigns', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin', 'Campaign Creator'), apiController_js_1.createCampaign);
router.post('/campaigns/:id/approve', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin', 'Approver'), apiController_js_1.approveCampaign);
router.post('/campaigns/:id/reject', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin', 'Approver'), apiController_js_1.rejectCampaign);
// Template routes
router.get('/templates', auth_js_1.authenticate, apiController_js_1.getTemplates);
router.post('/templates', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin', 'Campaign Creator'), apiController_js_1.createTemplate);
router.post('/templates/sync', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin'), apiController_js_1.syncTemplates);
// WATI Webhook callback route (called by WATI servers, unauthenticated by JWT but verified by payload)
router.post('/wati/webhook', apiController_js_1.handleWatiWebhook);
// Audit logs
router.get('/audit', auth_js_1.authenticate, (0, auth_js_1.requireRole)('Super Admin', 'Admin'), apiController_js_1.getAuditLogs);
exports.default = router;
