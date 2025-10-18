import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

async function testDonorsAPIWithAuth() {
  try {
    console.log('=== Testing Donors API with Authentication ===');
    
    // Create a test admin token
    const adminPayload = {
      id: 'test-admin-id',
      role: 'ADMIN',
      email: 'admin@test.com'
    };
    
    const token = jwt.sign(adminPayload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
    console.log('Created test token for admin');
    
    // Test the API with authentication
    const response = await fetch('http://localhost:3001/api/donors?limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response Data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('API Error Response:', errorText);
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testDonorsAPIWithAuth();