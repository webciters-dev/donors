// server/src/routes/videos.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";

const prisma = new PrismaClient();
const router = express.Router();

// Ensure video uploads folder exists
const videoUploadDir = path.resolve("uploads/videos");
const thumbnailDir = path.resolve("uploads/thumbnails");

[videoUploadDir, thumbnailDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

// Helper function to get video metadata using ffmpeg
const getVideoMetadata = promisify((filePath, callback) => {
  ffmpeg.ffprobe(filePath, (err, metadata) => {
    if (err) return callback(err);
    
    const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
    if (!videoStream) return callback(new Error('No video stream found'));
    
    const result = {
      duration: Math.round(metadata.format.duration),
      width: videoStream.width,
      height: videoStream.height,
      bitrate: metadata.format.bit_rate,
      size: metadata.format.size
    };
    
    callback(null, result);
  });
});

// Helper function to generate video thumbnail
const generateThumbnail = promisify((inputPath, outputPath, callback) => {
  ffmpeg(inputPath)
    .screenshots({
      timestamps: ['10%'], // Take screenshot at 10% of video duration
      filename: path.basename(outputPath),
      folder: path.dirname(outputPath),
      size: '320x240'
    })
    .on('end', () => callback(null))
    .on('error', callback);
});

/**
 * POST /api/videos/upload-intro
 * Upload introduction video for the authenticated student
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

    try {
      // Get video metadata
      const metadata = await getVideoMetadata(filePath);
      
      // Validate duration (30 seconds minimum, 120 seconds maximum)
      if (metadata.duration < 30) {
        fs.unlinkSync(filePath); // Clean up uploaded file
        return res.status(400).json({ 
          error: "Video too short. Please record at least 30 seconds." 
        });
      }
      
      if (metadata.duration > 120) {
        fs.unlinkSync(filePath); // Clean up uploaded file
        return res.status(400).json({ 
          error: "Video too long. Please keep it under 2 minutes (120 seconds)." 
        });
      }

      // Generate thumbnail
      const thumbnailFileName = fileName.replace(path.extname(fileName), '.jpg');
      const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);
      
      await generateThumbnail(filePath, thumbnailPath);

      // Convert video to MP4 if it's not already (optional optimization)
      let finalVideoPath = filePath;
      let finalVideoFileName = fileName;
      
      if (!fileName.endsWith('.mp4')) {
        finalVideoFileName = fileName.replace(path.extname(fileName), '.mp4');
        finalVideoPath = path.join(videoUploadDir, finalVideoFileName);
        
        await new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .outputOptions('-c:v libx264') // Use H.264 codec
            .outputOptions('-c:a aac') // Use AAC audio codec
            .outputOptions('-movflags +faststart') // Optimize for web streaming
            .output(finalVideoPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });
        
        // Remove original file after conversion
        fs.unlinkSync(filePath);
      }

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
          fs.unlinkSync(oldVideoPath);
        }
      }
      
      if (student.introVideoThumbnailUrl) {
        const oldThumbnailPath = path.join(thumbnailDir, path.basename(student.introVideoThumbnailUrl));
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }

      // Update student with new video information
      const updatedStudent = await prisma.student.update({
        where: { id: req.user.studentId },
        data: {
          introVideoUrl: `/uploads/videos/${finalVideoFileName}`,
          introVideoThumbnailUrl: `/uploads/thumbnails/${thumbnailFileName}`,
          introVideoDuration: metadata.duration,
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
          metadata: {
            width: metadata.width,
            height: metadata.height,
            fileSize: req.file.size
          }
        }
      });

    } catch (processError) {
      console.error('Video processing error:', processError);
      
      // Clean up uploaded file on processing error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
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
        fs.unlinkSync(videoPath);
      }
    }
    
    if (student.introVideoThumbnailUrl) {
      const thumbnailPath = path.join(thumbnailDir, path.basename(student.introVideoThumbnailUrl));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
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