const express = require('express');
const {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
  getApplicationStats
} = require('../controllers/applicationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest, applicationSchema } = require('../middleware/validation');

const router = express.Router();

// Protected routes - all require authentication
router.get('/', authenticateToken, getAllApplications);
router.get('/stats', authenticateToken, authorizeRoles('ADMIN', 'SUB_ADMIN'), getApplicationStats);
router.get('/:id', authenticateToken, getApplicationById);

router.post('/', 
  authenticateToken,
  authorizeRoles('STUDENT', 'ADMIN', 'SUB_ADMIN'),
  validateRequest(applicationSchema),
  createApplication
);

router.put('/:id', 
  authenticateToken,
  authorizeRoles('STUDENT', 'ADMIN', 'SUB_ADMIN'),
  updateApplication
);

router.patch('/:id/status', 
  authenticateToken,
  authorizeRoles('ADMIN', 'SUB_ADMIN'),
  updateApplicationStatus
);

router.delete('/:id', 
  authenticateToken,
  authorizeRoles('STUDENT', 'ADMIN', 'SUB_ADMIN'),
  deleteApplication
);

module.exports = router;