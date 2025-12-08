// server/src/routes/videos-simple.js - Simplified version without ffmpeg
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// Ensure video uploads folder exists
const videoUploadDir = path.resolve("uploads/videos");

if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

// Video-specific multer configuration
const videoStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, videoUploadDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  },
});

// File filter for videos only
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/webm'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MOV, AVI, and WebM are allowed.'), false);
  }
};

const uploadVideo = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,    // 100MB file size limit
    fieldSize: 100 * 1024 * 1024,   // 100MB max per field (for large video field)
    fieldNameSize: 256,              // Allow longer field names if needed
    fields: 10,                      // Allow up to 10 form fields
    parts: 100,                      // Allow up to 100 parts in multipart message
  }
});

/**
 * Multer Error Handler Middleware
 * Catches and properly handles multer-specific errors
 */
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer Error:', err.code, err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false,
        error: `File too large. Maximum size is 100MB, but received ${Math.round(err.limit / (1024*1024))}MB`
      });
    }
    if (err.code === 'LIMIT_FIELD_SIZE') {
      return res.status(413).json({ 
        success: false,
        error: `Form field too large. Maximum field size is 100MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        error: 'Too many files uploaded'
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({ 
        success: false,
        error: 'Too many parts in the request'
      });
    }
    
    return res.status(400).json({ 
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    console.error('Upload Error:', err);
    return res.status(500).json({ 
      success: false,
      error: err.message || 'Unknown upload error'
    });
  }
  
  next();
};

/**
 * POST /api/videos/upload-intro
 * Upload introduction video for the authenticated student (simplified version)
 */
router.post("/upload-intro", requireAuth, (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    handleUploadErrors(err, req, res, next);
  });
}, async (req, res) => {
  try {
    // Log upload attempt
    console.log('🎥 Video Upload Attempt:', {
      studentId: req.user.studentId,
      studentRole: req.user.role,
      fileReceived: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      fileSizeMB: req.file ? `${(req.file.size / (1024*1024)).toFixed(2)}MB` : 'N/A',
      contentType: req.file?.mimetype,
      duration: req.body.duration
    });

    // Only students can upload introduction videos
    if (req.user.role !== 'STUDENT') {
      console.warn('❌ Unauthorized upload attempt by:', req.user.role);
      return res.status(403).json({ error: "Only students can upload introduction videos" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const duration = req.body.duration ? parseInt(req.body.duration) : null;

    try {
      // For now, we'll accept any video without processing
      // In production, you'd want to add video processing with ffmpeg
      
      // Update student record with video information
      const student = await prisma.student.findUnique({
        where: { id: req.user.studentId }
      });

      if (!student) {
        return res.status(404).json({ error: "Student profile not found" });
      }

      // Remove old video files if they exist
      if (student.introVideoUrl) {
        const oldVideoPath = path.join(videoUploadDir, path.basename(student.introVideoUrl));
        if (fs.existsSync(oldVideoPath)) {
          try {
            fs.unlinkSync(oldVideoPath);
          } catch (error) {
            console.log('Could not remove old video file:', error.message);
          }
        }
      }

      // Update student with new video information
      const updatedStudent = await prisma.student.update({
        where: { id: req.user.studentId },
        data: {
          introVideoUrl: `/uploads/videos/${fileName}`,
          introVideoThumbnailUrl: null, // Will be generated later
          introVideoDuration: duration, // Use duration from frontend
          introVideoUploadedAt: new Date(),
          introVideoOriginalName: originalName
        }
      });

      res.json({
        success: true,
        video: {
          url: updatedStudent.introVideoUrl,
          thumbnailUrl: updatedStudent.introVideoThumbnailUrl,
          duration: updatedStudent.introVideoDuration,
          uploadedAt: updatedStudent.introVideoUploadedAt,
          originalName: updatedStudent.introVideoOriginalName,
          message: "Video uploaded successfully. Processing will be completed shortly."
        }
      });

    } catch (processError) {
      console.error('Video processing error:', processError);
      
      // Clean up uploaded file on processing error
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.log('Could not clean up file:', error.message);
        }
      }
      
      return res.status(500).json({ 
        error: "Failed to process video file. Please try again with a different file." 
      });
    }

  } catch (error) {
    console.error('❌ Video upload error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to upload video. Please try again." 
    });
  }
});

/**
 * DELETE /api/videos/intro
 * Remove introduction video for the authenticated student
 */
router.delete("/intro", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: "Only students can manage introduction videos" });
    }

    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId }
    });

    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    // Remove video files from filesystem
    if (student.introVideoUrl) {
      const videoPath = path.join(videoUploadDir, path.basename(student.introVideoUrl));
      if (fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
        } catch (error) {
          console.log('Could not remove video file:', error.message);
        }
      }
    }

    // Clear video fields in database
    await prisma.student.update({
      where: { id: req.user.studentId },
      data: {
        introVideoUrl: null,
        introVideoThumbnailUrl: null,
        introVideoDuration: null,
        introVideoUploadedAt: null,
        introVideoOriginalName: null
      }
    });

    res.json({ success: true, message: "Introduction video removed successfully" });

  } catch (error) {
    console.error('Video deletion error:', error);
    res.status(500).json({ error: "Failed to remove video" });
  }
});

export default router;