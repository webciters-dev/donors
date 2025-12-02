// server/src/middleware/auditMiddleware.js
import { createAuditLog, AUDIT_ACTIONS, AUDIT_RESOURCES } from '../lib/auditLogger.js';

/**
 * Extracts IP address from request, handling proxy headers
 */
function getIpAddress(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Middleware to automatically log actions performed by authenticated users
 * Should be placed after authentication middleware
 */
export function auditMiddleware(options = {}) {
  const {
    action = null,
    resourceType = null,
    includeBody = false,
    includeQuery = false
  } = options;

  return async (req, res, next) => {
    // Only log if user is authenticated
    if (!req.user) {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Don't wait for audit log - log asynchronously
      setImmediate(async () => {
        try {
          const metadata = {};
          
          if (includeBody && req.body) {
            metadata.body = sanitizeData(req.body);
          }
          
          if (includeQuery && req.query) {
            metadata.query = req.query;
          }

          metadata.method = req.method;
          metadata.path = req.originalUrl || req.url;
          metadata.statusCode = res.statusCode;

          // Determine action from HTTP method if not specified
          const auditAction = action || getActionFromMethod(req.method);
          
          // Determine resource type from URL if not specified
          const auditResourceType = resourceType || getResourceTypeFromUrl(req.originalUrl || req.url);

          // Extract resource ID from URL params or response
          const resourceId = req.params?.id || data?.id || data?.data?.id || null;

          // Track changes for UPDATE operations
          let changes = null;
          if (req.method === 'PUT' || req.method === 'PATCH') {
            changes = {
              updated: sanitizeData(req.body)
            };
          }

          await createAuditLog({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: auditAction,
            resourceType: auditResourceType,
            resourceId,
            ipAddress: getIpAddress(req),
            userAgent: req.headers['user-agent'],
            changes,
            metadata,
            status: res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED'
          });
        } catch (error) {
          console.error('Audit middleware error:', error);
          // Don't throw - continue with response
        }
      });

      return originalJson(data);
    };

    next();
  };
}

/**
 * Specific audit middleware for admin-only routes
 */
export function auditAdminAction(action, resourceType) {
  return auditMiddleware({
    action,
    resourceType,
    includeBody: true,
    includeQuery: true
  });
}

/**
 * Audit middleware for login attempts
 */
export function auditLogin(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    setImmediate(async () => {
      try {
        const success = res.statusCode === 200 && data.token;
        
        await createAuditLog({
          userId: data.user?.id || 'unknown',
          userEmail: req.body.email || 'unknown',
          userRole: data.user?.role || 'unknown',
          action: success ? AUDIT_ACTIONS.LOGIN : AUDIT_ACTIONS.LOGIN_FAILED,
          resourceType: AUDIT_RESOURCES.USER,
          ipAddress: getIpAddress(req),
          userAgent: req.headers['user-agent'],
          metadata: {
            method: 'POST',
            path: '/api/auth/login',
            email: req.body.email
          },
          status: success ? 'SUCCESS' : 'FAILED',
          errorMessage: success ? null : data.error || 'Login failed'
        });
      } catch (error) {
        console.error('Login audit error:', error);
      }
    });

    return originalJson(data);
  };

  next();
}

/**
 * Audit middleware for critical operations
 */
export function auditCriticalOperation(action, resourceType, description) {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const originalJson = res.json.bind(res);

    res.json = function(data) {
      setImmediate(async () => {
        try {
          await createAuditLog({
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action,
            resourceType,
            resourceId: req.params?.id || data?.id || null,
            ipAddress: getIpAddress(req),
            userAgent: req.headers['user-agent'],
            changes: req.body ? { data: sanitizeData(req.body) } : null,
            metadata: {
              description,
              method: req.method,
              path: req.originalUrl || req.url,
              statusCode: res.statusCode
            },
            status: res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED'
          });
        } catch (error) {
          console.error('Critical operation audit error:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
}

// Helper functions
function getActionFromMethod(method) {
  const methodMap = {
    'POST': AUDIT_ACTIONS.CREATE,
    'GET': AUDIT_ACTIONS.READ,
    'PUT': AUDIT_ACTIONS.UPDATE,
    'PATCH': AUDIT_ACTIONS.UPDATE,
    'DELETE': AUDIT_ACTIONS.DELETE
  };
  return methodMap[method] || 'UNKNOWN';
}

function getResourceTypeFromUrl(url) {
  // Extract resource type from URL patterns
  const patterns = [
    { regex: /\/students/i, type: AUDIT_RESOURCES.STUDENT },
    { regex: /\/donors/i, type: AUDIT_RESOURCES.DONOR },
    { regex: /\/applications/i, type: AUDIT_RESOURCES.APPLICATION },
    { regex: /\/sponsorships/i, type: AUDIT_RESOURCES.SPONSORSHIP },
    { regex: /\/users/i, type: AUDIT_RESOURCES.USER },
    { regex: /\/field-reviews/i, type: AUDIT_RESOURCES.FIELD_REVIEW },
    { regex: /\/interviews/i, type: AUDIT_RESOURCES.INTERVIEW },
    { regex: /\/documents/i, type: AUDIT_RESOURCES.DOCUMENT },
    { regex: /\/messages/i, type: AUDIT_RESOURCES.MESSAGE },
    { regex: /\/payments/i, type: AUDIT_RESOURCES.PAYMENT },
    { regex: /\/universities/i, type: AUDIT_RESOURCES.UNIVERSITY },
    { regex: /\/board-members/i, type: AUDIT_RESOURCES.BOARD_MEMBER }
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(url)) {
      return pattern.type;
    }
  }

  return 'Unknown';
}

function sanitizeData(data) {
  // Remove sensitive fields before logging
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
