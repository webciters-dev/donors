const express = require('express');
const { register, login, getProfile, changePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;