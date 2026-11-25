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
} from '../controllers/apiController.js';

import {
  getShortlinks,
  getShortlinkById,
  createShortlink,
  updateShortlink,
  toggleShortlinkStatus,
  getShortlinkAnalytics,
} from '../controllers/shortlinkController.js';

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

export default router;
