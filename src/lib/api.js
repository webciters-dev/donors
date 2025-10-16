// Centralized API configuration - eliminates 25+ duplicate declarations
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Enhanced API client with centralized configuration
 * Replaces duplicate API constants across components
 */
export const API = {
  baseURL: API_BASE_URL,
  
  // Helper for creating full URLs
  url: (path = '') => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
  
  // Common headers helper  
  headers: (token = null, extra = {}) => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  })
};

// Enhanced fetch wrapper with better error handling
export async function apiFetch(path, { method = "GET", body, token, headers = {} } = {}) {
  const url = API.url(path);
  
  try {
    const res = await fetch(url, {
      method,
      headers: API.headers(token, headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    
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
    console.error(`🚨 API Error for ${path}:`, error);
    throw error;
  }
}

// Legacy support
export function makeHeaders(token, extra = {}) {
  return API.headers(token, extra);
}

// Export base URL for backward compatibility
export const API_BASE = API_BASE_URL;

export default API;
