// server/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 * 
 * Configuration:
 * - 15 minute window
 * - Max 5 attempts per window
 * - Clear error message when limit exceeded
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting if disabled via environment variable
  skip: () => process.env.ENABLE_RATE_LIMITING === 'false',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
      retryAfter: 15 * 60
    });
  }
});

/**
 * Rate limiter for general API endpoints
 * More lenient than auth rate limiter
 * 
 * Configuration:
 * - 15 minute window
 * - Max 100 requests per window
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.ENABLE_RATE_LIMITING === 'false',
});

/**
 * Rate limiter for password reset endpoints
 * Very strict to prevent abuse
 * 
 * Configuration:
 * - 1 hour window
 * - Max 3 attempts per window
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    error: 'Too many password reset attempts, please try again after 1 hour',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.ENABLE_RATE_LIMITING === 'false',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many password reset attempts, please try again after 1 hour',
      retryAfter: 60 * 60
    });
  }
});

export default authRateLimiter;
