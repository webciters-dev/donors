// src/lib/cms.js - CMS Content Management Utility
import { CMS_CONTENT_DEFAULTS } from './cmsConfig.js';

const CMS_STORAGE_KEY = 'awake_cms_content';

/**
 * Get CMS content with fallback to defaults
 * @param {string} path - Dot notation path to content (e.g., 'hero.title')
 * @returns {any} Content value or default
 */
export const getCMSContent = (path) => {
  try {
    // Get custom content from localStorage
    const customContent = localStorage.getItem(CMS_STORAGE_KEY);
    const content = customContent ? JSON.parse(customContent) : {};
    
    // Get value using dot notation path
    const value = getNestedValue(content, path);
    
    // Return custom value or fallback to default
    return value !== undefined ? value : getNestedValue(CMS_CONTENT_DEFAULTS, path);
  } catch (error) {
    console.warn('Failed to load CMS content, using defaults:', error);
    return getNestedValue(CMS_CONTENT_DEFAULTS, path);
  }
};

/**
 * Get all CMS content (merged defaults + custom)
 * @returns {object} Complete content object
 */
export const getAllCMSContent = () => {
  try {
    const customContent = localStorage.getItem(CMS_STORAGE_KEY);
    const content = customContent ? JSON.parse(customContent) : {};
    
    // Deep merge defaults with custom content
    return deepMerge(CMS_CONTENT_DEFAULTS, content);
  } catch (error) {
    console.warn('Failed to load CMS content, using defaults:', error);
    return CMS_CONTENT_DEFAULTS;
  }
};

/**
 * Update CMS content
 * @param {string} path - Dot notation path to content
 * @param {any} value - New value to set
 */
export const updateCMSContent = (path, value) => {
  try {
    // Get existing custom content
    const customContent = localStorage.getItem(CMS_STORAGE_KEY);
    const content = customContent ? JSON.parse(customContent) : {};
    
    // Set value using dot notation path
    setNestedValue(content, path, value);
    
    // Save back to localStorage
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(content));
    
    console.log(` CMS: Updated ${path} =`, value);
    return true;
  } catch (error) {
    console.error('Failed to update CMS content:', error);
    return false;
  }
};

/**
 * Reset all CMS content to defaults
 */
export const resetCMSContent = () => {
  try {
    localStorage.removeItem(CMS_STORAGE_KEY);
    console.log(' CMS: Reset to defaults');
    return true;
  } catch (error) {
    console.error('Failed to reset CMS content:', error);
    return false;
  }
};

/**
 * Export all CMS content for backup
 * @returns {string} JSON string of current content
 */
export const exportCMSContent = () => {
  try {
    const content = getAllCMSContent();
    return JSON.stringify(content, null, 2);
  } catch (error) {
    console.error('Failed to export CMS content:', error);
    return null;
  }
};

/**
 * Import CMS content from backup
 * @param {string} jsonString - JSON string to import
 * @returns {boolean} Success status
 */
export const importCMSContent = (jsonString) => {
  try {
    const content = JSON.parse(jsonString);
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(content));
    console.log(' CMS: Imported content');
    return true;
  } catch (error) {
    console.error('Failed to import CMS content:', error);
    return false;
  }
};

// Helper functions
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}