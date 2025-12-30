/**
 * Input Validation Middleware
 * Uses express-validator for comprehensive request validation
 * 
 * Usage:
 *   import { validateRegistration, handleValidationErrors } from './middleware/validators.js';
 *   
 *   router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
 *     // Request is validated - safe to use req.body
 *   });
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 * Place this after validation chains
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// ============================================================================
// COMMON VALIDATION RULES
// ============================================================================

/**
 * Email validation
 */
export const validateEmail = () => 
  body('email')
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    // .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters');

/**
 * Password validation
 */
export const validatePassword = (field = 'password') =>
  body(field)
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number');

/**
 * Name validation (first/last name)
 */
export const validateName = (field) =>
  body(field)
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ min: 2, max: 100 }).withMessage(`${field} must be 2-100 characters`)
    .matches(/^[a-zA-Z\s'-]+$/).withMessage(`${field} must contain only letters, spaces, hyphens, and apostrophes`);

/**
 * Phone number validation
 */
export const validatePhone = (field = 'phone', optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  return validator
    .trim()
    .matches(/^[\d\s()+-]+$/).withMessage('Phone number contains invalid characters')
    .isLength({ min: 10, max: 20 }).withMessage('Phone number must be 10-20 characters');
};

/**
 * ID validation (numeric)
 */
export const validateId = (paramName = 'id') =>
  param(paramName)
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
    .toInt();

/**
 * Date validation
 */
export const validateDate = (field) =>
  body(field)
    .isISO8601().withMessage('Must be a valid date (ISO 8601 format)')
    .toDate();

/**
 * URL validation
 */
export const validateUrl = (field, optional = false) => {
  const validator = optional ? body(field).optional() : body(field);
  return validator
    .trim()
    .isURL().withMessage('Must be a valid URL');
};

/**
 * Enum validation
 */
export const validateEnum = (field, allowedValues) =>
  body(field)
    .isIn(allowedValues).withMessage(`Must be one of: ${allowedValues.join(', ')}`);

// ============================================================================
// AUTH VALIDATION RULES
// ============================================================================

export const validateRegistration = [
  validateEmail(),
  validatePassword(),
  body('role')
    .optional()
    .isIn(['STUDENT', 'DONOR', 'ADMIN', 'SUB_ADMIN', 'CASE_WORKER', 'SUPER_ADMIN'])
    .withMessage('Invalid role'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters')
];

export const validateLogin = [
  validateEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

export const validatePasswordReset = [
  validateEmail()
];

export const validatePasswordResetConfirm = [
  body('token')
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 32, max: 64 }).withMessage('Invalid token format'),
  validatePassword('password')
];

// ============================================================================
// STUDENT VALIDATION RULES
// ============================================================================

export const validateStudentCreate = [
  validateName('firstName'),
  validateName('lastName'),
  validateEmail(),
  validatePhone('phone', true),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date')
    .toDate(),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Gender must be MALE, FEMALE, or OTHER'),
  body('province')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Province must not exceed 100 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City must not exceed 100 characters')
];

export const validateStudentUpdate = [
  validateId(),
  validateName('firstName').optional(),
  validateName('lastName').optional(),
  validateEmail().optional(),
  validatePhone('phone', true),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date')
    .toDate(),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Gender must be MALE, FEMALE, or OTHER')
];

// ============================================================================
// DONOR VALIDATION RULES
// ============================================================================

export const validateDonorCreate = [
  validateName('firstName'),
  validateName('lastName'),
  validateEmail(),
  validatePhone('phone', true),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters')
];

// ============================================================================
// APPLICATION VALIDATION RULES
// ============================================================================

export const validateApplicationCreate = [
  body('studentId')
    .isInt({ min: 1 }).withMessage('Student ID must be a positive integer')
    .toInt(),
  body('degreeLevel')
    .isIn(['BACHELORS', 'MASTERS', 'PHD']).withMessage('Degree level must be BACHELORS, MASTERS, or PHD'),
  body('fieldOfStudy')
    .trim()
    .notEmpty().withMessage('Field of study is required')
    .isLength({ max: 200 }).withMessage('Field of study must not exceed 200 characters'),
  body('universityName')
    .trim()
    .notEmpty().withMessage('University name is required')
    .isLength({ max: 200 }).withMessage('University name must not exceed 200 characters'),
  body('tuitionAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tuition amount must be a positive number')
    .toFloat()
];

export const validateApplicationStatus = [
  validateId(),
  body('status')
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'INTERVIEW'])
    .withMessage('Status must be PENDING, APPROVED, REJECTED, or INTERVIEW')
];

// ============================================================================
// SPONSORSHIP VALIDATION RULES
// ============================================================================

export const validateSponsorshipCreate = [
  body('donorId')
    .isInt({ min: 1 }).withMessage('Donor ID must be a positive integer')
    .toInt(),
  body('studentId')
    .isInt({ min: 1 }).withMessage('Student ID must be a positive integer')
    .toInt(),
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
    .toFloat(),
  body('startDate')
    .isISO8601().withMessage('Start date must be a valid date')
    .toDate(),
  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
    .toDate()
];

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sortBy')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Sort field must not exceed 50 characters'),
  query('order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Order must be asc or desc')
];

// ============================================================================
// EXPORT ALL VALIDATORS
// ============================================================================

export default {
  handleValidationErrors,
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateId,
  validateDate,
  validateUrl,
  validateEnum,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateStudentCreate,
  validateStudentUpdate,
  validateDonorCreate,
  validateApplicationCreate,
  validateApplicationStatus,
  validateSponsorshipCreate,
  validatePagination
};
