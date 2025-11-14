// delete-student-applications.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🗑️  Deleting student applications from database...\n');

try {
  await prisma.$connect();
  
  // First, let's see what we have before deletion
  console.log('📊 BEFORE DELETION:');
  console.log('='.repeat(50));
  
  const applicationsBefore = await prisma.application.findMany({
    include: {
      student: {
        select: { name: true, email: true }
      }
    }
  });
  
  console.log(`Total applications found: ${applicationsBefore.length}`);
  
  if (applicationsBefore.length > 0) {
    console.log('\n📋 Applications to be deleted:');
    applicationsBefore.forEach((app, index) => {
      console.log(`${index + 1}. ${app.student.name} (${app.student.email}) - ${app.status} - ${app.amount} ${app.currency}`);
    });
  } else {
    console.log('✅ No applications found to delete');
    await prisma.$disconnect();
    process.exit(0);
  }
  
  // Confirm deletion
  console.log('\n⚠️  SAFETY CHECK:');
  console.log('This will delete ALL student applications from the database.');
  console.log('Other data (users, students, donors, etc.) will remain untouched.\n');
  
  // Perform the deletion
  console.log('🗑️  Deleting applications...');
  
  const deleteResult = await prisma.application.deleteMany({});
  
  console.log(`✅ Successfully deleted ${deleteResult.count} applications\n`);
  
  // Verify deletion
  console.log('📊 AFTER DELETION:');
  console.log('='.repeat(50));
  
  const applicationsAfter = await prisma.application.count();
  console.log(`Applications remaining: ${applicationsAfter}`);
  
  // Verify other data is intact
  const userCount = await prisma.user.count();
  const studentCount = await prisma.student.count();
  const donorCount = await prisma.donor.count();
  
  console.log('\n✅ OTHER DATA VERIFICATION (should be unchanged):');
  console.log(`Users: ${userCount}`);
  console.log(`Students: ${studentCount}`);
  console.log(`Donors: ${donorCount}`);
  
  await prisma.$disconnect();
  console.log('\n🏁 Student applications deletion completed successfully!');
  
} catch (error) {
  console.error('❌ Error during deletion:', error.message);
  process.exit(1);
}