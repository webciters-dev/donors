const { Student, User, Application, Document } = require('../models');
const { Op } = require('sequelize');

// Get all students with filtering
const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      field,
      university,
      sponsored,
      studentPhase,
      minGPA,
      maxGPA
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { university: { [Op.like]: `%${search}%` } },
        { field: { [Op.like]: `%${search}%` } }
      ];
    }

    // Field filters
    if (field) where.field = field;
    if (university) where.university = university;
    if (sponsored !== undefined) where.sponsored = sponsored === 'true';
    if (studentPhase) where.studentPhase = studentPhase;
    if (minGPA) where.gpa = { [Op.gte]: parseFloat(minGPA) };
    if (maxGPA) where.gpa = { ...where.gpa, [Op.lte]: parseFloat(maxGPA) };

    const { count, rows: students } = await Student.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role']
        }
      ]
    });

    res.json({
      students,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role']
        },
        {
          model: Application,
          as: 'applications',
          order: [['createdAt', 'DESC']]
        },
        {
          model: Document,
          as: 'documents'
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Error fetching student' });
  }
};

// Create student profile
const createStudent = async (req, res) => {
  try {
    const studentData = req.body;
    
    // Check if user is authorized
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUB_ADMIN') {
      // Students can only create their own profile
      if (req.user.role === 'STUDENT' && req.user.studentId) {
        return res.status(409).json({ message: 'Student profile already exists' });
      }
    }

    const student = await Student.create(studentData);

    // Link to user if student role
    if (req.user.role === 'STUDENT' && !req.user.studentId) {
      await req.user.update({ studentId: student.id });
    }

    res.status(201).json({ 
      message: 'Student profile created successfully',
      student 
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Error creating student profile' });
  }
};

// Update student profile
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUB_ADMIN') {
      if (req.user.studentId !== id) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
    }

    await student.update(updateData);

    res.json({ 
      message: 'Student profile updated successfully',
      student 
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Error updating student profile' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Only admins can delete
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete students' });
    }

    await student.destroy();

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ where: { studentPhase: 'ACTIVE' } });
    const sponsoredStudents = await Student.count({ where: { sponsored: true } });
    const graduatedStudents = await Student.count({ where: { studentPhase: 'GRADUATED' } });

    const stats = {
      total: totalStudents,
      active: activeStudents,
      sponsored: sponsoredStudents,
      graduated: graduatedStudents,
      unsponsored: totalStudents - sponsoredStudents
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ message: 'Error fetching student statistics' });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
};