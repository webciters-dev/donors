const { Application, Student, User, Document } = require('../models');
const { Op } = require('sequelize');

// Get all applications with filtering
const getAllApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      studentId,
      search,
      term
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filters
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (term) where.term = term;

    // Search filter
    if (search) {
      where[Op.or] = [
        { term: { [Op.like]: `%${search}%` } },
        { purpose: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'STUDENT' && req.user.studentId) {
      where.studentId = req.user.studentId;
    }

    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['submittedAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'university', 'field', 'gpa']
        },
        {
          model: Document,
          as: 'documents'
        }
      ]
    });

    res.json({
      applications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'role']
            }
          ]
        },
        {
          model: Document,
          as: 'documents'
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check authorization
    if (req.user.role === 'STUDENT' && req.user.studentId !== application.studentId) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Error fetching application' });
  }
};

// Create application
const createApplication = async (req, res) => {
  try {
    const applicationData = req.body;

    // Students can only create applications for themselves
    if (req.user.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.status(400).json({ message: 'Student profile required before creating application' });
      }
      applicationData.studentId = req.user.studentId;
    }

    // Validate required fields
    if (!applicationData.studentId || !applicationData.term) {
      return res.status(400).json({ message: 'Student ID and term are required' });
    }

    // Check if student exists
    const student = await Student.findByPk(applicationData.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const application = await Application.create({
      ...applicationData,
      submittedAt: new Date()
    });

    const createdApplication = await Application.findByPk(application.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'university', 'field']
        }
      ]
    });

    res.status(201).json({
      message: 'Application created successfully',
      application: createdApplication
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ message: 'Error creating application' });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check authorization
    if (req.user.role === 'STUDENT') {
      if (req.user.studentId !== application.studentId) {
        return res.status(403).json({ message: 'Not authorized to update this application' });
      }
      // Students can't update certain fields
      delete updateData.status;
      delete updateData.approvalReason;
    }

    await application.update(updateData);

    const updatedApplication = await Application.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'university', 'field']
        }
      ]
    });

    res.json({
      message: 'Application updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Error updating application' });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check authorization
    if (req.user.role === 'STUDENT') {
      if (req.user.studentId !== application.studentId) {
        return res.status(403).json({ message: 'Not authorized to delete this application' });
      }
      // Students can only delete draft applications
      if (application.status !== 'DRAFT') {
        return res.status(400).json({ message: 'Cannot delete submitted applications' });
      }
    }

    await application.destroy();

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: 'Error deleting application' });
  }
};

// Update application status (Admin only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvalReason, notes } = req.body;

    // Only admins can update status
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUB_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update application status' });
    }

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await application.update({
      status,
      approvalReason,
      notes
    });

    // If approved, update student status
    if (status === 'APPROVED') {
      await Student.update(
        { studentPhase: 'ACTIVE' },
        { where: { id: application.studentId } }
      );
    }

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
};

// Get application statistics
const getApplicationStats = async (req, res) => {
  try {
    const totalApplications = await Application.count();
    const pendingApplications = await Application.count({ where: { status: 'PENDING' } });
    const approvedApplications = await Application.count({ where: { status: 'APPROVED' } });
    const rejectedApplications = await Application.count({ where: { status: 'REJECTED' } });

    const stats = {
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      processing: await Application.count({ where: { status: 'PROCESSING' } })
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ message: 'Error fetching application statistics' });
  }
};

module.exports = {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
  getApplicationStats
};