import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'progress-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
    }
  }
});

// Get student's progress reports
router.get('/progress-reports', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Verify student is in ACTIVE phase
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { studentPhase: true }
    });
    
    if (!student || student.studentPhase !== 'ACTIVE') {
      return res.status(403).json({ error: 'Access denied. Only active students can access progress reports.' });
    }
    
    const reports = await prisma.progressReport.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: true
      }
    });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching progress reports:', error);
    res.status(500).json({ error: 'Failed to fetch progress reports' });
  }
});

// Submit new progress report
router.post('/progress-reports', requireAuth, upload.array('files', 5), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Verify student is in ACTIVE phase
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { studentPhase: true, name: true }
    });
    
    if (!student || student.studentPhase !== 'ACTIVE') {
      return res.status(403).json({ error: 'Access denied. Only active students can submit progress reports.' });
    }
    
    // Create progress report with transaction
    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.progressReport.create({
        data: {
          studentId,
          title,
          content,
          status: 'SUBMITTED'
        }
      });
      
      // Add file attachments if any
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map(file => ({
          progressReportId: newReport.id,
          filename: file.originalname,
          filepath: file.path,
          mimetype: file.mimetype,
          size: file.size
        }));
        
        await tx.progressReportAttachment.createMany({
          data: attachments
        });
      }
      
      return newReport;
    });
    
    console.log(`📝 Progress report submitted by ${student.name}: ${title}`);
    res.status(201).json(report);
    
  } catch (error) {
    console.error('Error submitting progress report:', error);
    res.status(500).json({ error: 'Failed to submit progress report' });
  }
});

// Get student's communications/messages
router.get('/communications', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get messages where student is sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: studentId },
          { recipientId: studentId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { name: true, role: true } },
        recipient: { select: { name: true, role: true } }
      }
    });
    
    // Transform for frontend
    const communications = messages.map(msg => ({
      id: msg.id,
      message: msg.content,
      createdAt: msg.createdAt,
      senderType: msg.sender.role,
      senderName: msg.sender.name,
      recipientType: msg.recipient.role,
      recipientName: msg.recipient.name
    }));
    
    res.json(communications);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Send message (student to admin/donor)
router.post('/messages', requireAuth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Find admin as default recipient (can be enhanced later)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!admin) {
      return res.status(500).json({ error: 'No admin found to send message to' });
    }
    
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        recipientId: admin.id,
        content: message.trim(),
        messageType: 'STUDENT_TO_ADMIN'
      },
      include: {
        sender: { select: { name: true, role: true } },
        recipient: { select: { name: true, role: true } }
      }
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get student profile (with phase verification)
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        program: true,
        studentPhase: true,
        sponsored: true,
        createdAt: true
      }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;