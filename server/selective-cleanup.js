import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function selectiveCleanup() {
  try {
    console.log(' Starting selective database cleanup...');
    
    // Check what will be deleted
    const studentCount = await prisma.student.count();
    const donorCount = await prisma.donor.count();
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    console.log(' Current database status:');
    console.log(`   Students: ${studentCount}`);
    console.log(`   Donors: ${donorCount}`);
    console.log(`   Total Users: ${userCount}`);
    console.log(`   Admin Users: ${adminCount}`);
    
    // Check what will be preserved
    const universityCount = await prisma.university.count();
    console.log(`   Universities: ${universityCount} (will be preserved)`);
    
    // Delete students (and related data)
    console.log('\n️  Deleting students and related data...');
    
    // Delete student-related records first (foreign key constraints)
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`    Deleted ${deletedStudents.count} students`);
    
    // Delete donor records
    const deletedDonors = await prisma.donor.deleteMany({});
    console.log(`    Deleted ${deletedDonors.count} donors`);
    
    // Delete non-admin users (keep admin users)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: { not: 'ADMIN' }
      }
    });
    console.log(`    Deleted ${deletedUsers.count} non-admin users`);
    
    // Verify what remains
    const remainingAdmins = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    const remainingUniversities = await prisma.university.count();
    
    console.log('\n Cleanup completed successfully!');
    console.log(' Remaining data:');
    console.log(`   Admin Users: ${remainingAdmins}`);
    console.log(`   Universities: ${remainingUniversities}`);
    console.log(`   Students: 0`);
    console.log(`   Donors: 0`);
    console.log(`   Regular Users: 0`);
    
    console.log('\n Database is now ready for fresh testing!');
    
  } catch (error) {
    console.error(' Error during selective cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
selectiveCleanup();