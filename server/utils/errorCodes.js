/**
 * STANDARDIZED ERROR CODES FOR ALL PROJECTS
 * Use this to replace magic error strings with structured error definitions
 * 
 * Each error has:
 * - code: Unique identifier
 * - statusCode: HTTP status code
 * - message: User-friendly message
 * - severity: 'low', 'medium', 'high' for logging/alerts
 * 
 * USAGE: throw new AppError(ErrorCodes.AUTH.INVALID_CREDENTIALS);
 */

const ErrorCodes = {
  // ============================================================================
  // AUTH - Authentication & Authorization (8 codes)
  // ============================================================================
  AUTH: {
    INVALID_CREDENTIALS: {
      code: 'AUTH_001',
      statusCode: 401,
      message: 'Invalid email or password',
      severity: 'medium'
    },
    TOKEN_EXPIRED: {
      code: 'AUTH_002',
      statusCode: 401,
      message: 'Your session has expired. Please login again',
      severity: 'low'
    },
    TOKEN_INVALID: {
      code: 'AUTH_003',
      statusCode: 401,
      message: 'Invalid or malformed authentication token',
      severity: 'medium'
    },
    SESSION_EXPIRED: {
      code: 'AUTH_004',
      statusCode: 401,
      message: 'Your session has ended. Please login again',
      severity: 'low'
    },
    UNAUTHORIZED: {
      code: 'AUTH_005',
      statusCode: 401,
      message: 'Authentication required. Please login',
      severity: 'low'
    },
    FORBIDDEN: {
      code: 'AUTH_006',
      statusCode: 403,
      message: 'You do not have permission to access this resource',
      severity: 'medium'
    },
    MFA_REQUIRED: {
      code: 'AUTH_007',
      statusCode: 403,
      message: 'Multi-factor authentication required',
      severity: 'medium'
    },
    ACCOUNT_LOCKED: {
      code: 'AUTH_008',
      statusCode: 423,
      message: 'Account is locked. Contact support to unlock',
      severity: 'high'
    }
  },

  // ============================================================================
  // VALIDATION - Input Validation (9 codes)
  // ============================================================================
  VALIDATION: {
    INVALID_INPUT: {
      code: 'VALIDATION_001',
      statusCode: 400,
      message: 'Invalid input provided',
      severity: 'low'
    },
    MISSING_FIELD: {
      code: 'VALIDATION_002',
      statusCode: 400,
      message: 'Required field is missing',
      severity: 'low'
    },
    INVALID_EMAIL: {
      code: 'VALIDATION_003',
      statusCode: 400,
      message: 'Email address is invalid',
      severity: 'low'
    },
    INVALID_FILE_TYPE: {
      code: 'VALIDATION_004',
      statusCode: 400,
      message: 'File type is not allowed',
      severity: 'low'
    },
    FILE_TOO_LARGE: {
      code: 'VALIDATION_005',
      statusCode: 413,
      message: 'File size exceeds maximum limit',
      severity: 'low'
    },
    INVALID_DATE_FORMAT: {
      code: 'VALIDATION_006',
      statusCode: 400,
      message: 'Date format is invalid. Use YYYY-MM-DD',
      severity: 'low'
    },
    INVALID_PHONE_NUMBER: {
      code: 'VALIDATION_007',
      statusCode: 400,
      message: 'Phone number format is invalid',
      severity: 'low'
    },
    DUPLICATE_ENTRY: {
      code: 'VALIDATION_008',
      statusCode: 409,
      message: 'This entry already exists',
      severity: 'low'
    },
    INVALID_LENGTH: {
      code: 'VALIDATION_009',
      statusCode: 400,
      message: 'Field length is invalid',
      severity: 'low'
    }
  },

  // ============================================================================
  // RESOURCE - Resource Not Found (8 codes)
  // ============================================================================
  RESOURCE: {
    USER_NOT_FOUND: {
      code: 'RESOURCE_001',
      statusCode: 404,
      message: 'User not found',
      severity: 'low'
    },
    STUDENT_NOT_FOUND: {
      code: 'RESOURCE_002',
      statusCode: 404,
      message: 'Student not found',
      severity: 'low'
    },
    APPLICATION_NOT_FOUND: {
      code: 'RESOURCE_003',
      statusCode: 404,
      message: 'Application not found',
      severity: 'low'
    },
    REVIEW_NOT_FOUND: {
      code: 'RESOURCE_004',
      statusCode: 404,
      message: 'Review not found',
      severity: 'low'
    },
    SPONSORSHIP_NOT_FOUND: {
      code: 'RESOURCE_005',
      statusCode: 404,
      message: 'Sponsorship not found',
      severity: 'low'
    },
    FILE_NOT_FOUND: {
      code: 'RESOURCE_006',
      statusCode: 404,
      message: 'File not found',
      severity: 'low'
    },
    SETTINGS_NOT_FOUND: {
      code: 'RESOURCE_007',
      statusCode: 404,
      message: 'Settings not found',
      severity: 'low'
    },
    SUBSCRIPTION_NOT_FOUND: {
      code: 'RESOURCE_008',
      statusCode: 404,
      message: 'Subscription not found',
      severity: 'low'
    }
  },

  // ============================================================================
  // DATABASE - Database Operations (7 codes)
  // ============================================================================
  DATABASE: {
    CONNECTION_FAILED: {
      code: 'DATABASE_001',
      statusCode: 503,
      message: 'Database connection failed',
      severity: 'high'
    },
    QUERY_FAILED: {
      code: 'DATABASE_002',
      statusCode: 500,
      message: 'Database query failed',
      severity: 'high'
    },
    TRANSACTION_FAILED: {
      code: 'DATABASE_003',
      statusCode: 500,
      message: 'Database transaction failed',
      severity: 'high'
    },
    UNIQUE_CONSTRAINT: {
      code: 'DATABASE_004',
      statusCode: 409,
      message: 'Duplicate entry violates unique constraint',
      severity: 'medium'
    },
    FOREIGN_KEY_CONSTRAINT: {
      code: 'DATABASE_005',
      statusCode: 409,
      message: 'Operation violates foreign key constraint',
      severity: 'medium'
    },
    MIGRATION_FAILED: {
      code: 'DATABASE_006',
      statusCode: 500,
      message: 'Database migration failed',
      severity: 'high'
    },
    BACKUP_FAILED: {
      code: 'DATABASE_007',
      statusCode: 500,
      message: 'Database backup failed',
      severity: 'high'
    }
  },

  // ============================================================================
  // FILE - File Operations (8 codes)
  // ============================================================================
  FILE: {
    UPLOAD_FAILED: {
      code: 'FILE_001',
      statusCode: 500,
      message: 'File upload failed',
      severity: 'medium'
    },
    INVALID_FILE_FORMAT: {
      code: 'FILE_002',
      statusCode: 400,
      message: 'File format is not supported',
      severity: 'low'
    },
    FILE_NOT_ACCESSIBLE: {
      code: 'FILE_003',
      statusCode: 404,
      message: 'File is not accessible',
      severity: 'medium'
    },
    DISK_SPACE_EXCEEDED: {
      code: 'FILE_004',
      statusCode: 507,
      message: 'Disk space exceeded',
      severity: 'high'
    },
    DIRECTORY_NOT_FOUND: {
      code: 'FILE_005',
      statusCode: 404,
      message: 'Directory not found',
      severity: 'high'
    },
    PERMISSION_DENIED: {
      code: 'FILE_006',
      statusCode: 403,
      message: 'Permission denied for file operation',
      severity: 'high'
    },
    FILE_ALREADY_EXISTS: {
      code: 'FILE_007',
      statusCode: 409,
      message: 'File already exists',
      severity: 'low'
    },
    VIDEO_DURATION_INVALID: {
      code: 'FILE_008',
      statusCode: 400,
      message: 'Video duration must be between 30-120 seconds',
      severity: 'low'
    }
  },

  // ============================================================================
  // BUSINESS - Business Logic (8 codes)
  // ============================================================================
  BUSINESS: {
    INVALID_STATE: {
      code: 'BUSINESS_001',
      statusCode: 409,
      message: 'Resource is in an invalid state for this operation',
      severity: 'medium'
    },
    INSUFFICIENT_FUNDS: {
      code: 'BUSINESS_002',
      statusCode: 402,
      message: 'Insufficient funds for this operation',
      severity: 'medium'
    },
    DUPLICATE_OPERATION: {
      code: 'BUSINESS_003',
      statusCode: 409,
      message: 'This operation has already been performed',
      severity: 'medium'
    },
    INVALID_OPERATION: {
      code: 'BUSINESS_004',
      statusCode: 400,
      message: 'Operation is not allowed',
      severity: 'medium'
    },
    LIMIT_EXCEEDED: {
      code: 'BUSINESS_005',
      statusCode: 429,
      message: 'Operation limit exceeded',
      severity: 'low'
    },
    ALREADY_COMPLETED: {
      code: 'BUSINESS_006',
      statusCode: 409,
      message: 'Operation already completed',
      severity: 'low'
    },
    INVALID_PERIOD: {
      code: 'BUSINESS_007',
      statusCode: 400,
      message: 'Operation not allowed in this period',
      severity: 'low'
    },
    RESTRICTED_ACCESS: {
      code: 'BUSINESS_008',
      statusCode: 403,
      message: 'Access is restricted for this resource',
      severity: 'medium'
    }
  },

  // ============================================================================
  // EXTERNAL - External Services (6 codes)
  // ============================================================================
  EXTERNAL: {
    EMAIL_FAILED: {
      code: 'EXTERNAL_001',
      statusCode: 502,
      message: 'Failed to send email',
      severity: 'high'
    },
    SMS_FAILED: {
      code: 'EXTERNAL_002',
      statusCode: 502,
      message: 'Failed to send SMS',
      severity: 'high'
    },
    PAYMENT_FAILED: {
      code: 'EXTERNAL_003',
      statusCode: 502,
      message: 'Payment processing failed',
      severity: 'high'
    },
    API_ERROR: {
      code: 'EXTERNAL_004',
      statusCode: 502,
      message: 'External API error',
      severity: 'high'
    },
    SERVICE_UNAVAILABLE: {
      code: 'EXTERNAL_005',
      statusCode: 503,
      message: 'External service is unavailable',
      severity: 'high'
    },
    TIMEOUT: {
      code: 'EXTERNAL_006',
      statusCode: 504,
      message: 'External service request timeout',
      severity: 'high'
    }
  },

  // ============================================================================
  // SECURITY - Security Issues (5 codes)
  // ============================================================================
  SECURITY: {
    RATE_LIMIT_EXCEEDED: {
      code: 'SECURITY_001',
      statusCode: 429,
      message: 'Too many requests. Please try again later',
      severity: 'low'
    },
    RECAPTCHA_FAILED: {
      code: 'SECURITY_002',
      statusCode: 403,
      message: 'ReCAPTCHA verification failed',
      severity: 'medium'
    },
    IP_BLOCKED: {
      code: 'SECURITY_003',
      statusCode: 403,
      message: 'Your IP address is blocked',
      severity: 'high'
    },
    CSRF_TOKEN_INVALID: {
      code: 'SECURITY_004',
      statusCode: 403,
      message: 'CSRF token is invalid',
      severity: 'medium'
    },
    SUSPICIOUS_ACTIVITY: {
      code: 'SECURITY_005',
      statusCode: 403,
      message: 'Suspicious activity detected',
      severity: 'high'
    }
  },

  // ============================================================================
  // SERVER - Server/System Errors (6 codes)
  // ============================================================================
  SERVER: {
    INTERNAL_ERROR: {
      code: 'SERVER_001',
      statusCode: 500,
      message: 'An internal server error occurred',
      severity: 'high'
    },
    TIMEOUT: {
      code: 'SERVER_002',
      statusCode: 504,
      message: 'Request timeout. Please try again',
      severity: 'high'
    },
    BAD_REQUEST: {
      code: 'SERVER_003',
      statusCode: 400,
      message: 'Bad request',
      severity: 'low'
    },
    METHOD_NOT_ALLOWED: {
      code: 'SERVER_004',
      statusCode: 405,
      message: 'Method not allowed',
      severity: 'low'
    },
    CONFLICT: {
      code: 'SERVER_005',
      statusCode: 409,
      message: 'Resource conflict',
      severity: 'medium'
    },
    MAINTENANCE_MODE: {
      code: 'SERVER_006',
      statusCode: 503,
      message: 'Server is under maintenance. Please try again later',
      severity: 'high'
    }
  }
};

module.exports = ErrorCodes;
