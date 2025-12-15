/**
 * Standard Error Codes and Types
 * Used for consistent error identification across the application
 * 
 * Format: ERROR_TYPE_CATEGORY
 * Categories: AUTH, VALIDATION, DATABASE, BUSINESS, SERVER, EXTERNAL
 */

export const ErrorCodes = {
  // Authentication & Authorization Errors (1xxx)
  AUTH_MISSING_CREDENTIALS: {
    code: 'AUTH_001',
    message: 'Email and password are required',
    statusCode: 400,
    category: 'AUTH'
  },
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_002',
    message: 'Invalid email or password',
    statusCode: 401,
    category: 'AUTH'
  },
  AUTH_INVALID_TOKEN: {
    code: 'AUTH_003',
    message: 'Invalid or expired authentication token',
    statusCode: 401,
    category: 'AUTH'
  },
  AUTH_INSUFFICIENT_PERMISSIONS: {
    code: 'AUTH_004',
    message: 'Insufficient permissions for this operation',
    statusCode: 403,
    category: 'AUTH'
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_005',
    message: 'Authentication required',
    statusCode: 401,
    category: 'AUTH'
  },

  // Validation Errors (2xxx)
  VALIDATION_FAILED: {
    code: 'VAL_001',
    message: 'Validation failed',
    statusCode: 422,
    category: 'VALIDATION'
  },
  VALIDATION_MISSING_FIELD: {
    code: 'VAL_002',
    message: 'Required field is missing',
    statusCode: 400,
    category: 'VALIDATION'
  },
  VALIDATION_INVALID_FORMAT: {
    code: 'VAL_003',
    message: 'Invalid format provided',
    statusCode: 400,
    category: 'VALIDATION'
  },
  VALIDATION_INVALID_EMAIL: {
    code: 'VAL_004',
    message: 'Invalid email format',
    statusCode: 400,
    category: 'VALIDATION'
  },
  VALIDATION_INVALID_ROLE: {
    code: 'VAL_005',
    message: 'Invalid role specified',
    statusCode: 400,
    category: 'VALIDATION'
  },

  // Resource Errors (3xxx)
  RESOURCE_NOT_FOUND: {
    code: 'RES_001',
    message: 'Resource not found',
    statusCode: 404,
    category: 'RESOURCE'
  },
  RESOURCE_ALREADY_EXISTS: {
    code: 'RES_002',
    message: 'Resource already exists',
    statusCode: 409,
    category: 'RESOURCE'
  },
  RESOURCE_DUPLICATE: {
    code: 'RES_003',
    message: 'Duplicate resource',
    statusCode: 409,
    category: 'RESOURCE'
  },
  RESOURCE_IN_USE: {
    code: 'RES_004',
    message: 'Resource is currently in use',
    statusCode: 409,
    category: 'RESOURCE'
  },

  // Database Errors (4xxx)
  DATABASE_ERROR: {
    code: 'DB_001',
    message: 'Database operation failed',
    statusCode: 500,
    category: 'DATABASE'
  },
  DATABASE_CONSTRAINT_VIOLATION: {
    code: 'DB_002',
    message: 'Database constraint violation',
    statusCode: 409,
    category: 'DATABASE'
  },
  DATABASE_UNIQUE_VIOLATION: {
    code: 'DB_003',
    message: 'Unique constraint violation',
    statusCode: 409,
    category: 'DATABASE'
  },
  DATABASE_FOREIGN_KEY_VIOLATION: {
    code: 'DB_004',
    message: 'Foreign key constraint violation',
    statusCode: 400,
    category: 'DATABASE'
  },
  DATABASE_RECORD_NOT_FOUND: {
    code: 'DB_005',
    message: 'Record not found in database',
    statusCode: 404,
    category: 'DATABASE'
  },

  // Business Logic Errors (5xxx)
  BUSINESS_INVALID_STATE: {
    code: 'BUS_001',
    message: 'Invalid operation for current state',
    statusCode: 400,
    category: 'BUSINESS'
  },
  BUSINESS_ALREADY_PROCESSED: {
    code: 'BUS_002',
    message: 'Operation already processed',
    statusCode: 409,
    category: 'BUSINESS'
  },
  BUSINESS_PREREQUISITE_NOT_MET: {
    code: 'BUS_003',
    message: 'Prerequisite for operation not met',
    statusCode: 400,
    category: 'BUSINESS'
  },
  BUSINESS_INSUFFICIENT_DATA: {
    code: 'BUS_004',
    message: 'Insufficient data to complete operation',
    statusCode: 400,
    category: 'BUSINESS'
  },
  BUSINESS_LIMIT_EXCEEDED: {
    code: 'BUS_005',
    message: 'Operation limit exceeded',
    statusCode: 429,
    category: 'BUSINESS'
  },

  // File/Media Errors (6xxx)
  FILE_UPLOAD_FAILED: {
    code: 'FILE_001',
    message: 'File upload failed',
    statusCode: 400,
    category: 'FILE'
  },
  FILE_SIZE_EXCEEDED: {
    code: 'FILE_002',
    message: 'File size exceeds maximum limit',
    statusCode: 413,
    category: 'FILE'
  },
  FILE_INVALID_TYPE: {
    code: 'FILE_003',
    message: 'Invalid file type',
    statusCode: 400,
    category: 'FILE'
  },
  FILE_NOT_FOUND: {
    code: 'FILE_004',
    message: 'File not found',
    statusCode: 404,
    category: 'FILE'
  },

  // External Service Errors (7xxx)
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXT_001',
    message: 'External service error',
    statusCode: 502,
    category: 'EXTERNAL'
  },
  EXTERNAL_SERVICE_TIMEOUT: {
    code: 'EXT_002',
    message: 'External service timeout',
    statusCode: 504,
    category: 'EXTERNAL'
  },
  RECAPTCHA_VERIFICATION_FAILED: {
    code: 'EXT_003',
    message: 'reCAPTCHA verification failed',
    statusCode: 400,
    category: 'EXTERNAL'
  },
  PAYMENT_PROCESSING_FAILED: {
    code: 'EXT_004',
    message: 'Payment processing failed',
    statusCode: 402,
    category: 'EXTERNAL'
  },

  // Server/Internal Errors (8xxx)
  INTERNAL_SERVER_ERROR: {
    code: 'SRV_001',
    message: 'Internal server error',
    statusCode: 500,
    category: 'SERVER'
  },
  CONFIGURATION_ERROR: {
    code: 'SRV_002',
    message: 'Configuration error',
    statusCode: 500,
    category: 'SERVER'
  },
  INITIALIZATION_ERROR: {
    code: 'SRV_003',
    message: 'Initialization error',
    statusCode: 500,
    category: 'SERVER'
  },
};

/**
 * Get error info by code
 */
export function getErrorInfo(errorCode) {
  for (const [, errorInfo] of Object.entries(ErrorCodes)) {
    if (errorInfo.code === errorCode) {
      return errorInfo;
    }
  }
  return ErrorCodes.INTERNAL_SERVER_ERROR;
}

/**
 * Map Prisma error codes to our error codes
 */
export function mapPrismaErrorCode(prismaCode) {
  const mapping = {
    'P2002': ErrorCodes.DATABASE_UNIQUE_VIOLATION,
    'P2003': ErrorCodes.DATABASE_FOREIGN_KEY_VIOLATION,
    'P2014': ErrorCodes.DATABASE_FOREIGN_KEY_VIOLATION,
    'P2025': ErrorCodes.DATABASE_RECORD_NOT_FOUND,
  };
  return mapping[prismaCode] || ErrorCodes.DATABASE_ERROR;
}

export default ErrorCodes;
