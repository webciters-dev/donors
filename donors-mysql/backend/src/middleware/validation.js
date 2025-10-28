const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Common validation schemas
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('STUDENT', 'DONOR').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const studentProfileSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  university: Joi.string().required(),
  field: Joi.string().required(),
  program: Joi.string().required(),
  gpa: Joi.number().min(0).max(4).required(),
  gradYear: Joi.number().integer().min(2020).max(2030).required(),
  city: Joi.string().optional(),
  country: Joi.string().required(),
  province: Joi.string().optional(),
  needUSD: Joi.number().integer().min(0).required(),
  cnic: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  guardianName: Joi.string().optional(),
  guardianCnic: Joi.string().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional()
});

const applicationSchema = Joi.object({
  term: Joi.string().required(),
  amount: Joi.number().integer().min(0).optional(),
  needUSD: Joi.number().integer().min(0).optional(),
  tuitionFee: Joi.number().integer().min(0).optional(),
  hostelFee: Joi.number().integer().min(0).optional(),
  otherExpenses: Joi.number().integer().min(0).optional(),
  familyIncome: Joi.number().integer().min(0).optional(),
  familyContribution: Joi.number().integer().min(0).optional(),
  purpose: Joi.string().optional()
});

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
  studentProfileSchema,
  applicationSchema
};