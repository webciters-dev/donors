#  Email Notifications - Enhancement TODO List

**Last Updated:** November 24, 2025  
**Status:** Planning Phase  
**Priority:** High Impact Business Features

---

##  Current Implementation Status

###  **ALREADY IMPLEMENTED** (17 Email Types Working)

#### Student Notifications (6/11) - 55% Complete
-  Welcome Email - When student registers
-  Application Confirmation - When application submitted
-  Application Approved - When admin approves
-  Application Rejected - When admin rejects
-  Sponsorship Received - When donor sponsors
-  Interview Scheduled - When board interview scheduled

#### Donor Notifications (2/6) - 33% Complete
-  Welcome Email - When donor registers
-  Payment Confirmation - When payment processed

#### Case Worker Notifications (3/5) - 60% Complete
-  Welcome Email - When account created
-  Assignment Email - When student assigned
-  Document Upload - When student uploads document

#### Admin Notifications (1/7) - 14% Complete
-  Field Review Completed - When case worker completes review

#### Board Member Notifications (2/5) - 40% Complete
-  Welcome Email - When added as board member
-  Interview Assignment - When assigned to panel

#### System Notifications (3/6) - 50% Complete
-  Password Reset - Forgot password flow
-  Missing Document Request - Admin requests docs
-  General Student Messages - Custom notifications

**TOTAL: 17/40 Email Types = 42.5% Complete**

---

##  Phase 1: Critical Business Impact (HIGH PRIORITY)

### 1. Donor Matching Notifications 
**Impact:** Increases sponsorship conversion by 30-40%  
**Effort:** 4-6 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendDonorMatchingStudentsEmail()` function
  - Match based on: university, field, degree level, amount, province, city
  - Include top 3-5 matching students
  - Show match score (0-100%)
  - Direct links to student profiles
  
- [ ] Create daily/weekly digest email
  - [ ] `sendDonorWeeklyDigest()` - Summary of new matches
  - [ ] Admin setting: Daily vs Weekly preference
  - [ ] Unsubscribe option
  
- [ ] Add trigger logic
  - [ ] When new student approved (check all donor preferences)
  - [ ] Scheduled job: Daily digest at 9 AM
  - [ ] Respect donor notification preferences

#### Email Template Content:
```
Subject:  3 New Students Match Your Preferences

Dear [Donor Name],

We found 3 new students who match your sponsorship preferences:

1. [Student Name] - [University] - [Program] - $[Amount] (95% match)
2. [Student Name] - [University] - [Program] - $[Amount] (88% match)
3. [Student Name] - [University] - [Program] - $[Amount] (82% match)

[View All Matches Button]
[Update Preferences Button]
```

---

### 2. Admin Critical Action Alerts 
**Impact:** Prevents application bottlenecks, improves efficiency  
**Effort:** 5-7 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendAdminPendingActionsDigest()` function
  - Applications pending >7 days
  - Field reviews waiting >5 days
  - Interview decisions not submitted >48 hours
  - Failed payments requiring attention
  
- [ ] Create daily digest email (morning 8 AM)
  - [ ] Dashboard summary with counts
  - [ ] Direct action links
  - [ ] Priority indicators (urgent, normal)
  
- [ ] Create urgent alert email
  - [ ] Trigger immediately for critical issues
  - [ ] Applications pending >14 days
  - [ ] Interviews scheduled but no panel assigned

#### Email Template Content:
```
Subject: ️ [5] Pending Actions Require Your Attention

Good morning, Admin!

Your Daily Action Summary:

 URGENT:
- 2 applications pending >10 days
- 1 interview scheduled tomorrow (no panel assigned)

 ATTENTION NEEDED:
- 3 field reviews waiting >5 days
- 4 interview decisions pending

[View Admin Dashboard]
[Take Action Now]
```

---

### 3. Board Member Interview Reminders ⏰
**Impact:** Reduces no-shows, improves interview completion rate  
**Effort:** 3-4 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendInterviewReminder24Hours()` function
  - 24 hours before interview
  - Include meeting link, student name, application summary
  
- [ ] Create `sendInterviewReminder1Hour()` function
  - 1 hour before interview
  - Quick reminder with join link
  
- [ ] Create `sendInterviewDecisionRequest()` function
  - 48 hours after interview if decision not submitted
  - Remind to submit approve/reject/abstain
  
- [ ] Add scheduled job for reminders
  - Check every hour for upcoming interviews
  - Send reminders at appropriate times

#### Email Template Content:
```
Subject: ⏰ Interview Tomorrow - [Student Name] at [Time]

Dear [Board Member],

This is a reminder about your scheduled interview:

 Date: Tomorrow, [Date]
⏰ Time: [Time]
 Student: [Student Name]
 Program: [University] - [Program]
 Join Link: [Meeting Link]

[Review Application] [Join Meeting]
```

---

##  Phase 2: Operational Efficiency (MEDIUM PRIORITY)

### 4. Case Worker Review Reminders 
**Impact:** Speeds up verification process by 50%  
**Effort:** 3-4 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendCaseWorkerReviewReminder()` function
  - Trigger: Review pending >3 days
  - Include student name, application ID
  - Direct link to review page
  
- [ ] Create `sendCaseWorkerTaskCompletionConfirmation()` function
  - Sent when case worker submits review
  - Thank you message
  - Summary of their recommendation

---

### 5. Student Progress Update Reminders 
**Impact:** Keeps profiles active, increases donor engagement  
**Effort:** 4-5 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendStudentProgressUpdateReminder()` function
  - Quarterly reminder (every 3 months)
  - Remind to update GPA, achievements, goals
  - Show impact: "Your sponsor wants to hear from you"
  
- [ ] Create `sendDonorStudentInactiveAlert()` function
  - Notify donor: "Student hasn't updated in 60 days"
  - Encourage donor to send message
  - Option to request progress update

---

### 6. Application Status Transition Emails 
**Impact:** Better transparency, reduces support inquiries  
**Effort:** 2-3 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Add email for `PENDING → PROCESSING` transition
- [ ] Add email for `PROCESSING → CASE_WORKER_APPROVED` transition
- [ ] Add email for `CASE_WORKER_APPROVED → INTERVIEW_SCHEDULED` transition
- [ ] Add email for `INTERVIEW_COMPLETED → BOARD_APPROVED` transition

---

##  Phase 3: Engagement & Retention (LOW PRIORITY)

### 7. Recurring Payment Notifications 
**Impact:** Reduces payment confusion, increases trust  
**Effort:** 3-4 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendRecurringPaymentConfirmation()` function
- [ ] Create `sendPaymentFailedNotification()` function
- [ ] Create `sendPaymentRetryNotification()` function
- [ ] Create `sendNextPaymentReminder()` function (3 days before)

---

### 8. Re-engagement Emails 
**Impact:** Brings back inactive users, reduces churn  
**Effort:** 5-6 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendInactiveDonorReengagement()` function
  - Trigger: Last login >30 days
  - "New students available since your last visit"
  
- [ ] Create `sendIncompleteStudentProfileReminder()` function
  - Trigger: Profile <80% complete
  - "Complete your profile to get sponsored"
  
- [ ] Create `sendCaseWorkerPendingTasksReminder()` function
  - Weekly summary of pending reviews

---

### 9. Weekly Admin Digest 
**Impact:** Executive oversight, data-driven decisions  
**Effort:** 4-5 hours  
**Status:** ⏳ TODO

#### Tasks:
- [ ] Create `sendAdminWeeklyDigest()` function
  - Total applications this week
  - Approval rate
  - Total sponsorships & amount
  - Case worker performance
  - System health metrics

---

## ️ Technical Implementation Requirements

### New Files to Create:
1. **`server/src/lib/emailNotifications.js`** - New notification functions
2. **`server/src/routes/notifications.js`** - Admin notification management
3. **`server/src/jobs/emailScheduler.js`** - Cron job scheduler
4. **`server/src/middleware/notificationQueue.js`** - Email queue & rate limiting
5. **`server/src/utils/matchingAlgorithm.js`** - Donor-student matching logic

### Dependencies to Add:
```json
{
  "node-cron": "^3.0.3",  // For scheduled jobs
  "bull": "^4.12.0"       // For email queue (optional, advanced)
}
```

### Environment Variables to Add:
```env
# Email Notification Settings
ENABLE_EMAIL_REMINDERS=false              # Master switch
ENABLE_DONOR_MATCHING=false               # Donor matching emails
ENABLE_ADMIN_DIGESTS=false                # Admin daily/weekly digests
ENABLE_INTERVIEW_REMINDERS=false          # Board member reminders

# Timing Configuration
NOTIFICATION_CHECK_INTERVAL=3600000       # Check every hour (ms)
ADMIN_DIGEST_TIME=08:00                   # Daily digest time
DONOR_DIGEST_DAY=monday                   # Weekly digest day
DONOR_DIGEST_TIME=09:00                   # Weekly digest time

# Thresholds
PENDING_APPLICATION_ALERT_DAYS=7          # Alert after 7 days
PENDING_REVIEW_ALERT_DAYS=5               # Alert after 5 days
INACTIVE_STUDENT_ALERT_DAYS=60            # Alert after 60 days
INTERVIEW_REMINDER_24H=true               # 24h reminder
INTERVIEW_REMINDER_1H=true                # 1h reminder
```

### Database Schema Changes (Optional):
```prisma
// Track notification preferences per user
model NotificationPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  emailEnabled    Boolean  @default(true)
  digestFrequency String   @default("weekly") // daily, weekly, never
  matchingAlerts  Boolean  @default(true)
  reminderAlerts  Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("notification_preferences")
}

// Track sent notifications (prevent duplicates)
model NotificationLog {
  id              String   @id @default(cuid())
  type            String   // "donor_matching", "admin_digest", etc.
  recipientEmail  String
  recipientUserId String?
  status          String   // "sent", "failed", "queued"
  errorMessage    String?
  sentAt          DateTime @default(now())
  
  @@map("notification_logs")
}
```

---

##  Success Metrics to Track

Once implemented, measure:
- **Sponsorship conversion rate** (before vs after donor matching)
- **Application processing time** (before vs after admin alerts)
- **Interview no-show rate** (before vs after reminders)
- **Case worker review time** (before vs after reminders)
- **Student profile completion rate** (before vs after reminders)
- **Email delivery rate** (sent vs failed)
- **Email open rate** (if tracking enabled)
- **Email click-through rate** (CTA clicks)

---

##  What NOT to Do (Safety Rules)

1.  **DO NOT** modify existing working email functions in `emailService.js`
2.  **DO NOT** change existing route files without careful review
3.  **DO NOT** enable all features at once (gradual rollout)
4.  **DO NOT** send emails without rate limiting (respect Brevo limits)
5.  **DO NOT** send reminders more than once per day per user
6.  **DO NOT** spam users (respect unsubscribe preferences)
7.  **DO NOT** send emails during night hours (8 AM - 9 PM only)
8.  **DO NOT** use production email for testing (use test mode)

---

##  Testing Checklist

Before deploying each notification type:
- [ ] Test email template rendering (HTML + plain text)
- [ ] Test with real email client (Gmail, Outlook)
- [ ] Test mobile responsiveness
- [ ] Test all dynamic variables populate correctly
- [ ] Test error handling (failed sends)
- [ ] Test rate limiting
- [ ] Test duplicate prevention
- [ ] Test unsubscribe links work
- [ ] Test scheduling accuracy (cron jobs)
- [ ] Test database query performance
- [ ] Load test with 100+ emails
- [ ] Test email delivery to spam folders

---

##  Estimated Timeline

| Phase | Tasks | Effort | Duration |
|-------|-------|--------|----------|
| Phase 1 | Tasks 1-3 | 12-17 hours | 2-3 days |
| Phase 2 | Tasks 4-6 | 9-12 hours | 2 days |
| Phase 3 | Tasks 7-9 | 12-15 hours | 2-3 days |
| **TOTAL** | **9 task groups** | **33-44 hours** | **6-8 days** |

---

##  Quick Start Guide (When Ready to Implement)

### Step 1: Choose a Phase
```bash
# Example: Start with Phase 1, Task 1 (Donor Matching)
git checkout -b feature/email-donor-matching
```

### Step 2: Create New Files (Don't Modify Existing)
```bash
# Create new notification functions file
touch server/src/lib/emailNotifications.js

# Create notification routes
touch server/src/routes/notifications.js

# Create scheduler (if needed)
touch server/src/jobs/emailScheduler.js
```

### Step 3: Add Environment Variables
```bash
# Add to server/.env
ENABLE_DONOR_MATCHING=false  # Start disabled for testing
```

### Step 4: Test Locally
```bash
# Send test email
curl -X POST http://localhost:3001/api/notifications/test/donor-matching \
  -H "Content-Type: application/json" \
  -d '{"donorId": "test-donor-id"}'
```

### Step 5: Enable in Production
```bash
# After thorough testing, enable in production
ENABLE_DONOR_MATCHING=true
```

---

##  Notes & Decisions Log

### November 24, 2025
- **Decision:** Create this TODO file to persist plans across chat sessions
- **Decision:** Keep existing email functions untouched (zero risk approach)
- **Decision:** Use feature flags for gradual rollout
- **Decision:** Create separate files for new notifications (modular approach)
- **Reason:** User wants 100% guarantee nothing breaks with existing emails

---

## 🆘 Emergency Rollback Plan

If something goes wrong:

```bash
# 1. Disable all new notifications immediately
# In server/.env, set all to false:
ENABLE_EMAIL_REMINDERS=false
ENABLE_DONOR_MATCHING=false
ENABLE_ADMIN_DIGESTS=false
ENABLE_INTERVIEW_REMINDERS=false

# 2. Restart server
pm2 restart awake-backend

# 3. Check logs
pm2 logs awake-backend --lines 100

# 4. Remove new routes from server.js if needed
# Comment out: app.use("/api/notifications", notificationsRouter);

# 5. Revert database migrations if any
npx prisma migrate resolve --rolled-back <migration-name>
```

---

##  Completion Checklist

Mark tasks complete as you finish them:

### Phase 1
- [ ] Donor matching notifications implemented & tested
- [ ] Admin critical action alerts implemented & tested
- [ ] Board interview reminders implemented & tested
- [ ] All Phase 1 emails sending successfully in production

### Phase 2
- [ ] Case worker review reminders implemented & tested
- [ ] Student progress reminders implemented & tested
- [ ] Application status transition emails implemented & tested
- [ ] All Phase 2 emails sending successfully in production

### Phase 3
- [ ] Recurring payment notifications implemented & tested
- [ ] Re-engagement emails implemented & tested
- [ ] Weekly admin digest implemented & tested
- [ ] All Phase 3 emails sending successfully in production

---

**END OF TODO LIST**

**Questions or need clarification?** Update this file with your notes!
