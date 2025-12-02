// test-email-connection.js
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('=== EMAIL CONNECTION TEST ===');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[CONFIGURED]' : '[MISSING]');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Create transporter with same config as main app
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.aircrew.nl',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('\n=== TESTING CONNECTION ===');

try {
  // Test connection
  await transporter.verify();
  console.log(' SMTP Connection successful!');
  
  // Try sending a test email
  console.log('\n=== SENDING TEST EMAIL ===');
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
    to: 'test@example.com',
    subject: 'Email Service Test',
    text: 'This is a test email to verify the email service is working.',
    html: '<p>This is a test email to verify the email service is working.</p>'
  });
  
  console.log(' Test email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
  
} catch (error) {
  console.log(' Email test failed:');
  console.log('Error Code:', error.code);
  console.log('Error Message:', error.message);
  console.log('Full Error:', error);
}

process.exit(0);