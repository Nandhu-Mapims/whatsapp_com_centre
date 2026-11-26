import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  login,
  getMe,
  getEmployees,
  createEmployee,
  bulkImportEmployees,
  getDesignations,
  createDesignation,
  getCampaigns,
  createCampaign,
  testSendTemplate,
  approveCampaign,
  rejectCampaign,
  dispatchCampaign,
  handleWatiWebhook,
  getAuditLogs,
  getTemplates,
  createTemplate,
  syncTemplates,
  deleteTemplate,
  restoreTemplate,
  updateEmployeePhone,
  getDeliveryReports,
  retryMessage,
  getSystemMode,
  setSystemMode,
  getGatewayStatus,
  toggleGateway,
} from '../controllers/apiController.js';

import {
  getShortlinks,
  getShortlinkById,
  createShortlink,
  updateShortlink,
  toggleShortlinkStatus,
  getShortlinkAnalytics,
} from '../controllers/shortlinkController.js';

import {
  getVaatiTemplates,
  getVaatiTemplateById,
  createVaatiTemplate,
  updateVaatiTemplate,
  deleteVaatiTemplate,
  testSendVaatiTemplate,
  toggleVaatiTemplateReply,
} from '../controllers/vaatiTemplateController.js';
import {
  handleVaatiWebhook,
  getVaatiReplies,
  syncVaatiRepliesNow,
  updateVaatiReplyStatus,
  deleteVaatiReply,
} from '../controllers/vaatiReplyController.js';

const router = Router();

// Auth routes
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Employee routes
router.get('/employees', authenticate, getEmployees);
router.post('/employees', authenticate, requireRole('Super Admin', 'HR', 'MD'), createEmployee);
router.post('/employees/bulk', authenticate, requireRole('Super Admin', 'HR', 'MD'), bulkImportEmployees);
router.patch('/employees/phone', authenticate, updateEmployeePhone);

// Designation routes
router.get('/designations', authenticate, getDesignations);
router.post('/designations', authenticate, requireRole('Super Admin', 'HR', 'MD'), createDesignation);

// Campaign routes
router.get('/campaigns', authenticate, getCampaigns);
router.post(
  '/campaigns',
  authenticate,
  requireRole('Super Admin', 'HR', 'MS', 'MD'),
  createCampaign
);
router.post(
  '/campaigns/test-send',
  authenticate,
  requireRole('Super Admin', 'HR', 'MS', 'MD'),
  testSendTemplate
);
router.post(
  '/campaigns/:id/approve',
  authenticate,
  requireRole('Super Admin', 'MS', 'MD'),
  approveCampaign
);
router.post(
  '/campaigns/:id/reject',
  authenticate,
  requireRole('Super Admin', 'MS', 'MD'),
  rejectCampaign
);
router.post(
  '/campaigns/:id/dispatch',
  authenticate,
  requireRole('Super Admin', 'HR', 'MS', 'MD'),
  dispatchCampaign
);

// Template routes
router.get('/templates', authenticate, getTemplates);
router.post(
  '/templates',
  authenticate,
  requireRole('Super Admin'),
  createTemplate
);
router.post(
  '/templates/sync',
  authenticate,
  requireRole('Super Admin', 'MS', 'MD'),
  syncTemplates
);
router.delete(
  '/templates/:id',
  authenticate,
  requireRole('Super Admin', 'MD', 'HR'),
  deleteTemplate
);
router.post(
  '/templates/:id/restore',
  authenticate,
  requireRole('Super Admin', 'MD', 'HR'),
  restoreTemplate
);

// Reports routes (Live WATI delivery receipts & Retry)
router.get('/reports/delivery', getDeliveryReports);
router.post('/reports/retry', retryMessage);

// WATI Webhook callback route (called by WATI servers, unauthenticated by JWT but verified by payload)
router.post('/wati/webhook', handleWatiWebhook);

// Audit logs (Strictly Super Admin Alone)
router.get('/audit', authenticate, requireRole('Super Admin'), getAuditLogs);

// Shortlink Creation & Management (Admin RBAC restricted)
router.get('/shortlinks', authenticate, requireRole('Super Admin'), getShortlinks);
router.post('/shortlinks', authenticate, requireRole('Super Admin'), createShortlink);
router.get('/shortlinks/:id', authenticate, requireRole('Super Admin'), getShortlinkById);
router.put('/shortlinks/:id', authenticate, requireRole('Super Admin'), updateShortlink);
router.patch('/shortlinks/:id/toggle', authenticate, requireRole('Super Admin'), toggleShortlinkStatus);
router.get('/shortlinks/:id/analytics', authenticate, requireRole('Super Admin'), getShortlinkAnalytics);

// System mode (Safe Working Sandbox vs Live Production)
router.get('/system/mode', getSystemMode);
router.post('/system/mode', authenticate, requireRole('Super Admin', 'MD'), setSystemMode);

// Gateway Management (WATI vs VAATI)
router.get('/gateway/status', getGatewayStatus);
router.post('/gateway/toggle', authenticate, requireRole('Super Admin', 'MD', 'HR'), toggleGateway);

// VAATI Custom Templates Management
router.get('/vaati/templates', authenticate, getVaatiTemplates);
router.get('/vaati/templates/:id', authenticate, getVaatiTemplateById);
router.post('/vaati/templates', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), createVaatiTemplate);
router.put('/vaati/templates/:id', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), updateVaatiTemplate);
router.patch('/vaati/templates/:id/reply-toggle', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), toggleVaatiTemplateReply);
router.delete('/vaati/templates/:id', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), deleteVaatiTemplate);
router.post('/vaati/templates/test-send', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), testSendVaatiTemplate);

// VAATI Webhook & User Replies Inbox (Saved to MongoDB)
router.post('/vaati/webhook', handleVaatiWebhook);
router.get('/vaati/replies', authenticate, getVaatiReplies);
router.post('/vaati/replies/sync', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), syncVaatiRepliesNow);
router.patch('/vaati/replies/:id/status', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), updateVaatiReplyStatus);
router.delete('/vaati/replies/:id', authenticate, requireRole('Super Admin', 'HR', 'MS', 'MD'), deleteVaatiReply);

export default router;
