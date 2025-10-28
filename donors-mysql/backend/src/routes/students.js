const express = require('express');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
} = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest, studentProfileSchema } = require('../middleware/validation');

const router = express.Router();

// Public routes (for donor browsing)
router.get('/', getAllStudents);
router.get('/stats', getStudentStats);
router.get('/:id', getStudentById);

// Protected routes
router.post('/', 
  authenticateToken, 
  authorizeRoles('STUDENT', 'ADMIN', 'SUB_ADMIN'),
  validateRequest(studentProfileSchema),
  createStudent
);

router.put('/:id', 
  authenticateToken,
  authorizeRoles('STUDENT', 'ADMIN', 'SUB_ADMIN'),
  updateStudent
);

router.delete('/:id', 
  authenticateToken,
  authorizeRoles('ADMIN'),
  deleteStudent
);

module.exports = router;