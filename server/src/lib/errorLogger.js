/**
 * Enhanced Error Logger
 * Provides structured error logging with context
 * 
 * Features:
 * - Structured error logging with context
 * - Non-blocking (uses fire-and-forget pattern)
 * - Detailed error information capture
 * - In-memory statistics tracking
 * - File-based error history
 * 
 * Safety: All async operations have error handling, won't block requests
 */

import logger from './logger.js';
import { getErrorInfo } from './errorCodes.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '../../logs/errors');

/**
 * In-memory error statistics (non-persistent)
 */
const errorStats = {
  total: 0,
  byCode: {},
  byCategory: {},
  byStatus: {},
  recent: [], // Last 50 errors
  startTime: new Date()
};

const MAX_RECENT_ERRORS = 50;

/**
 * Ensure logs directory exists
 * Non-blocking - errors don't propagate
 */
async function ensureLogDirectory() {
  try {
    if (!existsSync(LOG_DIR)) {
      await mkdir(LOG_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create logs directory:', err.message);
    // Don't throw - this shouldn't block request handling
  }
}

/**
 * Write error to file asynchronously (non-blocking)
 */
async function writeErrorToFile(errorInfo) {
  try {
    await ensureLogDirectory();
    
    const date = new Date().toISOString().split('T')[0];
    const logFile = join(LOG_DIR, `errors_${date}.log`);
    
    const entry = JSON.stringify(errorInfo) + '\n';
    await writeFile(logFile, entry, { flag: 'a' });
  } catch (err) {
    // Silently fail - logging shouldn't break requests
    // Just log to console as fallback
    console.error('Error writing to error log:', err.message);
  }
}

/**
 * Enhanced error logger
 * 
 * Usage:
 *   logError(new Error("Something failed"), {
 *     route: '/api/users',
 *     userId: 'user_123',
 *     action: 'CREATE_USER',
 *     details: { email: 'test@example.com' }
 *   });
 */
export function logError(error, context = {}) {
  try {
    // Extract error information
    const errorCode = context.errorCode || 'UNKNOWN_ERROR';
    const errorInfo = getErrorInfo(errorCode);
    
    // Build comprehensive error log
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorCode: errorCode,
      category: errorInfo?.category || 'UNKNOWN',
      statusCode: context.statusCode || errorInfo?.statusCode || 500,
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      
      // Context information
      context: {
        route: context.route || 'UNKNOWN',
        method: context.method || 'UNKNOWN',
        userId: context.userId || null,
        userRole: context.userRole || null,
        ip: context.ip || null,
        userAgent: context.userAgent || null,
        action: context.action || null,
      },
      
      // Additional details
      details: context.details || null,
      query: context.query || null,
      body: context.body ? sanitizeBody(context.body) : null,
      
      // Environment
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };
    
    // Update statistics
    errorStats.total++;
    errorStats.byCode[errorCode] = (errorStats.byCode[errorCode] || 0) + 1;
    errorStats.byCategory[errorInfo?.category] = (errorStats.byCategory[errorInfo?.category] || 0) + 1;
    errorStats.byStatus[errorInfo?.statusCode] = (errorStats.byStatus[errorInfo?.statusCode] || 0) + 1;
    
    // Keep recent errors (last 50)
    errorStats.recent.unshift({
      timestamp: errorLog.timestamp,
      code: errorCode,
      message: error.message,
      route: context.route,
      userId: context.userId,
    });
    if (errorStats.recent.length > MAX_RECENT_ERRORS) {
      errorStats.recent = errorStats.recent.slice(0, MAX_RECENT_ERRORS);
    }
    
    // Log to Winston (structured logging)
    if (errorInfo?.category === 'EXTERNAL') {
      logger.warn(`External Service Error: ${errorCode}`, errorLog);
    } else if (errorInfo?.statusCode >= 500) {
      logger.error(`Server Error: ${errorCode}`, errorLog);
    } else {
      logger.warn(`Client/Business Error: ${errorCode}`, errorLog);
    }
    
    // Write to file asynchronously (non-blocking)
    // Using fire-and-forget pattern
    writeErrorToFile(errorLog).catch(err => {
      // If file write fails, silently ignore
      // Error logging should never break the main request
    });
    
    return errorLog;
  } catch (err) {
    // Even error logging shouldn't crash
    console.error('Error in logError function:', err);
    return null;
  }
}

/**
 * Get current error statistics
 */
export function getErrorStats() {
  return {
    ...errorStats,
    uptime: formatUptime(Date.now() - errorStats.startTime.getTime()),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Reset error statistics (for testing)
 */
export function resetErrorStats() {
  errorStats.total = 0;
  errorStats.byCode = {};
  errorStats.byCategory = {};
  errorStats.byStatus = {};
  errorStats.recent = [];
  errorStats.startTime = new Date();
}

/**
 * Format uptime duration
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'creditCard'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

/**
 * Express error logging middleware
 */
export function errorLoggingMiddleware(err, req, res, next) {
  // Log the error
  logError(err, {
    route: req.path,
    method: req.method,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    query: req.query,
    body: req.body,
    statusCode: err.statusCode || 500,
    errorCode: err.code || 'UNKNOWN_ERROR',
    action: req.body?.action || null,
  });
  
  // Pass to next middleware
  next(err);
}

export default {
  logError,
  getErrorStats,
  resetErrorStats,
  errorLoggingMiddleware,
};
