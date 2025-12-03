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
      subject: 'Welcome to AWAKE Connect - Case Worker',
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><div style="margin-bottom: 20px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">AWAKE Connect</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">You're registered as a Case Worker. Review student applications, verify documents, and provide recommendations.</p><div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p><p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p><p style="margin: 5px 0;"><strong>Portal:</strong> <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a></p></div><p style="color: #374151; margin: 0; font-size: 13px;">Change password after first login. Students will be assigned to you via email.</p></div><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Portal</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">AWAKE Connect</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${caseWorkerName.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">New student assigned: <strong>${studentName}</strong></p><p style="color: #374151; margin: 0 0 15px 0;"><strong>Email:</strong> ${studentEmail}<br><strong>Application ID:</strong> ${applicationId}</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Application</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      subject: 'Case Worker Assigned to Your Application - AWAKE Connect',
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">AWAKE Connect</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${studentName.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">Case worker assigned: <strong>${caseWorkerName}</strong><br>Application ID: <strong>${applicationId.slice(-8)}</strong></p><p style="color: #374151; margin: 0 0 15px 0;">They will verify your documents and may request additional information. Check your dashboard for messages.${message ? `<br><br><strong>Message:</strong> "${message}"` : ''}</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Application</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      subject: 'New Message - AWAKE Connect',
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">AWAKE Connect</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">New message on your application:</p><div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="margin: 0; font-size: 14px;">${message}</p></div><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Application</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">AWAKE Connect</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;"><strong>${studentName}</strong> uploaded: <strong>${documentName}</strong></p><p style="color: #374151; margin: 15px 0 0 0;">Log in to review the document.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}/sub-admin/review/${applicationId}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Document</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Welcome to AWAKE Connect</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">Your account has been created. Complete your profile and submit your application.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get Started</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Welcome to AWAKE Connect</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">Thank you for joining as a donor. Your support helps students achieve their educational goals.${organization ? ` We're honored to welcome <strong>${organization}</strong>.` : ''}</p><p style="color: #374151; margin: 0 0 15px 0;">Browse student profiles and sponsor a student to get started.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}/donor-dashboard" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Students</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Welcome to the AWAKE Connect Board</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">You've been added as <strong>${title}</strong>. You'll participate in student interviews and help evaluate scholarship applications.</p><p style="color: #374151; margin: 0 0 15px 0;">You'll receive email notifications with interview details, meeting links, and candidate information. No login required.</p><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Password Reset</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${(name || 'User').split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">Click below to reset your password. This link expires in 1 hour.</p><div style="text-align: center; margin: 20px 0;"><a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a></div><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0;">Or visit: ${resetUrl}</p><p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">If you didn't request this, ignore this email.</p><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Application Submitted</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">Your application has been received and is under review.</p><p style="color: #374151; margin: 0 0 5px 0;"><strong>Application ID:</strong> ${applicationId}</p><p style="color: #374151; margin: 0 0 15px 0;"><strong>Status:</strong> Under Review</p><p style="color: #374151; margin: 0 0 15px 0;">We'll update you via email as your application progresses through verification, field review, and sponsor matching.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Status</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Additional Documents Needed</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; margin: 0 0 15px 0;">To continue reviewing your application, please upload:</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><ul style="color: #374151; margin: 10px 0; padding-left: 20px;">${missingItems.map(item => `<li>${item}</li>`).join('')}</ul></div>${note ? `<p style="color: #374151; margin: 0 0 15px 0;"><strong>Note:</strong> ${note}</p>` : ''}<div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upload Now</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Interview Scheduled</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name},</p><p style="color: #374151; margin: 0 0 15px 0;">Your interview has been scheduled.</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="color: #374151; margin: 5px 0;"><strong>Date:</strong> ${scheduledDate}</p><p style="color: #374151; margin: 5px 0;"><strong>Time:</strong> ${scheduledTime}</p><p style="color: #374151; margin: 5px 0;"><strong>Interview ID:</strong> ${interviewId.slice(-8)}</p><p style="color: #374151; margin: 5px 0;"><strong>Application ID:</strong> ${applicationId.slice(-8)}</p></div>${meetingLink ? `<p style="color: #374151; margin: 0 0 10px 0;"><a href="${meetingLink}" style="color: #2563eb; text-decoration: none;"><strong>Join Meeting</strong></a></p>` : ''}${boardMembers && boardMembers.length > 0 ? `<p style="color: #374151; margin: 0 0 10px 0;"><strong>Panel:</strong> ${boardMembers.map(m => m.name).join(', ')}</p>` : ''}${notes ? `<p style="color: #374151; margin: 10px 0 0 0;"><strong>Notes:</strong> ${notes}</p>` : ''}<div style="text-align: center; margin: 20px 0;">${meetingLink ? `<a href="${meetingLink}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Meeting</a>` : ''}</div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 22px; margin: 0 0 15px 0;">Interview Assignment</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${name},</p><p style="color: #374151; margin: 0 0 15px 0;">You've been assigned to interview student <strong>${studentName}</strong>.${isChairperson ? ' You are the <strong>Chairperson</strong>.' : ''}</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="color: #374151; margin: 5px 0;"><strong>Date:</strong> ${scheduledDate}</p><p style="color: #374151; margin: 5px 0;"><strong>Time:</strong> ${scheduledTime}</p><p style="color: #374151; margin: 5px 0;"><strong>Interview ID:</strong> ${interviewId.slice(-8)}</p><p style="color: #374151; margin: 5px 0;"><strong>Application ID:</strong> ${applicationId.slice(-8)}</p></div>${meetingLink ? `<p style="color: #374151; margin: 0 0 10px 0;"><a href="${meetingLink}" style="color: #2563eb; text-decoration: none;"><strong>Join Interview</strong></a></p>` : ''}${notes ? `<p style="color: #374151; margin: 0 0 10px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}<div style="text-align: center; margin: 20px 0;">${meetingLink ? `<a href="${meetingLink}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Interview</a>` : ''}</div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #111827; font-size: 22px; margin: 0 0 15px 0;">Field Review Complete</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${adminName},</p><p style="color: #374151; margin: 0 0 15px 0;"><strong>${caseWorkerName}</strong> completed field verification for <strong>${studentName}</strong>.</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="color: #374151; margin: 5px 0;"><strong>Student:</strong> ${studentName}</p><p style="color: #374151; margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p><p style="color: #374151; margin: 5px 0;"><strong>Case Worker:</strong> ${caseWorkerName}</p><p style="color: #374151; margin: 5px 0;"><strong>Recommendation:</strong> ${fielderRecommendation ? fielderRecommendation.replace('_', ' ') : 'Pending'}</p>${verificationScore ? `<p style="color: #374151; margin: 5px 0;"><strong>Score:</strong> ${verificationScore}%</p>` : ''}</div>${adminNotesRequired ? `<p style="background-color: #fef3c7; color: #92400e; padding: 10px; border-radius: 6px; margin: 10px 0;"><strong>Attention:</strong> ${adminNotesRequired}</p>` : ''}<div style="text-align: center; margin: 20px 0;"><a href="${reviewUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Now</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #111827; font-size: 22px; margin: 0 0 15px 0;">Payment Confirmed</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi,</p><p style="color: #374151; margin: 0 0 15px 0;">Thank you! Your payment of <strong>${formattedAmount}</strong> to support <strong>${studentName}</strong> has been confirmed.</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="color: #374151; margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}</p><p style="color: #374151; margin: 5px 0;"><strong>Student:</strong> ${studentName}</p><p style="color: #374151; margin: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</p><p style="color: #374151; margin: 5px 0;"><strong>Sponsorship ID:</strong> ${sponsorshipId}</p><p style="color: #374151; margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p></div><p style="color: #374151; margin: 0 0 15px 0;">${studentName} will be notified of your sponsorship. You'll receive progress updates and can message the student through the platform.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}/donor" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Dashboard</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 28px; margin: 0 0 15px 0;">Congratulations!</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${studentName},</p><p style="color: #374151; margin: 0 0 15px 0;">Excellent news! You've been sponsored by <strong>${donorName}</strong> with an amount of <strong>${formattedAmount}</strong>.</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="color: #374151; margin: 5px 0;"><strong>Sponsor:</strong> ${donorName}</p><p style="color: #374151; margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}</p><p style="color: #374151; margin: 5px 0;"><strong>Sponsorship ID:</strong> ${sponsorshipId}</p></div>${message ? `<div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin: 15px 0;"><p style="color: #78350f; font-style: italic; margin: 0;"><strong>Message from sponsor:</strong> "${message}"</p></div>` : ''}<p style="color: #374151; margin: 0 0 15px 0;">Log in to view sponsor details and send a thank you message.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}/student" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Dashboard</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
            
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
      subject: `Application APPROVED! You're Now in the Marketplace`,
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #059669; font-size: 28px; margin: 0 0 15px 0;">Congratulations!</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${studentName},</p><p style="color: #374151; margin: 0 0 15px 0;">Great news! Your application has been approved and is now visible to sponsors in the marketplace.</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="color: #374151; margin: 5px 0;"><strong>University:</strong> ${university}</p><p style="color: #374151; margin: 5px 0;"><strong>Program:</strong> ${program}</p><p style="color: #374151; margin: 5px 0;"><strong>Amount Needed:</strong> ${formattedAmount}</p><p style="color: #374151; margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p></div><p style="color: #374151; margin: 0 0 15px 0;">Keep your profile updated. Sponsors will see your profile and you'll be notified immediately when matched.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Profile</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background-color: white; padding: 30px; border-radius: 8px;"><h1 style="color: #111827; font-size: 22px; margin: 0 0 15px 0;">Application Update</h1><p style="color: #374151; margin: 0 0 15px 0;">Hi ${studentName},</p><p style="color: #374151; margin: 0 0 15px 0;">After reviewing your application, we need additional information or improvements before proceeding.</p><div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;"><p style="color: #374151; margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p><p style="color: #374151; margin: 5px 0;"><strong>Status:</strong> Requires Additional Information</p></div>${rejectionReason ? `<div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin: 10px 0;"><p style="color: #92400e; margin: 0;"><strong>Reason:</strong> ${rejectionReason}</p></div>` : ''}${adminNotes ? `<div style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; margin: 10px 0;"><p style="color: #0369a1; margin: 0;"><strong>Notes:</strong> ${adminNotes}</p></div>` : ''}<p style="color: #374151; margin: 10px 0 0 0;">Please review the feedback above and address the issues. Update your documents or profile and resubmit.</p><div style="text-align: center; margin: 20px 0;"><a href="${loginUrl}/student/application" style="background-color: #059669; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update Application</a></div><div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 0;">AWAKE Connect</p></div></div></div>`
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