import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getMe,
  getEmployees,
  createEmployee,
  getCampaigns,
  createCampaign,
  approveCampaign,
  rejectCampaign,
  handleWatiWebhook,
  getAuditLogs,
} from '../controllers/apiController.js';

const router = Router();

// Auth routes
router.get('/auth/me', authenticate, getMe);

// Employee routes
router.get('/employees', authenticate, getEmployees);
router.post('/employees', authenticate, requireRole('Super Admin', 'Admin'), createEmployee);

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

// WATI Webhook callback route (called by WATI servers, unauthenticated by JWT but verified by payload)
router.post('/wati/webhook', handleWatiWebhook);

// Audit logs
router.get('/audit', authenticate, requireRole('Super Admin', 'Admin'), getAuditLogs);

export default router;
