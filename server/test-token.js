import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Test token validation
async function testToken() {
  try {
    // Get the token from localStorage-like simulation
    // You would need to copy the actual token from the browser
    console.log('🔍 Testing JWT token validation...');
    
    // Check if we can decode a sample token
    const samplePayload = {
      sub: 'cmguhnqtr000823npehltvk8n', // user ID
      email: 'test+21@webciters.com',
      role: 'DONOR'
    };
    
    const token = jwt.sign(samplePayload, JWT_SECRET, { expiresIn: '7d' });
    console.log('🎟️ Generated test token:', token);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded successfully:', decoded);
    
    // Test the API endpoint with this token
    const response = await fetch('http://localhost:3001/api/donors/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ API error:', errorText);
    }
    
  } catch (e) {
    console.error('❌ Token test error:', e);
  }
}

testToken();