import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/applications - List all applications with filtering
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { submittedAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              program: true,
              gpa: true,
              gradYear: true
            }
          }
        }
      }),
      prisma.application.count({ where })
    ]);
    
    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /api/applications - Create new application
router.post('/', async (req, res) => {
  try {
    const { studentId, term, needUSD, notes, fxRate } = req.body;

    if (!studentId || !term || !needUSD) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentId, term, needUSD' 
      });
    }

    const application = await prisma.application.create({
      data: {
        studentId,
        term,
        needUSD: parseInt(needUSD),
        notes,
        fxRate: fxRate ? parseFloat(fxRate) : null
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            university: true,
            program: true
          }
        }
      }
    });
    
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /api/applications/:id/status - Update application status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be PENDING, PROCESSING, APPROVED, or REJECTED' 
      });
    }

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { 
        status,
        notes: notes || null
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            university: true,
            program: true
          }
        }
      }
    });
    
    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// GET /api/applications/:id - Get single application
router.get('/:id', async (req, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        student: true
      }
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

export default router;