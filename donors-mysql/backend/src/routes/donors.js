const express = require('express');
const {
  getAllDonors,
  getDonorById,
  updateDonor,
  getDonorDashboard,
  getDonorStats,
  getTopDonors
} = require('../controllers/donorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Protected routes - require authentication
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'SUB_ADMIN'), getAllDonors);
router.get('/stats', authenticateToken, authorizeRoles('ADMIN', 'SUB_ADMIN'), getDonorStats);
router.get('/top', authenticateToken, authorizeRoles('ADMIN', 'SUB_ADMIN'), getTopDonors);
router.get('/dashboard', authenticateToken, authorizeRoles('DONOR'), getDonorDashboard);
router.get('/:id', authenticateToken, getDonorById);

router.put('/:id', 
  authenticateToken,
  authorizeRoles('DONOR', 'ADMIN', 'SUB_ADMIN'),
  updateDonor
);

module.exports = router;