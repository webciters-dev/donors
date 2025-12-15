# Complete Testing Flow for AWAKE Connect

**Website**: https://aircrew.nl

---

## 🎯 What to Test

You will walk through the entire application from **student perspective** to **admin perspective** to make sure everything works correctly.

---

## ✅ Step 1: Register as Student (5 minutes)

1. Go to https://aircrew.nl
2. Click **"Apply for Aid"** button
3. Fill in the form:
   - **Name**: Any name you want (e.g., "Test Student 123")
   - **Email**: Must be unique (e.g., test.student.12345@gmail.com)
   - **Password**: Any password (e.g., TestPass123)
   - **Upload Photo**: Upload any photo from your computer
   - Click **"Register"**
4. You will see a confirmation message
5. You should receive a welcome email (check spam folder if not in inbox)

✅ **What should happen**: Registration completes, you get a token/login message

---

## ✅ Step 2: Complete Student Profile (5 minutes)

After registration, you'll be taken to profile setup. Fill in your personal details:

- **Full Name**: Your complete name
- **Date of Birth**: Select your birth date
- **Phone Number**: Enter phone number (e.g., +92300000000)
- **Address**: Enter your address
- **City**: Enter your city
- **Country**: Select your country
- **Guardian Name** (optional): Your guardian's name if applicable
- **Guardian Contact** (optional): Guardian's phone/email
- Click **"Save Profile"** or **"Continue"**

✅ **What should happen**: Profile is saved, you see confirmation

---

## ✅ Step 3: Complete Student Application (15 minutes)

After profile, you'll go to the application form in steps:

### **Step 3.1 - Education Details (Step 1)**
- **Current Education Level**: Select (e.g., Undergraduate, Postgraduate)
- **University Name**: Enter university name
- **Degree Level**: Select degree type (e.g., Bachelor, Master, PhD)
- **Field of Study**: Enter field (e.g., Engineering, Medicine, Business)
- **Program/Major**: Enter specific program name
- **Expected Graduation**: Select date
- **GPA/CGPA**: Enter your GPA (e.g., 3.5)
- **Current Year**: Select current year of study
- Click **"Next"** to continue to Step 2

### **Step 3.2 - Financial Details (Step 2)**
- **Total Education Cost**: Enter total amount needed (e.g., 100000)
- **Currency**: Select currency (PKR, USD, etc.)
- **Semester/Year Fee**: Enter semester/yearly fee (e.g., 50000)
- **Living Expenses**: Enter monthly/yearly living costs (e.g., 30000)
- **Other Expenses**: Any other costs (books, transport, etc.)
- **Financial Situation**: Describe your financial need
- Click **"Next"** to continue to Step 3

### **Step 3.3 - Supporting Documents (Step 3)**
- **Upload Academic Certificate**: Upload your latest academic result/certificate
- **Upload Fee Invoice**: Upload education fee invoice
- **Upload ID Document**: Upload CNIC or national ID copy
- **Upload Income Certificate**: Upload family income certificate (if available)
- **Upload Any Other Document**: Upload any additional supporting documents
- Click **"Submit Application"**

✅ **What should happen**: Application is submitted successfully, you see confirmation message, receive confirmation email with application details

---

## ✅ Step 4: Login as Admin (2 minutes)

1. Go back to https://aircrew.nl
2. Click **"Admin Login"** (usually in top right or header)
3. Login with admin credentials:
   - **Email**: test+60@webciters.com
   - **Password**: Admin@123
4. You should see the **Admin Dashboard**

✅ **What should happen**: You login successfully and see admin panel

---

## ✅ Step 5: Find the Student Application (3 minutes)

In the Admin Dashboard:

1. Look for **"Applications"** or **"Pending Applications"** section
2. Find the application from the student you just created (search by name or email)
3. Click on the application to open it
4. You should see:
   - Student name, email, photo
   - Education details (university, degree, etc.)
   - Financial details (costs, expenses)
   - Application status (should be "PENDING" or similar)

✅ **What should happen**: You can see the complete student application

---

## ✅ Step 6: Assign Case Worker to Student (3 minutes)

1. While viewing the application, look for **"Assign Case Worker"** button or option
2. Click it
3. Select a case worker from the dropdown (or create one if needed)
4. Click **"Assign"** or **"Save"**
5. Confirm the case worker is now assigned

✅ **What should happen**: Case worker is assigned to the student

---

## ✅ Step 7: Request Documents from Student (2 minutes)

1. In the application, look for **"Request Documents"** or **"Document Requirements"** section
2. Select the required documents (usually things like):
   - CNIC (National ID)
   - Academic Results
   - Fee Invoices
   - Income Certificate
3. Click **"Send Request"** or **"Request Documents"**
4. Student should receive an email asking for documents

✅ **What should happen**: Document request is sent to student, they receive email

---

## ✅ Step 8: Review Application & Arrange Board Interview (5 minutes)

1. In the application, look for **"Schedule Interview"** or **"Board Interview"** section
2. Click **"Schedule Interview with Board Members"**
3. Fill in:
   - **Interview Date**: Pick any future date
   - **Interview Time**: Pick any time (e.g., 10:00 AM)
   - **Interview Link/Location**: Enter meeting link or location
4. Click **"Schedule"** or **"Save"**
5. Email should be sent to student with interview details

✅ **What should happen**: Interview is scheduled, student gets email notification

---

## ✅ Step 9: Approve or Reject Application (3 minutes)

1. Back in the application, look for **"Status"** section
2. You should see buttons/options to:
   - ✅ **"Approve"** application
   - ❌ **"Reject"** application
   - (Optional) Add notes about the decision

3. Choose one:
   - Click **"Approve"** - Student is now eligible for sponsorship
   - OR Click **"Reject"** - Application is rejected

4. Add any notes if you want (optional)
5. Click **"Submit"** or **"Save"**

✅ **What should happen**: Application status changes to "APPROVED" or "REJECTED", emails sent to student

---

## ✅ Step 10: View Approved Student in Donor/Sponsor Area (3 minutes)

1. Logout from admin (click logout in top right)
2. Go back to https://aircrew.nl
3. Look for **"Browse Students"** or **"Find a Student to Sponsor"** section
4. Search for the student you approved
5. You should see their profile with:
   - Photo
   - Education details
   - Amount needed
   - Option to sponsor

✅ **What should happen**: Approved student appears in sponsor/donor search

---

## 📋 Quick Checklist - What to Test

- [ ] Student registration works (form submits, email received)
- [ ] Student can complete profile with all details
- [ ] Student can complete application in 3 steps
- [ ] Documents can be uploaded (CNIC, certificates, invoices, etc.)
- [ ] Admin can login with test credentials
- [ ] Admin can see pending applications
- [ ] Admin can assign case worker to student
- [ ] Admin can request documents from student
- [ ] Admin can schedule board interview
- [ ] Admin can approve/reject application
- [ ] Emails are sent at each step (registration, application, doc request, interview, approval)
- [ ] Approved student appears in sponsor search area
- [ ] No error messages or crashes during any step

---

## 🔴 If Something Breaks

If you see errors:
1. Take a screenshot of the error
2. Write down exactly what you were doing when it happened
3. Check browser console (F12 → Console tab) for red error messages
4. Share the screenshot and error message

---

## ⏱️ Total Time: ~45 minutes

**Sections to Test**:
- Student registration: 5 min
- Student profile completion: 5 min
- Student application (3 steps): 15 min
- Admin login: 2 min
- Find application: 3 min
- Assign case worker: 3 min
- Request documents: 2 min
- Schedule interview: 5 min
- Approve/reject: 3 min
- View in sponsor area: 3 min

---

## 🎯 Success Criteria

✅ All steps complete without errors  
✅ Emails are received at each step  
✅ Data is saved correctly  
✅ Admin can see and manage student applications  
✅ Approved students appear in sponsor search  
✅ No crashes or broken buttons  

---

**Admin Test Account**:
- Email: test+60@webciters.com
- Password: Admin@123

**Start Here**: https://aircrew.nl

Let us know if you find any issues! 🚀
