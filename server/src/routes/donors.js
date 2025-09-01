import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/donors - List all donors
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [donors, total] = await Promise.all([
      prisma.donor.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { totalFunded: 'desc' },
        include: {
          sponsorships: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  university: true,
                  program: true,
                  sponsored: true
                }
              }
            }
          },
          _count: {
            select: {
              sponsorships: true
            }
          }
        }
      }),
      prisma.donor.count()
    ]);
    
    res.json({
      donors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

// GET /api/donors/:id - Get single donor
router.get('/:id', async (req, res) => {
  try {
    const donor = await prisma.donor.findUnique({
      where: { id: req.params.id },
      include: {
        sponsorships: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                university: true,
                program: true,
                sponsored: true,
                gradYear: true,
                gpa: true
              }
            }
          },
          orderBy: { date: 'desc' }
        }
      }
    });
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    
    res.json(donor);
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({ error: 'Failed to fetch donor' });
  }
});

// POST /api/donors - Create new donor
router.post('/', async (req, res) => {
  try {
    const { name, email, organization } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email' 
      });
    }

    const donor = await prisma.donor.create({
      data: {
        name,
        email,
        organization
      }
    });
    
    res.status(201).json(donor);
  } catch (error) {
    console.error('Error creating donor:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Donor with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create donor' });
  }
});

// GET /api/donors/:id/receipts - Get donor receipts
router.get('/:id/receipts', async (req, res) => {
  try {
    const sponsorships = await prisma.sponsorship.findMany({
      where: { donorId: req.params.id },
      include: {
        student: {
          select: {
            name: true,
            university: true,
            program: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    // Transform sponsorships into receipt format
    const receipts = sponsorships.map((sponsorship, index) => ({
      id: sponsorship.id,
      date: sponsorship.date.toISOString().split('T')[0],
      studentName: sponsorship.student.name,
      amount: sponsorship.amount,
      receiptNumber: `RCP-${sponsorship.date.getFullYear()}-${String(index + 1).padStart(4, '0')}`,
      taxYear: sponsorship.date.getFullYear()
    }));
    
    res.json({ receipts });
  } catch (error) {
    console.error('Error fetching donor receipts:', error);
    res.status(500).json({ error: 'Failed to fetch donor receipts' });
  }
});

// GET /api/donors/:id/sponsorships - Get donor sponsorships
router.get('/:id/sponsorships', async (req, res) => {
  try {
    const sponsorships = await prisma.sponsorship.findMany({
      where: { donorId: req.params.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            program: true,
            sponsored: true,
            gradYear: true,
            gpa: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json({ sponsorships });
  } catch (error) {
    console.error('Error fetching donor sponsorships:', error);
    res.status(500).json({ error: 'Failed to fetch donor sponsorships' });
  }
});

export default router;