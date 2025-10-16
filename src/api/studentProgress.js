// src/api/studentProgress.js - API service for student progress
import axios from 'axios';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Submit a new progress update
 * @param {Object} progressData - Progress form data
 * @param {File[]} files - Array of files to upload
 * @returns {Promise} API response
 */
export const submitProgressUpdate = async (progressData, files = {}) => {
  try {
    const formData = new FormData();
    
    // Add form fields
    Object.keys(progressData).forEach(key => {
      if (progressData[key] !== null && progressData[key] !== undefined && progressData[key] !== '') {
        formData.append(key, progressData[key]);
      }
    });
    
    // Add files if they exist
    if (files.transcript) {
      formData.append('transcript', files.transcript);
    }
    if (files.certificates) {
      formData.append('certificates', files.certificates);
    }
    if (files.projects) {
      formData.append('projects', files.projects);
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/api/student-progress`,
      formData,
      {
        headers: {
          ...getAuthHeadersForFormData(),
          // Don't set Content-Type for FormData - browser handles it automatically
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error submitting progress update:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all progress updates for a student
 * @param {string} studentId - Student ID
 * @returns {Promise} Progress updates
 */
export const getStudentProgress = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/student-progress/${studentId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get progress updates for all students sponsored by a donor
 * @param {string} donorId - Donor ID
 * @returns {Promise} Progress data organized by student
 */
export const getDonorProgressData = async (donorId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/student-progress/donor/${donorId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching donor progress data:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get document download URL
 * @param {string} filename - Document filename
 * @returns {string} Document URL
 */
export const getDocumentUrl = (filename) => {
  return `${API_BASE_URL}/api/student-progress/document/${filename}`;
};

/**
 * Check if student is sponsored (required for progress updates)
 * @param {string} studentId - Student ID
 * @returns {Promise} Sponsorship status
 */
export const checkSponsorshipStatus = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/students/${studentId}/sponsorship-status`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking sponsorship status:', error);
    throw error.response?.data || error;
  }
};