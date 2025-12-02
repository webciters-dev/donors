/**
 * Error Tracking Module
 * Provides centralized error logging and monitoring
 * 
 * Usage:
 *   import { setupErrorTracking, logError } from './monitoring/errorTracker.js';
 *   
 *   // In server.js
 *   setupErrorTracking(app);
 *   
 *   // Log errors manually
 *   logError(error, { context: 'user-registration', userId: 123 });
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '../..', 'logs');

// Error statistics tracking
const errorStats = {
  totalErrors: 0,
  errorsByType: {},
  recentErrors: [],
  startTime: new Date()
};

const MAX_RECENT_ERRORS = 50; // Keep last 50 errors in memory

/**
 * Ensure logs directory exists
 */
async function ensureLogDirectory() {
  if (!existsSync(LOG_DIR)) {
    await mkdir(LOG_DIR, { recursive: true });
  }
}

/**
 * Write error to log file
 */
async function writeErrorToFile(errorLog) {
  try {
    await ensureLogDirectory();
    
    const date = new Date().toISOString().split('T')[0];
    const logFile = join(LOG_DIR, `errors_${date}.log`);
    
    const logEntry = JSON.stringify(errorLog) + '\n';
    await writeFile(logFile, logEntry, { flag: 'a' });
  } catch (err) {
    // Fallback to console if file writing fails
    console.error('Failed to write error log:', err);
    console.error('Original error:', errorLog);
  }
}

/**
 * Log error with context
 * @param {Error} error - The error object
 * @param {Object} context - Additional context (userId, route, etc.)
 */
export async function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Update statistics
  errorStats.totalErrors++;
  errorStats.errorsByType[error.name] = (errorStats.errorsByType[error.name] || 0) + 1;
  
  // Add to recent errors (keep only last MAX_RECENT_ERRORS)
  errorStats.recentErrors.unshift({
    timestamp: errorLog.timestamp,
    message: error.message,
    name: error.name,
    context: context.route || context.action || 'unknown'
  });
  
  if (errorStats.recentErrors.length > MAX_RECENT_ERRORS) {
    errorStats.recentErrors = errorStats.recentErrors.slice(0, MAX_RECENT_ERRORS);
  }
  
  // Write to file asynchronously
  await writeErrorToFile(errorLog);
  
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(' Error logged:', {
      message: error.message,
      context,
      stack: error.stack?.split('\n')[1]?.trim() // First line of stack
    });
  }
}

/**
 * Get error statistics
 */
export function getErrorStats() {
  return {
    ...errorStats,
    uptime: {
      seconds: Math.floor((Date.now() - errorStats.startTime.getTime()) / 1000),
      formatted: formatUptime(Date.now() - errorStats.startTime.getTime())
    }
  };
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
 * Express error handling middleware
 */
export function errorHandlerMiddleware(err, req, res, next) {
  // Log the error
  logError(err, {
    route: req.path,
    method: req.method,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Send error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

/**
 * Setup error tracking
 * @param {Express.Application} app - Express app instance
 */
export function setupErrorTracking(app) {
  // Endpoint to view error statistics (admin only in production)
  app.get('/api/monitoring/errors', (req, res) => {
    // In production, this should be protected by admin auth
    if (process.env.NODE_ENV === 'production' && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(getErrorStats());
  });
  
  // Unhandled rejection handler
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logError(error, {
      type: 'unhandledRejection',
      promise: String(promise)
    });
  });
  
  // Uncaught exception handler
  process.on('uncaughtException', (error) => {
    logError(error, {
      type: 'uncaughtException',
      critical: true
    });
    
    // In production, we might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      console.error('Critical error occurred. Server may need restart.');
      // process.exit(1); // Uncomment if you want to exit on uncaught exceptions
    }
  });
  
  console.log(' Error tracking initialized:');
  console.log('   GET /api/monitoring/errors - View error statistics');
  console.log('   Logs directory:', LOG_DIR);
}

export default { setupErrorTracking, logError, getErrorStats, errorHandlerMiddleware };
