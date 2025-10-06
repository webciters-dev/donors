// Cleanup script to keep only Ahmad Khan student
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup - keeping only Ahmad Khan...');
    
    // Find Ahmad Khan (the student to keep)
    const ahmadKhan = await prisma.student.findFirst({
      where: { name: "Ahmad Khan" },
      include: { applications: true }
    });
    
    if (!ahmadKhan) {
      console.log('❌ Ahmad Khan not found! Aborting cleanup.');
      return;
    }
    
    console.log(`✅ Found Ahmad Khan: ${ahmadKhan.name} (${ahmadKhan.email})`);
    console.log(`📱 Ahmad Khan has ${ahmadKhan.applications.length} application(s)`);
    
    // Find all other students (to remove)
    const otherStudents = await prisma.student.findMany({
      where: { 
        NOT: { id: ahmadKhan.id }
      },
      include: { 
        applications: true,
        messages: true,
        fieldReviews: true
      }
    });
    
    console.log(`🗑️ Found ${otherStudents.length} other student(s) to remove:`);
    
    for (const student of otherStudents) {
      console.log(`   - ${student.name} (${student.email})`);
      console.log(`     Applications: ${student.applications.length}`);
      console.log(`     Messages: ${student.messages.length}`);
      console.log(`     Field Reviews: ${student.fieldReviews.length}`);
    }
    
    // Delete all data related to other students
    for (const student of otherStudents) {
      console.log(`\n🗑️ Removing ${student.name}...`);
      
      // Delete field reviews for this student
      if (student.fieldReviews.length > 0) {
        await prisma.fieldReview.deleteMany({
          where: { studentId: student.id }
        });
        console.log(`   ✅ Deleted ${student.fieldReviews.length} field review(s)`);
      }
      
      // Delete messages for this student
      if (student.messages.length > 0) {
        await prisma.message.deleteMany({
          where: { studentId: student.id }
        });
        console.log(`   ✅ Deleted ${student.messages.length} message(s)`);
      }
      
      // Delete applications for this student
      if (student.applications.length > 0) {
        await prisma.application.deleteMany({
          where: { studentId: student.id }
        });
        console.log(`   ✅ Deleted ${student.applications.length} application(s)`);
      }
      
      // Delete the student user account
      const userAccount = await prisma.user.findFirst({
        where: { studentId: student.id }
      });
      
      if (userAccount) {
        await prisma.user.delete({
          where: { id: userAccount.id }
        });
        console.log(`   ✅ Deleted user account: ${userAccount.email}`);
      }
      
      // Delete the student record
      await prisma.student.delete({
        where: { id: student.id }
      });
      console.log(`   ✅ Deleted student record: ${student.name}`);
    }
    
    // Verify final state
    const remainingStudents = await prisma.student.findMany();
    const remainingApplications = await prisma.application.findMany();
    const remainingMessages = await prisma.message.findMany();
    const remainingFieldReviews = await prisma.fieldReview.findMany();
    
    console.log('\n🎉 Cleanup completed!');
    console.log(`📊 Final database state:`);
    console.log(`   Students: ${remainingStudents.length} (should be 1 - Ahmad Khan)`);
    console.log(`   Applications: ${remainingApplications.length}`);
    console.log(`   Messages: ${remainingMessages.length}`);
    console.log(`   Field Reviews: ${remainingFieldReviews.length}`);
    
    if (remainingStudents.length === 1 && remainingStudents[0].name === "Ahmad Khan") {
      console.log('✅ SUCCESS: Only Ahmad Khan remains in the database!');
    } else {
      console.log('⚠️ WARNING: Unexpected database state after cleanup');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase();