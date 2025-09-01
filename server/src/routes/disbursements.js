import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/disbursements - List all disbursements
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, studentId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [disbursements, total] = await Promise.all([
      prisma.disbursement.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              university: true,
              program: true,
              email: true
            }
          }
        }
      }),
      prisma.disbursement.count({ where })
    ]);
    
    res.json({
      disbursements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching disbursements:', error);
    res.status(500).json({ error: 'Failed to fetch disbursements' });
  }
});

// POST /api/disbursements - Create new disbursement
router.post('/', async (req, res) => {
  try {
    const { studentId, amount, notes } = req.body;

    if (!studentId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentId, amount' 
      });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const disbursement = await prisma.disbursement.create({
      data: {
        studentId,
        amount: parseInt(amount),
        notes
      },
      include: {
        student: {
          select: {
            name: true,
            university: true,
            program: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json(disbursement);
  } catch (error) {
    console.error('Error creating disbursement:', error);
    res.status(500).json({ error: 'Failed to create disbursement' });
  }
});

// PATCH /api/disbursements/:id/status - Update disbursement status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['INITIATED', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be INITIATED, COMPLETED, or FAILED' 
      });
    }

    const disbursement = await prisma.disbursement.update({
      where: { id: req.params.id },
      data: { 
        status,
        notes: notes || null
      },
      include: {
        student: {
          select: {
            name: true,
            university: true,
            program: true,
            email: true
          }
        }
      }
    });
    
    res.json(disbursement);
  } catch (error) {
    console.error('Error updating disbursement status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Disbursement not found' });
    }
    res.status(500).json({ error: 'Failed to update disbursement status' });
  }
});

// GET /api/disbursements/:id - Get single disbursement
router.get('/:id', async (req, res) => {
  try {
    const disbursement = await prisma.disbursement.findUnique({
      where: { id: req.params.id },
      include: {
        student: true
      }
    });
    
    if (!disbursement) {
      return res.status(404).json({ error: 'Disbursement not found' });
    }
    
    res.json(disbursement);
  } catch (error) {
    console.error('Error fetching disbursement:', error);
    res.status(500).json({ error: 'Failed to fetch disbursement' });
  }
});

export default router;