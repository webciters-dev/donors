// test-student-registration.js
// Test script to verify student registration with country field

const API = "http://localhost:3002";

async function testStudentRegistration() {
  console.log('🧪 Testing Student Registration with Country Field...');
  
  const testStudent = {
    name: "Test Student",
    email: `test.student.${Date.now()}@example.com`,
    password: "TestPass123!",
    university: "Test University",
    program: "Computer Science",
    gender: "M",
    country: "Pakistan", // This should now work!
    city: "Lahore",
    province: "Punjab",
    gpa: 3.5,
    gradYear: 2025,
    needUSD: 2500,
    field: "Engineering"
  };

  try {
    console.log('📤 Sending registration request...');
    const response = await fetch(`${API}/api/auth/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testStudent)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Student registration worked!');
      console.log('📋 Response:', result);
    } else {
      console.log('❌ FAILED! Registration error:');
      console.log('📋 Error:', result);
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
  }
}

// Run the test
testStudentRegistration();