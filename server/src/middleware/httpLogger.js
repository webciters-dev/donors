/**
 * HTTP Request Logging Middleware
 * Integrates Winston logger with Express for request/response logging
 * 
 * Usage:
 *   import { httpLogger } from './middleware/httpLogger.js';
 *   app.use(httpLogger);
 */

import logger from '../lib/logger.js';

/**
 * HTTP request/response logging middleware
 */
export function httpLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log incoming request
  logger.logRequest(req);
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log response
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.logResponse(req, res, responseTime);
    
    // Call original end function
    originalEnd.apply(res, args);
  };
  
  next();
}

/**
 * Error logging middleware
 * Should be placed after all routes as a final error handler
 */
export function errorLogger(err, req, res, next) {
  logger.logError(err, {
    route: req.path,
    method: req.method,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip,
    body: req.body,
  });
  
  next(err);
}

export default { httpLogger, errorLogger };
