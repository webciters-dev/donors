/**
 * STANDARDIZED ERROR HANDLER UTILITY
 * Use this across ALL projects for consistent error creation and handling
 * 
 * USAGE:
 * const AppError = require('./appError');
 * const ErrorCodes = require('./errorCodes');
 * 
 * // Throw error with predefined code
 * throw new AppError(ErrorCodes.AUTH.INVALID_CREDENTIALS);
 * 
 * // Throw error with custom message
 * throw new AppError(ErrorCodes.RESOURCE.NOT_FOUND, 'Student with ID 123 not found');
 * 
 * // Throw error with details
 * throw new AppError(ErrorCodes.VALIDATION.MISSING_FIELD, 'Email is required', { field: 'email' });
 */

const ErrorCodes = require('./errorCodes');

class AppError extends Error {
  constructor(errorCode, customMessage = null, details = null, originalError = null) {
    // If errorCode is just a string (backwards compatibility)
    if (typeof errorCode === 'string') {
      super(customMessage || errorCode);
      this.code = 'UNKNOWN';
      this.statusCode = 500;
      this.severity = 'high';
    } else {
      // Use ErrorCodes structure
      super(customMessage || errorCode.message);
      this.code = errorCode.code;
      this.statusCode = errorCode.statusCode;
      this.severity = errorCode.severity;
      this.errorCodeKey = errorCode; // Store for reference
    }

    this.isAppError = true;
    this.timestamp = new Date().toISOString();
    this.details = details || {};
    this.originalError = originalError;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API response
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        severity: this.severity,
        timestamp: this.timestamp,
        details: this.details
      }
    };
  }

  /**
   * Convert error to logging format (with sensitive data handling)
   */
  toLogFormat(requestId = null, userId = null, route = null, action = null) {
    return {
      timestamp: this.timestamp,
      requestId: requestId,
      userId: userId,
      route: route,
      action: action,
      error: {
        code: this.code,
        message: this.message,
        severity: this.severity,
        statusCode: this.statusCode,
        stack: this.stack,
        details: this.details,
        originalError: this.originalError ? {
          message: this.originalError.message,
          name: this.originalError.name,
          stack: this.originalError.stack
        } : null
      }
    };
  }

  /**
   * Get error for different contexts
   */
  getForContext(context = 'api') {
    switch (context) {
      case 'api':
        return this.toJSON();
      case 'log':
        return this.toLogFormat();
      case 'user':
        // Safe version without technical details
        return {
          success: false,
          error: {
            code: this.code,
            message: this.message,
            timestamp: this.timestamp
          }
        };
      default:
        return this.toJSON();
    }
  }
}

/**
 * Helper function to create common errors
 */
const createError = {
  notFound: (message, details) => 
    new AppError(ErrorCodes.RESOURCE.NOT_FOUND, message, details),

  unauthorized: (message, details) => 
    new AppError(ErrorCodes.AUTH.UNAUTHORIZED, message, details),

  forbidden: (message, details) => 
    new AppError(ErrorCodes.AUTH.FORBIDDEN, message, details),

  validation: (message, details) => 
    new AppError(ErrorCodes.VALIDATION.INVALID_INPUT, message, details),

  internal: (message, originalError, details) => 
    new AppError(ErrorCodes.SERVER.INTERNAL_ERROR, message, details, originalError),

  conflict: (message, details) => 
    new AppError(ErrorCodes.BUSINESS.INVALID_STATE, message, details),

  badRequest: (message, details) => 
    new AppError(ErrorCodes.SERVER.BAD_REQUEST, message, details),

  fileError: (type, message, details) => {
    const errorCodeMap = {
      'upload_failed': ErrorCodes.FILE.UPLOAD_FAILED,
      'invalid_format': ErrorCodes.FILE.INVALID_FILE_FORMAT,
      'too_large': ErrorCodes.VALIDATION.FILE_TOO_LARGE,
      'invalid_type': ErrorCodes.VALIDATION.INVALID_FILE_TYPE,
      'not_accessible': ErrorCodes.FILE.FILE_NOT_ACCESSIBLE,
      'video_duration': ErrorCodes.FILE.VIDEO_DURATION_INVALID
    };
    return new AppError(errorCodeMap[type] || ErrorCodes.FILE.UPLOAD_FAILED, message, details);
  },

  authError: (type, message, details) => {
    const errorCodeMap = {
      'invalid_credentials': ErrorCodes.AUTH.INVALID_CREDENTIALS,
      'token_expired': ErrorCodes.AUTH.TOKEN_EXPIRED,
      'token_invalid': ErrorCodes.AUTH.TOKEN_INVALID,
      'session_expired': ErrorCodes.AUTH.SESSION_EXPIRED
    };
    return new AppError(errorCodeMap[type] || ErrorCodes.AUTH.UNAUTHORIZED, message, details);
  }
};

/**
 * Middleware to catch and handle errors
 */
const errorHandler = (err, req, res, next) => {
  // Set default values
  let error = err;
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    error = err;
  }
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2025') {
      error = createError.notFound('Resource not found');
    } else if (err.code === 'P2002') {
      error = createError.conflict('Unique constraint violation', { field: err.meta?.target });
    } else if (err.code === 'P2003') {
      error = createError.conflict('Foreign key constraint violation');
    } else {
      error = new AppError(ErrorCodes.DATABASE.QUERY_FAILED, 'Database query failed', {}, err);
    }
    statusCode = error.statusCode;
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    error = new AppError(ErrorCodes.VALIDATION.INVALID_INPUT, 'Validation failed', {
      validationErrors: err.details || err.message
    });
    statusCode = error.statusCode;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error = createError.authError('token_invalid', 'Invalid authentication token');
    statusCode = error.statusCode;
  }
  else if (err.name === 'TokenExpiredError') {
    error = createError.authError('token_expired', 'Authentication token has expired');
    statusCode = error.statusCode;
  }
  // Handle generic Error
  else if (err instanceof Error) {
    error = new AppError(ErrorCodes.SERVER.INTERNAL_ERROR, err.message, {}, err);
    statusCode = error.statusCode;
  }

  // Ensure error is AppError instance
  if (!(error instanceof AppError)) {
    error = new AppError(ErrorCodes.SERVER.INTERNAL_ERROR, message, {}, err);
  }

  // Log the error
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logError(error, {
    requestId,
    route: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Send response
  return res.status(statusCode).json(error.toJSON());
};

/**
 * Logger utility - use this to log errors consistently
 */
const logError = (error, context = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
    userId: context.userId,
    route: context.route,
    method: context.method,
    ip: context.ip,
    error: {
      code: error.code,
      message: error.message,
      severity: error.severity,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    }
  };

  // Log based on severity
  if (error.severity === 'high') {
    console.error('[ERROR-HIGH]', JSON.stringify(logEntry, null, 2));
  } else if (error.severity === 'medium') {
    console.warn('[ERROR-MEDIUM]', JSON.stringify(logEntry, null, 2));
  } else {
    console.log('[ERROR-LOW]', JSON.stringify(logEntry, null, 2));
  }

  // In production, send to external logging service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: logEntry });
  }
};

/**
 * Async error wrapper for routes
 * Usage: app.get('/api/users/:id', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  createError,
  errorHandler,
  logError,
  asyncHandler,
  ErrorCodes
};
