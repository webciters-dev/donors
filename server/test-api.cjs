const dotenv = require('dotenv');
dotenv.config();

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/applications?limit=5');
    const data = await response.json();
    
    console.log('=== API Response Sample ===');
    console.log('Total applications:', data.applications?.length || 0);
    
    if (data.applications && data.applications.length > 0) {
      const app = data.applications[0];
      console.log('\nFirst Application Structure:');
      console.log('- Application ID:', app.id);
      console.log('- Student Name:', app.student?.name);
      console.log('- Application Status:', app.status);
      console.log('- Student Sponsored Field:', app.student?.sponsored); // This should now be included
      console.log('- Has Sponsorships Array:', Array.isArray(app.sponsorships));
      
      console.log('\nFull Student Object Keys:', Object.keys(app.student || {}));
    }
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testAPI();