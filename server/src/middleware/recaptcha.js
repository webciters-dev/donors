// server/src/middleware/recaptcha.js
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify reCAPTCHA token with Google's API
 * @param {string} token - reCAPTCHA token from frontend
 * @param {string} remoteip - Client IP address (optional)
 * @returns {Promise<Object>} Verification result
 */
export async function verifyRecaptchaToken(token, remoteip = null) {
  if (!RECAPTCHA_SECRET_KEY) {
    throw new Error('reCAPTCHA secret key not configured');
  }

  if (!token) {
    throw new Error('reCAPTCHA token is required');
  }

  //  Development bypass for localhost
  const isDevelopment = process.env.DEVELOPMENT_MODE === 'true';
  if (isDevelopment && token === 'development-bypass-token') {
    console.log(' Development mode: Bypassing reCAPTCHA verification for localhost');
    return {
      success: true,
      score: 0.9,
      action: 'register',
      hostname: 'localhost',
      'challenge_ts': new Date().toISOString()
    };
  }

  try {
    const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
        ...(remoteip && { remoteip })
      },
      timeout: 10000 // 10 second timeout
    });

    const result = response.data;

    // Log verification attempt (for monitoring)
    console.log('reCAPTCHA verification:', {
      success: result.success,
      score: result.score,
      action: result.action,
      hostname: result.hostname,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error.message);
    throw new Error('Failed to verify reCAPTCHA token');
  }
}

/**
 * Express middleware for reCAPTCHA verification
 * @param {Object} options - Configuration options
 * @param {number} options.minScore - Minimum score for v3 (0.0 to 1.0)
 * @param {string[]} options.allowedActions - Allowed actions for v3
 * @param {boolean} options.skipOnMissing - Skip verification if no token provided
 * @returns {Function} Express middleware function
 */
export function requireRecaptcha(options = {}) {
  const {
    minScore = 0.5,
    allowedActions = ['submit', 'register', 'login', 'reset'],
    skipOnMissing = false
  } = options;

  return async (req, res, next) => {
    try {
      const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];
      
      if (!token) {
        if (skipOnMissing) {
          console.warn('reCAPTCHA token missing, but skipping verification');
          return next();
        }
        return res.status(400).json({ 
          error: 'reCAPTCHA verification required',
          code: 'RECAPTCHA_MISSING'
        });
      }

      // Get client IP for verification
      const clientIP = req.ip || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null);

      // Verify token with Google
      const result = await verifyRecaptchaToken(token, clientIP);

      if (!result.success) {
        console.warn('reCAPTCHA verification failed:', result['error-codes']);
        return res.status(400).json({ 
          error: 'reCAPTCHA verification failed',
          code: 'RECAPTCHA_FAILED',
          details: result['error-codes']
        });
      }

      // For v3, check score and action
      if (result.score !== undefined) {
        // This is reCAPTCHA v3
        if (result.score < minScore) {
          console.warn(`reCAPTCHA score too low: ${result.score} < ${minScore}`);
          return res.status(400).json({ 
            error: 'reCAPTCHA verification failed - suspicious activity detected',
            code: 'RECAPTCHA_LOW_SCORE',
            score: result.score
          });
        }

        if (result.action && !allowedActions.includes(result.action)) {
          console.warn(`reCAPTCHA invalid action: ${result.action}`);
          return res.status(400).json({ 
            error: 'reCAPTCHA verification failed - invalid action',
            code: 'RECAPTCHA_INVALID_ACTION'
          });
        }
      }

      // Store verification result for logging
      req.recaptchaResult = result;
      
      next();
    } catch (error) {
      console.error('reCAPTCHA middleware error:', error);
      return res.status(500).json({ 
        error: 'reCAPTCHA verification error',
        code: 'RECAPTCHA_ERROR'
      });
    }
  };
}

/**
 * Middleware for high-security endpoints (stricter verification)
 */
export const requireStrictRecaptcha = requireRecaptcha({
  minScore: 0.7,
  allowedActions: ['submit', 'register'],
  skipOnMissing: false
});

/**
 * Middleware for reCAPTCHA v2 verification (no score checking)
 */
export const requireRecaptchaV2 = requireRecaptcha({
  minScore: 0.0, // v2 doesn't have scores, so set to 0
  allowedActions: ['submit', 'register', 'login', 'reset'],
  skipOnMissing: false
});

/**
 * Middleware for medium-security endpoints
 */
export const requireMediumRecaptcha = requireRecaptcha({
  minScore: 0.5,
  allowedActions: ['submit', 'register', 'login', 'reset'],
  skipOnMissing: true  // Allow password reset requests without reCAPTCHA (still protected by email verification)
});

/**
 * Middleware for low-security endpoints (lenient)
 */
export const requireBasicRecaptcha = requireRecaptcha({
  minScore: 0.3,
  allowedActions: ['submit', 'register', 'login', 'reset', 'form', 'createCaseWorker'],
  skipOnMissing: true
});

// Default export
export default requireRecaptcha;