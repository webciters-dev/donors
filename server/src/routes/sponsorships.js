import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/sponsorships - List all sponsorships
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, donorId, studentId } = req.query;
    
    const where = {};
    if (donorId) where.donorId = donorId;
    if (studentId) where.studentId = studentId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sponsorships, total] = await Promise.all([
      prisma.sponsorship.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: {
          donor: {
            select: {
              id: true,
              name: true,
              email: true,
              organization: true
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              university: true,
              program: true,
              gpa: true,
              gradYear: true
            }
          }
        }
      }),
      prisma.sponsorship.count({ where })
    ]);
    
    res.json({
      sponsorships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching sponsorships:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// POST /api/sponsorships - Create new sponsorship
router.post('/', async (req, res) => {
  try {
    const { donorId, studentId, amount } = req.body;

    if (!donorId || !studentId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: donorId, studentId, amount' 
      });
    }

    // Check if student exists and is not already sponsored
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.sponsored) {
      return res.status(400).json({ error: 'Student is already sponsored' });
    }

    // Check if donor exists
    const donor = await prisma.donor.findUnique({
      where: { id: donorId }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Create sponsorship and update related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the sponsorship
      const sponsorship = await tx.sponsorship.create({
        data: {
          donorId,
          studentId,
          amount: parseInt(amount)
        },
        include: {
          donor: {
            select: {
              name: true,
              organization: true
            }
          },
          student: {
            select: {
              name: true,
              university: true,
              program: true
            }
          }
        }
      });

      // Mark student as sponsored
      await tx.student.update({
        where: { id: studentId },
        data: { sponsored: true }
      });

      // Update donor's total funded amount
      await tx.donor.update({
        where: { id: donorId },
        data: {
          totalFunded: {
            increment: parseInt(amount)
          }
        }
      });

      return sponsorship;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to create sponsorship' });
  }
});

// GET /api/sponsorships/:id - Get single sponsorship
router.get('/:id', async (req, res) => {
  try {
    const sponsorship = await prisma.sponsorship.findUnique({
      where: { id: req.params.id },
      include: {
        donor: true,
        student: true
      }
    });
    
    if (!sponsorship) {
      return res.status(404).json({ error: 'Sponsorship not found' });
    }
    
    res.json(sponsorship);
  } catch (error) {
    console.error('Error fetching sponsorship:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorship' });
  }
});

export default router;