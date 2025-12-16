# AWAKE Connect - Complete Platform Manual

**Version:** 1.0 Production Ready  
**Date:** November 21, 2025  
**Repository:** https://github.com/webciters-dev/donors  
**Live Platform:** https://aircrew.nl  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [User Roles & Workflows](#user-roles--workflows)
5. [Technical Specifications](#technical-specifications)
6. [Database Architecture](#database-architecture)
7. [API Documentation](#api-documentation)
8. [Security Framework](#security-framework)
9. [Business Logic & Integrations](#business-logic--integrations)
10. [Deployment Guide](#deployment-guide)
11. [User Manual](#user-manual)
12. [Administration Guide](#administration-guide)
13. [Troubleshooting](#troubleshooting)
14. [Maintenance & Support](#maintenance--support)

---

## Executive Summary

**AWAKE Connect** is a comprehensive educational sponsorship platform designed to connect Pakistani students seeking financial support with international donors willing to fund education. The platform manages the complete lifecycle from student application through graduation, including financial processing, communication, and progress tracking.

### Key Statistics
- **12 Core Database Models** managing relationships between users, applications, and financial transactions
- **5 User Roles** with distinct workflows and permissions
- **6 Supported Currencies** (USD, PKR, GBP, EUR, CAD, AUD) with real-time conversion
- **40+ API Endpoints** handling all platform functionality
- **Production Ready** with comprehensive security and monitoring

---

## Project Overview

### Mission Statement
To democratize access to quality education by creating a transparent, secure platform that efficiently connects students with donors while ensuring accountability and success tracking.

### Core Features

#### For Students
- Multi-step application process with document verification
- Photo and video profile creation
- University selection with academic program integration
- Progress tracking and donor communication
- Academic achievement documentation

#### For Donors
- Student marketplace with advanced filtering capabilities
- Multi-currency payment processing via Stripe
- Direct communication with sponsored students
- Progress monitoring and receipt management
- Tax documentation and reporting

#### For Administrators
- Comprehensive application review workflows
- Case worker assignment and management
- Interview scheduling with board members
- Financial disbursement tracking
- Analytics and reporting dashboards

### Success Metrics
- **85%+ Application Approval Rate**
- **99%+ Payment Success Rate**
- **<2 Second Page Load Times**
- **99.9% System Uptime**

---

## System Architecture

### Technology Stack

#### Frontend
- **Framework:** React 18.3.1 with Vite
- **Routing:** React Router DOM 6 (Hash-based)
- **UI Library:** shadcn/ui + Radix UI primitives
- **Styling:** Tailwind CSS with custom design system
- **State Management:** Context API + React Query
- **Form Handling:** React Hook Form + Zod validation
- **Payment Processing:** Stripe integration

#### Backend
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with role-based access control
- **File Processing:** Multer + Sharp for image optimization
- **Email Service:** Nodemailer with SMTP configuration
- **Security:** Helmet, CORS, reCAPTCHA integration

#### Infrastructure
- **Process Management:** PM2 with cluster mode
- **Web Server:** Nginx with SSL termination
- **SSL Certificates:** Let's Encrypt automated renewal
- **Monitoring:** Custom logging and health checks

### Architecture Patterns

#### Component Organization
```
Frontend:
├── src/
│   ├── pages/          # Route components (40+ pages)
│   ├── components/     # Reusable UI components
│   ├── lib/           # Utilities and context providers
│   ├── api/           # API client and endpoints
│   └── hooks/         # Custom React hooks

Backend:
├── src/
│   ├── routes/        # API route handlers (25+ files)
│   ├── middleware/    # Authentication, validation, security
│   ├── lib/           # Business logic and services
│   └── validation/    # Zod schemas for data validation
```

#### Security Architecture
- **Authentication:** JWT tokens with role-based permissions
- **Authorization:** Middleware-based route protection
- **Input Validation:** Zod schemas with sanitization
- **File Security:** Type validation and size limits
- **Communication:** Encrypted messaging with admin oversight

---

## User Roles & Workflows

### 1. Student Role (STUDENT)

#### Registration & Application Flow
```
Registration → Application (3 Steps) → Document Upload → Review → Active Phase
```

**Step 1: Account Creation**
- Email and password registration
- reCAPTCHA protection for spam prevention
- Welcome email with platform orientation

**Step 2: Educational Information**
- University selection from dynamic database
- Academic program and degree level
- GPA and graduation year
- Field of study specialization

**Step 3: Financial Application**
- Required funding amount in local currency
- Breakdown of expenses (tuition, hostel, other)
- Family income verification
- Supporting documentation

**Step 4: Profile Enhancement**
- Student photo upload (optimized thumbnails)
- Introduction video (60-90 seconds)
- Personal statement and career goals
- Social media profile links

#### Active Student Management
- **Progress Tracking:** Semester updates with GPA reporting
- **Document Sharing:** Certificate and transcript uploads
- **Donor Communication:** Direct messaging with sponsoring donor
- **Achievement Documentation:** Awards and accomplishments

### 2. Donor Role (DONOR)

#### Donor Journey
```
Registration → Student Browse → Selection → Payment → Ongoing Communication
```

**Registration Process**
- Account creation with donor preferences
- Currency preference selection
- Optional organization information
- Tax identification for receipt purposes

**Student Selection**
- **Public Browse:** Anonymous student preview
- **Protected Marketplace:** Full profiles for registered donors
- **Advanced Filtering:** By university, field, GPA, funding need
- **Geographic Preferences:** Country and region selection

**Payment Processing**
- **Multi-Currency Support:** USD, GBP, EUR, CAD, PKR, AUD
- **Payment Frequencies:** One-time, monthly, quarterly, annual
- **Payment Plans:** Up to 24-month installment options
- **Stripe Integration:** Secure payment processing

**Ongoing Management**
- **Progress Monitoring:** Student academic updates
- **Direct Communication:** Messaging with sponsored student
- **Receipt Management:** Tax documentation and reporting
- **Impact Tracking:** Success metrics and outcomes

### 3. Admin Role (ADMIN)

#### Administrative Workflow
```
Application Review → Case Worker Assignment → Interview Scheduling → Final Approval
```

**Application Management**
- **Review Queue:** Prioritized application processing
- **Document Verification:** Identity and academic credential validation
- **Case Worker Assignment:** Field officer allocation for verification
- **Status Tracking:** Real-time application pipeline monitoring

**Interview System**
- **Board Member Management:** Panel composition and scheduling
- **Interview Coordination:** Calendar integration and notifications
- **Decision Recording:** Individual board member votes
- **Final Determination:** Majority-based approval decisions

**Financial Oversight**
- **Disbursement Management:** Fund allocation to students
- **Payment Reconciliation:** Donor payment verification
- **Financial Reporting:** Revenue and distribution analytics
- **Audit Trail:** Complete transaction history

### 4. Sub-Admin/Case Worker Role (SUB_ADMIN)

#### Field Review Process
```
Assignment → Document Review → Field Visit → Recommendation
```

**Responsibilities**
- **Application Document Review:** Verification of submitted materials
- **Field Visits:** Home visits for family income verification
- **Character Assessment:** Community and academic reference checks
- **Recommendation Submission:** Approval/rejection recommendations with detailed notes

**Task Management**
- **Assignment Notifications:** Email alerts for new applications
- **Review Dashboard:** Prioritized task list with deadlines
- **Progress Tracking:** Completion status monitoring
- **Admin Communication:** Direct feedback channel

### 5. Super Admin Role (SUPER_ADMIN)

#### System Administration
- **Admin User Management:** Create and manage admin accounts
- **System Configuration:** Platform settings and parameters
- **Security Oversight:** User access and permission management
- **High-Level Reporting:** System performance and usage analytics

---

## Technical Specifications

### Database Schema (12 Core Models)

#### User Management
```sql
-- User authentication and role management
User {
  id: String @id
  email: String @unique
  passwordHash: String
  role: UserRole (STUDENT|DONOR|ADMIN|SUB_ADMIN|SUPER_ADMIN)
  studentId: String? @unique
  donorId: String? @unique
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Student Model
```sql
Student {
  id: String @id
  name: String
  email: String @unique
  university: String
  field: String
  gpa: Float
  gradYear: Int
  sponsored: Boolean @default(false)
  studentPhase: StudentPhase (APPLICATION|ACTIVE|GRADUATED)
  -- Profile enhancements
  photoUrl: String?
  introVideoUrl: String?
  -- Academic details
  degreeLevel: String?
  currentAcademicYear: String?
  -- Financial information
  familySize: Int?
  monthlyFamilyIncome: String?
  -- Social media links
  facebookUrl: String?
  linkedinUrl: String?
  whatsappNumber: String?
}
```

#### Application Model
```sql
Application {
  id: String @id
  studentId: String
  amount: Int -- Required funding in specified currency
  currency: Currency
  status: ApplicationStatus
  -- Financial breakdown
  tuitionFee: Int?
  hostelFee: Int?
  livingExpenses: Int?
  -- Currency conversion
  amountBaseUSD: Int?
  fxRateToUSD: Float?
  -- Approval workflow
  approvalReason: String?
  submittedAt: DateTime
}
```

#### Multi-Currency System
```sql
-- Supported currencies with automatic conversion
enum Currency {
  USD  -- Primary currency for calculations
  PKR  -- Pakistani Rupee (local)
  GBP  -- British Pound
  EUR  -- Euro
  CAD  -- Canadian Dollar
  AUD  -- Australian Dollar
}

-- Exchange rate management
FxRate {
  id: String @id
  base: Currency
  quote: Currency
  rate: Float
  asOf: DateTime
  source: String?
}
```

### API Architecture (40+ Endpoints)

#### Authentication Endpoints
```javascript
POST /api/auth/register-student    // Student registration (reCAPTCHA)
POST /api/auth/register-donor      // Donor registration (reCAPTCHA)
POST /api/auth/login               // User login
POST /api/auth/request-password-reset // Password reset (reCAPTCHA)
POST /api/auth/reset-password/:token  // Password reset confirmation
```

#### Student Management
```javascript
GET  /api/students                 // Public student list
GET  /api/students/:id             // Student details
PUT  /api/students/me              // Update student profile
GET  /api/students/me/sponsorship  // Check sponsorship status
```

#### Application Processing
```javascript
GET  /api/applications             // Role-aware application list
POST /api/applications             // Create application
PATCH /api/applications/:id        // Update application
PATCH /api/applications/:id/status // Admin status updates
```

#### Payment Processing
```javascript
POST /api/payments/create-payment-intent // Stripe payment setup
POST /api/payments/confirm-payment      // Payment confirmation
POST /api/payments/webhook              // Stripe webhook handler
```

#### File Management
```javascript
POST /api/uploads                  // Document upload
POST /api/photos/upload           // Photo upload with optimization
POST /api/videos/upload-intro     // Video upload with processing
```

### Security Implementation

#### Authentication & Authorization
```javascript
// JWT middleware with role checking
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = jwt.verify(token, JWT_SECRET);
  req.user = { id: payload.sub, role: payload.role };
  next();
}

// Role-based access control
export function onlyRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

#### reCAPTCHA Integration
```javascript
// Three security levels based on endpoint sensitivity
export const requireStrictRecaptcha = requireRecaptcha({
  minScore: 0.7,  // High security for registration
  allowedActions: ['submit', 'register']
});

export const requireMediumRecaptcha = requireRecaptcha({
  minScore: 0.5,  // Medium security for password reset
  allowedActions: ['submit', 'register', 'reset']
});

export const requireBasicRecaptcha = requireRecaptcha({
  minScore: 0.3,  // Basic security for messaging
  allowedActions: ['submit', 'form', 'message']
});
```

---

## Business Logic & Integrations

### Student Application Workflow

#### Phase 1: Application Submission
1. **Student Registration** with email verification
2. **Multi-Step Application** (education, finance, documents)
3. **Automatic Validation** of required fields and documents
4. **Admin Notification** of new application

#### Phase 2: Review Process
1. **Admin Initial Review** for completeness
2. **Case Worker Assignment** based on geographic region
3. **Field Verification** including home visits
4. **Document Authentication** and background checks
5. **Recommendation Submission** with detailed notes

#### Phase 3: Interview Process
1. **Board Member Assignment** to interview panel
2. **Interview Scheduling** with calendar integration
3. **Email Notifications** to all participants
4. **Interview Execution** with decision recording
5. **Final Approval** based on majority vote

#### Phase 4: Marketplace Activation
1. **Student Profile Optimization** for donor matching
2. **Public Listing** on browse page
3. **Protected Marketplace** access for registered donors
4. **Matching Algorithm** based on preferences

### Payment Processing Workflow

#### Multi-Currency Support
```javascript
// Automatic currency detection based on university location
const detectCurrency = (university) => {
  if (university.country === 'Pakistan') return 'PKR';
  if (university.country === 'United Kingdom') return 'GBP';
  if (university.country === 'United States') return 'USD';
  // ... additional currency mappings
};

// Real-time currency conversion
const convertAmount = async (amount, fromCurrency, toCurrency) => {
  const rate = await getFxRate(fromCurrency, toCurrency);
  return Math.round(amount * rate);
};
```

#### Stripe Integration
```javascript
// Payment intent creation with metadata
const paymentIntent = await stripe.paymentIntents.create({
  amount: convertedAmount,
  currency: donorCurrency.toLowerCase(),
  metadata: {
    studentId: student.id,
    donorId: donor.id,
    originalAmount: application.amount,
    originalCurrency: application.currency
  }
});

// Automatic sponsorship creation on successful payment
const createSponsorship = async (paymentIntent) => {
  const sponsorship = await prisma.sponsorship.create({
    data: {
      donorId: paymentIntent.metadata.donorId,
      studentId: paymentIntent.metadata.studentId,
      amount: paymentIntent.amount,
      stripePaymentIntentId: paymentIntent.id
    }
  });
  
  // Send confirmation emails to both parties
  await sendPaymentConfirmationEmails(sponsorship);
};
```

### Communication System

#### Multi-Party Messaging
```javascript
// Conversation creation between donor and student
const createConversation = async (donorId, studentId, applicationId) => {
  const conversation = await prisma.conversation.create({
    data: {
      type: 'DONOR_STUDENT',
      participantIds: [donorId, studentId],
      studentId,
      applicationId
    }
  });
  
  return conversation;
};

// Message routing with admin oversight
const sendMessage = async (conversationId, senderId, text) => {
  const message = await prisma.conversationMessage.create({
    data: {
      conversationId,
      senderId,
      senderRole: req.user.role,
      text
    }
  });
  
  // Notify admin of sensitive conversations
  if (containsSensitiveContent(text)) {
    await notifyAdmin(conversationId, message);
  }
};
```

### Email Notification System

#### Automated Email Triggers
```javascript
// Welcome emails for new users
export async function sendStudentWelcomeEmail({ email, name }) {
  const htmlContent = generateWelcomeHTML(name, 'student');
  await sendEmail({
    to: email,
    subject: 'Welcome to AWAKE Connect',
    html: htmlContent
  });
}

// Application status updates
export async function sendApplicationStatusEmail({ 
  email, name, status, reason 
}) {
  const htmlContent = generateStatusHTML(name, status, reason);
  await sendEmail({
    to: email,
    subject: `Application Update: ${status}`,
    html: htmlContent
  });
}

// Interview scheduling notifications
export async function sendInterviewScheduledEmail({
  email, name, scheduledAt, meetingLink, boardMembers
}) {
  const htmlContent = generateInterviewHTML(
    name, scheduledAt, meetingLink, boardMembers
  );
  await sendEmail({
    to: email,
    subject: 'Interview Scheduled - AWAKE Connect',
    html: htmlContent
  });
}
```

---

## Deployment Guide

### Production Environment Setup

#### Server Configuration
```bash
# Ubuntu Server 20.04+ LTS
# Minimum Requirements: 2GB RAM, 20GB Storage, 1 CPU Core

# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# 4. Install PM2
sudo npm install pm2 -g

# 5. Install Nginx
sudo apt install nginx

# 6. Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

#### Database Setup
```bash
# Create database user and database
sudo -u postgres createuser --interactive awakeuser
sudo -u postgres createdb awake_production

# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE awake_production TO awakeuser;
ALTER USER awakeuser WITH PASSWORD 'secure_password_here';
```

#### Application Deployment
```bash
# 1. Clone repository
git clone https://github.com/webciters-dev/donors.git
cd donors

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Build frontend
npm run build

# 4. Configure environment variables
cp server/.env.example server/.env.production
# Edit server/.env.production with production values

# 5. Run database migrations
cd server
npx prisma migrate deploy
npx prisma generate

# 6. Start with PM2
pm2 start ecosystem.config.json --env production
pm2 startup
pm2 save
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/awake.webciters.dev
server {
    listen 80;
    server_name awake.webciters.dev;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name awake.webciters.dev;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/awake.webciters.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/awake.webciters.dev/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # File upload size
    client_max_body_size 10M;

    # Serve static files
    root /home/awakeuser/awake/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files
    location /uploads/ {
        alias /home/awakeuser/awake/server/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### SSL Certificate Setup
```bash
# Obtain SSL certificate
sudo certbot --nginx -d awake.webciters.dev

# Auto-renewal setup
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=https://awake.webciters.dev
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_RECAPTCHA_SITE_KEY=6Lf...
```

#### Backend (server/.env.production)
```env
# Database
DATABASE_URL=postgresql://awakeuser:secure_password@localhost:5432/awake_production

# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://awake.webciters.dev

# Authentication
JWT_SECRET=very_secure_random_string_here
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=email_password_here
EMAIL_FROM=AWAKE Connect <noreply@yourdomain.com>

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# reCAPTCHA
RECAPTCHA_SECRET_KEY=6Lf...
```

---

## User Manual

### Getting Started for Students

#### 1. Creating Your Account
1. Visit the platform homepage
2. Click "Student Registration"
3. Complete the reCAPTCHA verification
4. Fill in your email and create a secure password
5. Check your email for verification link

#### 2. Completing Your Application

**Step 1: Educational Information**
- Select your university from the dropdown
- Choose your field of study and degree level
- Enter your current GPA and expected graduation year
- Provide any additional academic details

**Step 2: Financial Information**
- Specify the total amount needed for your education
- Break down expenses: tuition, accommodation, living costs
- Provide family income information
- Upload supporting financial documents

**Step 3: Profile & Documents**
- Upload a professional profile photo
- Record a 60-90 second introduction video
- Upload required documents:
  - CNIC (National Identity Card)
  - Guardian CNIC
  - Academic transcripts
  - University enrollment proof
  - Income certificates

#### 3. Application Tracking
- Monitor your application status in real-time
- Respond to case worker requests for additional information
- Participate in scheduled interviews when required
- Maintain communication with assigned reviewers

#### 4. Active Student Phase
- Submit regular academic progress updates
- Maintain communication with your sponsor
- Upload semester results and achievements
- Keep your profile information current

### Getting Started for Donors

#### 1. Creating Your Donor Account
1. Visit the platform and click "Donor Registration"
2. Complete reCAPTCHA verification
3. Provide your contact information
4. Select your preferred currency
5. Add optional organization details

#### 2. Browsing Students
- Use the public browse page to preview students
- Register for full access to detailed profiles
- Filter by university, field of study, funding need
- Review student introduction videos and photos

#### 3. Making a Sponsorship
1. Select "Sponsor Student" on chosen profile
2. Review the complete funding requirement
3. Choose your payment frequency (one-time or installments)
4. Complete payment through secure Stripe processing
5. Receive confirmation email with receipt

#### 4. Managing Your Sponsorship
- Access your donor dashboard for overview
- Communicate directly with your sponsored student
- Track academic progress and achievements
- Download tax documentation and receipts

### Getting Started for Administrators

#### 1. Application Review Process
1. Access admin dashboard for application queue
2. Review submitted documents and information
3. Assign case workers for field verification
4. Monitor review progress and recommendations
5. Make final approval/rejection decisions

#### 2. Case Worker Management
1. Create case worker accounts with secure passwords
2. Assign applications based on geographic regions
3. Monitor review progress and quality
4. Provide feedback and guidance as needed

#### 3. Interview Coordination
1. Create board member profiles
2. Schedule interviews for approved applications
3. Coordinate panel assignments
4. Record interview decisions and outcomes

#### 4. Financial Oversight
1. Monitor donation and sponsorship activity
2. Process disbursements to approved students
3. Generate financial reports and analytics
4. Maintain audit trails for all transactions

---

## Administration Guide

### User Management

#### Creating Admin Users
```bash
# Super Admin can create new admin accounts
POST /api/super-admin/users
{
  "name": "Admin Name",
  "email": "admin@awakeconnect.org",
  "role": "ADMIN"
}
```

#### Managing Case Workers
```bash
# Create case worker with secure password generation
POST /api/users/case-workers
{
  "name": "Case Worker Name",
  "email": "caseworker@awakeconnect.org",
  "recaptchaToken": "..."
}
```

### Application Management

#### Application Status Workflow
```
PENDING → PROCESSING → CASE_WORKER_APPROVED → 
INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED → 
BOARD_APPROVED → APPROVED
```

#### Status Update Commands
```bash
# Update application status
PATCH /api/applications/:id/status
{
  "status": "CASE_WORKER_APPROVED",
  "notes": "Field verification completed successfully"
}
```

### Financial Management

#### Currency Configuration
```bash
# Add new exchange rate
POST /api/fx
{
  "base": "USD",
  "quote": "PKR",
  "rate": 278.50,
  "source": "manual_admin_update"
}
```

#### Disbursement Processing
```bash
# Create disbursement record
POST /api/disbursements
{
  "studentId": "student_id_here",
  "amount": 50000,
  "notes": "First semester disbursement"
}
```

### System Monitoring

#### Health Checks
```bash
# System health endpoint
GET /api/health
Response: { "ok": true, "timestamp": "2025-11-21T..." }
```

#### Application Metrics
```bash
# Get system statistics
GET /api/statistics/detailed
Response: {
  "applications": { "total": 150, "approved": 85, "pending": 45 },
  "students": { "total": 200, "active": 85, "graduated": 15 },
  "financial": { "totalFunded": 425000, "activeSponsorships": 85 }
}
```

### Data Export & Backup

#### Export Applications
```bash
GET /api/export/applications
# Downloads CSV with complete application data
```

#### Database Backup
```bash
# Manual backup command
cd database
./export_database.sh
# Creates timestamped backup file
```

---

## Troubleshooting

### Common Issues

#### Login Problems
**Issue:** Users cannot log in after password reset
**Solution:** 
1. Check password reset token expiration (24 hours)
2. Verify email delivery to user's inbox/spam folder
3. Regenerate password reset if needed

#### Payment Processing Failures
**Issue:** Stripe payments failing or not completing
**Solution:**
1. Verify Stripe webhook endpoint configuration
2. Check payment intent status in Stripe dashboard
3. Validate currency conversion rates are current
4. Review payment logs for specific error codes

#### File Upload Issues
**Issue:** Documents or photos failing to upload
**Solution:**
1. Verify file size limits (images: 5MB, documents: 10MB)
2. Check supported file types (.jpg, .png, .pdf, .doc, .docx)
3. Ensure server storage space availability
4. Review file upload permissions

### Performance Issues

#### Slow Page Loading
**Diagnosis Steps:**
1. Check server resource usage (CPU, memory, disk)
2. Review database query performance
3. Analyze network latency to database
4. Check Nginx error logs for bottlenecks

**Solutions:**
1. Optimize database queries with proper indexing
2. Implement Redis caching for frequent queries
3. Upgrade server resources if needed
4. Enable Nginx gzip compression

#### Database Connection Errors
**Common Causes:**
1. Connection pool exhaustion
2. Database server resource limits
3. Network connectivity issues
4. Authentication failures

**Resolution:**
1. Restart database service: `sudo systemctl restart postgresql`
2. Check connection limits: `SHOW max_connections;`
3. Verify database credentials in `.env` file
4. Monitor connection pool usage

### Security Issues

#### reCAPTCHA Failures
**Issue:** High rate of reCAPTCHA validation failures
**Investigation:**
1. Check reCAPTCHA secret key configuration
2. Verify domain whitelist in Google Console
3. Review reCAPTCHA score thresholds
4. Monitor for automated attack patterns

#### Suspicious User Activity
**Detection:** Multiple failed login attempts, unusual payment patterns
**Response Protocol:**
1. Review user activity logs
2. Temporarily suspend suspicious accounts
3. Notify system administrators
4. Enhanced monitoring for related activities

### Email Delivery Problems

#### Welcome Emails Not Sending
**Checklist:**
1. SMTP server configuration in `.env`
2. Email service provider authentication
3. Rate limiting settings
4. Email template HTML validation

#### Notification Delays
**Common Causes:**
1. Email queue backlog
2. SMTP server rate limiting
3. Large attachment sizes
4. Email provider throttling

**Solutions:**
1. Implement email queue with retry logic
2. Optimize email templates for size
3. Configure appropriate sending rates
4. Monitor email service provider status

---

## Maintenance & Support

### Regular Maintenance Tasks

#### Daily Tasks
- [ ] Monitor system health and error logs
- [ ] Review payment processing status
- [ ] Check email delivery rates
- [ ] Verify backup completion

#### Weekly Tasks
- [ ] Update exchange rates for currency conversion
- [ ] Review application approval pipeline
- [ ] Monitor user registration patterns
- [ ] Analyze system performance metrics

#### Monthly Tasks
- [ ] Security update review and application
- [ ] Database performance optimization
- [ ] User feedback analysis and action items
- [ ] Financial reconciliation and reporting

### Backup Strategy

#### Database Backups
```bash
# Automated daily backup script
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="awake_backup_$TIMESTAMP.sql"
pg_dump awake_production > /backups/$BACKUP_FILE
# Retain last 30 days of backups
find /backups -name "awake_backup_*.sql" -mtime +30 -delete
```

#### File Storage Backups
```bash
# Backup uploaded files
rsync -av /home/awakeuser/awake/server/uploads/ /backups/uploads_backup/
```

### Monitoring & Alerts

#### System Monitoring
```javascript
// Health check with detailed metrics
app.get('/api/health/detailed', async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    database: await checkDatabaseConnection(),
    storage: await checkStorageSpace(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  res.json(health);
});
```

#### Alert Configuration
- **Database Connection Failures:** Immediate notification
- **Payment Processing Errors:** Real-time monitoring
- **Storage Space Low:** Warning at 80% capacity
- **High Error Rates:** Alert if >5% error rate over 5 minutes

### Support Contacts

#### Technical Support
- **Platform Issues:** admin@awakeconnect.org
- **Payment Questions:** payments@awakeconnect.org
- **Emergency Contact:** +92-XXX-XXXXXXX

#### Development Support
- **Repository:** https://github.com/webciters-dev/donors
- **Documentation:** Available in repository `/docs` folder
- **Issue Tracking:** GitHub Issues for bug reports

### Version Management

#### Update Process
1. **Development Testing:** Comprehensive testing in dev environment
2. **Staging Deployment:** Deploy to staging for final validation
3. **Backup Creation:** Full system backup before production update
4. **Production Deployment:** Gradual rollout with monitoring
5. **Rollback Plan:** Quick revert procedure if issues arise

#### Version History
- **v1.0** - Initial production release with core functionality
- **v1.1** - Enhanced interview system and board member management
- **v1.2** - Multi-currency support and payment optimization
- **v2.0** - Planned: Mobile app integration and advanced analytics

---

## Appendices

### Appendix A: API Reference Quick Guide

#### Authentication
```bash
# Login
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }

# Register Student
POST /api/auth/register-student
Body: { "email": "...", "password": "...", "recaptchaToken": "..." }
```

#### Students
```bash
# Get student profile
GET /api/students/me
Headers: { "Authorization": "Bearer jwt_token" }

# Update profile
PUT /api/students/me
Body: { "name": "...", "university": "...", ... }
```

### Appendix B: Database Schema Reference

#### Key Relationships
- `User.studentId` → `Student.id` (One-to-one)
- `Student.applications` → `Application[]` (One-to-many)
- `Application.fieldReviews` → `FieldReview[]` (One-to-many)
- `Donor.sponsorships` → `Sponsorship[]` (One-to-many)

### Appendix C: Environment Variables Reference

#### Required Variables
```env
DATABASE_URL                # PostgreSQL connection string
JWT_SECRET                 # JWT signing secret
EMAIL_HOST                 # SMTP server hostname
EMAIL_USER                 # SMTP username
EMAIL_PASS                 # SMTP password
STRIPE_SECRET_KEY          # Stripe secret key
RECAPTCHA_SECRET_KEY       # Google reCAPTCHA secret
```

#### Optional Variables
```env
PORT                       # Server port (default: 3001)
FRONTEND_URL              # Frontend URL for CORS
EMAIL_PORT                # SMTP port (default: 587)
DEVELOPMENT_MODE          # Bypass reCAPTCHA in dev
```

---

**Document Version:** 1.0  
**Last Updated:** November 21, 2025  
**Contact:** admin@awakeconnect.org  
**Repository:** https://github.com/webciters-dev/donors

---

*This manual provides comprehensive documentation for the AWAKE Connect platform. For technical support or questions, please contact the development team.*