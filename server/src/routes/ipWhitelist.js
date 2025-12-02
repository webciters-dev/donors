// server/src/routes/ipWhitelist.js
import express from 'express';
import { requireAuth, onlyRoles } from '../middleware/auth.js';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validators.js';
import {
  addIpToWhitelist,
  removeIpFromWhitelist,
  updateIpWhitelist,
  getWhitelistedIps,
  isIpWhitelisted
} from '../middleware/ipWhitelist.js';
import { sendSuccess, sendError } from '../lib/apiResponse.js';
import { auditCriticalOperation } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS } from '../lib/auditLogger.js';

const router = express.Router();

// Validation middleware
const validateIpAddress = [
  body('ipAddress')
    .trim()
    .notEmpty().withMessage('IP address is required')
    .matches(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^(\d{1,3}\.){3}\*$/)
    .withMessage('Invalid IP address format. Supports: 192.168.1.1, 192.168.1.0/24, or 192.168.1.*'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Description must not exceed 255 characters'),
  handleValidationErrors
];

const validateIpId = [
  param('id')
    .trim()
    .notEmpty().withMessage('IP whitelist ID is required'),
  handleValidationErrors
];

/**
 * GET /api/ip-whitelist
 * Get all whitelisted IPs
 * Access: SUPER_ADMIN only
 */
router.get(
  '/',
  requireAuth,
  onlyRoles(['SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { includeInactive } = req.query;
      
      const ips = await getWhitelistedIps(includeInactive === 'true');

      sendSuccess(res, ips, 'IP whitelist retrieved successfully');
    } catch (error) {
      console.error('Get IP whitelist error:', error);
      sendError(res, 500, 'WHITELIST_ERROR', 'Failed to retrieve IP whitelist');
    }
  }
);

/**
 * POST /api/ip-whitelist
 * Add IP to whitelist
 * Access: SUPER_ADMIN only
 */
router.post(
  '/',
  requireAuth,
  onlyRoles(['SUPER_ADMIN']),
  validateIpAddress,
  auditCriticalOperation(AUDIT_ACTIONS.CREATE, 'IpWhitelist', 'Added IP to whitelist'),
  async (req, res) => {
    try {
      const { ipAddress, description } = req.body;

      const result = await addIpToWhitelist(
        ipAddress,
        description || null,
        req.user.id
      );

      sendSuccess(res, result.data, 'IP added to whitelist successfully', 201);
    } catch (error) {
      console.error('Add IP to whitelist error:', error);
      
      if (error.code === 'P2002') {
        return sendError(res, 409, 'DUPLICATE_IP', 'This IP address is already in the whitelist');
      }
      
      sendError(res, 500, 'ADD_IP_ERROR', 'Failed to add IP to whitelist');
    }
  }
);

/**
 * PATCH /api/ip-whitelist/:id
 * Update IP whitelist entry
 * Access: SUPER_ADMIN only
 */
router.patch(
  '/:id',
  requireAuth,
  onlyRoles(['SUPER_ADMIN']),
  validateIpId,
  auditCriticalOperation(AUDIT_ACTIONS.UPDATE, 'IpWhitelist', 'Updated IP whitelist entry'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { ipAddress, description, isActive } = req.body;

      const updates = {};
      if (ipAddress !== undefined) updates.ipAddress = ipAddress;
      if (description !== undefined) updates.description = description;
      if (isActive !== undefined) updates.isActive = isActive;

      const result = await updateIpWhitelist(id, updates, req.user.id);

      sendSuccess(res, result.data, 'IP whitelist entry updated successfully');
    } catch (error) {
      console.error('Update IP whitelist error:', error);
      
      if (error.code === 'P2025') {
        return sendError(res, 404, 'IP_NOT_FOUND', 'IP whitelist entry not found');
      }
      
      sendError(res, 500, 'UPDATE_IP_ERROR', 'Failed to update IP whitelist entry');
    }
  }
);

/**
 * DELETE /api/ip-whitelist/:id
 * Remove IP from whitelist
 * Access: SUPER_ADMIN only
 */
router.delete(
  '/:id',
  requireAuth,
  onlyRoles(['SUPER_ADMIN']),
  validateIpId,
  auditCriticalOperation(AUDIT_ACTIONS.DELETE, 'IpWhitelist', 'Removed IP from whitelist'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await removeIpFromWhitelist(id, req.user.id);

      sendSuccess(res, result.data, 'IP removed from whitelist successfully');
    } catch (error) {
      console.error('Remove IP from whitelist error:', error);
      
      if (error.code === 'P2025') {
        return sendError(res, 404, 'IP_NOT_FOUND', 'IP whitelist entry not found');
      }
      
      sendError(res, 500, 'REMOVE_IP_ERROR', 'Failed to remove IP from whitelist');
    }
  }
);

/**
 * POST /api/ip-whitelist/check
 * Check if IP is whitelisted
 * Access: SUPER_ADMIN only
 */
router.post(
  '/check',
  requireAuth,
  onlyRoles(['SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { ipAddress } = req.body;

      if (!ipAddress) {
        return sendError(res, 400, 'MISSING_IP', 'IP address is required');
      }

      const whitelisted = await isIpWhitelisted(ipAddress);

      sendSuccess(res, { ipAddress, whitelisted }, 'IP check completed');
    } catch (error) {
      console.error('Check IP error:', error);
      sendError(res, 500, 'CHECK_IP_ERROR', 'Failed to check IP whitelist');
    }
  }
);

/**
 * GET /api/ip-whitelist/my-ip
 * Get current user's IP address
 * Access: Authenticated users
 */
router.get(
  '/my-ip',
  requireAuth,
  async (req, res) => {
    try {
      const clientIp = (
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        'unknown'
      ).replace(/^::ffff:/, '');

      const whitelisted = await isIpWhitelisted(clientIp);

      sendSuccess(res, { 
        ipAddress: clientIp, 
        whitelisted,
        user: {
          email: req.user.email,
          role: req.user.role
        }
      }, 'Your IP address');
    } catch (error) {
      console.error('Get my IP error:', error);
      sendError(res, 500, 'GET_IP_ERROR', 'Failed to retrieve IP address');
    }
  }
);

export default router;
