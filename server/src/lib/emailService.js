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

export async function sendStudentCaseWorkerAssignedEmail({
  email,
  studentName,
  caseWorkerName,
  applicationId,
  message
}) {
  try {
    const transporter = createTransporter();
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: ' Case Worker Assigned to Your Application - AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;"> Case Worker Assigned to Your Application</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${studentName.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Great news! A dedicated case worker has been assigned to review your scholarship application. 
                They will verify your documents and provide guidance throughout the process.
              </p>
              
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #065f46; margin-top: 0;"> Your Case Worker</h3>
                <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                  <p style="margin: 8px 0;"><strong>Name:</strong> ${caseWorkerName}</p>
                  <p style="margin: 8px 0;"><strong>Role:</strong> Application Reviewer</p>
                  <p style="margin: 8px 0;"><strong>Application ID:</strong> ${applicationId.slice(-8)}</p>
                </div>
              </div>
              
              <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;"> What to Expect</h3>
                <ul style="color: #1e3a8a; margin: 10px 0; padding-left: 20px;">
                  <li><strong>Document Verification:</strong> Your case worker will review all submitted documents</li>
                  <li><strong>Possible Requests:</strong> You may be asked to upload additional documents if needed</li>
                  <li><strong>Regular Updates:</strong> You'll receive messages if we need more information</li>
                  <li><strong>Transparent Process:</strong> You'll be informed at each stage of review</li>
                </ul>
              </div>
              
              ${message ? `
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;"> Message from Case Worker</h3>
                <p style="color: #374151; margin: 0; line-height: 1.6;">
                  "${message}"
                </p>
              </div>
              ` : ''}
              
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">⏱️ Next Steps</h3>
                <ol style="color: #78350f; margin: 10px 0; padding-left: 20px;">
                  <li>Log in to your AWAKE Connect account</li>
                  <li>Review your application status</li>
                  <li>Check messages for any document requests from your case worker</li>
                  <li>Upload any additional documents if requested</li>
                  <li>Respond promptly to keep your application moving forward</li>
                </ol>
              </div>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Your case worker is here to help you succeed. If you have questions about your application, 
                please check the messages section in your dashboard or contact our support team.
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
                If you have any questions about your case worker or application, please contact our support team.<br>
                <a href="mailto:support@awakeconnect.org" style="color: #2563eb;">support@awakeconnect.org</a>
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
    
    console.log(' Student Case Worker Assignment Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error(' Failed to send student case worker assignment email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * RESERVED FOR FUTURE USE - Generic student notification email
 * 
 * Purpose: Send generic messages/notifications to students
 * Usage: Can be used by messaging system or admin notifications
 * 
 * Parameters:
 * - email: Student email
 * - name: Student name
 * - message: Custom message text
 * - applicationId: Related application ID
 * 
 * Example use case: Admin sending important announcements to students
 * 
 * NOTE: Currently not called anywhere in the codebase (reserved for future features)
 * Keep this function for future expansion of notification system
 */
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

export async function sendBoardMemberWelcomeEmail({ email, name, title }) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Welcome to AWAKE Connect Board - Student Interview Assignment',
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
              <h2 style="color: #111827; margin-bottom: 15px;">Welcome to the AWAKE Connect Board</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name.split(' ')[0]},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                You have been added to the AWAKE Connect Board as <strong>${title}</strong>. Thank you for volunteering your time to help evaluate student scholarship applications.
              </p>
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">Your Role & Responsibilities:</h3>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li>Participate in student interviews when scheduled</li>
                  <li>Evaluate students based on academic merit and financial need</li>
                  <li>Provide fair and constructive feedback</li>
                  <li>Help make scholarship award decisions</li>
                </ul>
              </div>
              
              <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #047857; margin-top: 0;">How It Works:</h3>
                <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  <li>You'll receive email notifications when interviews are scheduled</li>
                  <li>Join interviews via provided meeting links (Zoom, etc.)</li>
                  <li>Participate in student evaluation discussions</li>
                  <li>Your input helps determine scholarship awards</li>
                </ol>
              </div>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">What's Next:</h3>
              <p style="color: #374151; margin: 10px 0;">You'll receive email notifications when:</p>
              <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                <li>Student interviews are scheduled</li>
                <li>Meeting details and candidate information is available</li>
                <li>Your participation is requested</li>
              </ul>
              <p style="color: #374151; margin: 10px 0 0 0;"><strong>No login required</strong> - everything is handled via email notifications.</p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions about your role or responsibilities, please contact:<br>
                <a href="mailto:admin@awakeconnect.org" style="color: #2563eb;">admin@awakeconnect.org</a>
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
    console.log(' Board Member Welcome Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send board member welcome email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail({ email, name, resetToken, userRole }) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetUrl = `${loginUrl}/#/reset-password/${resetToken}`;  // Added # for HashRouter
    
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
      subject: ' Interview Scheduled - AWAKE Connect Board Review',
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
              <h2 style="color: #111827; margin-bottom: 15px;"> Interview Scheduled - Board Review</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Great news! Your scholarship application has reached the final stage. 
                We have scheduled an interview with our board members to discuss your application and educational goals.
              </p>
              
              <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;"> Interview Details</h3>
                <div style="color: #374151; margin: 10px 0;">
                  <p style="margin: 8px 0;"><strong> Date:</strong> ${scheduledDate}</p>
                  <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${scheduledTime}</p>
                  <p style="margin: 8px 0;"><strong>🆔 Interview ID:</strong> ${interviewId.slice(-8)}</p>
                  <p style="margin: 8px 0;"><strong> Application ID:</strong> ${applicationId.slice(-8)}</p>
                </div>
                ${meetingLink ? `
                <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 5px 0; color: #1e40af;"><strong> Meeting Link:</strong></p>
                  <a href="${meetingLink}" style="color: #2563eb; word-break: break-all; font-family: monospace;">${meetingLink}</a>
                </div>
                ` : ''}
              </div>
              
              ${boardMembers && boardMembers.length > 0 ? `
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;"> Interview Panel</h3>
                <p style="color: #374151; margin-bottom: 10px;">You will be interviewed by:</p>
                <ul style="color: #374151; margin: 10px 0; padding-left: 20px;">
                  ${boardMembers.map(member => `<li style="margin: 5px 0;"><strong>${member.name}</strong> - ${member.title || 'Board Member'}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              ${notes ? `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;"> Additional Notes</h3>
                <p style="color: #374151; margin: 0;">${notes}</p>
              </div>
              ` : ''}
              
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #065f46; margin-top: 0;"> Interview Tips</h3>
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
                 Join Meeting
              </a>
              ` : ''}
              <a href="${loginUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                 View Application
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
    console.log(' Interview Scheduled (Student) Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send interview scheduled (student) email:', error);
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
      subject: ' Board Interview Assignment - AWAKE Connect',
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
              <h2 style="color: #111827; margin-bottom: 15px;"> Board Interview Assignment</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                Dear ${name},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                You have been assigned to conduct a board interview for a scholarship applicant. 
                ${isChairperson ? 'You are designated as the <strong>Chairperson</strong> for this interview.' : 'Your expertise will be valuable in evaluating this candidate.'}
              </p>
              
              <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;"> Interview Details</h3>
                <div style="color: #374151; margin: 10px 0;">
                  <p style="margin: 8px 0;"><strong> Student:</strong> ${studentName}</p>
                  <p style="margin: 8px 0;"><strong> Date:</strong> ${scheduledDate}</p>
                  <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${scheduledTime}</p>
                  <p style="margin: 8px 0;"><strong>🆔 Interview ID:</strong> ${interviewId.slice(-8)}</p>
                  <p style="margin: 8px 0;"><strong> Application ID:</strong> ${applicationId.slice(-8)}</p>
                  ${isChairperson ? '<p style="margin: 8px 0; color: #059669;"><strong> Role: Chairperson</strong></p>' : ''}
                </div>
                ${meetingLink ? `
                <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
                  <p style="margin: 5px 0; color: #1e40af;"><strong> Meeting Link:</strong></p>
                  <a href="${meetingLink}" style="color: #2563eb; word-break: break-all; font-family: monospace;">${meetingLink}</a>
                </div>
                ` : ''}
              </div>
              
              ${notes ? `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;"> Interview Notes</h3>
                <p style="color: #374151; margin: 0;">${notes}</p>
              </div>
              ` : ''}
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;"> Your Responsibilities</h3>
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
                 Join Interview
              </a>
              ` : ''}
              <a href="${loginUrl}/admin" 
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                 Review Application
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
    console.log(' Interview Scheduled (Board Member) Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send interview scheduled (board member) email:', error);
    return { success: false, error: error.message };
  }
}

// =============================
// MISSING NOTIFICATION EMAIL FUNCTIONS
// =============================

export async function sendAdminFieldReviewCompletedEmail({
  email,
  adminName,
  caseWorkerName,
  studentName,
  applicationId,
  fielderRecommendation,
  verificationScore,
  adminNotesRequired
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const reviewUrl = `${loginUrl}/admin/applications/${applicationId}`;
    
    const recommendationColor = 
      fielderRecommendation === 'STRONGLY_APPROVE' ? '#10b981' :
      fielderRecommendation === 'APPROVE' ? '#3b82f6' :
      fielderRecommendation === 'CONDITIONAL' ? '#f59e0b' :
      '#ef4444';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: ` Field Review Completed - ${studentName} (${fielderRecommendation || 'Pending'})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111827; margin: 0; font-size: 28px;"> Field Review Complete</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Student Sponsorship Platform</p>
            </div>
            
            <!-- Alert Section -->
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
              <h3 style="color: #1e40af; margin-top: 0;"> Review Ready for Admin Decision</h3>
              <p style="color: #1e3a8a; margin: 5px 0;">
                Case worker <strong>${caseWorkerName}</strong> has completed field verification for student <strong>${studentName}</strong>.
              </p>
            </div>
            
            <!-- Student Information -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Student Information</h3>
              <div style="display: grid; gap: 10px;">
                <p style="margin: 5px 0;"><strong>Student Name:</strong> ${studentName}</p>
                <p style="margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p>
                <p style="margin: 5px 0;"><strong>Case Worker:</strong> ${caseWorkerName}</p>
              </div>
            </div>
            
            <!-- Verification Results -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;"> Verification Results</h3>
              
              ${fielderRecommendation ? `
              <div style="margin: 15px 0;">
                <strong>Case Worker Recommendation:</strong>
                <div style="background-color: ${recommendationColor}; color: white; padding: 8px 15px; border-radius: 15px; display: inline-block; margin-left: 10px; font-weight: bold;">
                  ${fielderRecommendation.replace('_', ' ')}
                </div>
              </div>
              ` : ''}
              
              ${verificationScore ? `
              <div style="margin: 15px 0;">
                <strong>Verification Score:</strong>
                <div style="background-color: #e5e7eb; padding: 8px 15px; border-radius: 6px; display: inline-block; margin-left: 10px;">
                  <strong style="color: #374151;">${verificationScore}%</strong>
                </div>
              </div>
              ` : ''}
              
              ${adminNotesRequired ? `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <div style="color: #92400e; font-weight: bold; margin-bottom: 5px;">️ Admin Attention Required:</div>
                <div style="color: #78350f;">${adminNotesRequired}</div>
              </div>
              ` : ''}
            </div>
            
            <!-- Action Required -->
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <h3 style="color: #dc2626; margin-top: 0;"> Action Required</h3>
              <p style="color: #991b1b; margin: 0;">
                Please review the case worker's assessment and make a final decision on this application.
              </p>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" 
                 style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                 Review Application Now
              </a>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #111827; margin-top: 0;">Next Steps:</h3>
              <ol style="color: #374151; margin: 10px 0; padding-left: 20px;">
                <li>Review the detailed field verification report</li>
                <li>Examine case worker's recommendation and notes</li>
                <li>Check all uploaded documents and verification status</li>
                <li>Make final decision: Approve, Reject, or Request Additional Information</li>
                <li>Add admin notes for transparency and record-keeping</li>
              </ol>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This is an automated notification from the AWAKE Connect admin system.<br>
                Please review and take action promptly to maintain application processing efficiency.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                AWAKE Connect - Student Sponsorship Platform
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(' Admin Field Review Completed Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send admin field review completed email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendDonorPaymentConfirmationEmail({
  email,
  donorName,
  studentName,
  amount,
  currency,
  paymentMethod,
  transactionId,
  sponsorshipId
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: ` Payment Confirmed - Supporting ${studentName} (${formattedAmount})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111827; margin: 0; font-size: 28px;"> Payment Confirmed</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Student Sponsorship Platform</p>
            </div>
            
            <!-- Success Message -->
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
              <h3 style="color: #065f46; margin-top: 0;"> Thank You for Your Generosity!</h3>
              <p style="color: #047857; margin: 5px 0;">
                Your payment has been successfully processed. You are now officially supporting <strong>${studentName}</strong>'s educational journey!
              </p>
            </div>
            
            <!-- Payment Details -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;"> Payment Details</h3>
              <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <div style="background-color: #f3f4f6; padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
                  <strong>Transaction Information</strong>
                </div>
                <div style="padding: 15px;">
                  <p style="margin: 8px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
                  <p style="margin: 8px 0;"><strong>Student:</strong> ${studentName}</p>
                  <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${paymentMethod || 'Credit Card'}</p>
                  <p style="margin: 8px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
                  <p style="margin: 8px 0;"><strong>Sponsorship ID:</strong> ${sponsorshipId}</p>
                  <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <!-- Impact Message -->
            <div style="background-color: #ede9fe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #5b21b6; margin-top: 0;"> Your Impact</h3>
              <p style="color: #6b21a8;">
                Your generous contribution of <strong>${formattedAmount}</strong> will directly support ${studentName}'s education. 
                This sponsorship helps cover tuition fees, books, and living expenses, making higher education accessible.
              </p>
              <p style="color: #6b21a8; margin-top: 15px;">
                You will receive regular updates on ${studentName}'s academic progress and can communicate directly through our platform.
              </p>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;"> What Happens Next</h3>
              <ol style="color: #78350f; margin: 10px 0; padding-left: 20px;">
                <li>Your payment is being processed and verified</li>
                <li>${studentName} will be notified about your sponsorship</li>
                <li>You'll receive access to student progress updates</li>
                <li>Direct messaging with the student will be activated</li>
                <li>Regular progress reports will be sent to your email</li>
              </ol>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}/donor" 
                 style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                 View Dashboard
              </a>
              <a href="${loginUrl}/donor/students" 
                 style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
                ‍ View Student Profile
              </a>
            </div>
            
            <!-- Tax Information -->
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #4b5563; margin: 0; font-size: 14px;">
                <strong>Tax Information:</strong> Please retain this email as a record of your charitable contribution. 
                A formal donation receipt will be sent separately for tax purposes.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Thank you for making a difference in a student's life through education.<br>
                If you have any questions, please contact us at <a href="mailto:support@aircrew.nl" style="color: #2563eb;">support@aircrew.nl</a>
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
    console.log(' Donor Payment Confirmation Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send donor payment confirmation email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendStudentSponsorshipNotificationEmail({
  email,
  studentName,
  donorName,
  amount,
  currency,
  sponsorshipId,
  message
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: ` Great News! You Have a New Sponsor - ${formattedAmount} Sponsorship`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111827; margin: 0; font-size: 32px;"> Congratulations!</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Student Sponsorship Platform</p>
            </div>
            
            <!-- Celebration Banner -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
              <h2 style="margin: 0; font-size: 24px;"> You Have Been Sponsored! </h2>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your educational journey just got the support it deserves</p>
            </div>
            
            <!-- Sponsor Information -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0;"> Sponsor Information</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px;">
                <p style="margin: 8px 0;"><strong>Sponsor Name:</strong> ${donorName}</p>
                <p style="margin: 8px 0;"><strong>Sponsorship Amount:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">${formattedAmount}</span></p>
                <p style="margin: 8px 0;"><strong>Sponsorship ID:</strong> ${sponsorshipId}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            ${message ? `
            <!-- Personal Message -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;"> Message from Your Sponsor</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; font-style: italic; color: #374151;">
                "${message}"
              </div>
            </div>
            ` : ''}
            
            <!-- What This Means -->
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;"> What This Means for You</h3>
              <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li><strong>Financial Support:</strong> ${formattedAmount} towards your educational expenses</li>
                <li><strong>Mentorship Opportunity:</strong> Connect directly with your sponsor for guidance</li>
                <li><strong>Progress Sharing:</strong> Share your academic achievements and milestones</li>
                <li><strong>Networking:</strong> Build valuable professional relationships</li>
                <li><strong>Recognition:</strong> Your hard work and potential have been recognized</li>
              </ul>
            </div>
            
            <!-- Next Steps -->
            <div style="background-color: #ede9fe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #5b21b6; margin-top: 0;"> Your Next Steps</h3>
              <ol style="color: #6b21a8; margin: 10px 0; padding-left: 20px;">
                <li>Log in to your dashboard to see sponsor details</li>
                <li>Send a thank you message to your sponsor</li>
                <li>Update your academic progress regularly</li>
                <li>Stay engaged with your studies and goals</li>
                <li>Share your journey and achievements</li>
              </ol>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}/student" 
                 style="background-color: #059669; color: white; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px; font-size: 16px;">
                 View Dashboard
              </a>
              <a href="${loginUrl}/student/messages" 
                 style="background-color: #3b82f6; color: white; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px; font-size: 16px;">
                 Thank Your Sponsor
              </a>
            </div>
            
            <!-- Responsibilities -->
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <h3 style="color: #dc2626; margin-top: 0;"> Your Responsibilities</h3>
              <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px;">
                <li>Maintain good academic standing</li>
                <li>Provide regular progress updates</li>
                <li>Use funds responsibly for educational purposes</li>
                <li>Communicate respectfully with your sponsor</li>
                <li>Show gratitude and appreciation</li>
              </ul>
            </div>
            
            <!-- Support Information -->
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #374151; margin-top: 0;"> Need Help?</h4>
              <p style="color: #4b5563; margin: 0; font-size: 14px;">
                If you have any questions about your sponsorship or need assistance, please contact our support team:
                <br><a href="mailto:support@aircrew.nl" style="color: #2563eb;">support@aircrew.nl</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Congratulations on this amazing milestone! Your dedication to education has been recognized.<br>
                Make the most of this opportunity and continue striving for excellence.
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
    console.log(' Student Sponsorship Notification Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send student sponsorship notification email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendApplicationApprovedStudentEmail({
  email,
  studentName,
  applicationId,
  amount,
  currency,
  university,
  program
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: ` Application APPROVED! Ready for Sponsorship - ${formattedAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111827; margin: 0; font-size: 32px;"> APPROVED!</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Student Sponsorship Platform</p>
            </div>
            
            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
              <h2 style="margin: 0; font-size: 24px;"> Your Application Has Been Approved!</h2>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">You're now eligible for sponsorship matching</p>
            </div>
            
            <!-- Application Details -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0;"> Application Details</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px;">
                <p style="margin: 8px 0;"><strong>Student:</strong> ${studentName}</p>
                <p style="margin: 8px 0;"><strong>University:</strong> ${university}</p>
                <p style="margin: 8px 0;"><strong>Program:</strong> ${program}</p>
                <p style="margin: 8px 0;"><strong>Amount Needed:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">${formattedAmount}</span></p>
                <p style="margin: 8px 0;"><strong>Application ID:</strong> ${applicationId}</p>
                <p style="margin: 8px 0;"><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <!-- What Happens Next -->
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;"> What Happens Next</h3>
              <ol style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li><strong>Marketplace Activation:</strong> Your profile is now live for potential sponsors to view</li>
                <li><strong>Sponsor Matching:</strong> Our system will match you with suitable sponsors</li>
                <li><strong>Direct Applications:</strong> Donors can now sponsor you directly</li>
                <li><strong>Progress Updates:</strong> Keep your profile active with regular updates</li>
                <li><strong>Communication:</strong> Engage with potential sponsors through our platform</li>
              </ol>
            </div>
            
            <!-- Important Reminders -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">⭐ Important Reminders</h3>
              <ul style="color: #78350f; margin: 10px 0; padding-left: 20px;">
                <li><strong>Stay Active:</strong> Log in regularly and update your progress</li>
                <li><strong>Complete Profile:</strong> Ensure all information is accurate and current</li>
                <li><strong>Professional Communication:</strong> Maintain respectful interactions with sponsors</li>
                <li><strong>Academic Excellence:</strong> Continue performing well in your studies</li>
                <li><strong>Documentation:</strong> Keep all academic records updated</li>
              </ul>
            </div>
            
            <!-- Eligibility Status -->
            <div style="background-color: #ede9fe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #5b21b6; margin-top: 0;"> Your Status</h3>
              <div style="display: grid; gap: 10px;">
                <div style="background-color: white; padding: 10px; border-radius: 4px; border-left: 4px solid #10b981;">
                  <strong style="color: #065f46;"> Application Status:</strong> <span style="color: #10b981;">APPROVED</span>
                </div>
                <div style="background-color: white; padding: 10px; border-radius: 4px; border-left: 4px solid #3b82f6;">
                  <strong style="color: #1e40af;"> Sponsorship Status:</strong> <span style="color: #3b82f6;">READY FOR MATCHING</span>
                </div>
                <div style="background-color: white; padding: 10px; border-radius: 4px; border-left: 4px solid #f59e0b;">
                  <strong style="color: #92400e;"> Profile Status:</strong> <span style="color: #f59e0b;">LIVE IN MARKETPLACE</span>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}/student" 
                 style="background-color: #059669; color: white; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px; font-size: 16px;">
                 View Dashboard
              </a>
              <a href="${loginUrl}/student/profile" 
                 style="background-color: #3b82f6; color: white; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px; font-size: 16px;">
                ️ Update Profile
              </a>
            </div>
            
            <!-- Tips for Success -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #374151; margin-top: 0;"> Tips for Success</h3>
              <ul style="color: #4b5563; margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li>Upload a professional profile photo if you haven't already</li>
                <li>Write compelling personal and academic stories</li>
                <li>Regularly update your academic progress and achievements</li>
                <li>Respond promptly to sponsor messages and inquiries</li>
                <li>Be genuine and authentic in all communications</li>
                <li>Show gratitude and appreciation to potential sponsors</li>
              </ul>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Congratulations on reaching this milestone! Your educational journey is now one step closer to reality.<br>
                Keep working hard and stay connected with our community.
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
    console.log(' Application Approved Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send application approved email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendApplicationRejectedStudentEmail({
  email,
  studentName,
  applicationId,
  rejectionReason,
  adminNotes
}) {
  try {
    const transporter = createTransporter();
    
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: ` Application Update - Further Review Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #111827; margin: 0; font-size: 28px;"> Application Update</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Student Sponsorship Platform</p>
            </div>
            
            <!-- Status Banner -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
              <h3 style="color: #92400e; margin-top: 0;"> Application Requires Further Review</h3>
              <p style="color: #78350f; margin: 5px 0;">
                Thank you for your application. After careful review, we need some additional information or improvements before we can proceed.
              </p>
            </div>
            
            <!-- Application Information -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;"> Application Details</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <p style="margin: 8px 0;"><strong>Student:</strong> ${studentName}</p>
                <p style="margin: 8px 0;"><strong>Application ID:</strong> ${applicationId}</p>
                <p style="margin: 8px 0;"><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Requires Additional Information</span></p>
              </div>
            </div>
            
            ${rejectionReason ? `
            <!-- Review Comments -->
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #dc2626; margin-top: 0;"> Review Comments</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px;">
                <p style="color: #374151; margin: 0; line-height: 1.6;">${rejectionReason}</p>
              </div>
            </div>
            ` : ''}
            
            ${adminNotes ? `
            <!-- Additional Notes -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;"> Additional Notes</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; margin: 0; line-height: 1.6;">${adminNotes}</p>
              </div>
            </div>
            ` : ''}
            
            <!-- What You Can Do -->
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;"> Next Steps</h3>
              <ol style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li><strong>Review Feedback:</strong> Carefully read all comments and suggestions above</li>
                <li><strong>Address Issues:</strong> Make the necessary improvements to your application</li>
                <li><strong>Update Documents:</strong> Upload any missing or updated documents</li>
                <li><strong>Revise Information:</strong> Update your profile with accurate details</li>
                <li><strong>Resubmit:</strong> Submit your improved application for review</li>
              </ol>
            </div>
            
            <!-- Encouragement -->
            <div style="background-color: #ede9fe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #5b21b6; margin-top: 0;"> Don't Give Up!</h3>
              <p style="color: #6b21a8; line-height: 1.6;">
                This is not a rejection, but an opportunity to strengthen your application. Many successful students 
                have gone through this review process. Take this feedback as valuable guidance to improve your 
                chances of approval and eventual sponsorship.
              </p>
              <p style="color: #6b21a8; margin-top: 15px;">
                <strong>Remember:</strong> The review process ensures that only the most prepared students enter 
                our sponsorship marketplace, which increases your chances of finding a suitable sponsor.
              </p>
            </div>
            
            <!-- Common Issues -->
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;"> Common Areas for Improvement</h3>
              <ul style="color: #4b5563; margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li><strong>Documentation:</strong> Ensure all required documents are uploaded and clearly legible</li>
                <li><strong>Academic Records:</strong> Provide complete and verified academic transcripts</li>
                <li><strong>Financial Information:</strong> Submit accurate and complete financial documentation</li>
                <li><strong>Personal Statement:</strong> Write a compelling and detailed personal introduction</li>
                <li><strong>Contact Information:</strong> Verify all contact details are current and accurate</li>
                <li><strong>Profile Completeness:</strong> Fill out all required sections of your profile</li>
              </ul>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}/student/application" 
                 style="background-color: #059669; color: white; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px; font-size: 16px;">
                 Improve Application
              </a>
              <a href="${loginUrl}/student/documents" 
                 style="background-color: #3b82f6; color: white; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px; font-size: 16px;">
                 Upload Documents
              </a>
            </div>
            
            <!-- Support Information -->
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;"> Need Help?</h4>
              <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
                If you need assistance understanding the feedback or improving your application, please don't hesitate to contact our support team:
                <br><a href="mailto:support@aircrew.nl" style="color: #2563eb;">support@aircrew.nl</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                We believe in your potential and want to help you succeed.<br>
                Use this feedback to strengthen your application and try again.
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
    console.log(' Application Rejected Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send application rejected email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send admin notification when student submits application for review (PENDING status)
 */
export async function sendApplicationSubmissionNotificationEmail({
  adminEmail,
  studentName,
  studentEmail,
  applicationId,
  university,
  program,
  amount,
  currency
}) {
  try {
    const transporter = createTransporter();
    
    const adminPortalUrl = process.env.ADMIN_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:8080';
    const applicationDetailsUrl = `${adminPortalUrl}/admin/applications/${applicationId}`;
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: adminEmail,
      subject: ` New Application Submitted for Review - ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 28px;">AWAKE Connect</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Admin Notification Portal</p>
            </div>
            
            <!-- Alert Banner -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px;"> New Application Submission</h2>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A student has submitted their application for review</p>
            </div>
            
            <!-- Student Information -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0;"> Student Information</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px;">
                <p style="margin: 8px 0;"><strong>Student Name:</strong> ${studentName}</p>
                <p style="margin: 8px 0;"><strong>Student Email:</strong> <a href="mailto:${studentEmail}" style="color: #2563eb;">${studentEmail}</a></p>
                <p style="margin: 8px 0;"><strong>University:</strong> ${university}</p>
                <p style="margin: 8px 0;"><strong>Program:</strong> ${program}</p>
                <p style="margin: 8px 0;"><strong>Funding Needed:</strong> <span style="color: #059669; font-weight: bold;">${formattedAmount}</span></p>
                <p style="margin: 8px 0;"><strong>Application ID:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${applicationId}</code></p>
                <p style="margin: 8px 0;"><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <!-- Required Actions -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;"> Next Steps</h3>
              <ol style="color: #78350f; margin: 10px 0; padding-left: 20px;">
                <li><strong>Review Documents:</strong> Verify all submitted documents are complete and authentic</li>
                <li><strong>Field Verification:</strong> Assign to a field officer for local verification if needed</li>
                <li><strong>Profile Assessment:</strong> Evaluate student's profile completeness and eligibility</li>
                <li><strong>Make Decision:</strong> Approve, request more info, or reject the application</li>
                <li><strong>Notify Student:</strong> Send decision to the student via email</li>
              </ol>
            </div>
            
            <!-- Important Notes -->
            <div style="background-color: #ede9fe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #5b21b6; margin-top: 0;"> Important Notes</h3>
              <ul style="color: #4c1d95; margin: 10px 0; padding-left: 20px;">
                <li>Check that all <strong>required documents</strong> have been uploaded</li>
                <li>Verify the student's <strong>profile completeness</strong></li>
                <li>Review any <strong>admin notes or requests</strong> previously made</li>
                <li>Contact student if <strong>additional information is needed</strong></li>
              </ul>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${applicationDetailsUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                 Review Application Now
              </a>
            </div>
            
            <!-- Application Queue -->
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="color: #065f46; margin-top: 0;"> Admin Portal</h4>
              <p style="color: #047857; margin: 0; font-size: 14px;">
                View all submitted applications and manage the review process in your admin dashboard.
                <br><a href="${adminPortalUrl}/admin/applications" style="color: #2563eb;">Go to Applications List</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This is an automated notification from AWAKE Connect.<br>
                Please review this application promptly to maintain good service for students.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                <strong>AWAKE Connect</strong> - Student Sponsorship Platform
              </p>
            </div>
            
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(' Application Submission Notification sent to admin:', adminEmail);
    console.log('Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error(' Failed to send application submission notification:', error);
    return { success: false, error: error.message };
  }
}