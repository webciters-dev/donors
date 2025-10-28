import apiClient from './client';

// Authentication endpoints
export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await apiClient.post('/auth/change-password', passwordData);
    return response.data;
  }
};

// Student endpoints
export const studentAPI = {
  getAll: async (filters = {}) => {
    const response = await apiClient.get('/students', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  create: async (studentData) => {
    const response = await apiClient.post('/students', studentData);
    return response.data;
  },

  update: async (id, studentData) => {
    const response = await apiClient.put(`/students/${id}`, studentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/students/${id}`);
    return response.data;
  }
};

// Application endpoints
export const applicationAPI = {
  getAll: async (filters = {}) => {
    const response = await apiClient.get('/applications', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/applications/${id}`);
    return response.data;
  },

  create: async (applicationData) => {
    const response = await apiClient.post('/applications', applicationData);
    return response.data;
  },

  update: async (id, applicationData) => {
    const response = await apiClient.put(`/applications/${id}`, applicationData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/applications/${id}`);
    return response.data;
  }
};

// Donor endpoints
export const donorAPI = {
  getAll: async (filters = {}) => {
    const response = await apiClient.get('/donors', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/donors/${id}`);
    return response.data;
  },

  update: async (id, donorData) => {
    const response = await apiClient.put(`/donors/${id}`, donorData);
    return response.data;
  }
};

// Sponsorship endpoints
export const sponsorshipAPI = {
  getAll: async (filters = {}) => {
    const response = await apiClient.get('/sponsorships', { params: filters });
    return response.data;
  },

  create: async (sponsorshipData) => {
    const response = await apiClient.post('/sponsorships', sponsorshipData);
    return response.data;
  },

  update: async (id, sponsorshipData) => {
    const response = await apiClient.put(`/sponsorships/${id}`, sponsorshipData);
    return response.data;
  }
};

// File upload endpoints
export const fileAPI = {
  upload: async (formData) => {
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};