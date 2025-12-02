// server/src/routes/auditLogs.js
import express from 'express';
import { requireAuth, onlyRoles } from '../middleware/auth.js';
import { getAuditLogs, getAuditStats } from '../lib/auditLogger.js';
import { validatePagination } from '../middleware/validators.js';
import { sendSuccess, sendError } from '../lib/apiResponse.js';

const router = express.Router();

/**
 * GET /api/audit-logs
 * Get audit logs with filtering and pagination
 * Access: SUPER_ADMIN only
 */
router.get(
  '/',
  requireAuth,
  onlyRoles(['SUPER_ADMIN']),
  validatePagination,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        action,
        resourceType,
        startDate,
        endDate
      } = req.query;

      const result = await getAuditLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
        action,
        resourceType,
        startDate,
        endDate
      });

      sendSuccess(res, result, 'Audit logs retrieved successfully');
    } catch (error) {
      console.error('Get audit logs error:', error);
      sendError(res, 500, 'AUDIT_LOGS_ERROR', 'Failed to retrieve audit logs');
    }
  }
);

/**
 * GET /api/audit-logs/stats
 * Get audit log statistics
 * Access: SUPER_ADMIN only
 */
router.get(
  '/stats',
  requireAuth,
  onlyRoles(['SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { days = 30 } = req.query;
      
      const stats = await getAuditStats(parseInt(days));

      sendSuccess(res, stats, 'Audit statistics retrieved successfully');
    } catch (error) {
      console.error('Get audit stats error:', error);
      sendError(res, 500, 'AUDIT_STATS_ERROR', 'Failed to retrieve audit statistics');
    }
  }
);

/**
 * GET /api/audit-logs/user/:userId
 * Get audit logs for specific user
 * Access: SUPER_ADMIN or own user
 */
router.get(
  '/user/:userId',
  requireAuth,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Check permission: SUPER_ADMIN or own user
      if (req.user.role !== 'SUPER_ADMIN' && req.user.id !== userId) {
        return sendError(res, 403, 'FORBIDDEN', 'Access denied');
      }

      const result = await getAuditLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        userId
      });

      sendSuccess(res, result, 'User audit logs retrieved successfully');
    } catch (error) {
      console.error('Get user audit logs error:', error);
      sendError(res, 500, 'USER_AUDIT_ERROR', 'Failed to retrieve user audit logs');
    }
  }
);

export default router;
