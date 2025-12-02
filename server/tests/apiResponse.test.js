/**
 * Unit Tests for API Response Utilities
 */
import { describe, it, expect } from 'vitest';
import {
  ApiError,
  formatErrorResponse,
  formatSuccessResponse,
  ErrorCodes,
} from '../src/lib/apiResponse.js';

describe('API Response Utilities', () => {
  describe('ApiError', () => {
    it('should create an ApiError with statusCode and message', () => {
      const error = new ApiError(400, 'Bad request');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.details).toBeNull();
    });
    
    it('should create an ApiError with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ApiError(422, 'Validation failed', details);
      
      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual(details);
    });
  });
  
  describe('formatErrorResponse', () => {
    it('should format basic error response', () => {
      const response = formatErrorResponse(404, 'Not found');
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe(404);
      expect(response.error.message).toBe('Not found');
      expect(response.timestamp).toBeDefined();
    });
    
    it('should include details when provided', () => {
      const details = { userId: 123 };
      const response = formatErrorResponse(404, 'User not found', details);
      
      expect(response.error.details).toEqual(details);
    });
  });
  
  describe('formatSuccessResponse', () => {
    it('should format basic success response', () => {
      const data = { id: 1, name: 'Test' };
      const response = formatSuccessResponse(data);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });
    
    it('should include message and meta when provided', () => {
      const data = [1, 2, 3];
      const meta = { total: 3, page: 1 };
      const response = formatSuccessResponse(data, 'Success', meta);
      
      expect(response.message).toBe('Success');
      expect(response.meta).toEqual(meta);
    });
  });
  
  describe('ErrorCodes', () => {
    it('should have standard error codes', () => {
      expect(ErrorCodes.BAD_REQUEST).toEqual({ code: 400, message: 'Bad request' });
      expect(ErrorCodes.UNAUTHORIZED).toEqual({ code: 401, message: 'Unauthorized' });
      expect(ErrorCodes.NOT_FOUND).toEqual({ code: 404, message: 'Resource not found' });
      expect(ErrorCodes.INTERNAL_ERROR).toEqual({ code: 500, message: 'Internal server error' });
    });
  });
});
