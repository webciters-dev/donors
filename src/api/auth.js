// src/api/auth.js - Authentication utilities for API calls

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with Authorization bearer token
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Get just the Authorization header for multipart/form-data requests
 * (Don't set Content-Type for FormData - browser will set it automatically)
 * @returns {Object} Headers object with Authorization bearer token only
 */
export const getAuthHeadersForFormData = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a token
 */
export const isAuthenticated = () => {
  return Boolean(localStorage.getItem('auth_token'));
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null if not found
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};