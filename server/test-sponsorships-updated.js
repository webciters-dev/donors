import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

async function testUpdatedSponsorshipsAPI() {
  try {
    console.log('=== Testing Updated Sponsorships API ===');
    
    // Create a test admin token
    const adminPayload = {
      id: 'test-admin-id',
      role: 'ADMIN',
      email: 'admin@test.com'
    };
    
    const token = jwt.sign(adminPayload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
    
    // Test with Athar Shah's donor ID
    const atharDonorId = 'cmguhnqq4000623npirjhbeb3';
    
    const response = await fetch(`http://localhost:3001/api/sponsorships?donorId=${atharDonorId}`, {
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
      
      // Check if application ID is included
      if (data.sponsorships && data.sponsorships.length > 0) {
        const firstSponsorship = data.sponsorships[0];
        console.log('\n=== Application ID Check ===');
        console.log('Student:', firstSponsorship.student?.name);
        console.log('Application ID:', firstSponsorship.student?.applications?.[0]?.id);
        console.log('Application Status:', firstSponsorship.student?.applications?.[0]?.status);
      }
    } else {
      const errorText = await response.text();
      console.log('API Error Response:', errorText);
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testUpdatedSponsorshipsAPI();