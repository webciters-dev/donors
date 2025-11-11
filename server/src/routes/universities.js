// server/src/routes/universities.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get universities for a specific country (public endpoint for dropdowns)
router.get('/countries/:country', async (req, res) => {
  try {
    const { country } = req.params;
    
    // Get official universities for this country
    const universities = await prisma.university.findMany({
      where: {
        country: country,
        isOfficial: true
      },
      select: {
        id: true,
        name: true,
        country: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ universities });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Get custom universities pending approval (admin only)
router.get('/custom/pending', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const customUniversities = await prisma.university.findMany({
      where: {
        isCustom: true,
        isOfficial: false
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        applications: {
          select: {
            id: true,
            submittedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ customUniversities });
  } catch (error) {
    console.error('Error fetching custom universities:', error);
    res.status(500).json({ error: 'Failed to fetch custom universities' });
  }
});

// Promote custom university to official (admin only)
router.post('/custom/:universityId/promote', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { universityId } = req.params;
    const adminId = req.user.id;

    const university = await prisma.university.update({
      where: { id: universityId },
      data: {
        isOfficial: true,
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });

    res.json({ 
      message: 'University promoted to official dropdown',
      university 
    });
  } catch (error) {
    console.error('Error promoting university:', error);
    res.status(500).json({ error: 'Failed to promote university' });
  }
});

// Create or get university (used internally when students submit forms)
router.post('/create-or-get', async (req, res) => {
  try {
    const { name, country, isCustom = false, submittedBy = null } = req.body;

    if (!name || !country) {
      return res.status(400).json({ error: 'Name and country are required' });
    }

    // Try to find existing university
    let university = await prisma.university.findUnique({
      where: {
        name_country: {
          name: name,
          country: country
        }
      }
    });

    // If not found, create new one
    if (!university) {
      university = await prisma.university.create({
        data: {
          name,
          country,
          isCustom,
          isOfficial: !isCustom, // Official if not custom
          submittedBy
        }
      });
    }

    res.json({ university });
  } catch (error) {
    console.error('Error creating/getting university:', error);
    res.status(500).json({ error: 'Failed to create/get university' });
  }
});

// Get all universities (admin only)
router.get('/all', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const universities = await prisma.university.findMany({
      include: {
        _count: {
          select: {
            students: true,
            applications: true
          }
        }
      },
      orderBy: [
        { country: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ universities });
  } catch (error) {
    console.error('Error fetching all universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Delete university (admin only) - only if no students/applications reference it
router.delete('/:universityId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { universityId } = req.params;

    // Check if any students or applications reference this university
    const referencedCount = await prisma.university.findUnique({
      where: { id: universityId },
      include: {
        _count: {
          select: {
            students: true,
            applications: true
          }
        }
      }
    });

    if (!referencedCount) {
      return res.status(404).json({ error: 'University not found' });
    }

    if (referencedCount._count.students > 0 || referencedCount._count.applications > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete university with existing students or applications' 
      });
    }

    await prisma.university.delete({
      where: { id: universityId }
    });

    res.json({ message: 'University deleted successfully' });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({ error: 'Failed to delete university' });
  }
});

// ===== UNIVERSITY-SPECIFIC ACADEMIC ENDPOINTS =====

// Get degree levels offered by a specific university
router.get('/:universityId/degree-levels', async (req, res) => {
  try {
    const { universityId } = req.params;

    // Verify university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId }
    });

    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    const degreeLevels = await prisma.universityDegreeLevel.findMany({
      where: { universityId },
      select: {
        id: true,
        degreeLevel: true
      },
      orderBy: {
        degreeLevel: 'asc'
      }
    });

    res.json({ degreeLevels: degreeLevels.map(dl => dl.degreeLevel) });
  } catch (error) {
    console.error('Error fetching degree levels:', error);
    res.status(500).json({ error: 'Failed to fetch degree levels' });
  }
});

// Get fields offered by a university for a specific degree level
router.get('/:universityId/fields', async (req, res) => {
  try {
    const { universityId } = req.params;
    const { degreeLevel } = req.query;

    if (!degreeLevel) {
      return res.status(400).json({ error: 'degreeLevel query parameter is required' });
    }

    // Verify university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId }
    });

    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    const fields = await prisma.universityField.findMany({
      where: { 
        universityId,
        degreeLevel
      },
      select: {
        id: true,
        fieldName: true
      },
      orderBy: {
        fieldName: 'asc'
      }
    });

    res.json({ fields: fields.map(f => f.fieldName) });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Get programs offered by a university for a specific degree level and field
router.get('/:universityId/programs', async (req, res) => {
  try {
    const { universityId } = req.params;
    const { degreeLevel, field } = req.query;

    if (!degreeLevel || !field) {
      return res.status(400).json({ 
        error: 'degreeLevel and field query parameters are required' 
      });
    }

    // Verify university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId }
    });

    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    const programs = await prisma.universityProgram.findMany({
      where: { 
        universityId,
        degreeLevel,
        fieldName: field
      },
      select: {
        id: true,
        programName: true
      },
      orderBy: {
        programName: 'asc'
      }
    });

    res.json({ programs: programs.map(p => p.programName) });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Add degree level to university (admin only)
router.post('/:universityId/degree-levels', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { universityId } = req.params;
    const { degreeLevel } = req.body;

    if (!degreeLevel) {
      return res.status(400).json({ error: 'degreeLevel is required' });
    }

    const result = await prisma.universityDegreeLevel.create({
      data: {
        universityId,
        degreeLevel
      }
    });

    res.json({ 
      message: 'Degree level added successfully',
      degreeLevel: result
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This degree level already exists for this university' });
    }
    console.error('Error adding degree level:', error);
    res.status(500).json({ error: 'Failed to add degree level' });
  }
});

// Add field to university degree level (admin only)
router.post('/:universityId/fields', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { universityId } = req.params;
    const { degreeLevel, fieldName } = req.body;

    if (!degreeLevel || !fieldName) {
      return res.status(400).json({ error: 'degreeLevel and fieldName are required' });
    }

    // Get the degree level record
    const degreeLevelRecord = await prisma.universityDegreeLevel.findUnique({
      where: {
        universityId_degreeLevel: {
          universityId,
          degreeLevel
        }
      }
    });

    if (!degreeLevelRecord) {
      return res.status(404).json({ error: 'Degree level not found for this university' });
    }

    const result = await prisma.universityField.create({
      data: {
        universityId,
        universityDegreeLevelId: degreeLevelRecord.id,
        degreeLevel,
        fieldName
      }
    });

    res.json({ 
      message: 'Field added successfully',
      field: result
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This field already exists for this university and degree level' });
    }
    console.error('Error adding field:', error);
    res.status(500).json({ error: 'Failed to add field' });
  }
});

// Add program to university field (admin only)
router.post('/:universityId/programs', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { universityId } = req.params;
    const { degreeLevel, fieldName, programName } = req.body;

    if (!degreeLevel || !fieldName || !programName) {
      return res.status(400).json({ 
        error: 'degreeLevel, fieldName, and programName are required' 
      });
    }

    // Get the degree level and field records
    const degreeLevelRecord = await prisma.universityDegreeLevel.findUnique({
      where: {
        universityId_degreeLevel: {
          universityId,
          degreeLevel
        }
      }
    });

    if (!degreeLevelRecord) {
      return res.status(404).json({ error: 'Degree level not found for this university' });
    }

    const fieldRecord = await prisma.universityField.findUnique({
      where: {
        universityId_degreeLevel_fieldName: {
          universityId,
          degreeLevel,
          fieldName
        }
      }
    });

    if (!fieldRecord) {
      return res.status(404).json({ error: 'Field not found for this university and degree level' });
    }

    const result = await prisma.universityProgram.create({
      data: {
        universityId,
        universityDegreeLevelId: degreeLevelRecord.id,
        universityFieldId: fieldRecord.id,
        degreeLevel,
        fieldName,
        programName
      }
    });

    res.json({ 
      message: 'Program added successfully',
      program: result
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'This program already exists for this university, degree level, and field' 
      });
    }
    console.error('Error adding program:', error);
    res.status(500).json({ error: 'Failed to add program' });
  }
});

export default router;