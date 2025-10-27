import apiClient from './client.js';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Fallback mock data
const mockData = {
  students: [
    {
      id: '1',
      name: 'Aisha Khan',
      email: 'aisha.khan@example.com',
      gender: 'F',
      university: 'University of Engineering and Technology, Lahore',
      program: 'Computer Science',
      field: 'Engineering',
      gpa: 3.8,
      gradYear: 2025,
      city: 'Lahore',
      province: 'Punjab',
      needUSD: 2500,
      sponsored: false
    },
    {
      id: '2',
      name: 'Muhammad Ahmed',
      email: 'ahmed.muhammad@example.com',
      gender: 'M',
      university: 'National University of Sciences and Technology',
      program: 'Mechanical Engineering', 
      field: 'Engineering',
      gpa: 3.6,
      gradYear: 2024,
      city: 'Islamabad',
      province: 'Islamabad',
      needUSD: 3000,
      sponsored: false
    }
  ],
  kpis: {
    totalDonors: 45,
    sponsoredStudents: 89,
    activeRepayers: 67,
    onTimeRepaymentRate: 94,
    totalDisbursed: 245000,
    averageSponsorship: 2750
  },
  applications: [
    {
      id: '1',
      student: { name: 'Hassan Malik', university: 'IBA Karachi', program: 'Business Admin' },
      term: 'Fall 2024',
      status: 'PENDING',
      submittedAt: '2024-01-15'
    }
  ],
  receipts: [
    {
      id: '1',
      date: '2024-01-15',
      studentName: 'Aisha Khan',
      amount: 2500,
      receiptNumber: 'RCP-2024-0001',
      taxYear: 2024
    }
  ],
  sponsorships: []
};

// Students API
export const listStudents = async (params = {}) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, using mock data');
    
    let students = [...mockData.students];
    
    // Apply filters if provided
    if (params.search) {
      const search = params.search.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(search) ||
        s.university.toLowerCase().includes(search) ||
        s.program.toLowerCase().includes(search) ||
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
    
    if (params.maxBudget) {
      students = students.filter(s => s.application?.amount <= Number(params.maxBudget));
    }
    
    return { data: { students, pagination: { total: students.length } } };
  }
  
  try {
    const response = await apiClient.get('/students', { params });
    return response;
  } catch (error) {
    console.error('API Error, falling back to mock data:', error);
    return { data: { students: mockData.students, pagination: { total: mockData.students.length } } };
  }
};

export const getStudentById = async (id) => {
  if (!API_BASE_URL) {
    const student = mockData.students.find(s => s.id === id);
    return { data: student };
  }
  
  try {
    const response = await apiClient.get(`/students/${id}`);
    return response;
  } catch (error) {
    console.error('API Error, falling back to mock data:', error);
    const student = mockData.students.find(s => s.id === id);
    return { data: student };
  }
};

export const createStudent = async (data) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, simulating student creation');
    return { data: { ...data, id: Date.now().toString() } };
  }
  
  try {
    const response = await apiClient.post('/students', data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Applications API
export const getApplications = async (params = {}) => {
  if (!API_BASE_URL) {
    return { data: { applications: mockData.applications, pagination: { total: mockData.applications.length } } };
  }
  
  try {
    const response = await apiClient.get('/applications', { params });
    return response;
  } catch (error) {
    console.error('API Error, falling back to mock data:', error);
    return { data: { applications: mockData.applications, pagination: { total: mockData.applications.length } } };
  }
};

export const createApplication = async (data) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, simulating application creation');
    return { data: { ...data, id: Date.now().toString(), status: 'PENDING' } };
  }
  
  try {
    const response = await apiClient.post('/applications', data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (id, data) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, simulating status update');
    return { data: { id, ...data } };
  }
  
  try {
    const response = await apiClient.patch(`/applications/${id}/status`, data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Donors API
export const getDonors = async (params = {}) => {
  if (!API_BASE_URL) {
    return { data: { donors: [], pagination: { total: 0 } } };
  }
  
  try {
    const response = await apiClient.get('/donors', { params });
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return { data: { donors: [], pagination: { total: 0 } } };
  }
};

export const createDonor = async (data) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, simulating donor creation');
    return { data: { ...data, id: Date.now().toString() } };
  }
  
  try {
    const response = await apiClient.post('/donors', data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getDonorReceipts = async (donorId) => {
  if (!API_BASE_URL) {
    return { data: { receipts: mockData.receipts } };
  }
  
  try {
    const response = await apiClient.get(`/donors/${donorId}/receipts`);
    return response;
  } catch (error) {
    console.error('API Error, falling back to mock data:', error);
    return { data: { receipts: mockData.receipts } };
  }
};

export const getDonorSponsorships = async (donorId) => {
  if (!API_BASE_URL) {
    return { data: { sponsorships: mockData.sponsorships } };
  }
  
  try {
    const response = await apiClient.get(`/donors/${donorId}/sponsorships`);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return { data: { sponsorships: mockData.sponsorships } };
  }
};

// Sponsorships API
export const createSponsorship = async (data) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, simulating sponsorship creation');
    return { data: { ...data, id: Date.now().toString() } };
  }
  
  try {
    const response = await apiClient.post('/sponsorships', data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Disbursements API
export const createDisbursement = async (data) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, simulating disbursement creation');  
    return { data: { ...data, id: Date.now().toString() } };
  }
  
  try {
    const response = await apiClient.post('/disbursements', data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Reports API
export const getKPIs = async () => {
  if (!API_BASE_URL) {
    return { data: mockData.kpis };
  }
  
  try {
    // This would be implemented in the backend
    return { data: mockData.kpis };
  } catch (error) {
    console.error('API Error, falling back to mock data:', error);
    return { data: mockData.kpis };
  }
};

// Payments API
export const createCheckoutSession = async (data) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, payment simulation not available');
    throw new Error('Payment processing requires backend API');
  }
  
  try {
    const response = await apiClient.post('/payments/create-checkout-session', data);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const verifyPayment = async (sessionId) => {
  if (!API_BASE_URL) {
    console.log('API_BASE_URL not found, payment verification not available');
    throw new Error('Payment verification requires backend API');
  }
  
  try {
    const response = await apiClient.post('/payments/verify-payment', { sessionId });
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth endpoints (placeholder for future implementation)
export const login = async (credentials) => {
  if (!API_BASE_URL) {
    console.log('Login simulation:', credentials);
    return {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: credentials.email,
          role: 'admin'
        }
      }
    };
  }
  
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};