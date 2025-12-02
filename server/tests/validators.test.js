/**
 * Unit Tests for Validation Middleware
 */
import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateId } from '../src/middleware/validators.js';

describe('Validation Middleware', () => {
  describe('validateEmail', () => {
    it('should return validator function', () => {
      const validator = validateEmail();
      expect(validator).toBeDefined();
      expect(typeof validator.run).toBe('function');
    });
  });
  
  describe('validatePassword', () => {
    it('should return validator function', () => {
      const validator = validatePassword();
      expect(validator).toBeDefined();
      expect(typeof validator.run).toBe('function');
    });
    
    it('should accept custom field name', () => {
      const validator = validatePassword('newPassword');
      expect(validator).toBeDefined();
    });
  });
  
  describe('validateId', () => {
    it('should return validator function for default id param', () => {
      const validator = validateId();
      expect(validator).toBeDefined();
    });
    
    it('should accept custom param name', () => {
      const validator = validateId('userId');
      expect(validator).toBeDefined();
    });
  });
});
