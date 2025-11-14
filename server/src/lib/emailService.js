// server/src/lib/emailService.js
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Use professional SMTP configuration from .env
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.aircrew.nl',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      // Disable certificate validation for development/self-signed certs
      rejectUnauthorized: false
    },
    // Rate limiting to prevent "too many emails" errors
    pool: true,
    maxConnections: 1,
    maxMessages: 10,
    rateDelta: 60000, // 1 minute
    rateLimit: 5 // max 5 emails per minute
  });
};

export async function sendFieldOfficerWelcomeEmail({ 
  email, 
  name, 
  password
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Welcome to AWAKE Connect - Case Worker Registration',
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
              <h2 style="color: #111827; margin-bottom: 15px;">Welcome to AWAKE Connect!</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Welcome to AWAKE Connect. You have been registered as a Case Worker on our platform. 
                Your role will be to review student applications and help us identify deserving candidates for educational sponsorship.
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                As a Case Worker, you will review applications, verify documents, and make recommendations to help students access educational opportunities.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #111827; margin-top: 0;">Your responsibilities include:</h3>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li>Review student applications and supporting documents</li>
                  <li>Verify authenticity of submitted information</li>
                  <li>Make recommendations to approve, request changes, or reject applications</li>
                  <li>Guide students through the application process when needed</li>
                </ul>
              </div>
              
              <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="color: #047857; margin: 0; font-size: 14px;">
                  You will receive a separate email when your first student is assigned for review.
                </p>
              </div>
            </div>
            
            <!-- Login Credentials -->
            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Your Login Information</h3>
              <div style="font-family: monospace; background-color: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                <p style="margin: 5px 0;"><strong>Portal URL:</strong> <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a></p>
              </div>
              <p style="color: #1e40af; font-size: 14px; margin: 10px 0 0 0;">
                <strong>Important:</strong> Please change your password after your first login.
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Access Portal
              </a>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #111827; margin-top: 0;">Getting Started:</h3>
              <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                <li>Log in using the credentials provided above</li>
                <li>Change your password for security</li>
                <li>Familiarize yourself with the portal interface</li>
                <li>Wait for your first student assignment</li>
                <li>Review applications thoroughly and provide clear recommendations</li>
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
    
    // Log successful email sending
    console.log('Case Worker Registration Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send sub admin email:', error);
    throw new Error('Failed to send welcome email');
  }
}

export async function sendCaseWorkerAssignmentEmail({
  email,
  caseWorkerName,
  studentName,
  applicationId,
  studentEmail
}) {
  try {
    const transporter = createTransporter();
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'New Student Assignment - AWAKE Connect',
      html: `
        <div style="background-color: #f8fafc; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 24px;">AWAKE Connect</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Student Sponsorship Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #111827; margin-bottom: 15px;">New Student Assignment</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Hello ${caseWorkerName.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                A new student has been assigned to you for review. Please log in to your portal to begin reviewing their application.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #111827; margin-top: 0;">Assignment Details:</h3>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li><strong>Student Name:</strong> ${studentName}</li>
                  <li><strong>Student Email:</strong> ${studentEmail}</li>
                  <li><strong>Application ID:</strong> ${applicationId}</li>
                  <li><strong>Status:</strong> Pending Review</li>
                </ul>
              </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Review Application
              </a>
            </div>
            
            <!-- Review Steps -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #111827; margin-top: 0;">Review Process:</h3>
              <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                <li>Log in to your portal</li>
                <li>Review the application and supporting documents</li>
                <li>Verify submitted information</li>
                <li>Request additional documentation if needed</li>
                <li>Provide your recommendation</li>
              </ol>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions about this assignment, please contact our support team.<br>
                <a href="mailto:support@awakeconnect.org" style="color: #2563eb;">support@awakeconnect.org</a>
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log successful email sending
    console.log('Case Worker Assignment Email sent successfully!');
    console.log(`Student: ${studentName} assigned to: ${caseWorkerName} (${email})`);
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send case worker assignment email:', error);
    throw new Error('Failed to send assignment email');
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
      subject: 'New Message - AWAKE Connect Application',
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
              <h2 style="color: #111827; margin-bottom: 15px;">New Message on Your Application</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                You have received a new message regarding your application:
              </p>
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <p style="color: #374151; margin: 0; font-weight: bold;">${message}</p>
              </div>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Please log in to your student portal to respond.
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Application
              </a>
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
    console.log('Student Notification Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send student notification:', error);
    throw error;
  }
}

export async function sendDocumentUploadNotification({ 
  email, 
  name, 
  studentName,
  documentName,
  applicationId 
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'New Document Uploaded - AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;">New Document Uploaded</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                <strong>${studentName}</strong> has uploaded a new document for review:
              </p>
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <p style="color: #0369a1; margin: 0; font-weight: bold; font-size: 16px;">
                  ${documentName}
                </p>
              </div>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Please log in to your dashboard to review the uploaded document and continue the field verification process.
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}/sub-admin/review/${applicationId}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Review Document
              </a>
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
    console.log(`Document upload notification sent to ${email}:`, info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send document upload notification:', error);
    // Don't throw error - we don't want document upload to fail if email fails
    return { success: false, error: error.message };
  }
}

// NEW EMAIL FUNCTIONS

export async function sendStudentWelcomeEmail({ email, name }) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Welcome to AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;">Welcome to AWAKE Connect</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Your AWAKE Connect account has been created successfully. You can now complete your student profile and submit your application for educational funding.
              </p>
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">Next Steps:</h3>
                <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li>Complete your student profile</li>
                  <li>Submit your application with required documents</li>
                  <li>Wait for review and verification</li>
                  <li>Connect with potential sponsors once approved</li>
                </ol>
              </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Complete Your Profile
              </a>
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
    console.log('Student Welcome Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send student welcome email:', error);
    // Don't throw error - we don't want registration to fail if email fails
    return { success: false, error: error.message };
  }
}

export async function sendDonorWelcomeEmail({ email, name, organization }) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Welcome to AWAKE Connect - Thank You for Supporting Education',
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
              <h2 style="color: #111827; margin-bottom: 15px;">Welcome to AWAKE Connect</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Thank you for joining AWAKE Connect as a donor. Your support for education will make a real difference in students' lives.
              </p>
              
              ${organization ? `
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                We're honored to welcome <strong>${organization}</strong> to our community of education supporters.
              </p>
              ` : ''}
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">How It Works:</h3>
                <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li>Browse verified student profiles and applications</li>
                  <li>Choose students whose stories inspire you</li>
                  <li>Provide direct financial support for their education</li>
                  <li>Receive updates on their academic progress</li>
                  <li>Build meaningful connections with sponsored students</li>
                </ol>
              </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}/donor-dashboard" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Explore Student Profiles
              </a>
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
    console.log('Donor Welcome Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send donor welcome email:', error);
    // Don't throw error - we don't want registration to fail if email fails
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail({ email, name, resetToken, userRole }) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetUrl = `${loginUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Password Reset Request - AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;">Password Reset Request</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${(name || 'User').split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                We received a request to reset your password for your AWAKE Connect account. 
                Click the button below to create a new password.
              </p>
              
              <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  <strong>Security Notice:</strong> This reset link will expire in 1 hour for your security. 
                  If you didn't request this reset, please ignore this email.
                </p>
              </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset My Password
              </a>
            </div>
            
            <!-- Alternative Link -->
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #374151; font-size: 14px; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #2563eb; font-size: 14px; margin: 5px 0 0 0; word-break: break-all;">
                ${resetUrl}
              </p>
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
    console.log('Password Reset Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw error - we don't want password reset to fail if email fails
    return { success: false, error: error.message };
  }
}

export async function sendApplicationConfirmationEmail({ email, name, applicationId }) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Application Submitted Successfully - AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;">Application Submitted Successfully</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Your scholarship application has been successfully submitted to AWAKE Connect. 
                We have received all your information and will begin the review process.
              </p>
              
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #065f46; margin-top: 0;">Application Details:</h3>
                <p style="color: #374151; margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Under Review</p>
              </div>
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">What Happens Next:</h3>
                <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li><strong>Document Verification:</strong> Our team will review your submitted documents</li>
                  <li><strong>Field Review:</strong> A local officer may contact you for additional verification</li>
                  <li><strong>Approval Process:</strong> Approved applications will be made visible to potential sponsors</li>
                  <li><strong>Sponsor Matching:</strong> Donors will be able to view and sponsor your education</li>
                </ol>
              </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Check Application Status
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                We'll keep you updated via email as your application progresses.<br>
                If you have any questions, please contact our support team.<br>
                <a href="mailto:support@awakeconnect.org" style="color: #2563eb;">support@awakeconnect.org</a>
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Application Confirmation Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send application confirmation email:', error);
    // Don't throw error - we don't want application submission to fail if email fails
    return { success: false, error: error.message };
  }
}

export async function sendMissingDocumentRequestEmail({ email, name, missingItems, note, applicationId }) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Additional Documents Required - AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;">Additional Documents Required</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Thank you for your scholarship application. To proceed with your application review, 
                we need you to upload the following additional documents:
              </p>
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">Required Documents:</h3>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  ${missingItems.map(item => `<li style="margin: 5px 0;">${item}</li>`).join('')}
                </ul>
              </div>
              
              ${note ? `
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">Additional Notes:</h3>
                <p style="color: #374151; margin: 0;">${note}</p>
              </div>
              ` : ''}
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Please log into your AWAKE Connect account and upload these documents as soon as possible. 
                This will help us expedite your application review process.
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Upload Documents
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions about the required documents, please contact our support team.<br>
                <a href="mailto:support@awakeconnect.org" style="color: #2563eb;">support@awakeconnect.org</a>
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Missing Document Request Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Failed to send missing document request email:', error);
    // Don't throw error - we don't want document request to fail if email fails
    return { success: false, error: error.message };
  }
}

// =============================
// INTERVIEW EMAIL FUNCTIONS
// =============================

export async function sendInterviewScheduledStudentEmail({
  email,
  name,
  interviewId,
  scheduledAt,
  meetingLink,
  boardMembers,
  notes,
  applicationId
}) {
  try {
    const transporter = createTransporter();
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const scheduledDate = new Date(scheduledAt).toLocaleDateString();
    const scheduledTime = new Date(scheduledAt).toLocaleTimeString();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: '🎯 Interview Scheduled - AWAKE Connect Board Review',
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
              <h2 style="color: #111827; margin-bottom: 15px;">🎯 Interview Scheduled - Board Review</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Great news! Your scholarship application has reached the final stage. 
                We have scheduled an interview with our board members to discuss your application and educational goals.
              </p>
              
              <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">📅 Interview Details</h3>
                <div style="color: #374151; margin: 10px 0;">
                  <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${scheduledDate}</p>
                  <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${scheduledTime}</p>
                  <p style="margin: 8px 0;"><strong>🆔 Interview ID:</strong> ${interviewId.slice(-8)}</p>
                  <p style="margin: 8px 0;"><strong>📋 Application ID:</strong> ${applicationId.slice(-8)}</p>
                </div>
                ${meetingLink ? `
                <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 5px 0; color: #1e40af;"><strong>🔗 Meeting Link:</strong></p>
                  <a href="${meetingLink}" style="color: #2563eb; word-break: break-all; font-family: monospace;">${meetingLink}</a>
                </div>
                ` : ''}
              </div>
              
              ${boardMembers && boardMembers.length > 0 ? `
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">👥 Interview Panel</h3>
                <p style="color: #374151; margin-bottom: 10px;">You will be interviewed by:</p>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  ${boardMembers.map(member => `<li style="margin: 5px 0;"><strong>${member.name}</strong> - ${member.title || 'Board Member'}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              ${notes ? `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">📝 Additional Notes</h3>
                <p style="color: #374151; margin: 0;">${notes}</p>
              </div>
              ` : ''}
              
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #065f46; margin-top: 0;">💡 Interview Tips</h3>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li>Be ready 5-10 minutes before the scheduled time</li>
                  <li>Prepare to discuss your educational goals and aspirations</li>
                  <li>Have questions ready about the sponsorship program</li>
                  <li>Ensure stable internet connection and quiet environment</li>
                  <li>Test your camera and microphone beforehand</li>
                </ul>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              ${meetingLink ? `
              <a href="${meetingLink}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                🎥 Join Meeting
              </a>
              ` : ''}
              <a href="${loginUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                📊 View Application
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you need to reschedule or have any questions, please contact us immediately.<br>
                <a href="mailto:support@aircrew.nl" style="color: #2563eb;">support@aircrew.nl</a>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                AWAKE Connect - Empowering Students Through Education
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Interview Scheduled (Student) Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Failed to send interview scheduled (student) email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendInterviewScheduledBoardMemberEmail({
  email,
  name,
  title,
  studentName,
  interviewId,
  scheduledAt,
  meetingLink,
  notes,
  applicationId,
  isChairperson = false
}) {
  try {
    const transporter = createTransporter();
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const scheduledDate = new Date(scheduledAt).toLocaleDateString();
    const scheduledTime = new Date(scheduledAt).toLocaleTimeString();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: '🎯 Board Interview Assignment - AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;">🎯 Board Interview Assignment</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                You have been assigned to conduct a board interview for a scholarship applicant. 
                ${isChairperson ? 'You are designated as the <strong>Chairperson</strong> for this interview.' : 'Your expertise will be valuable in evaluating this candidate.'}
              </p>
              
              <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">📅 Interview Details</h3>
                <div style="color: #374151; margin: 10px 0;">
                  <p style="margin: 8px 0;"><strong>👤 Student:</strong> ${studentName}</p>
                  <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${scheduledDate}</p>
                  <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${scheduledTime}</p>
                  <p style="margin: 8px 0;"><strong>🆔 Interview ID:</strong> ${interviewId.slice(-8)}</p>
                  <p style="margin: 8px 0;"><strong>📋 Application ID:</strong> ${applicationId.slice(-8)}</p>
                  ${isChairperson ? '<p style="margin: 8px 0; color: #059669;"><strong>👑 Role: Chairperson</strong></p>' : ''}
                </div>
                ${meetingLink ? `
                <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 5px 0; color: #1e40af;"><strong>🔗 Meeting Link:</strong></p>
                  <a href="${meetingLink}" style="color: #2563eb; word-break: break-all; font-family: monospace;">${meetingLink}</a>
                </div>
                ` : ''}
              </div>
              
              ${notes ? `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">📝 Interview Notes</h3>
                <p style="color: #374151; margin: 0;">${notes}</p>
              </div>
              ` : ''}
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">📋 Your Responsibilities</h3>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li>Review the student's application beforehand</li>
                  <li>Attend the interview at the scheduled time</li>
                  <li>Ask relevant questions about academic goals and financial need</li>
                  <li>Evaluate the candidate's eligibility for sponsorship</li>
                  <li>Record your decision (Approve/Reject/Abstain) in the system</li>
                  ${isChairperson ? '<li style="color: #059669;"><strong>As Chairperson: Lead the interview and coordinate panel members</strong></li>' : ''}
                </ul>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              ${meetingLink ? `
              <a href="${meetingLink}" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                🎥 Join Interview
              </a>
              ` : ''}
              <a href="${loginUrl}/admin" 
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                📊 Review Application
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you cannot attend or need to reschedule, please contact us immediately.<br>
                <a href="mailto:admin@aircrew.nl" style="color: #2563eb;">admin@aircrew.nl</a>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                AWAKE Connect - Empowering Students Through Education
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Interview Scheduled (Board Member) Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Failed to send interview scheduled (board member) email:', error);
    return { success: false, error: error.message };
  }
}