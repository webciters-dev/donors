// test-duplicate-registration.js
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

console.log('🧪 Testing duplicate email registration prevention...\n');

const testEmail = 'duplicate-test@example.com';
const testStudent = {
  name: 'Test Student',
  email: testEmail,
  password: 'password123',
  gender: 'M',
  personalIntroduction: 'Test student for duplicate email test'
};

async function testDuplicateRegistration() {
  try {
    console.log('1️⃣ First registration attempt...');
    const response1 = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStudent)
    });
    
    const result1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    console.log(`   Response:`, result1);
    
    console.log('\n2️⃣ Second registration attempt (should be rejected)...');
    const response2 = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testStudent,
        name: 'Different Name' // Different name but same email
      })
    });
    
    const result2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    console.log(`   Response:`, result2);
    
    if (response2.status === 409) {
      console.log('\n✅ SUCCESS: Duplicate email registration properly rejected!');
    } else {
      console.log('\n❌ FAILED: Duplicate email registration was allowed!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDuplicateRegistration();