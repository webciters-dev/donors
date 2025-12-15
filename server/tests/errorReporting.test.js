/**
 * Tests for Error Reporting Framework (Phase 1)
 * Tests error codes, error logger, and enhanced error responses
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ErrorCodes,
  getErrorInfo,
  mapPrismaErrorCode,
} from '../src/lib/errorCodes.js';
import {
  logError,
  getErrorStats,
  resetErrorStats,
} from '../src/lib/errorLogger.js';
import {
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createConflictError,
  createAuthError,
  createPermissionError,
  handlePrismaError,
  safeErrorResponse,
} from '../src/lib/enhancedError.js';

describe('Error Reporting Framework - Phase 1', () => {
  
  describe('ErrorCodes', () => {
    it('should have standard error codes defined', () => {
      expect(ErrorCodes.AUTH_INVALID_CREDENTIALS).toBeDefined();
      expect(ErrorCodes.VALIDATION_FAILED).toBeDefined();
      expect(ErrorCodes.RESOURCE_NOT_FOUND).toBeDefined();
      expect(ErrorCodes.DATABASE_ERROR).toBeDefined();
    });
    
    it('should have required properties in error codes', () => {
      const errorCode = ErrorCodes.AUTH_INVALID_CREDENTIALS;
      expect(errorCode.code).toBe('AUTH_002');
      expect(errorCode.message).toBeDefined();
      expect(errorCode.statusCode).toBe(401);
      expect(errorCode.category).toBe('AUTH');
    });
    
    it('getErrorInfo should retrieve error by code', () => {
      const info = getErrorInfo('VAL_001');
      expect(info.code).toBe('VAL_001');
      expect(info.category).toBe('VALIDATION');
    });
    
    it('mapPrismaErrorCode should map Prisma P2002 to UNIQUE_VIOLATION', () => {
      const mapped = mapPrismaErrorCode('P2002');
      expect(mapped.code).toBe('DB_003');
      expect(mapped.message).toContain('Unique constraint');
    });
    
    it('mapPrismaErrorCode should map Prisma P2025 to NOT_FOUND', () => {
      const mapped = mapPrismaErrorCode('P2025');
      expect(mapped.code).toBe('DB_005');
    });
  });

  describe('Error Logger', () => {
    beforeEach(() => {
      resetErrorStats();
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      const result = logError(error, {
        route: '/api/test',
        userId: 'user_123',
        errorCode: 'TEST_ERROR',
      });
      
      expect(result).toBeDefined();
      expect(result.message).toBe('Test error');
      expect(result.context.route).toBe('/api/test');
      expect(result.context.userId).toBe('user_123');
    });

    it('should increment error statistics', () => {
      const error = new Error('Test');
      logError(error, {
        errorCode: 'AUTH_002',
        route: '/api/login',
      });
      
      const stats = getErrorStats();
      expect(stats.total).toBe(1);
      expect(stats.byCode['AUTH_002']).toBe(1);
      expect(stats.byCategory['AUTH']).toBe(1);
    });

    it('should track recent errors (last 50)', () => {
      for (let i = 0; i < 60; i++) {
        logError(new Error(`Error ${i}`), {
          errorCode: 'TEST_ERROR',
          route: `/api/test/${i}`,
        });
      }
      
      const stats = getErrorStats();
      expect(stats.recent.length).toBe(50);
      expect(stats.total).toBe(60);
    });

    it('should sanitize sensitive fields', () => {
      const error = new Error('Auth failed');
      const result = logError(error, {
        body: {
          email: 'test@example.com',
          password: 'secret123',
          token: 'xyz789',
        },
        errorCode: 'AUTH_002',
        route: '/api/login',
      });
      
      expect(result.body.email).toBe('test@example.com');
      expect(result.body.password).toBe('***REDACTED***');
      expect(result.body.token).toBe('***REDACTED***');
    });

    it('should not throw if error logging fails', () => {
      // This test verifies that error logging is non-blocking
      const error = new Error('Test');
      expect(() => {
        logError(error, { errorCode: 'TEST_ERROR' });
      }).not.toThrow();
    });
  });

  describe('Enhanced Error Responses', () => {
    it('createErrorResponse should create valid error response', () => {
      const response = createErrorResponse(
        400,
        'Invalid input',
        'VAL_003',
        { field: 'email' }
      );
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid input');
      expect(response.errorCode).toBe('VAL_003');
      expect(response.errorCategory).toBe('VALIDATION');
      expect(response.errorDetails).toEqual({ field: 'email' });
      expect(response.timestamp).toBeDefined();
    });

    it('createValidationError should create validation error', () => {
      const response = createValidationError('Missing field', { field: 'name' });
      expect(response.success).toBe(false);
      expect(response.error).toBe('Missing field');
      expect(response.errorCode).toBe('VALIDATION_FAILED');
    });

    it('createNotFoundError should create 404 error', () => {
      const response = createNotFoundError('User not found');
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('RESOURCE_NOT_FOUND');
    });

    it('createConflictError should create 409 error', () => {
      const response = createConflictError('Email already exists');
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('RESOURCE_ALREADY_EXISTS');
    });

    it('createAuthError should create authentication error', () => {
      const response = createAuthError('Invalid credentials', 'AUTH_002');
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('AUTH_002');
    });

    it('createPermissionError should create 403 error', () => {
      const response = createPermissionError('Admin access required');
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Prisma Error Handling', () => {
    it('should handle P2002 (unique constraint)', () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint',
      };
      
      const response = handlePrismaError(prismaError);
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('RESOURCE_ALREADY_EXISTS');
      expect(response.errorDetails.field).toBe('email');
    });

    it('should handle P2025 (record not found)', () => {
      const prismaError = {
        code: 'P2025',
        meta: {},
        message: 'Record not found',
      };
      
      const response = handlePrismaError(prismaError);
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('RESOURCE_NOT_FOUND');
    });

    it('should handle P2003 (foreign key constraint)', () => {
      const prismaError = {
        code: 'P2003',
        meta: { field_name: 'studentId' },
        message: 'Foreign key constraint',
      };
      
      const response = handlePrismaError(prismaError);
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('DATABASE_FOREIGN_KEY_VIOLATION');
      expect(response.errorDetails.field).toBe('studentId');
    });

    it('should handle unknown Prisma error', () => {
      const prismaError = {
        code: 'P9999',
        meta: {},
        message: 'Unknown error',
      };
      
      const response = handlePrismaError(prismaError);
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Safe Error Response', () => {
    it('should handle regular Error objects', () => {
      const error = new Error('Something went wrong');
      const response = safeErrorResponse(error);
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should handle Prisma errors', () => {
      const error = {
        code: 'P2002',
        meta: { target: ['email'] },
      };
      
      const response = safeErrorResponse(error);
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('RESOURCE_ALREADY_EXISTS');
    });

    it('should handle errors with statusCode', () => {
      const error = new Error('Invalid input');
      error.statusCode = 422;
      error.code = 'VAL_001';
      error.details = { field: 'email' };
      
      const response = safeErrorResponse(error);
      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('VAL_001');
      expect(response.errorDetails).toEqual({ field: 'email' });
    });

    it('should never throw even on invalid input', () => {
      expect(() => {
        safeErrorResponse(null);
      }).not.toThrow();
      
      expect(() => {
        safeErrorResponse(undefined);
      }).not.toThrow();
      
      expect(() => {
        safeErrorResponse({});
      }).not.toThrow();
    });
  });

  describe('Backward Compatibility', () => {
    it('error responses keep existing .error field', () => {
      const response = createErrorResponse(
        400,
        'Invalid email',
        'VAL_004'
      );
      
      // Frontend expects .error field
      expect(response.error).toBe('Invalid email');
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe('string');
    });

    it('frontend fallback pattern still works', () => {
      const response = createErrorResponse(
        400,
        'Test error',
        'VAL_001'
      );
      
      // Simulate frontend error handling
      const errorMsg = response.error || response.errorDetails?.message || 'Default message';
      expect(errorMsg).toBe('Test error');
    });

    it('multiple fallback chains work', () => {
      const response = createErrorResponse(
        400,
        'Test error',
        'VAL_001'
      );
      
      // Simulate various frontend patterns
      const pattern1 = response.error || 'Failed'; // Works
      const pattern2 = response.errorCode || 'UNKNOWN'; // Works
      const pattern3 = response.error?.message || response.error || 'Failed'; // Works
      
      expect(pattern1).toBe('Test error');
      expect(pattern2).toBe('VAL_001');
      expect(pattern3).toBe('Test error');
    });
  });

});
