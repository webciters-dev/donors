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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Welcome to AWAKE Connect - Case Worker Team',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;">Welcome to AWAKE</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">A Project by Akhuwat USA</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Thank you for joining our Case Worker team!</strong></p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;"><p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;"><strong>Your Role</strong><br>You are part of the AWAKE (Aiding Worthy American-Keyed Education) verification team. Your responsibility is to conduct field verification of student applications, review submitted documents, and provide professional recommendations.</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Your Responsibilities:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;"><li>Review student applications assigned to you</li><li>Conduct field verification of student information</li><li>Verify all required documents are authentic</li><li>Provide professional recommendations</li><li>Communicate findings to the admin team</li></ul><div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;"><p style="color: #1e40af; font-size: 14px; margin: 0;"><strong>Your Credentials</strong><br>Email: <strong>${email}</strong><br>Password: <strong>${password}</strong><br>Change your password after first login for security.</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">New student applications will be assigned to you via email notification. You'll have dashboard access to manage your assignments.</p><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">Visit AWAKE Platform</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;"><strong>Questions?</strong> Our support team is here to help. Contact us through the platform's support form or email <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p><p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">This email was sent to ${email} because you were added as a case worker.</p></div></div></div>`
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
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'New Student Assignment - AWAKE Connect Verification',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;">New Assignment</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Student Field Verification Required</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${caseWorkerName.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>A new student application has been assigned to your verification queue.</strong></p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;"><h3 style="color: #047857; margin-top: 0;">Assignment Details</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Student:</strong> ${studentName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Email:</strong> ${studentEmail}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Application ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;">${applicationId}</code></p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Your Verification Process:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li><strong>Review Application</strong> - Review all documents and information</li><li><strong>Schedule Verification</strong> - Contact student for field visit</li><li><strong>Conduct Field Visit</strong> - Verify student details and circumstances</li><li><strong>Document Findings</strong> - Submit verification report</li><li><strong>Submit Recommendation</strong> - Provide your professional assessment</li></ol><div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Timeline:</strong> Please complete field verification within 14 days of this notification to keep applications moving smoothly through our review process.</p></div><div style="text-align: center; margin: 30px 0;\"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);\">View Assignment</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Need Help?</strong> Contact the admin team through the platform or email <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Your Application is Under Review - Verification in Progress',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;">Good News!</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Your Application is Progressing</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${studentName.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Your application has passed the initial review and is now moving to the next phase!</strong></p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;"><h3 style="color: #047857; margin-top: 0;">Verification Status Update</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Assigned to:</strong> ${caseWorkerName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Application ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;">${applicationId.slice(-8)}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Current Stage:</strong> <span style="color: #059669; font-weight: bold;">Field Verification</span></p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>What Happens Next:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;"><li>The assigned case worker will contact you to schedule a verification visit</li><li>You'll meet with the case worker for a field verification</li><li>They will review your documentation and circumstances</li><li>Your application will then move to final admin review</li><li>Once approved, you'll be featured on our marketplace for sponsors</li></ol>${message ? `<div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;"><p style="color: #1e40af; font-size: 14px; margin: 0;"><strong>Additional Note:</strong><br>${message}</p></div>` : ''}<div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">Check Application Status</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;"><strong>Important:</strong> Keep your contact information current and be prepared to meet with the case worker at a convenient time. Respond promptly to ensure your application progresses smoothly.</p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Important Message - AWAKE Connect',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;\">Important Message</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">From AWAKE Connect</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${name.split(' ')[0]},</p><div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 15px; margin: 0; line-height: 1.6;\">${message}</p></div><div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669;\"><p style="color: #047857; font-size: 14px; margin: 0;\"><strong>Application ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;\">${applicationId}</code></p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>What to Do Next:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Log in to your AWAKE account</li><li>Check your application status and messages</li><li>Take any required action as indicated</li><li>Contact support if you have questions</li></ol><div style="text-align: center; margin: 30px 0;\"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);\">Go to Platform</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Questions?</strong> Contact our support team at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'New Document Uploaded for Review - Action Required',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: bold;\">Document Upload Alert</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">New Document Ready for Review</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>A student has submitted a new document for your review.</strong></p><div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;\"><h3 style="color: #1e40af; margin-top: 0;">Document Details</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Student:</strong> ${studentName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Document:</strong> ${documentName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Application ID:</strong> <code style="background-color: #f0f9ff; padding: 2px 6px; border-radius: 3px;\">${applicationId}</code></p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Required Review Steps:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Log in to your AWAKE admin dashboard</li><li>Navigate to the application queue</li><li>Review the uploaded document</li><li>Verify authenticity and completeness</li><li>Accept or request revisions as needed</li></ol><div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Timeline:</strong> Please review and respond to the student within 3 business days to keep the application process moving smoothly.</p></div><div style="text-align: center; margin: 30px 0;\"><a href="${landingUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);\">Review Documents</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Need Help?</strong> Contact our admin team at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Welcome to AWAKE - Your Journey to Educational Excellence Starts Here',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;">Welcome to AWAKE</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">A Project by Akhuwat USA</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Congratulations on taking the first step towards your educational dreams!</strong></p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;"><p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;"><strong>What is AWAKE?</strong><br>AWAKE (Aiding Worthy American-Keyed Education) is Akhuwat USA's initiative to connect deserving students with generous donors. We believe every student with potential deserves the chance to achieve their educational goals.</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>What happens next:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;"><li>Complete your profile with personal and academic information</li><li>Submit your application and educational goals</li><li>Our team will review your application for verification</li><li>Once approved, donors will see your profile and can sponsor your education</li><li>Connect with your sponsors and receive funding for your studies</li></ul><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;"><strong>Get started today by visiting the platform and completing your profile.</strong> This is your opportunity to unlock educational opportunities and realize your potential.</p><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">Visit AWAKE Platform</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;"><strong>Questions?</strong> Our support team is here to help. Reach out through the platform's contact form or email us at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p><p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">This email was sent to ${email} because an account was registered with this address.</p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@awakeconnect.org>',
      to: email,
      subject: 'Welcome to AWAKE - Make a Difference in Education',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;">Welcome to AWAKE</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">A Project by Akhuwat USA</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Thank you for joining the AWAKE community as a donor!</strong></p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;"><p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;"><strong>Your Impact Matters</strong><br>Your donation directly supports deserving students in achieving their educational dreams. AWAKE (Aiding Worthy American-Keyed Education) by Akhuwat USA connects compassionate donors like you with students who have the potential to transform their futures.${organization ? `<br><br>We're honored that <strong>${organization}</strong> is joining this mission.` : ''}</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>How it works:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;"><li><strong>Browse</strong> verified student profiles with their educational goals and background</li><li><strong>Connect</strong> with students directly and understand their aspirations</li><li><strong>Sponsor</strong> a student's education at any funding level</li><li><strong>Track</strong> the impact of your donation and receive updates</li><li><strong>Celebrate</strong> as students achieve their dreams with your support</li></ul><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">Every donation, regardless of size, creates meaningful change. Your generosity opens educational doors and transforms lives.</p><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">Explore Student Profiles</a></div><div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #d97706;"><p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;"><strong>Transparency & Trust</strong><br>100% of donation information is verified. Our team personally reviews each student application, ensuring your support reaches the students who need it most.</p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p><p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">This email was sent to ${email} because an account was registered with this address.</p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Welcome to AWAKE Connect Board - Become a Student Interviewer',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;\">Welcome to AWAKE Board</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">A Project by Akhuwat USA</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Thank you for joining the AWAKE Connect Board!</strong> Your expertise and perspective are invaluable in our mission to support deserving students.</p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;\"><h3 style="color: #047857; margin-top: 0;\">Your Role: ${title}</h3><p style="color: #374151; font-size: 14px; margin: 8px 0; line-height: 1.6;\">You've been appointed as a <strong>${title}</strong> on the AWAKE Connect Board. In this role, you will interview qualified students, assess their circumstances and commitment to education, and provide recommendations that help determine scholarship eligibility.</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Your Responsibilities:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Conduct video or phone interviews with student candidates</li><li>Evaluate student applications and supporting documents</li><li>Assess student commitment, circumstances, and need</li><li>Provide professional recommendations to the admin team</li><li>Maintain confidentiality of student information</li></ul><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>How It Works:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>You'll receive email notifications when a student is scheduled for interview</li><li>Each notification includes the student's profile, background, and meeting link</li><li>No separate login required - just click the provided meeting link</li><li>Attend the interview and provide your assessment</li></ol><div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Interview Schedule:</strong> Interviews are typically scheduled at times convenient for all board members involved. You'll receive scheduling notifications at least 48 hours in advance.</p></div><div style="text-align: center; margin: 30px 0;\"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);\">Visit AWAKE Platform</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Questions?</strong> Contact the AWAKE team at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p><p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;\">This email was sent to ${email} because you were added to the AWAKE Board.</p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    const resetUrl = `${landingUrl}/#/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Secure Password Reset - AWAKE Connect Account',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;\"><h1 style="color: #dc2626; font-size: 28px; margin: 0; font-weight: bold;">Password Reset</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">Secure Account Access</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${(name || 'User').split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>We received a request to reset the password for your AWAKE Connect account.</strong></p><div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;\"><p style="color: #7f1d1d; font-size: 14px; margin: 0; line-height: 1.6;\"><strong>Security Notice:</strong> This password reset link will expire in <strong>1 hour</strong> for your account protection. If you did not request this reset, please ignore this email or contact support immediately.</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;\"><strong>To reset your password:</strong></p><div style="text-align: center; margin: 30px 0;"><a href="${resetUrl}" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);\">Reset Password Now</a></div><p style="color: #6b7280; font-size: 13px; margin: 15px 0;\">If the button doesn't work, copy and paste this link into your browser:</p><div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 10px 0; word-break: break-all;\"><code style="color: #374151; font-size: 12px;\">${resetUrl}</code></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>After You Reset:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Log in with your new password</li><li>Update your account settings if needed</li><li>Enable two-factor authentication for extra security (optional)</li></ul><div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #d97706;\"><p style="color: #92400e; font-size: 13px; margin: 0;\"><strong>Didn't request this?</strong> If someone else sent this reset request, don't worry. Your password hasn't changed. Contact us immediately at <strong>support@aircrew.nl</strong></p></div><p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 15px 0;\"><strong>Account Security Tips:</strong></p><ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 20px; padding: 0;\"><li>Use a strong, unique password</li><li>Never share your password with anyone</li><li>Be cautious of phishing emails requesting your password</li></ul><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Your Application Has Been Received - AWAKE Connect',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;">Thank You!</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Application Confirmed</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>Thank you for submitting your application to AWAKE!</strong> We have successfully received your submission and it is now under review.</p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;\"><h3 style="color: #047857; margin-top: 0;">Application Tracking</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Application ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;\">${applicationId}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Under Review</span></p><p style="color: #374151; font-size: 14px; margin: 8px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>What Happens Next:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li><strong>Document Review</strong> - Our team reviews all submitted documents</li><li><strong>Field Verification</strong> - A case worker verifies your information</li><li><strong>Admin Assessment</strong> - Final evaluation by our admin team</li><li><strong>Marketplace Listing</strong> - Once approved, your profile becomes visible to donors</li><li><strong>Sponsor Matching</strong> - Donors will see your profile and may choose to sponsor</li></ol><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\">We'll send you email updates at each stage. Keep your contact information and profile up to date.</p><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);\">Visit AWAKE Platform</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Important:</strong> Keep your profile information current and respond promptly to any requests from our team. This helps us move your application forward quickly.</p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Additional Documents Required - Please Upload',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #f59e0b; font-size: 28px; margin: 0; font-weight: bold;">Action Required</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Additional Documents Needed</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;"><strong>To continue processing your application, we need additional documents from you.</strong></p><div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;\"><h3 style="color: #92400e; margin-top: 0;">Required Documents</h3><ul style="color: #374151; margin: 10px 0; padding-left: 20px;\">${missingItems.map(item => `<li style="font-size: 14px; line-height: 1.6;">${item}</li>`).join('')}</ul></div>${note ? `<div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Additional Notes:</strong><br>${note}</p></div>` : ''}<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>How to Submit:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Visit the AWAKE platform using the link below</li><li>Log in to your account</li><li>Navigate to your application</li><li>Upload the required documents</li><li>Submit for review</li></ol><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Deadline:</strong> Please upload these documents as soon as possible to avoid delays in your application review.</p><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);\">Upload Documents Now</a></div><div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Need Help?</strong> If you have questions about which documents to submit, contact our support team at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    const landingUrl = 'https://aircrew.nl';
    const scheduledDate = new Date(scheduledAt).toLocaleDateString();
    const scheduledTime = new Date(scheduledAt).toLocaleTimeString();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Interview Scheduled - Important: Prepare Your Responses',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #7c3aed; font-size: 28px; margin: 0; font-weight: bold;">Interview Scheduled</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Next Step in Your Application</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Congratulations! Your application has advanced to the interview stage.</strong> Our board members would like to learn more about you and your educational goals.</p><div style="background-color: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;\"><h3 style="color: #6d28d9; margin-top: 0;\">Interview Details</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Date:</strong> ${scheduledDate}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Time:</strong> ${scheduledTime}</p>${meetingLink ? `<p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #7c3aed; text-decoration: none; font-weight: bold;\">Click here to join</a></p>` : ''}<p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Interview ID:</strong> <code style="background-color: #f3e8ff; padding: 2px 6px; border-radius: 3px;\">${interviewId.slice(-8)}</code></p></div>${boardMembers && boardMembers.length > 0 ? `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Meet Your Interviewers:</strong><br>${boardMembers.map(m => `${m.name}${m.title ? ` (${m.title})` : ''}`).join('<br>')}</p>` : ''}<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Prepare Yourself:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Be ready to discuss your educational background and aspirations</li><li>Prepare to answer questions about your financial situation</li><li>Have examples ready of your academic achievements and character</li><li>Test your internet connection 10 minutes before the meeting</li><li>Find a quiet, professional location for the interview</li></ul>${notes ? `<div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Interview Notes:</strong><br>${notes}</p></div>` : ''}<div style="text-align: center; margin: 30px 0;"><a href="${meetingLink || landingUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);\">${meetingLink ? 'Join Interview Now' : 'Go to Platform'}</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Can't make it?</strong> If you need to reschedule, contact support at <strong>support@aircrew.nl</strong> as soon as possible.</p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    const landingUrl = 'https://aircrew.nl';
    const scheduledDate = new Date(scheduledAt).toLocaleDateString();
    const scheduledTime = new Date(scheduledAt).toLocaleTimeString();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: 'Interview Assignment - Student Interview Scheduled',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #7c3aed; font-size: 28px; margin: 0; font-weight: bold;">Interview Assignment</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">${isChairperson ? 'You are the Panel Chairperson' : 'Join the Review Panel'}</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${name.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>You have been assigned to interview a student applicant.</strong> Your professional assessment will help determine scholarship eligibility.</p><div style="background-color: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;\"><h3 style="color: #6d28d9; margin-top: 0;\">Interview Details</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Candidate:</strong> ${studentName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Date:</strong> ${scheduledDate}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Time:</strong> ${scheduledTime}</p>${meetingLink ? `<p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #7c3aed; text-decoration: none; font-weight: bold;\">Click to Join</a></p>` : ''}<p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Interview ID:</strong> <code style="background-color: #f3e8ff; padding: 2px 6px; border-radius: 3px;\">${interviewId.slice(-8)}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Application ID:</strong> <code style="background-color: #f3e8ff; padding: 2px 6px; border-radius: 3px;\">${applicationId.slice(-8)}</code></p>${isChairperson ? `<p style="color: #6d28d9; font-size: 14px; margin: 8px 0; background-color: #fef3c7; padding: 8px; border-radius: 4px;\"><strong>⭐ Panel Chairperson Role:</strong> You are responsible for leading the interview and submitting the final panel recommendation.</p>` : ''}</div>${notes ? `<div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Interview Notes & Guidance:</strong><br>${notes}</p></div>` : ''}<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Before the Interview:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Review the student's application and documentation</li><li>Prepare thoughtful questions about their background and goals</li><li>Test your internet connection 10 minutes early</li><li>Find a professional, quiet environment</li>${isChairperson ? `<li>Prepare to lead the discussion and collect other panelists' assessments</li>` : `<li>Prepare to provide your professional assessment after the interview</li>`}</ul><div style="text-align: center; margin: 30px 0;"><a href="${meetingLink || landingUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);\">${meetingLink ? 'Join Interview' : 'View Assignment'}</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Questions?</strong> Contact our admin team at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    const reviewUrl = `${landingUrl}`;
    
    const recommendationColor = 
      fielderRecommendation === 'STRONGLY_APPROVE' ? '#10b981' :
      fielderRecommendation === 'APPROVE' ? '#3b82f6' :
      fielderRecommendation === 'CONDITIONAL' ? '#f59e0b' :
      '#ef4444';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: `Field Verification Complete - ${studentName} - Action Required`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: bold;\">Review Complete</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">Field Verification Submitted</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${adminName.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Field verification has been completed</strong> for the following application and is now ready for your administrative review.</p><div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;\"><h3 style="color: #1e40af; margin-top: 0;\">Field Review Summary</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Student:</strong> ${studentName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Application ID:</strong> <code style="background-color: #f0f9ff; padding: 2px 6px; border-radius: 3px;\">${applicationId}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Case Worker:</strong> ${caseWorkerName}</p>${fielderRecommendation ? `<p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Recommendation:</strong> <span style="color: ${recommendationColor}; font-weight: bold; background-color: #f0f9ff; padding: 4px 8px; border-radius: 4px;\">${fielderRecommendation.replace('_', ' ')}</span></p>` : ''}<p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Verification Status:</strong> <span style="color: #059669; font-weight: bold;\">Completed</span></p>${verificationScore ? `<p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Verification Score:</strong> <span style="font-weight: bold; color: #2563eb;\">${verificationScore}%</span></p>` : ''}</div>${adminNotesRequired ? `<div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #d97706;\"><p style="color: #92400e; font-size: 14px; margin: 0;\"><strong>⚠ Administrative Notes Required:</strong><br>${adminNotesRequired}</p></div>` : ''}<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>Your Next Steps:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Review the complete field verification report</li><li>Assess the case worker's recommendation</li><li>Conduct any additional due diligence if needed</li><li>Decide on approval or request additional information</li><li>If approved, the student will be listed on the marketplace for donors</li></ol><div style="text-align: center; margin: 30px 0;"><a href="${reviewUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);\">Review Application</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Need Help?</strong> Contact support at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: `Payment Confirmed - Your Sponsorship of ${studentName} is Active`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;\">Thank You!</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">Payment Confirmed & Sponsorship Active</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${donorName.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Thank you for your generosity!</strong> Your sponsorship payment has been successfully processed, and you are now actively supporting ${studentName}'s education.</p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;\"><h3 style="color: #047857; margin-top: 0;\">Payment Details</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Student Sponsor:</strong> ${studentName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Amount:</strong> <span style="font-weight: bold; color: #059669; font-size: 16px;\">${formattedAmount}</span></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Payment Method:</strong> ${paymentMethod}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Transaction ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;\">${transactionId}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Sponsorship ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;\">${sponsorshipId}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>What Happens Next:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>${studentName} will receive a notification about your sponsorship</li><li>You can start a private conversation with the student</li><li>Receive regular updates on their academic progress</li><li>View how your donation is making a difference</li><li>Download tax receipt for your donation</li></ul><div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Your Sponsorship Impact:</strong> Your support removes financial barriers and empowers ${studentName} to focus on their education and future success.</p></div><div style="text-align: center; margin: 30px 0;\"><a href="${landingUrl}\" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);\">View Your Dashboard</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Questions or Need Support?</strong> Contact us at <strong>support@aircrew.nl</strong></p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: `Amazing News! You Have a New Sponsor - ${formattedAmount} Sponsorship Active`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;\">Congratulations!</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">Your Sponsorship is Active</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${studentName.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Excellent news!</strong> You have been sponsored by <strong>${donorName}</strong> who is committed to supporting your educational journey.</p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;\"><h3 style="color: #047857; margin-top: 0;\">Sponsorship Details</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Sponsor Name:</strong> ${donorName}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Sponsorship Amount:</strong> <span style="font-weight: bold; color: #059669; font-size: 16px;\">${formattedAmount}</span></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Sponsorship ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;\">${sponsorshipId}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;\">Active</span></p></div>${message ? `<div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #d97706;\"><p style="color: #92400e; font-size: 14px; margin: 0;"><strong>💬 Message from Your Sponsor:</strong></p><p style="color: #78350f; font-style: italic; margin: 8px 0 0 0;\">"${message}"</p></div>` : ''}<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>What This Means for You:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Your sponsor is invested in your educational success</li><li>You can now send messages to your sponsor</li><li>Share your progress and academic achievements</li><li>Receive encouragement and support from your sponsor</li><li>Build a meaningful relationship with your sponsor community</li></ul><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Recommended Next Steps:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Log in to your AWAKE account</li><li>View your sponsor's profile and story</li><li>Send a thank you message to your sponsor</li><li>Share an update about your academic goals</li><li>Consider sending a progress update soon</li></ol><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);\">View Your Sponsor</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Thank You!</strong> Your sponsor believes in your potential. Make the most of this opportunity and pursue your dreams with determination.</p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: `🎉 Congratulations! Your Application is APPROVED - Now Live to Sponsors`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #059669; font-size: 28px; margin: 0; font-weight: bold;\">Congratulations!</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">Your Application is APPROVED!</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${studentName.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Excellent news!</strong> Your application has been approved and is now live in the AWAKE marketplace. You're officially ready to receive sponsorships!</p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;\"><h3 style="color: #047857; margin-top: 0;\">Your Approved Profile</h3><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>University/Institution:</strong> ${university}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Program/Degree:</strong> ${program}</p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Target Amount:</strong> <span style="font-weight: bold; color: #059669; font-size: 16px;\">${formattedAmount}</span></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Application ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;\">${applicationId}</code></p><p style="color: #374151; font-size: 14px; margin: 8px 0;\"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;\">Live in Marketplace</span></p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>What Happens Now:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Your profile is visible to all AWAKE donors</li><li>Donors can view your story and educational goals</li><li>When a donor sponsors you, you'll receive an instant notification</li><li>You can then communicate directly with your sponsors</li><li>Sponsors will support you throughout your educational journey</li></ol><div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Maximize Your Sponsorship Chances:</strong> Keep your profile updated, share your academic goals clearly, and respond promptly to any messages from donors. The more engaged you are, the more likely donors will choose to sponsor you.</p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\"><strong>Profile Tips for Donors:</strong></p><ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Share your personal story and why education matters to you</li><li>Be specific about your financial need and circumstances</li><li>Highlight your academic achievements and aspirations</li><li>Update donors regularly on your progress and achievements</li><li>Express gratitude and keep sponsors informed</li></ul><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);\">View Your Profile</a></div><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Believe in Yourself!</strong> Your profile is now representing you to potential sponsors. This is your chance to connect with generous individuals who believe in supporting education. Make the most of it!</p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: email,
      subject: `Application Status Update - Additional Information Needed`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);"><div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #f59e0b; font-size: 28px; margin: 0; font-weight: bold;\">Application Update</h1><p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;\">We Need Your Help</p></div><p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;\">Hi ${studentName.split(' ')[0]},</p><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;\">Thank you for submitting your application. Our team has reviewed it and we need some additional information or clarifications before we can move forward.</p><div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;\"><h3 style="color: #92400e; margin-top: 0;\">What We Need From You</h3>${rejectionReason ? `<p style="color: #78350f; font-size: 14px; margin: 8px 0; line-height: 1.6;\">${rejectionReason}</p>` : '<p style="color: #78350f; font-size: 14px; margin: 8px 0;\">Please check your application for areas that need clarification or additional documentation.</p>'}</div>${adminNotes ? `<div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Admin Notes:</strong><br>${adminNotes}</p></div>` : ''}<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>Application Status:</strong></p><div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669;\"><p style="color: #047857; font-size: 14px; margin: 0;\"><strong>Application ID:</strong> <code style="background-color: #f0fdf4; padding: 2px 6px; border-radius: 3px;\">${applicationId}</code><br><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;\">Pending Revision</span></p></div><p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 15px 0;\"><strong>Next Steps:</strong></p><ol style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 15px 20px; padding: 0;\"><li>Log in to your AWAKE account</li><li>Review your application carefully</li><li>Make the necessary corrections and updates</li><li>Add any missing documents</li><li>Resubmit your application for review</li></ol><div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;\"><p style="color: #1e40af; font-size: 14px; margin: 0;\"><strong>Don't Give Up!</strong> We believe in your potential. This feedback helps us ensure fairness and quality. Please address the items above and resubmit—we're here to support your success.</p></div><div style="text-align: center; margin: 30px 0;"><a href="${landingUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);\">Update Your Application</a></div><p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 20px 0 15px 0;\"><strong>Having Trouble?</strong> If you have questions about what's needed or encounter issues updating your application, please don't hesitate to reach out.</p><div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669;\"><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;\"><strong>Support Team:</strong> Contact us at <strong>support@aircrew.nl</strong><br>We're here to help clarify any questions or concerns.</p></div><div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;\"><p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; line-height: 1.5;\">AWAKE Connect - Empowering Education Through Compassionate Giving<br><strong>A Project by Akhuwat USA</strong></p></div></div></div>`
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
    
    const landingUrl = 'https://aircrew.nl';
    const applicationDetailsUrl = `${landingUrl}`;
    const formattedAmount = currency === 'PKR' ? 
      `Rs ${amount.toLocaleString()}` : 
      `$${amount.toLocaleString()}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AWAKE Connect <noreply@aircrew.nl>',
      to: adminEmail,
      subject: `🔔 New Application Submitted - ${studentName} - Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);">
          <div style="background-color: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: bold;">AWAKE Connect</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-weight: bold;">Admin Review Portal</p>
            </div>
            
            <!-- Alert Banner -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; font-weight: bold;">📋 New Application Ready for Review</h2>
              <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 14px;">A student has submitted their application and is waiting for your evaluation</p>
            </div>
            
            <!-- Student Information -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0; font-size: 16px; font-weight: bold;">👤 Student Information</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px;">
                <p style="margin: 10px 0; color: #374151;"><strong>Student Name:</strong> ${studentName}</p>
                <p style="margin: 10px 0; color: #374151;"><strong>Student Email:</strong> <a href="mailto:${studentEmail}" style="color: #2563eb; text-decoration: none;">${studentEmail}</a></p>
                <p style="margin: 10px 0; color: #374151;"><strong>University/Institution:</strong> ${university}</p>
                <p style="margin: 10px 0; color: #374151;"><strong>Program/Degree:</strong> ${program}</p>
                <p style="margin: 10px 0; color: #374151;"><strong>Funding Amount Requested:</strong> <span style="color: #059669; font-weight: bold; font-size: 16px;">${formattedAmount}</span></p>
                <p style="margin: 10px 0; color: #374151;"><strong>Application ID:</strong> <code style="background-color: #f3f4f6; padding: 3px 8px; border-radius: 3px; font-family: monospace;">${applicationId}</code></p>
                <p style="margin: 10px 0; color: #374151;"><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <!-- Review Status -->
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #059669;">
              <p style="color: #047857; margin: 0; font-weight: bold;">✓ Status: READY FOR INITIAL REVIEW</p>
            </div>
            
            <!-- Required Actions -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
              <h3 style="color: #92400e; margin-top: 0; font-size: 16px; font-weight: bold;">⚡ Your Action Items</h3>
              <ol style="color: #78350f; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Verify Documents:</strong> Ensure all required documents are uploaded and appear authentic</li>
                <li><strong>Profile Assessment:</strong> Review student profile completeness and initial eligibility</li>
                <li><strong>Assign Case Worker:</strong> If documents pass initial review, assign to field verification</li>
                <li><strong>Track Progress:</strong> Monitor application through all review stages</li>
                <li><strong>Make Final Decision:</strong> Approve for marketplace or request additional information</li>
              </ol>
            </div>
            
            <!-- Important Notes -->
            <div style="background-color: #ede9fe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed;">
              <h4 style="color: #5b21b6; margin-top: 0; font-size: 14px; font-weight: bold;">📌 Important Reminders</h4>
              <ul style="color: #4c1d95; margin: 8px 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
                <li>Verify all <strong>required documents</strong> are complete and authentic</li>
                <li>Check for any <strong>incomplete or conflicting information</strong></li>
                <li>Review <strong>eligibility criteria</strong> carefully before proceeding</li>
                <li><strong>Contact student</strong> immediately if additional information is needed</li>
                <li>Maintain <strong>fair and consistent</strong> application review standards</li>
              </ul>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${landingUrl}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                 Review Application Now
              </a>
            </div>
            
            <!-- Application Queue Info -->
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #065f46; margin-top: 0; font-size: 14px; font-weight: bold;\">📊 Admin Dashboard</h4>
              <p style="color: #047857; margin: 0; font-size: 13px; line-height: 1.6;">
                Access your complete admin dashboard to view all applications, manage assignments, track progress, and generate reports.
                <br><br><a href="${landingUrl}" style="color: #2563eb; font-weight: bold; text-decoration: none;">Go to Admin Portal →</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.6;">
                This is an automated notification from AWAKE Connect Admin System.<br>
                <strong>Please review this application promptly</strong> to maintain quality service for students.<br>
                <br>AWAKE Connect - Empowering Education Through Compassionate Giving<br>
                <strong>A Project by Akhuwat USA</strong>
              </p>
            </div>
          </div>
        </div>
      `
            
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