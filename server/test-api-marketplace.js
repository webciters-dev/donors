// test-api-marketplace.js
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/students/approved',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('🔍 Marketplace API Response:');
      console.log('Students returned:', result.students?.length || 0);
      
      if (result.students && result.students.length > 0) {
        result.students.forEach((student, i) => {
          console.log(`\n${i+1}. ${student.name} (${student.email})`);
          console.log(`   University: ${student.university}`);
          console.log(`   Program: ${student.program}`);
          console.log(`   Need: $${student.needUsd || student.needUSD}`);
          console.log(`   Sponsored: $${student.sponsored || 0}`);
          console.log(`   Remaining: $${student.remainingNeed || 0}`);
          console.log(`   Is Approved: ${student.isApproved}`);
        });
      } else {
        console.log('❌ No students found in marketplace');
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();