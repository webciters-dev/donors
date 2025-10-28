const { Donor, User, Sponsorship, Student } = require('../models');
const { Op } = require('sequelize');

// Get all donors
const getAllDonors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      country,
      organization
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { organization: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filters
    if (country) where.country = country;
    if (organization) where.organization = { [Op.like]: `%${organization}%` };

    const { count, rows: donors } = await Donor.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role']
        },
        {
          model: Sponsorship,
          as: 'sponsorships',
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'name', 'university', 'field']
            }
          ]
        }
      ]
    });

    res.json({
      donors,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ message: 'Error fetching donors' });
  }
};

// Get donor by ID
const getDonorById = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role']
        },
        {
          model: Sponsorship,
          as: 'sponsorships',
          include: [
            {
              model: Student,
              as: 'student'
            }
          ]
        }
      ]
    });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check authorization
    if (req.user.role === 'DONOR' && req.user.donorId !== id) {
      return res.status(403).json({ message: 'Not authorized to view this donor profile' });
    }

    res.json({ donor });
  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({ message: 'Error fetching donor' });
  }
};

// Update donor profile
const updateDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUB_ADMIN') {
      if (req.user.donorId !== id) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
    }

    await donor.update(updateData);

    const updatedDonor = await Donor.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role']
        }
      ]
    });

    res.json({
      message: 'Donor profile updated successfully',
      donor: updatedDonor
    });
  } catch (error) {
    console.error('Update donor error:', error);
    res.status(500).json({ message: 'Error updating donor profile' });
  }
};

// Get donor dashboard data
const getDonorDashboard = async (req, res) => {
  try {
    const donorId = req.user.donorId;

    if (!donorId) {
      return res.status(400).json({ message: 'Donor profile not found' });
    }

    const donor = await Donor.findByPk(donorId, {
      include: [
        {
          model: Sponsorship,
          as: 'sponsorships',
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'name', 'university', 'field', 'gpa', 'studentPhase']
            }
          ]
        }
      ]
    });

    const totalSponsored = donor.sponsorships.length;
    const activeSponsored = donor.sponsorships.filter(s => s.status === 'active').length;
    const totalFunded = donor.totalFunded || 0;

    const dashboardData = {
      donor,
      stats: {
        totalSponsored,
        activeSponsored,
        totalFunded
      },
      recentSponsorships: donor.sponsorships.slice(0, 5)
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Get donor dashboard error:', error);
    res.status(500).json({ message: 'Error fetching donor dashboard' });
  }
};

// Get donor statistics
const getDonorStats = async (req, res) => {
  try {
    const totalDonors = await Donor.count();
    const activeDonors = await Donor.count({
      include: [
        {
          model: Sponsorship,
          as: 'sponsorships',
          where: { status: 'active' },
          required: true
        }
      ]
    });

    const totalFunded = await Donor.sum('totalFunded') || 0;

    const stats = {
      total: totalDonors,
      active: activeDonors,
      inactive: totalDonors - activeDonors,
      totalFunded
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get donor stats error:', error);
    res.status(500).json({ message: 'Error fetching donor statistics' });
  }
};

// Get top donors
const getTopDonors = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topDonors = await Donor.findAll({
      order: [['totalFunded', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'name', 'totalFunded', 'organization'],
      include: [
        {
          model: Sponsorship,
          as: 'sponsorships',
          attributes: ['id'],
          where: { status: 'active' },
          required: false
        }
      ]
    });

    res.json({ topDonors });
  } catch (error) {
    console.error('Get top donors error:', error);
    res.status(500).json({ message: 'Error fetching top donors' });
  }
};

module.exports = {
  getAllDonors,
  getDonorById,
  updateDonor,
  getDonorDashboard,
  getDonorStats,
  getTopDonors
};