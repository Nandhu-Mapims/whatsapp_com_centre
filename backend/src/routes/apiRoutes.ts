import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  login,
  getMe,
  getEmployees,
  createEmployee,
  bulkImportEmployees,
  getCampaigns,
  createCampaign,
  approveCampaign,
  rejectCampaign,
  handleWatiWebhook,
  getAuditLogs,
  getTemplates,
  createTemplate,
  syncTemplates,
} from '../controllers/apiController.js';

const router = Router();

// Auth routes
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Employee routes
router.get('/employees', authenticate, getEmployees);
router.post('/employees', authenticate, requireRole('Super Admin', 'Admin'), createEmployee);
router.post('/employees/bulk', authenticate, requireRole('Super Admin', 'Admin'), bulkImportEmployees);

// Campaign routes
router.get('/campaigns', authenticate, getCampaigns);
router.post(
  '/campaigns',
  authenticate,
  requireRole('Super Admin', 'Admin', 'Campaign Creator'),
  createCampaign
);
router.post(
  '/campaigns/:id/approve',
  authenticate,
  requireRole('Super Admin', 'Admin', 'Approver'),
  approveCampaign
);
router.post(
  '/campaigns/:id/reject',
  authenticate,
  requireRole('Super Admin', 'Admin', 'Approver'),
  rejectCampaign
);

// Template routes
router.get('/templates', authenticate, getTemplates);
router.post(
  '/templates',
  authenticate,
  requireRole('Super Admin', 'Admin', 'Campaign Creator'),
  createTemplate
);
router.post(
  '/templates/sync',
  authenticate,
  requireRole('Super Admin', 'Admin'),
  syncTemplates
);

// WATI Webhook callback route (called by WATI servers, unauthenticated by JWT but verified by payload)
router.post('/wati/webhook', handleWatiWebhook);

// Audit logs
router.get('/audit', authenticate, requireRole('Super Admin', 'Admin'), getAuditLogs);

export default router;
