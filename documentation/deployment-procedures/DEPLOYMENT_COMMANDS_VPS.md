# VPS Deployment Commands for Email Template Updates

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

**Changes Deployed:** Enhanced all 17 remaining email functions with professional AWAKE branding and landing page CTAs  
**GitHub Commit:** `5e7efcf` - "Enhance all email templates with professional AWAKE branding and landing page CTAs"  
**Repository:** github.com/webciters-dev/donors.git (main branch)

## Deployment Steps

### 1. SSH into VPS
```bash
ssh sohail@aircrew.nl
# or
ssh sohail@136.144.175.93
```

### 2. Navigate to Project Directory
```bash
cd /home/sohail/projects/donors/
```

### 3. Pull Latest Changes from GitHub
```bash
git pull origin main
```

**Expected Output:**
```
Updating fe7e025..5e7efcf
Fast-forward
 server/src/lib/emailService.js | 138 ++++++++++++++++++++++++++++------
 1 file changed, 138 insertions(+), 91 deletions(-)
```

### 4. Verify Changes Were Applied
```bash
cd server
git log --oneline -5
```

**Expected Output:**
```
5e7efcf Enhance all email templates with professional AWAKE branding and landing page CTAs
fe7e025 Add comprehensive .gitignore for production deployment
...
```

### 5. Restart PM2 Backend Process
```bash
pm2 restart 0
```

**Expected Output:**
```
[PM2] Restarting app : donors-api
[PM2] Restoring processes...
[ nodeId: 0, version: 0.3.2, processId: xxxxx ]
(ノ ゚Д゚)ノ If you forget to `pm2 start` your node process, you are a silly fellow...
```

### 6. Verify Backend is Running
```bash
pm2 status
```

**Expected Output - Backend Should be ONLINE:**
```
┌─────────────────────────┬──────┬──────┬────────┬─────────┬──────────┐
│ id │ name        │ mode │ status │ ↺      │ uptime  │
├─────────────────────────┼──────┼──────┼────────┼─────────┼──────────┤
│ 0  │ donors-api  │ fork │ online │ 0      │ 5s      │
└─────────────────────────┴──────┴──────┴────────┴─────────┴──────────┘
```

### 7. Verify Backend Health Check
```bash
curl http://localhost:3001/api/health
```

**Expected Output:**
```
{"ok":true}
```

### 8. Test Email System is Working

The backend will automatically use the enhanced email templates on the next email sending event.

To manually test:
1. Trigger an action that sends an email (e.g., password reset, application submission)
2. Check the email received to verify:
   - ✅ AWAKE branding is present
   - ✅ All links point to https://aircrew.nl
   - ✅ Professional styling and formatting applied
   - ✅ Expanded content with clear context

## Summary of Email Template Changes

### All 17 Functions Updated ✅

**Categories Enhanced:**

1. **Case Worker/Field Officer (3)**
   - sendFieldOfficerWelcomeEmail - Professional welcome with role details
   - sendCaseWorkerAssignmentEmail - Detailed assignment notification
   - sendStudentCaseWorkerAssignedEmail - Verification progress tracker

2. **Student Notifications (2)**
   - sendStudentNotificationEmail - Structured message alert
   - sendDocumentUploadNotification - Document review coordinator

3. **Welcome (1)**
   - sendBoardMemberWelcomeEmail - Board member onboarding

4. **Authentication (1)**
   - sendPasswordResetEmail - Security-focused reset

5. **Application Workflow (4)**
   - sendApplicationConfirmationEmail - Professional confirmation
   - sendMissingDocumentRequestEmail - Document request with deadline
   - sendApplicationApprovedStudentEmail - Marketplace listing celebration
   - sendApplicationRejectedStudentEmail - Supportive revision guidance

6. **Interview System (2)**
   - sendInterviewScheduledStudentEmail - Student preparation guidance
   - sendInterviewScheduledBoardMemberEmail - Board member assignment

7. **Sponsorship & Admin (4)**
   - sendAdminFieldReviewCompletedEmail - Field review alert
   - sendDonorPaymentConfirmationEmail - Payment confirmation
   - sendStudentSponsorshipNotificationEmail - Sponsorship celebration
   - sendApplicationSubmissionNotificationEmail - Admin notification

### Template Features Applied to All

✅ AWAKE/Akhuwat branding throughout  
✅ Emerald green color scheme (#059669)  
✅ Professional gradient backgrounds  
✅ Expanded content with context  
✅ Clear next-step guidance  
✅ Support contact: support@aircrew.nl  
✅ All CTAs point to https://aircrew.nl landing page  
✅ Responsive HTML design  
✅ Consistent styling across all templates  

## Rollback Instructions (if needed)

If you need to rollback these changes:

```bash
git revert 5e7efcf --no-edit
pm2 restart 0
```

## Post-Deployment Verification Checklist

- [ ] SSH connection successful
- [ ] Git pull completed without errors
- [ ] PM2 restart completed
- [ ] Backend shows ONLINE status
- [ ] Health check returns {"ok":true}
- [ ] First test email sent and received
- [ ] Email has AWAKE branding
- [ ] Email links point to https://aircrew.nl
- [ ] Professional styling applied
- [ ] Expanded content visible

## Contact & Support

If deployment issues occur:
- Check PM2 logs: `pm2 logs 0`
- Check application logs: `cat /home/sohail/projects/donors/server/logs/production.log`
- Email: support@aircrew.nl

## Success! 🎉

Once verified, the enhanced email system is live on https://aircrew.nl
