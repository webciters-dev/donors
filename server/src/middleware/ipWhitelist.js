// server/src/middleware/ipWhitelist.js
import prisma from '../prismaClient.js';
import logger from '../lib/logger.js';
import { createAuditLog, AUDIT_ACTIONS, AUDIT_RESOURCES } from '../lib/auditLogger.js';

/**
 * Extracts IP address from request, handling proxy headers
 */
function getIpAddress(req) {
  const ip = (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
  
  // Remove IPv6 prefix if present
  return ip.replace(/^::ffff:/, '');
}

/**
 * Check if IP matches pattern (supports CIDR notation)
 */
function ipMatches(ip, pattern) {
  // Direct match
  if (ip === pattern) return true;
  
  // Wildcard match (e.g., 192.168.1.*)
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '\\d+') + '$');
    return regex.test(ip);
  }
  
  // CIDR notation (basic support for /24, /16, /8)
  if (pattern.includes('/')) {
    const [baseIp, cidr] = pattern.split('/');
    const cidrNum = parseInt(cidr);
    
    // Convert IPs to numeric arrays
    const ipParts = ip.split('.').map(Number);
    const baseParts = baseIp.split('.').map(Number);
    
    // Check matching octets based on CIDR
    const octetsToMatch = Math.floor(cidrNum / 8);
    
    for (let i = 0; i < octetsToMatch; i++) {
      if (ipParts[i] !== baseParts[i]) return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Middleware to check if IP is whitelisted for admin routes
 * @param {Object} options - Configuration options
 * @param {boolean} options.enforceWhitelist - Whether to enforce whitelist (default: true)
 * @param {string[]} options.allowedRoles - Roles subject to IP whitelist (default: ['ADMIN', 'SUPER_ADMIN'])
 * @param {boolean} options.blockOnFailure - Block request if IP not whitelisted (default: true)
 */
export function ipWhitelistMiddleware(options = {}) {
  const {
    enforceWhitelist = process.env.ENABLE_IP_WHITELIST !== 'false',
    allowedRoles = ['ADMIN', 'SUPER_ADMIN'],
    blockOnFailure = true
  } = options;

  return async (req, res, next) => {
    // Skip if whitelist is disabled
    if (!enforceWhitelist) {
      return next();
    }

    // Skip if not authenticated
    if (!req.user) {
      return next();
    }

    // Skip if user role is not in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next();
    }

    const clientIp = getIpAddress(req);

    try {
      // Check if IP is in whitelist
      const whitelistedIps = await prisma.ipWhitelist.findMany({
        where: { isActive: true }
      });

      // Allow if whitelist is empty (first-time setup)
      if (whitelistedIps.length === 0) {
        logger.warn('IP whitelist is empty - allowing access for initial setup', {
          ip: clientIp,
          userEmail: req.user.email
        });
        return next();
      }

      // Check if client IP matches any whitelisted pattern
      const isWhitelisted = whitelistedIps.some(entry => 
        ipMatches(clientIp, entry.ipAddress)
      );

      if (isWhitelisted) {
        logger.info('IP whitelist check passed', {
          ip: clientIp,
          userEmail: req.user.email,
          path: req.originalUrl
        });
        return next();
      }

      // IP not whitelisted - log and potentially block
      logger.warn('IP whitelist check failed - access denied', {
        ip: clientIp,
        userEmail: req.user.email,
        userRole: req.user.role,
        path: req.originalUrl
      });

      // Create audit log for blocked access
      await createAuditLog({
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'ACCESS_DENIED',
        resourceType: AUDIT_RESOURCES.ADMIN,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        metadata: {
          reason: 'IP not whitelisted',
          path: req.originalUrl,
          method: req.method
        },
        status: 'FAILED',
        errorMessage: 'IP address not in whitelist'
      });

      if (blockOnFailure) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'IP_NOT_WHITELISTED',
            message: 'Access denied. Your IP address is not authorized to access this resource.',
            ip: clientIp
          }
        });
      }

      // If not blocking, just log and continue
      next();

    } catch (error) {
      logger.error('IP whitelist check error', {
        error: error.message,
        ip: clientIp,
        userEmail: req.user?.email
      });

      // On error, fail securely (deny access)
      if (blockOnFailure) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'IP_WHITELIST_ERROR',
            message: 'Unable to verify IP whitelist. Access denied.'
          }
        });
      }

      next();
    }
  };
}

/**
 * Add IP to whitelist
 */
export async function addIpToWhitelist(ipAddress, description, addedBy) {
  try {
    const entry = await prisma.ipWhitelist.create({
      data: {
        ipAddress,
        description,
        addedBy,
        isActive: true
      }
    });

    logger.info('IP added to whitelist', {
      ipAddress,
      description,
      addedBy
    });

    return { success: true, data: entry };
  } catch (error) {
    logger.error('Failed to add IP to whitelist', {
      error: error.message,
      ipAddress
    });
    throw error;
  }
}

/**
 * Remove IP from whitelist
 */
export async function removeIpFromWhitelist(id, removedBy) {
  try {
    const entry = await prisma.ipWhitelist.delete({
      where: { id }
    });

    logger.info('IP removed from whitelist', {
      id,
      ipAddress: entry.ipAddress,
      removedBy
    });

    // Create audit log
    await createAuditLog({
      userId: removedBy,
      userEmail: 'system',
      userRole: 'SUPER_ADMIN',
      action: AUDIT_ACTIONS.DELETE,
      resourceType: 'IpWhitelist',
      resourceId: id,
      metadata: {
        ipAddress: entry.ipAddress,
        description: entry.description
      },
      status: 'SUCCESS'
    });

    return { success: true, data: entry };
  } catch (error) {
    logger.error('Failed to remove IP from whitelist', {
      error: error.message,
      id
    });
    throw error;
  }
}

/**
 * Update IP whitelist entry
 */
export async function updateIpWhitelist(id, updates, updatedBy) {
  try {
    const entry = await prisma.ipWhitelist.update({
      where: { id },
      data: updates
    });

    logger.info('IP whitelist entry updated', {
      id,
      ipAddress: entry.ipAddress,
      updates,
      updatedBy
    });

    return { success: true, data: entry };
  } catch (error) {
    logger.error('Failed to update IP whitelist', {
      error: error.message,
      id
    });
    throw error;
  }
}

/**
 * Get all whitelisted IPs
 */
export async function getWhitelistedIps(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };
  
  return await prisma.ipWhitelist.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Check if specific IP is whitelisted
 */
export async function isIpWhitelisted(ipAddress) {
  const whitelistedIps = await prisma.ipWhitelist.findMany({
    where: { isActive: true }
  });

  return whitelistedIps.some(entry => ipMatches(ipAddress, entry.ipAddress));
}
