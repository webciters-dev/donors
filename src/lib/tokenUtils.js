/**
 * JWT Token Utilities
 * Helper functions to validate and decode JWT tokens without verification
 */

/**
 * Decode JWT payload without verification (client-side only)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if expired, false if valid or invalid
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTimeInSeconds;
}

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {number|null} - Expiration timestamp in ms or null if invalid
 */
export function getTokenExpirationTime(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000; // Convert from seconds to ms
}

/**
 * Check if token will expire soon (within minutes)
 * @param {string} token - JWT token
 * @param {number} minutesThreshold - Number of minutes to check ahead
 * @returns {boolean} - true if expiring soon
 */
export function isTokenExpiringSoon(token, minutesThreshold = 5) {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return true;
  
  const currentTime = Date.now();
  const minutesMs = minutesThreshold * 60 * 1000;
  return expirationTime - currentTime <= minutesMs;
}

/**
 * Get email from token payload
 * @param {string} token - JWT token
 * @returns {string|null} - Email or null
 */
export function getEmailFromToken(token) {
  const payload = decodeToken(token);
  return payload?.email || null;
}

/**
 * Get role from token payload
 * @param {string} token - JWT token
 * @returns {string|null} - Role or null
 */
export function getRoleFromToken(token) {
  const payload = decodeToken(token);
  return payload?.role || null;
}

/**
 * Get user ID from token payload
 * @param {string} token - JWT token
 * @returns {string|null} - User ID or null
 */
export function getUserIdFromToken(token) {
  const payload = decodeToken(token);
  return payload?.sub || null;
}
