// server/src/server.js (ESM)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.join(__dirname, "..");

// Load environment variables FIRST before importing anything that needs them
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
const envPath = path.join(serverDir, envFile);
dotenv.config({ path: envPath });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Structured logging
import logger from "./lib/logger.js";
import { httpLogger, errorLogger } from "./middleware/httpLogger.js";
import { logError } from "./lib/errorLogger.js";

// API Documentation
import { setupSwagger } from "./lib/swagger.js";

// Monitoring modules (optional - enabled via ENABLE_MONITORING env var)
import { setupHealthCheck } from "./monitoring/healthCheck.js";
import { setupErrorTracking, errorHandlerMiddleware } from "./monitoring/errorTracker.js";
import profileRouter from "./routes/profile.js";
import authRouter from "./routes/auth.js";
import studentsRouter from "./routes/students.js";
import donorsRouter from "./routes/donors.js";
import applicationsRouter from "./routes/applications.js";
import sponsorshipsRouter from "./routes/sponsorships.js";
import disbursementsRouter from "./routes/disbursements.js";
import messagesRouter from "./routes/messages.js";
import conversationsRouter from "./routes/conversations.js";
import uploadsRouter from "./routes/uploads.js";
import paymentsRouter from "./routes/payments.js";
import fxRouter from "./routes/fx.js";
import fieldReviewsRouter from "./routes/fieldReviews.js";
import usersRouter from "./routes/users.js";
import requestsRouter from "./routes/requests.js";
import exportRouter from "./routes/export.js";
import studentProgressRouter from "./routes/student-progress.js";
import studentRouter from "./routes/student.js";
import statisticsRouter from "./routes/statistics.js";
import universitiesRouter from "./routes/universities.js";
import photosRouter from "./routes/photos.js";
import videosRouter from "./routes/videos-simple.js";
import boardMembersRouter from "./routes/boardMembers.js";
import interviewsRouter from "./routes/interviews.js";
import superAdminRouter from "./routes/superAdmin.js";
import auditLogsRouter from "./routes/auditLogs.js";
import ipWhitelistRouter from "./routes/ipWhitelist.js";

// Audit logging middleware
import { auditLogin } from "./middleware/auditMiddleware.js";
import { ipWhitelistMiddleware } from "./middleware/ipWhitelist.js";

const app = express();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
// Support multiple dev origins (Vite can switch ports if busy). You can also set FRONTEND_URLS as comma-separated list.
const FRONTEND_URLS = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set([
    ...FRONTEND_URLS,
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:8083",
  ])
).filter(Boolean);

// ─────────────────────────────────────────────────────────────
// Security & logging
// (disable CSP in helmet for local dev so Vite scripts load fine)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin access for media files
  })
);

// Structured HTTP logging (Winston)
if (process.env.ENABLE_STRUCTURED_LOGGING === 'true') {
  app.use(httpLogger);
  logger.info('Structured HTTP logging enabled');
} else {
  // Fallback to morgan for simple logging
  app.use(morgan("dev"));
}

// ─────────────────────────────────────────────────────────────
// CORS (allow the Vite dev server(s) and handle preflight globally)
const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser or same-origin requests without origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// helpful for caches/proxies and origin-based responses
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

// ─────────────────────────────────────────────────────────────
// Parsers
app.use(express.json({ limit: "10mb" })); // Reasonable limit for most requests and uploads
app.use(express.urlencoded({ limit: "10mb", extended: true })); // For form data

// ─────────────────────────────────────────────────────────────
// Timeout Configuration for Large File Uploads
// Set request timeout to 5 minutes for large video uploads
app.use((req, res, next) => {
  req.socket.setTimeout(300000); // 5 minutes (300,000 ms)
  res.setTimeout(300000);
  next();
});

// ─────────────────────────────────────────────────────────────
// Error Reporting Middleware (Phase 3 Enhancement)
// Captures request context for error logging
app.use((req, res, next) => {
  // Attach request metadata for error logging
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.on('finish', () => {
    // Log errors only for error responses
    if (res.statusCode >= 400 && res.locals?.errorLogged !== true) {
      try {
        logError(new Error(`${res.statusCode} ${req.method} ${req.path}`), {
          route: req.path,
          method: req.method,
          statusCode: res.statusCode,
          userId: req.user?.id,
          userRole: req.user?.role,
          action: 'http_error_response'
        });
      } catch (e) {
        // Silently fail - don't let logging break the response
        logger.error('Error logging request error:', e);
      }
    }
  });
  next();
});

// ─────────────────────────────────────────────────────────────
// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ─────────────────────────────────────────────────────────────
// Routes
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api/donors", donorsRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/sponsorships", sponsorshipsRouter);
app.use("/api/disbursements", disbursementsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/fx", fxRouter);
app.use("/api/field-reviews", fieldReviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/export", exportRouter);
app.use("/api/student-progress", studentProgressRouter);
app.use("/api/student", studentRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/universities", universitiesRouter);
app.use("/api/photos", photosRouter);
app.use("/api/videos", videosRouter);
app.use("/api/board-members", boardMembersRouter);
app.use("/api/interviews", interviewsRouter);

// Security routes (SUPER_ADMIN only)
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/ip-whitelist", ipWhitelistRouter);

// IP Whitelist Protection for Admin Routes
// Apply IP whitelist middleware to admin/super-admin routes
if (process.env.ENABLE_IP_WHITELIST === 'true') {
  logger.info('IP whitelist protection enabled for admin routes');
  app.use("/api/super-admin", ipWhitelistMiddleware());
  app.use("/api/users", ipWhitelistMiddleware({ allowedRoles: ['SUPER_ADMIN'] }));
}

app.use("/api/super-admin", superAdminRouter);


// ⬇️ NEW for uploads
app.use("/api/uploads", uploadsRouter);     // handles file upload API

// Serve all static files including videos with proper headers
app.use("/uploads", express.static("uploads", {
  setHeaders: (res, path) => {
    // Set proper headers for video files
    if (path.includes('/videos/')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4');
      // Enable CORS for video files
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
    }
  }
}));

// Serve manual files
app.use("/manuals", express.static("../manuals", {
  setHeaders: (res, path) => {
    // Set proper headers for HTML files
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));


// ─────────────────────────────────────────────────────────────

app.use("/api/profile", profileRouter);

// ─────────────────────────────────────────────────────────────
// API Documentation (Swagger)
// Enable with ENABLE_API_DOCS=true in .env
if (process.env.ENABLE_API_DOCS === 'true') {
  setupSwagger(app);
}

// ─────────────────────────────────────────────────────────────
// Monitoring Setup (optional)
// Enable with ENABLE_MONITORING=true in .env
if (process.env.ENABLE_MONITORING === 'true') {
  console.log('\n Setting up monitoring...');
  setupHealthCheck(app);
  setupErrorTracking(app);
}

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Error logging middleware
if (process.env.ENABLE_STRUCTURED_LOGGING === 'true') {
  app.use(errorLogger);
}

// Error handler middleware (should be last)
if (process.env.ENABLE_MONITORING === 'true') {
  app.use(errorHandlerMiddleware);
}

// ─────────────────────────────────────────────────────────────
// Start
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    corsOrigins: allowedOrigins.length ? allowedOrigins : [FRONTEND_URL],
    monitoring: process.env.ENABLE_MONITORING === 'true',
    structuredLogging: process.env.ENABLE_STRUCTURED_LOGGING === 'true',
    rateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
  });
});
