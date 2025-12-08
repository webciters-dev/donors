// src/schemas/videoValidation.schema.js
import { z } from "zod";

// Supported video formats
const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/webm"
];

// Video file size limits (in bytes)
const MIN_VIDEO_SIZE = 1 * 1024 * 1024;  // 1MB minimum
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB maximum (backend limit)
const MAX_VIDEO_SIZE_DISPLAY = 25; // 25MB (display to users)

// Duration limits (in seconds)
const MIN_DURATION = 60;  // 60 seconds (1 minute)
const MAX_DURATION = 90;  // 90 seconds (1.5 minutes)

export const introVideoSchema = z.object({
  file: z
    .any()
    .refine(
      (file) => file instanceof File,
      "Please select a video file"
    )
    .refine(
      (file) => SUPPORTED_VIDEO_TYPES.includes(file.type),
      "Please upload MP4, MOV, AVI, or WebM format"
    )
    .refine(
      (file) => file.size >= MIN_VIDEO_SIZE,
      `Video must be at least ${MIN_VIDEO_SIZE / (1024 * 1024)}MB`
    )
    .refine(
      (file) => file.size <= MAX_VIDEO_SIZE,
      `Video must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`
    ),
});

// Server-side validation for video metadata
export const videoMetadataSchema = z.object({
  duration: z
    .number()
    .min(MIN_DURATION, `Video must be at least ${MIN_DURATION} seconds (1 minute)`)
    .max(MAX_DURATION, `Video must be no longer than ${MAX_DURATION} seconds (1.5 minutes)`),
  
  format: z.enum(["mp4", "mov", "avi", "webm"], {
    errorMap: () => ({ message: "Unsupported video format" })
  }),
  
  fileSize: z
    .number()
    .min(MIN_VIDEO_SIZE, "Video file too small")
    .max(MAX_VIDEO_SIZE, "Video file too large"),
    
  resolution: z.object({
    width: z.number().min(480, "Video width must be at least 480px"),
    height: z.number().min(360, "Video height must be at least 360px"),
  }).optional(),
});

// Content validation guidelines for students
export const VIDEO_GUIDELINES = {
  duration: {
    min: MIN_DURATION,
    max: MAX_DURATION,
    recommended: "60-90 seconds"
  },
  
  fileSize: {
    max: MAX_VIDEO_SIZE,
    maxMB: MAX_VIDEO_SIZE_DISPLAY  // Use display value (25MB) for UI messages
  },
  
  formats: SUPPORTED_VIDEO_TYPES,
  
  content: {
    title: "Introduction Video Guidelines",
    prompt: `Please record a 60-90 second video introducing yourself and explaining why you deserve educational sponsorship. 
    
Guidelines for your video:
• Speak clearly about your goals and challenges
• Explain how education will impact your future
• Be authentic and genuine
• Ensure good lighting and clear audio
• Look directly at the camera when speaking
• Keep it within 60-90 seconds

This video helps donors connect with you personally and understand your story better.`,
    
    tips: [
      "Record in a quiet environment with good lighting",
      "Hold your phone steady or use a tripod",
      "Speak clearly and at a normal pace",
      "Introduce yourself and your educational goals",
      "Explain your financial challenges briefly", 
      "Share your dreams and how education will help",
      "End with a brief thank you to potential donors"
    ]
  }
};

export default introVideoSchema;