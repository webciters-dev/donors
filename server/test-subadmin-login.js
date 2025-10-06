// test-subadmin-login.js
// Test script to debug sub-admin login issues

const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('🔐 Testing Sub-Admin Login Issues...');
  
  // Test password hashing consistency
  const testPassword = 'TestPass123!';
  const hash1 = await bcrypt.hash(testPassword, 10);
  const hash2 = await bcrypt.hash(testPassword, 10);
  
  console.log('🧪 Password Hashing Test:');
  console.log('Original password:', testPassword);
  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);
  
  const verify1 = await bcrypt.compare(testPassword, hash1);
  const verify2 = await bcrypt.compare(testPassword, hash2);
  
  console.log('Verify hash 1:', verify1);
  console.log('Verify hash 2:', verify2);
  
  if (verify1 && verify2) {
    console.log('✅ Password hashing is working correctly');
  } else {
    console.log('❌ Password hashing has issues');
  }
}

testLogin().catch(console.error);