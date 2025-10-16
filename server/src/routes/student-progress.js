// server/src/routes/student-progress.js - API for student progress tracking
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { requireAuth, onlyRoles } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'progress');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

/**
 * POST /api/student-progress
 * Submit a new progress update
 */
router.post("/", 
  requireAuth, 
  onlyRoles("STUDENT"), 
  upload.fields([
    { name: 'transcript', maxCount: 1 },
    { name: 'certificates', maxCount: 1 },
    { name: 'projects', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        studentId,
        term,
        gpa,
        coursesCompleted,
        creditsEarned,
        achievements,
        challenges,
        goals,
        notes,
        updateType
      } = req.body;

      if (!studentId || !term || !gpa) {
        return res.status(400).json({ 
          error: 'Missing required fields: studentId, term, gpa' 
        });
      }

      // Verify this student belongs to the authenticated user
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          User: true,
          sponsorships: {
            include: {
              donor: { select: { name: true, email: true } }
            }
          }
        }
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      if (student.User?.id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: Can only submit progress for your own account' });
      }

      // Check if student is sponsored (required for progress updates)
      if (!student.sponsored || student.sponsorships.length === 0) {
        return res.status(400).json({ 
          error: 'Progress updates are only available for sponsored students' 
        });
      }

      // Process uploaded files
      const documents = [];
      if (req.files) {
        Object.keys(req.files).forEach(fieldName => {
          const file = req.files[fieldName][0];
          if (file) {
            documents.push({
              type: fieldName,
              originalName: file.originalname,
              filename: file.filename,
              path: file.path,
              size: file.size,
              mimeType: file.mimetype
            });
          }
        });
      }

      // Create progress update
      const progressUpdate = await prisma.studentProgress.create({
        data: {
          studentId,
          term,
          gpa: parseFloat(gpa),
          coursesCompleted: coursesCompleted ? parseInt(coursesCompleted) : null,
          creditsEarned: creditsEarned ? parseInt(creditsEarned) : null,
          achievements: achievements || null,
          challenges: challenges || null,
          goals: goals || null,
          notes: notes || null,
          updateType: updateType || 'academic',
          documents: documents,
          submittedAt: new Date()
        }
      });

      // Notify donor about new progress update (optional - can be implemented later)
      // TODO: Send notification to donor about new progress update

      res.json({
        success: true,
        progressUpdate,
        message: 'Progress update submitted successfully'
      });

    } catch (error) {
      console.error('Error creating progress update:', error);
      res.status(500).json({ error: 'Failed to create progress update' });
    }
  }
);

/**
 * GET /api/student-progress/:studentId
 * Get all progress updates for a student
 */
router.get("/:studentId", requireAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify access permissions
    let hasAccess = false;

    if (userRole === 'ADMIN') {
      hasAccess = true;
    } else if (userRole === 'STUDENT') {
      // Students can only view their own progress
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { User: true }
      });
      hasAccess = student?.User?.id === userId;
    } else if (userRole === 'DONOR') {
      // Donors can view progress of students they sponsor
      const sponsorship = await prisma.sponsorship.findFirst({
        where: {
          studentId,
          donor: {
            User: { id: userId }
          }
        }
      });
      hasAccess = !!sponsorship;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this student\'s progress' });
    }

    // Get progress updates
    const progressUpdates = await prisma.studentProgress.findMany({
      where: { studentId },
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          select: {
            name: true,
            university: true,
            program: true
          }
        }
      }
    });

    res.json({
      progressUpdates,
      total: progressUpdates.length
    });

  } catch (error) {
    console.error('Error fetching progress updates:', error);
    res.status(500).json({ error: 'Failed to fetch progress updates' });
  }
});

/**
 * GET /api/student-progress/donor/:donorId
 * Get progress updates for all students sponsored by a donor
 */
router.get("/donor/:donorId", requireAuth, onlyRoles("DONOR", "ADMIN"), async (req, res) => {
  try {
    const { donorId } = req.params;
    const userId = req.user.id;

    // Verify donor access (donors can only see their own sponsored students)
    if (req.user.role === 'DONOR') {
      const donor = await prisma.donor.findUnique({
        where: { id: donorId },
        include: { User: true }
      });
      
      if (donor?.User?.id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to view this donor\'s students' });
      }
    }

    // Get all sponsorships by this donor
    const sponsorships = await prisma.sponsorship.findMany({
      where: { donorId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            program: true
          }
        }
      }
    });

    // Get progress updates for all sponsored students
    const studentIds = sponsorships.map(s => s.studentId);
    
    const progressUpdates = await prisma.studentProgress.findMany({
      where: {
        studentId: { in: studentIds }
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            program: true
          }
        }
      }
    });

    // Group by student for easier frontend consumption
    const progressByStudent = {};
    progressUpdates.forEach(update => {
      const studentId = update.studentId;
      if (!progressByStudent[studentId]) {
        progressByStudent[studentId] = {
          student: update.student,
          updates: []
        };
      }
      progressByStudent[studentId].updates.push(update);
    });

    res.json({
      sponsorships,
      progressByStudent,
      totalUpdates: progressUpdates.length
    });

  } catch (error) {
    console.error('Error fetching donor progress data:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

/**
 * GET /api/student-progress/document/:filename
 * Download/view uploaded documents
 */
router.get("/document/:filename", requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find the progress update that contains this document
    const progressUpdate = await prisma.studentProgress.findFirst({
      where: {
        documents: {
          path: ['some', { filename: filename }] // JSON query for filename in documents array
        }
      },
      include: {
        student: {
          include: {
            User: true,
            sponsorships: {
              include: {
                donor: { include: { User: true } }
              }
            }
          }
        }
      }
    });

    if (!progressUpdate) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify access permissions
    const userId = req.user.id;
    const userRole = req.user.role;
    let hasAccess = false;

    if (userRole === 'ADMIN') {
      hasAccess = true;
    } else if (userRole === 'STUDENT') {
      hasAccess = progressUpdate.student.User?.id === userId;
    } else if (userRole === 'DONOR') {
      hasAccess = progressUpdate.student.sponsorships.some(s => s.donor.User?.id === userId);
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this document' });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'progress', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.sendFile(filePath);

  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ error: 'Failed to serve document' });
  }
});

export default router;