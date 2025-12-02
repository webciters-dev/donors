// server/src/lib/auditLogger.js
import prisma from '../prismaClient.js';
import logger from './logger.js';

/**
 * Log an audit entry for tracking admin/user actions
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID who performed the action
 * @param {string} params.userEmail - User email
 * @param {string} params.userRole - User role (ADMIN, SUPER_ADMIN, etc.)
 * @param {string} params.action - Action performed (CREATE, UPDATE, DELETE, LOGIN, etc.)
 * @param {string} params.resourceType - Type of resource affected
 * @param {string} [params.resourceId] - ID of affected resource
 * @param {string} [params.ipAddress] - IP address
 * @param {string} [params.userAgent] - Browser/client info
 * @param {Object} [params.changes] - Before/after values for updates
 * @param {Object} [params.metadata] - Additional context
 * @param {string} [params.status] - SUCCESS, FAILED, ERROR
 * @param {string} [params.errorMessage] - Error details
 */
export async function createAuditLog({
  userId,
  userEmail,
  userRole,
  action,
  resourceType,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  changes = null,
  metadata = null,
  status = 'SUCCESS',
  errorMessage = null
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        userRole,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        changes,
        metadata,
        status,
        errorMessage
      }
    });

    // Also log to winston for immediate visibility
    logger.info('Audit Log Entry Created', {
      auditLogId: auditLog.id,
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      status
    });

    return auditLog;
  } catch (error) {
    // Don't throw error to prevent blocking main operation
    // Just log the failure
    logger.error('Failed to create audit log', {
      error: error.message,
      userId,
      action,
      resourceType
    });
    console.error('Audit log creation failed:', error);
  }
}

/**
 * Get audit logs with filtering and pagination
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @param {string} [options.userId] - Filter by user ID
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.resourceType] - Filter by resource type
 * @param {Date} [options.startDate] - Filter from date
 * @param {Date} [options.endDate] - Filter to date
 */
export async function getAuditLogs({
  page = 1,
  limit = 50,
  userId = null,
  action = null,
  resourceType = null,
  startDate = null,
  endDate = null
} = {}) {
  const skip = (page - 1) * limit;
  
  const where = {};
  
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get audit statistics
 */
export async function getAuditStats(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    totalLogs,
    failedActions,
    actionsByType,
    topUsers
  ] = await Promise.all([
    // Total logs in period
    prisma.auditLog.count({
      where: { createdAt: { gte: startDate } }
    }),
    
    // Failed actions
    prisma.auditLog.count({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'SUCCESS' }
      }
    }),
    
    // Actions by type
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10
    }),
    
    // Top users by activity
    prisma.auditLog.groupBy({
      by: ['userId', 'userEmail'],
      where: { createdAt: { gte: startDate } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    })
  ]);

  return {
    period: `Last ${days} days`,
    totalLogs,
    failedActions,
    successRate: totalLogs > 0 ? ((totalLogs - failedActions) / totalLogs * 100).toFixed(2) : 100,
    actionsByType: actionsByType.map(item => ({
      action: item.action,
      count: item._count.action
    })),
    topUsers: topUsers.map(item => ({
      userId: item.userId,
      userEmail: item.userEmail,
      actionCount: item._count.userId
    }))
  };
}

/**
 * Clean old audit logs (for data retention policy)
 * @param {number} daysToKeep - Number of days to keep logs
 */
export async function cleanOldAuditLogs(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });

  logger.info('Old audit logs cleaned', {
    deletedCount: result.count,
    cutoffDate,
    daysToKeep
  });

  return result;
}

// Action constants for consistency
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // CRUD Operations
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  
  // Status Changes
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SUSPEND: 'SUSPEND',
  ACTIVATE: 'ACTIVATE',
  
  // Special Operations
  BULK_DELETE: 'BULK_DELETE',
  BULK_UPDATE: 'BULK_UPDATE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  
  // Privilege Changes
  ROLE_CHANGE: 'ROLE_CHANGE',
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  
  // System Operations
  BACKUP: 'BACKUP',
  RESTORE: 'RESTORE',
  CONFIG_CHANGE: 'CONFIG_CHANGE'
};

// Resource type constants
export const AUDIT_RESOURCES = {
  STUDENT: 'Student',
  DONOR: 'Donor',
  APPLICATION: 'Application',
  SPONSORSHIP: 'Sponsorship',
  USER: 'User',
  ADMIN: 'Admin',
  CASE_WORKER: 'CaseWorker',
  BOARD_MEMBER: 'BoardMember',
  FIELD_REVIEW: 'FieldReview',
  INTERVIEW: 'Interview',
  DOCUMENT: 'Document',
  MESSAGE: 'Message',
  PAYMENT: 'Payment',
  DISBURSEMENT: 'Disbursement',
  UNIVERSITY: 'University',
  SYSTEM: 'System'
};
