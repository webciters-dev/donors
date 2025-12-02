// Simple credential verification
import dotenv from 'dotenv';
dotenv.config();

console.log(' Email Credentials Verification');
console.log('=================================');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Password Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
console.log('Password Characters:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.split('').map(c => c === '#' ? '[HASH]' : c === '*' ? '[ASTERISK]' : c).join('') : 'NOT SET');
console.log('');

// Check for common issues
console.log(' Checking for Common Issues:');
console.log('==============================');

const password = process.env.EMAIL_PASS;
if (password) {
  console.log(' Password is set');
  console.log(' Password details:');
  console.log('   - Length:', password.length, 'characters');
  console.log('   - Starts with:', password.substring(0, 3));
  console.log('   - Ends with:', password.slice(-3));
  console.log('   - Contains #:', password.includes('#') ? 'YES' : 'NO');
  console.log('   - Contains *:', password.includes('*') ? 'YES' : 'NO');
  console.log('');
  
  // Base64 decode the auth string to see what's being sent
  const authString = Buffer.from(`\0${process.env.EMAIL_USER}\0${password}`).toString('base64');
  console.log(' Authentication string being sent:');
  console.log('   Base64:', authString.substring(0, 20) + '...');
} else {
  console.log(' Password is NOT set');
}

console.log('');
console.log(' Troubleshooting suggestions:');
console.log('================================');
console.log('1. Verify email account exists: noreply@aircrew.nl');
console.log('2. Verify password in DirectAdmin matches exactly: RoG*741#NoR');
console.log('3. Check if account needs activation time (5-10 minutes)');
console.log('4. Verify SMTP is enabled for the account in DirectAdmin');
console.log('5. Check for any IP restrictions or security settings');
console.log('');
console.log('Current expected credentials:');
console.log('Username: noreply@aircrew.nl');
console.log('Password: RoG*741#NoR');
console.log('Expected length: 11 characters');