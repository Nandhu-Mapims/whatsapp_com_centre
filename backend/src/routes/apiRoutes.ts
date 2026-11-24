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
  updateEmployeePhone,
  getDeliveryReports,
  retryMessage,
} from '../controllers/apiController.js';

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

// Reports routes (Live WATI delivery receipts & Retry)
router.get('/reports/delivery', getDeliveryReports);
router.post('/reports/retry', retryMessage);

// WATI Webhook callback route (called by WATI servers, unauthenticated by JWT but verified by payload)
router.post('/wati/webhook', handleWatiWebhook);

// Audit logs (Strictly Super Admin Alone)
router.get('/audit', authenticate, requireRole('Super Admin'), getAuditLogs);

export default router;
