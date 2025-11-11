// server/src/routes/photos.js
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/photos');
const thumbnailsDir = path.join(__dirname, '../../uploads/photos/thumbnails');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize directories
ensureDirectories();

// Configure multer for memory storage (we'll process images in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG and WebP are allowed.'), false);
    }
  }
});

// Helper function to generate unique filename
function generateFilename(originalName, suffix = '') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = path.extname(originalName).toLowerCase();
  return `student-photo-${timestamp}-${random}${suffix}${ext}`;
}

// Upload student photo endpoint
router.post('/upload', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(403).json({ error: 'Only students can upload photos' });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Generate filenames
    const originalFilename = generateFilename(req.file.originalname);
    const thumbnailFilename = generateFilename(req.file.originalname, '-thumb');
    
    const originalPath = path.join(uploadsDir, originalFilename);
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

    // Process and save original image (resize to max 1200px width to save space)
    await sharp(req.file.buffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toFile(originalPath);

    // Generate thumbnail (200x200 crop)
    await sharp(req.file.buffer)
      .resize(200, 200, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Delete old photos if they exist
    if (student.photoUrl) {
      try {
        const oldPhotoPath = path.join(__dirname, '../../', student.photoUrl);
        await fs.unlink(oldPhotoPath);
      } catch (err) {
        // Ignore if file doesn't exist
        console.warn('Could not delete old photo:', err.message);
      }
    }

    if (student.photoThumbnailUrl) {
      try {
        const oldThumbnailPath = path.join(__dirname, '../../', student.photoThumbnailUrl);
        await fs.unlink(oldThumbnailPath);
      } catch (err) {
        // Ignore if file doesn't exist
        console.warn('Could not delete old thumbnail:', err.message);
      }
    }

    // Generate URLs relative to server root
    const photoUrl = `uploads/photos/${originalFilename}`;
    const photoThumbnailUrl = `uploads/photos/thumbnails/${thumbnailFilename}`;

    // Update student record
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        photoUrl,
        photoThumbnailUrl,
        photoUploadedAt: new Date(),
        photoOriginalName: req.file.originalname
      }
    });

    res.json({
      message: 'Photo uploaded successfully',
      photoUrl,
      photoThumbnailUrl,
      uploadedAt: updatedStudent.photoUploadedAt
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
    }

    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Temporary upload endpoint for registration (no auth required)
router.post('/upload-temp', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    // Generate filenames for temporary storage
    const originalFilename = generateFilename(req.file.originalname);
    const thumbnailFilename = generateFilename(req.file.originalname, '-thumb');
    
    const originalPath = path.join(uploadsDir, originalFilename);
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

    // Process and save original image (resize to max 1200px width to save space)
    await sharp(req.file.buffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toFile(originalPath);

    // Generate thumbnail (200x200 crop)
    await sharp(req.file.buffer)
      .resize(200, 200, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Generate URLs relative to server root
    const photoUrl = `uploads/photos/${originalFilename}`;
    const photoThumbnailUrl = `uploads/photos/thumbnails/${thumbnailFilename}`;

    res.json({
      message: 'Photo uploaded temporarily',
      photoUrl,
      photoThumbnailUrl,
      originalName: req.file.originalname,
      tempUpload: true
    });

  } catch (error) {
    console.error('Temporary photo upload error:', error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
    }

    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get student photo (serves the actual image file)
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { thumbnail } = req.query; // ?thumbnail=true for thumbnail version

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        photoUrl: true,
        photoThumbnailUrl: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const photoUrl = thumbnail === 'true' ? student.photoThumbnailUrl : student.photoUrl;
    
    if (!photoUrl) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photoPath = path.join(__dirname, '../../', photoUrl);
    
    // Check if file exists
    try {
      await fs.access(photoPath);
    } catch (err) {
      return res.status(404).json({ error: 'Photo file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Send file
    res.sendFile(photoPath);

  } catch (error) {
    console.error('Photo retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve photo' });
  }
});

// Delete student photo
router.delete('/delete', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(403).json({ error: 'Only students can delete their photos' });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete physical files
    if (student.photoUrl) {
      try {
        const photoPath = path.join(__dirname, '../../', student.photoUrl);
        await fs.unlink(photoPath);
      } catch (err) {
        console.warn('Could not delete photo file:', err.message);
      }
    }

    if (student.photoThumbnailUrl) {
      try {
        const thumbnailPath = path.join(__dirname, '../../', student.photoThumbnailUrl);
        await fs.unlink(thumbnailPath);
      } catch (err) {
        console.warn('Could not delete thumbnail file:', err.message);
      }
    }

    // Update database
    await prisma.student.update({
      where: { id: studentId },
      data: {
        photoUrl: null,
        photoThumbnailUrl: null,
        photoUploadedAt: null,
        photoOriginalName: null
      }
    });

    res.json({ message: 'Photo deleted successfully' });

  } catch (error) {
    console.error('Photo deletion error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;