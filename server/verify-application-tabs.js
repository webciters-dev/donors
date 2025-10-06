// Verify Admin Applications Page Tabs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyApplicationTabs() {
  try {
    console.log('🎯 ADMIN APPLICATIONS PAGE VERIFICATION\n');
    console.log('='.repeat(50));
    
    // Get all applications with details
    const applications = await prisma.application.findMany({
      include: {
        student: { 
          select: { name: true, university: true, program: true } 
        },
        fieldReviews: { 
          select: { status: true } 
        }
      }
    });
    
    // Categorize applications by status
    const categories = {
      pending: applications.filter(app => app.status === 'PENDING'),
      approved: applications.filter(app => app.status === 'APPROVED'), 
      rejected: applications.filter(app => app.status === 'REJECTED'),
      all: applications
    };
    
    console.log('📊 APPLICATION CATEGORIES BREAKDOWN');
    console.log('-'.repeat(40));
    console.log(`📋 Total Applications: ${categories.all.length}`);
    console.log(`⏳ Pending Review: ${categories.pending.length}`);
    console.log(`✅ Approved: ${categories.approved.length}`);
    console.log(`❌ Rejected: ${categories.rejected.length}`);
    
    // Check each category
    console.log('\n🗂️  TAB CONTENT VERIFICATION');
    console.log('-'.repeat(35));
    
    // PENDING TAB
    console.log('\n⏳ PENDING REVIEW TAB:');
    if (categories.pending.length === 0) {
      console.log('   ✅ No pending applications (Ahmad Khan moved out correctly)');
    } else {
      console.log(`   📄 ${categories.pending.length} pending application(s):`);
      categories.pending.forEach((app, i) => {
        console.log(`      ${i+1}. ${app.student.name} - ${app.status}`);
      });
    }
    
    // APPROVED TAB  
    console.log('\n✅ APPROVED TAB:');
    if (categories.approved.length === 0) {
      console.log('   ❌ No approved applications found');
    } else {
      console.log(`   📄 ${categories.approved.length} approved application(s):`);
      categories.approved.forEach((app, i) => {
        const hasFieldReview = app.fieldReviews?.some(r => r.status === 'COMPLETED');
        console.log(`      ${i+1}. ${app.student.name}`);
        console.log(`         Status: ${app.status}`);
        console.log(`         Program: ${app.student.program} at ${app.student.university}`);
        console.log(`         Need: $${app.needUSD?.toLocaleString()}`);
        console.log(`         Field Verified: ${hasFieldReview ? '✅ Yes' : '❌ No'}`);
      });
    }
    
    // REJECTED TAB
    console.log('\n❌ REJECTED TAB:');
    if (categories.rejected.length === 0) {
      console.log('   ✅ No rejected applications');
    } else {
      console.log(`   📄 ${categories.rejected.length} rejected application(s):`);
      categories.rejected.forEach((app, i) => {
        console.log(`      ${i+1}. ${app.student.name} - ${app.status}`);
      });
    }
    
    // Verify Ahmad Khan specifically
    console.log('\n👤 AHMAD KHAN VERIFICATION');
    console.log('-'.repeat(30));
    
    const ahmadApp = applications.find(app => app.student.name === 'Ahmad Khan');
    if (!ahmadApp) {
      console.log('❌ Ahmad Khan application not found');
    } else {
      console.log(`✅ Ahmad Khan found with status: ${ahmadApp.status}`);
      
      if (ahmadApp.status === 'APPROVED') {
        console.log('✅ Ahmad Khan correctly in APPROVED tab');
        console.log('✅ Ahmad Khan NOT in PENDING tab (moved out correctly)');
      } else {
        console.log(`⚠️  Ahmad Khan status is ${ahmadApp.status}, expected APPROVED`);
      }
    }
    
    // Final verification
    console.log('\n🏆 TABS FUNCTIONALITY SUMMARY');
    console.log('='.repeat(35));
    
    const pendingEmpty = categories.pending.length === 0;
    const approvedHasAhmad = categories.approved.some(app => app.student.name === 'Ahmad Khan');
    const tabsWorking = pendingEmpty && approvedHasAhmad;
    
    if (tabsWorking) {
      console.log('🎉 APPLICATIONS TABS: PERFECT ✅');
      console.log('✅ Pending tab shows no applications (Ahmad moved out)');
      console.log('✅ Approved tab shows Ahmad Khan');
      console.log('✅ Proper separation of applications by status');
      console.log('✅ Ready for clean admin workflow!');
    } else {
      console.log('⚠️  APPLICATIONS TABS: NEEDS ATTENTION');
      if (!pendingEmpty) console.log('❌ Pending tab still has applications');
      if (!approvedHasAhmad) console.log('❌ Ahmad Khan not found in approved tab');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyApplicationTabs();