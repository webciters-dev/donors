import apiClient from './client';
import { mockData } from '../data/mockData';

// Check if API is available
const isApiAvailable = () => Boolean(import.meta.env.VITE_API_URL);

// Students endpoints
export const listStudents = async (params = {}) => {
  if (!isApiAvailable()) {
    // Fallback to mock data with client-side filtering
    let students = mockData.students;
    
    if (params.search) {
      const search = params.search.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(search) ||
        s.program.toLowerCase().includes(search) ||
        s.university.toLowerCase().includes(search) ||
        s.city.toLowerCase().includes(search)
      );
    }
    
    if (params.program) {
      students = students.filter(s => s.program === params.program);
    }
    
    if (params.gender) {
      students = students.filter(s => s.gender === params.gender);
    }
    
    if (params.province) {
      students = students.filter(s => s.province === params.province);
    }
    
    if (params.city) {
      students = students.filter(s => s.city.toLowerCase() === params.city.toLowerCase());
    }
    
    if (params.maxAmount) {
      students = students.filter(s => s.needUsd <= Number(params.maxAmount));
    }
    
    return { data: students };
  }
  
  const response = await apiClient.get('/api/students', { params });
  return response.data;
};

export const getStudentById = async (id) => {
  if (!isApiAvailable()) {
    const student = mockData.students.find(s => s.id === id);
    return { data: student };
  }
  
  const response = await apiClient.get(`/api/students/${id}`);
  return response.data;
};

// Sponsorship endpoints
export const createSponsorship = async (data) => {
  if (!isApiAvailable()) {
    // Mock response with fake Stripe URL
    return {
      data: {
        sponsorshipId: Math.random().toString(36).substr(2, 9),
        stripeCheckoutUrl: 'https://checkout.stripe.com/pay/test_session_123'
      }
    };
  }
  
  const response = await apiClient.post('/api/sponsorships', data);
  return response.data;
};

// Donor endpoints
export const getDonorReceipts = async () => {
  if (!isApiAvailable()) {
    return { data: mockData.receipts };
  }
  
  const response = await apiClient.get('/api/donor/receipts');
  return response.data;
};

export const getDonorSponsorships = async () => {
  if (!isApiAvailable()) {
    return { data: mockData.sponsorships };
  }
  
  const response = await apiClient.get('/api/donor/sponsorships');
  return response.data;
};

// Reports endpoints
export const getKPIs = async () => {
  if (!isApiAvailable()) {
    return { data: mockData.kpis };
  }
  
  const response = await apiClient.get('/api/reports/kpis');
  return response.data;
};

// Admin endpoints
export const getApplications = async (params = {}) => {
  if (!isApiAvailable()) {
    let applications = mockData.applications;
    
    if (params.status) {
      applications = applications.filter(a => a.status === params.status);
    }
    
    return { data: applications };
  }
  
  const response = await apiClient.get('/api/applications', { params });
  return response.data;
};

export const updateApplicationStatus = async (id, data) => {
  if (!isApiAvailable()) {
    return { data: { success: true, message: 'Status updated (mock)' } };
  }
  
  const response = await apiClient.put(`/api/applications/${id}/status`, data);
  return response.data;
};

// Auth endpoints
export const login = async (credentials) => {
  if (!isApiAvailable()) {
    // Mock login response
    return {
      data: {
        token: 'mock_jwt_token_123',
        user: {
          id: 1,
          name: 'Test User',
          email: credentials.email,
          role: credentials.email.includes('admin') ? 'ADMIN' : 'DONOR'
        }
      }
    };
  }
  
  const response = await apiClient.post('/api/auth/login', credentials);
  return response.data;
};