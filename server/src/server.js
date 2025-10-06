// server/src/server.js (ESM)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import profileRouter from "./routes/profile.js";
import authRouter from "./routes/auth.js";
import studentsRouter from "./routes/students.js";
import donorsRouter from "./routes/donors.js";
import applicationsRouter from "./routes/applications.js";
import sponsorshipsRouter from "./routes/sponsorships.js";
import disbursementsRouter from "./routes/disbursements.js";
import messagesRouter from "./routes/messages.js";
import uploadsRouter from "./routes/uploads.js";
import paymentsRouter from "./routes/payments.js";
import fxRouter from "./routes/fx.js";
import fieldReviewsRouter from "./routes/fieldReviews.js";
import usersRouter from "./routes/users.js";
import requestsRouter from "./routes/requests.js";
import exportRouter from "./routes/export.js";

dotenv.config();

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
  ])
).filter(Boolean);

// ─────────────────────────────────────────────────────────────
// Security & logging
// (disable CSP in helmet for local dev so Vite scripts load fine)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(morgan("dev"));

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
app.use(express.json({ limit: "1mb" }));

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
app.use("/api/payments", paymentsRouter);
app.use("/api/fx", fxRouter);
app.use("/api/field-reviews", fieldReviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/export", exportRouter);

// ⬇️ NEW for uploads
app.use("/api/uploads", uploadsRouter);     // handles file upload API
app.use("/uploads", express.static("uploads")); // serve uploaded files


// ─────────────────────────────────────────────────────────────

app.use("/api/profile", profileRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ─────────────────────────────────────────────────────────────
// Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 CORS allowed origins: ${allowedOrigins.length ? allowedOrigins.join(", ") : FRONTEND_URL}`
  );
});
