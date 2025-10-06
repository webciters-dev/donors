// verify-clean-database.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCleanState() {
  try {
    console.log('🔍 Verifying database is completely clean...\n');
    
    // Check all tables
    const counts = {
      users: await prisma.user.count(),
      students: await prisma.student.count(),
      applications: await prisma.application.count(),
      documents: await prisma.document.count(),
      sponsorships: await prisma.sponsorship.count(),
      messages: await prisma.message.count(),
      disbursements: await prisma.disbursement.count(),
      fieldReviews: await prisma.fieldReview.count()
    };
    
    console.log('📊 Table counts:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    
    // Check users by role
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });
    
    console.log('\n👥 Remaining users:');
    if (users.length === 0) {
      console.log('   ❌ NO USERS - This is a problem! Need at least admin.');
    } else {
      users.forEach((user, i) => {
        console.log(`   ${i+1}. ${user.email} (${user.role}) - ${user.name || 'No name'}`);
      });
    }
    
    // Verify clean state
    const isClean = counts.students === 0 && 
                   counts.applications === 0 && 
                   counts.documents === 0 && 
                   counts.sponsorships === 0 && 
                   counts.messages === 0 && 
                   counts.disbursements === 0 && 
                   counts.fieldReviews === 0;
    
    const hasAdminOnly = users.length > 0 && users.every(u => u.role === 'ADMIN');
    
    console.log('\n🎯 VERIFICATION:');
    if (isClean && hasAdminOnly) {
      console.log('✅ DATABASE IS PERFECTLY CLEAN');
      console.log('   - No students, donors, or field officers');
      console.log('   - No applications, documents, or sponsorships');
      console.log('   - Only admin user(s) remain');
      console.log('   - Ready for fresh testing!');
    } else {
      console.log('❌ DATABASE CLEANUP INCOMPLETE');
      if (!isClean) console.log('   - Still has test data in some tables');
      if (!hasAdminOnly) console.log('   - Still has non-admin users');
    }
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanState();