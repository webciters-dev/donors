const dotenv = require('dotenv');
dotenv.config();

async function testDonorsAPI() {
  try {
    console.log('=== Testing Donors API ===');
    
    // Test the API endpoint we just created
    const response = await fetch('http://localhost:3001/api/donors');
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('API Error:', errorText);
    }
    
    // Also test if we can access without auth (should fail)
    console.log('\n=== Testing without auth (should fail) ===');
    const noAuthResponse = await fetch('http://localhost:3001/api/donors');
    console.log('No Auth Status:', noAuthResponse.status);
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testDonorsAPI();