import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/students - List all students with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      program, 
      gender, 
      province, 
      city, 
      sponsored,
      maxBudget,
      page = 1, 
      limit = 20 
    } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { university: { contains: search, mode: 'insensitive' } },
        { program: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (program) where.program = program;
    if (gender) where.gender = gender;
    if (province) where.province = province;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (sponsored !== undefined) where.sponsored = sponsored === 'true';
    if (maxBudget) where.needUSD = { lte: parseInt(maxBudget) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          sponsorships: {
            include: {
              donor: {
                select: { name: true, organization: true }
              }
            }
          }
        }
      }),
      prisma.student.count({ where })
    ]);
    
    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id - Get single student
router.get('/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          orderBy: { submittedAt: 'desc' }
        },
        sponsorships: {
          include: {
            donor: {
              select: { name: true, organization: true, email: true }
            }
          }
        },
        disbursements: {
          orderBy: { date: 'desc' }
        }
      }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/students - Create new student
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      gender,
      university,
      field,
      program,
      gpa,
      gradYear,
      city,
      province,
      needUSD
    } = req.body;

    // Validate required fields
    if (!name || !email || !university || !program) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, university, program' 
      });
    }

    const student = await prisma.student.create({
      data: {
        name,
        email,
        gender,
        university,
        field,
        program,
        gpa: parseFloat(gpa),
        gradYear: parseInt(gradYear),
        city,
        province,
        needUSD: parseInt(needUSD)
      }
    });
    
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Student with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
  try {
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: req.body
    });
    
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(500).json({ error: 'Failed to update student' });
  }
});

export default router;