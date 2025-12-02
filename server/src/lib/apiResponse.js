/**
 * Standardized Error Response Utilities
 * Provides consistent error formatting across all API endpoints
 * 
 * Usage:
 *   import { ApiError, sendError } from './lib/apiResponse.js';
 *   
 *   // Throw API errors
 *   throw new ApiError(400, 'Invalid input', { field: 'email' });
 *   
 *   // Send error responses
 *   return sendError(res, 404, 'User not found');
 */

import logger from './logger.js';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error response structure
 */
export function formatErrorResponse(statusCode, message, details = null, stack = null) {
  const response = {
    success: false,
    error: {
      code: statusCode,
      message,
    },
    timestamp: new Date().toISOString(),
  };
  
  if (details) {
    response.error.details = details;
  }
  
  // Include stack trace only in development
  if (stack && process.env.NODE_ENV === 'development') {
    response.error.stack = stack;
  }
  
  return response;
}

/**
 * Send standardized error response
 */
export function sendError(res, statusCode, message, details = null) {
  const response = formatErrorResponse(statusCode, message, details);
  
  logger.warn('API Error', {
    statusCode,
    message,
    details,
  });
  
  return res.status(statusCode).json(response);
}

/**
 * Standard success response structure
 */
export function formatSuccessResponse(data, message = null, meta = null) {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  if (message) {
    response.message = message;
  }
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Send standardized success response
 */
export function sendSuccess(res, data, message = null, meta = null) {
  const response = formatSuccessResponse(data, message, meta);
  return res.json(response);
}

/**
 * Common error codes and messages
 */
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: { code: 400, message: 'Bad request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 404, message: 'Resource not found' },
  CONFLICT: { code: 409, message: 'Resource conflict' },
  VALIDATION_ERROR: { code: 422, message: 'Validation error' },
  TOO_MANY_REQUESTS: { code: 429, message: 'Too many requests' },
  
  // Server errors (5xx)
  INTERNAL_ERROR: { code: 500, message: 'Internal server error' },
  SERVICE_UNAVAILABLE: { code: 503, message: 'Service unavailable' },
};

/**
 * Express error handler middleware
 * Catches all errors and formats them consistently
 */
export function errorHandlerMiddleware(err, req, res, next) {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle ApiError instances
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, err.details);
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, 422, 'Validation failed', err.details || err.message);
  }
  
  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(res, err);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired');
  }
  
  // Log unexpected errors
  logger.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Generic error response
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;
  
  return sendError(res, err.statusCode || 500, message, null);
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(res, err) {
  const { code, meta } = err;
  
  switch (code) {
    case 'P2002': // Unique constraint violation
      return sendError(res, 409, 'Resource already exists', {
        field: meta?.target,
      });
    
    case 'P2025': // Record not found
      return sendError(res, 404, 'Resource not found');
    
    case 'P2003': // Foreign key constraint violation
      return sendError(res, 400, 'Invalid reference', {
        field: meta?.field_name,
      });
    
    case 'P2014': // Relation violation
      return sendError(res, 400, 'Related records exist', {
        relation: meta?.relation_name,
      });
    
    default:
      logger.error('Prisma error', {
        code,
        message: err.message,
        meta,
      });
      return sendError(res, 500, 'Database error');
  }
}

/**
 * Async route wrapper to catch errors
 * Eliminates need for try-catch in every route
 * 
 * Usage:
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await prisma.user.findMany();
 *     sendSuccess(res, users);
 *   }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  ApiError,
  sendError,
  sendSuccess,
  formatErrorResponse,
  formatSuccessResponse,
  ErrorCodes,
  errorHandlerMiddleware,
  asyncHandler,
};
