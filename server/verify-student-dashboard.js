// Complete verification script for Ahmad Khan's student dashboard
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyStudentDashboard() {
  try {
    console.log('🎯 AHMAD KHAN STUDENT DASHBOARD VERIFICATION\n');
    console.log('='.repeat(50));
    
    // 1. Verify Student Profile Completeness
    console.log('\n📋 1. PROFILE COMPLETENESS CHECK');
    console.log('-'.repeat(30));
    
    const student = await prisma.student.findFirst({
      where: { name: 'Ahmad Khan' }
    });
    
    if (!student) {
      console.log('❌ Ahmad Khan not found in database');
      return;
    }
    
    const requiredFields = [
      'cnic', 'dateOfBirth', 'guardianName', 'guardianCnic', 
      'phone', 'address', 'city', 'province', 'university', 
      'program', 'gpa', 'gradYear'
    ];
    
    console.log('✅ Student found:', student.name);
    console.log('📧 Email:', student.email);
    
    const missing = requiredFields.filter(field => {
      const value = student[field];
      return value === null || value === undefined || value === '' || 
             (typeof value === 'string' && value.trim() === '') ||
             Number.isNaN(value);
    });
    
    const completed = requiredFields.length - missing.length;
    const percentage = Math.round((completed / requiredFields.length) * 100);
    
    if (percentage === 100) {
      console.log('🎉 Profile Completion: 100% ✅');
      console.log('✅ All required fields are filled');
    } else {
      console.log(`⚠️  Profile Completion: ${percentage}% (${completed}/${requiredFields.length})`);
      console.log('❌ Missing fields:', missing);
    }
    
    // 2. Verify Application Status
    console.log('\n🗂️  2. APPLICATION STATUS CHECK');
    console.log('-'.repeat(30));
    
    const application = await prisma.application.findFirst({
      where: { studentId: student.id },
      include: {
        student: true
      }
    });
    
    if (!application) {
      console.log('❌ No application found for Ahmad Khan');
      return;
    }
    
    console.log('📄 Application ID:', application.id);
    console.log('📅 Term:', application.term);
    console.log('💰 Need (USD):', `$${application.needUSD?.toLocaleString()}`);
    console.log('📊 Status:', application.status);
    console.log('📆 Submitted:', application.submittedAt.toDateString());
    
    if (application.status === 'APPROVED') {
      console.log('🎉 Application Status: APPROVED ✅');
    } else {
      console.log(`⚠️  Application Status: ${application.status}`);
    }
    
    // 3. Verify Messages
    console.log('\n💬 3. MESSAGES CHECK');
    console.log('-'.repeat(30));
    
    const messages = await prisma.message.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📨 Total messages: ${messages.length}`);
    
    if (messages.length > 0) {
      console.log('\n📝 Message history:');
      messages.forEach((msg, index) => {
        const role = msg.fromRole === 'field_officer' ? 'Sub Admin' : 
                    msg.fromRole === 'admin' ? 'Admin' : 
                    msg.fromRole === 'student' ? 'Student' : msg.fromRole;
        console.log(`  ${index + 1}. [${role}] ${msg.text}`);
      });
    }
    
    // 4. Verify Field Reviews
    console.log('\n🔍 4. FIELD REVIEWS CHECK');
    console.log('-'.repeat(30));
    
    const fieldReviews = await prisma.fieldReview.findMany({
      where: { applicationId: application.id },
      include: {
        officer: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`📋 Field reviews: ${fieldReviews.length}`);
    
    if (fieldReviews.length > 0) {
      fieldReviews.forEach((review, index) => {
        console.log(`  ${index + 1}. Status: ${review.status} | Officer: ${review.officer.name}`);
        if (review.notes) {
          console.log(`     Notes: ${review.notes}`);
        }
      });
    }
    
    // 5. Dashboard Summary
    console.log('\n📊 5. DASHBOARD SUMMARY');
    console.log('-'.repeat(30));
    
    const isReady = percentage === 100 && application.status === 'APPROVED' && messages.length > 0;
    
    console.log(`👤 Student: ${student.name}`);
    console.log(`🎓 Program: ${student.program} at ${student.university}`);
    console.log(`📋 Profile: ${percentage}% complete ${percentage === 100 ? '✅' : '❌'}`);
    console.log(`📄 Application: ${application.status} ${application.status === 'APPROVED' ? '✅' : '❌'}`);
    console.log(`💬 Messages: ${messages.length} total ${messages.length > 0 ? '✅' : '❌'}`);
    console.log(`🔍 Field Reviews: ${fieldReviews.length} completed ${fieldReviews.length > 0 ? '✅' : '❌'}`);
    
    if (isReady) {
      console.log('\n🎉 DASHBOARD STATUS: PERFECT ✅');
      console.log('✅ Profile 100% complete');
      console.log('✅ Application APPROVED');
      console.log('✅ All communications visible');
      console.log('✅ Ready for donor workflow!');
    } else {
      console.log('\n⚠️  DASHBOARD STATUS: NEEDS ATTENTION');
      if (percentage < 100) console.log('❌ Profile incomplete');
      if (application.status !== 'APPROVED') console.log('❌ Application not approved');
      if (messages.length === 0) console.log('❌ No messages found');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStudentDashboard();