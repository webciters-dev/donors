/**
 * Enhanced API Client with Auth Interception
 * Handles 401 responses by clearing auth and redirecting to login
 */

import { isTokenExpired } from "./tokenUtils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Store logout callback (will be set by App component)
let globalLogoutCallback = null;

/**
 * Set the global logout callback
 * Call this from your App/Root component on mount
 * @param {Function} callback - logout function from useAuth
 */
export function setGlobalLogoutCallback(callback) {
  globalLogoutCallback = callback;
}

/**
 * Enhanced API configuration
 */
export const API = {
  baseURL: API_BASE_URL,
  
  url: (path = '') => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
  
  headers: (token = null, extra = {}) => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  })
};

/**
 * Enhanced fetch wrapper with 401 interception
 * Automatically logs out on 401 responses
 */
export async function apiFetch(path, { method = "GET", body, token, headers = {} } = {}) {
  const url = API.url(path);
  
  try {
    // ✅ NEW: Check if token is expired before making request
    if (token && isTokenExpired(token)) {
      console.warn(`[API] Token expired for request to ${path}. Logging out.`);
      handleUnauthorized();
      throw new Error("Token expired. Please log in again.");
    }

    const res = await fetch(url, {
      method,
      headers: API.headers(token, headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // ✅ NEW: Handle 401 Unauthorized
    if (res.status === 401) {
      console.error(`[API] 401 Unauthorized response from ${path}. Logging out.`);
      handleUnauthorized();
      throw new Error("Your session has expired. Please log in again.");
    }
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    
    return res.text();
  } catch (error) {
    console.error(`[API] Error for ${path}:`, error);
    throw error;
  }
}

/**
 * ✅ NEW: Handle unauthorized (401) response
 * Clears auth and redirects to login
 */
function handleUnauthorized() {
  // Clear localStorage
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  
  // Call global logout if available
  if (globalLogoutCallback) {
    globalLogoutCallback();
  }
  
  // Redirect to login
  window.location.href = "/#/login";
}

// Legacy support
export { apiFetch as default };
