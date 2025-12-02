// Test email functionality
import 'dotenv/config';
import { sendStudentWelcomeEmail } from './src/lib/emailService.js';

console.log(' Testing email service...');

// Debug environment variables
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);

sendStudentWelcomeEmail({
  email: 'test@example.com',
  name: 'Test Student'
}).then(result => {
  console.log(' Email test result:', result);
}).catch(error => {
  console.error(' Email test failed:', error);
});