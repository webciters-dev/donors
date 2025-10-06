// server/src/lib/emailService.js
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // For development, use Ethereal Email (test service)
  // In production, replace with your actual email service (Gmail, SendGrid, etc.)
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development: Use Ethereal Email for testing
    // Create account at https://ethereal.email/ or use environment variables
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
      }
    });
  }
};

export async function sendFieldOfficerWelcomeEmail({ 
  email, 
  name, 
  password, 
  applicationId,
  studentName 
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: '🔑 Sub Admin Assignment - AWAKE Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 28px;">AWAKE Connect</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Student Sponsorship Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #111827; margin-bottom: 15px;">Welcome, Sub Admin!</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                You have been assigned as a Sub Admin for a student application on AWAKE Connect. 
                Your expertise is needed to review and verify student documentation.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #111827; margin-top: 0;">Assignment Details:</h3>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li><strong>Student:</strong> ${studentName}</li>
                  <li><strong>Application ID:</strong> ${applicationId}</li>
                  <li><strong>Your Role:</strong> Sub Admin Review</li>
                </ul>
              </div>
            </div>
            
            <!-- Login Credentials -->
            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🔐 Your Login Credentials</h3>
              <div style="font-family: monospace; background-color: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                <p style="margin: 5px 0;"><strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a></p>
              </div>
              <p style="color: #1e40af; font-size: 14px; margin: 10px 0 0 0;">
                <strong>⚠️ Important:</strong> Please change your password after first login for security.
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                🚀 Access Sub Admin Portal
              </a>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #111827; margin-top: 0;">📋 What You Need to Do:</h3>
              <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                <li>Log in to the Sub Admin Portal using the credentials above</li>
                <li>Review the student's application and supporting documents</li>
                <li>Verify the authenticity of submitted information</li>
                <li>Request additional documentation if needed</li>
                <li>Provide your recommendation (Approve/Request Changes/Reject)</li>
              </ol>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions, please contact our support team.<br>
                <a href="mailto:support@awakeconnect.org" style="color: #2563eb;">support@awakeconnect.org</a>
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // For development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Sub Admin Welcome Email sent!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
    
  } catch (error) {
    console.error('❌ Failed to send field officer email:', error);
    throw new Error('Failed to send welcome email');
  }
}

export async function sendStudentNotificationEmail({
  email,
  name,
  message,
  applicationId
}) {
  try {
    const transporter = createTransporter();
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: '📢 New Message - AWAKE Connect Application',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">New Message on Your Application</h2>
          <p>Hello ${name},</p>
          <p>You have received a new message regarding your application:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="font-weight: bold;">${message}</p>
          </div>
          <p>Please log in to your student portal to respond:</p>
          <a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Application
          </a>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Failed to send student notification:', error);
    throw error;
  }
}