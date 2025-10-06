// server/setup-ethereal-email.cjs
const nodemailer = require('nodemailer');

async function createEtherealAccount() {
  try {
    console.log('🔧 Creating Ethereal Email test account...');
    
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Ethereal Email account created!');
    console.log('📧 Email Configuration for Development:');
    console.log('=====================================');
    console.log(`ETHEREAL_USER=${testAccount.user}`);
    console.log(`ETHEREAL_PASS=${testAccount.pass}`);
    console.log('');
    console.log('🔗 Ethereal Email Inbox:', `https://ethereal.email/messages`);
    console.log('');
    console.log('📝 Add these to your .env file:');
    console.log(`ETHEREAL_USER="${testAccount.user}"`);
    console.log(`ETHEREAL_PASS="${testAccount.pass}"`);
    console.log('');
    console.log('🎯 How it works:');
    console.log('- Emails will be sent to Ethereal\'s test inbox');
    console.log('- You can view them at https://ethereal.email/');
    console.log('- No real emails are delivered (perfect for testing)');
    console.log('- Preview URLs will show email content');
    
  } catch (error) {
    console.error('❌ Failed to create Ethereal account:', error.message);
  }
}

createEtherealAccount();