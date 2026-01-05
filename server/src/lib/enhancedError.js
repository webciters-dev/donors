/**
 * Enhanced Error Response Builder
 * Creates consistent, structured error responses while maintaining backward compatibility
 * 
 * Features:
 * - Backward compatible (keeps existing .error field)
 * - Adds detailed error information
 * - Includes error codes and categories
 * - Provides context for debugging
 * - Safe to deploy immediately (frontend still works)
 * 
 * Format:
 * {
 *   success: false,
 *   error: "User-friendly message",           // ← Existing field (backward compatible)
 *   errorCode: "AUTH_001",                    // ← New field (ignored by old frontend)
 *   errorCategory: "AUTH",                    // ← New field
 *   errorDetails: { field: "email", ... },    // ← New field (optional)
 *   timestamp: "2025-12-15T14:30:00Z",        // ← New field
 *   requestId: "req_123",                     // ← New field (for tracing)
 * }
 */

import { getErrorInfo } from './errorCodes.js';

/**
 * Create enhanced error response
 * 
 * Usage:
 *   return res.status(400).json(
 *     createErrorResponse(400, 'Email is required', 'VAL_002', {
 *       field: 'email'
 *     })
 *   );
 */
export function createErrorResponse(
  statusCode,
  message,
  errorCode = 'UNKNOWN_ERROR',
  errorDetails = null,
  requestId = null
) {
  const errorInfo = getErrorInfo(errorCode);
  
  return {
    success: false,
    statusCode: statusCode,  // ← Include statusCode for res.status(error.statusCode) usage
    error: message,  // ← KEEP existing field for backward compatibility
    errorCode: errorCode,
    errorCategory: errorInfo?.category || 'UNKNOWN',
    errorDetails: errorDetails,
    timestamp: new Date().toISOString(),
    requestId: requestId,
  };
}

/**
 * Create validation error response
 * 
 * Usage:
 *   return res.status(422).json(
 *     createValidationError('Email format invalid', {
 *       field: 'email',
 *       received: 'invalid-email',
 *       expected: 'valid email format'
 *     })
 *   );
 */
export function createValidationError(message, details = null, requestId = null) {
  return createErrorResponse(422, message, 'VALIDATION_FAILED', details, requestId);
}

/**
 * Create not found error response
 * 
 * Usage:
 *   return res.status(404).json(
 *     createNotFoundError('Student not found', { studentId: 'xyz' })
 *   );
 */
export function createNotFoundError(message, details = null, requestId = null) {
  return createErrorResponse(404, message, 'RESOURCE_NOT_FOUND', details, requestId);
}

/**
 * Create conflict error response (duplicate, already exists, etc)
 * 
 * Usage:
 *   return res.status(409).json(
 *     createConflictError('Email already registered', { email: 'test@example.com' })
 *   );
 */
export function createConflictError(message, details = null, requestId = null) {
  return createErrorResponse(409, message, 'RESOURCE_ALREADY_EXISTS', details, requestId);
}

/**
 * Create authentication error response
 * 
 * Usage:
 *   return res.status(401).json(
 *     createAuthError('Invalid credentials', 'AUTH_002')
 *   );
 */
export function createAuthError(message, errorCode = 'AUTH_005', requestId = null) {
  const statusCode = getErrorInfo(errorCode)?.statusCode || 401;
  return createErrorResponse(statusCode, message, errorCode, null, requestId);
}

/**
 * Create permission error response
 * 
 * Usage:
 *   return res.status(403).json(
 *     createPermissionError('Admin access required')
 *   );
 */
export function createPermissionError(message, requestId = null) {
  return createErrorResponse(403, message, 'AUTH_INSUFFICIENT_PERMISSIONS', null, requestId);
}

/**
 * Create internal server error response
 * 
 * Usage:
 *   return res.status(500).json(
 *     createInternalError('Database operation failed', { operation: 'create_user' })
 *   );
 */
export function createInternalError(message, details = null, requestId = null) {
  return createErrorResponse(
    500,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    'INTERNAL_SERVER_ERROR',
    details,
    requestId
  );
}

/**
 * Map Prisma errors to enhanced error responses
 * 
 * Usage:
 *   catch (error) {
 *     if (error.code?.startsWith('P')) {
 *       return res.status(409).json(handlePrismaError(error));
 *     }
 *   }
 */
export function handlePrismaError(error, requestId = null) {
  const { code, meta } = error;
  
  switch (code) {
    case 'P2002': // Unique constraint
      return createConflictError(
        'This record already exists',
        { field: meta?.target?.[0], violation: 'unique_constraint' },
        requestId
      );
    
    case 'P2025': // Record not found
      return createNotFoundError(
        'Record not found',
        { operation: 'update/delete_on_missing_record' },
        requestId
      );
    
    case 'P2003': // Foreign key constraint
      return createErrorResponse(
        400,
        'Invalid reference: related record not found',
        'DATABASE_FOREIGN_KEY_VIOLATION',
        { field: meta?.field_name },
        requestId
      );
    
    case 'P2014': // Relation violation
      return createErrorResponse(
        400,
        'Cannot perform operation: related records exist',
        'DATABASE_FOREIGN_KEY_VIOLATION',
        { relation: meta?.relation_name },
        requestId
      );
    
    default:
      return createInternalError(
        'Database operation failed',
        { prismaCode: code, meta },
        requestId
      );
  }
}

/**
 * Safe error response handler
 * Ensures every error produces a valid response
 */
export function safeErrorResponse(error, statusCode = 500, requestId = null) {
  try {
    if (error.code?.startsWith('P')) {
      // Prisma error
      return handlePrismaError(error, requestId);
    }
    
    if (error.statusCode) {
      // ApiError or similar
      return createErrorResponse(
        error.statusCode,
        error.message,
        error.code || 'UNKNOWN_ERROR',
        error.details,
        requestId
      );
    }
    
    // Generic error
    return createInternalError(
      error.message || 'An unexpected error occurred',
      null,
      requestId
    );
  } catch (err) {
    // Last resort - if even error handling fails
    return {
      success: false,
      error: 'Internal server error',
      errorCode: 'SRV_001',
      errorCategory: 'SERVER',
      timestamp: new Date().toISOString(),
      requestId: requestId,
    };
  }
}

export default {
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createConflictError,
  createAuthError,
  createPermissionError,
  createInternalError,
  handlePrismaError,
  safeErrorResponse,
};
