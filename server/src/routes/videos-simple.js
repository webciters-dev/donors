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
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

/**
 * POST /api/videos/upload-intro
 * Upload introduction video for the authenticated student (simplified version)
 */
router.post("/upload-intro", requireAuth, uploadVideo.single('video'), async (req, res) => {
  try {
    // Only students can upload introduction videos
    if (req.user.role !== 'STUDENT') {
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
    console.error('Video upload error:', error);
    res.status(500).json({ error: "Failed to upload video" });
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