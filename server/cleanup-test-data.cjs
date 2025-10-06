// cleanup-test-data.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up Comet\'s test data...\n');
    
    // First, let's see what we're about to delete
    console.log('📊 Current database state:');
    
    const students = await prisma.student.count();
    const applications = await prisma.application.count();
    const documents = await prisma.document.count();
    const messages = await prisma.message.count();
    const sponsorships = await prisma.sponsorship.count();
    const donors = await prisma.user.count({ where: { role: 'DONOR' } });
    const fieldOfficers = await prisma.user.count({ where: { role: 'FIELD_OFFICER' } });
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    console.log(`- Students: ${students}`);
    console.log(`- Applications: ${applications}`);
    console.log(`- Documents: ${documents}`);
    console.log(`- Messages: ${messages}`);
    console.log(`- Sponsorships: ${sponsorships}`);
    console.log(`- Donors: ${donors}`);
    console.log(`- Field Officers: ${fieldOfficers}`);
    console.log(`- Admins: ${admins}`);
    
    console.log('\n🗑️  Deleting test data (keeping admins only)...\n');
    
    // Delete in correct order to respect foreign key constraints
    
    // 1. Delete sponsorships first
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    console.log(`✅ Deleted ${deletedSponsorships.count} sponsorships`);
    
    // 2. Delete messages
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.count} messages`);
    
    // 3. Delete field reviews (if any)
    const deletedReviews = await prisma.fieldReview.deleteMany({});
    console.log(`✅ Deleted ${deletedReviews.count} field reviews`);
    
    // 4. Delete documents
    const deletedDocuments = await prisma.document.deleteMany({});
    console.log(`✅ Deleted ${deletedDocuments.count} documents`);
    
    // 5. Delete applications
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(`✅ Deleted ${deletedApplications.count} applications`);
    
    // 6. Delete students
    const deletedStudents = await prisma.student.deleteMany({});
    console.log(`✅ Deleted ${deletedStudents.count} students`);
    
    // 7. Delete donors and field officers (keep admins)
    const deletedDonors = await prisma.user.deleteMany({
      where: { role: 'DONOR' }
    });
    console.log(`✅ Deleted ${deletedDonors.count} donors`);
    
    const deletedFieldOfficers = await prisma.user.deleteMany({
      where: { role: 'FIELD_OFFICER' }
    });
    console.log(`✅ Deleted ${deletedFieldOfficers.count} field officers`);
    
    // Check remaining data
    console.log('\n📊 Final database state:');
    
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log(`Remaining users: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`- ${user.role}: ${user.email} (${user.name || 'N/A'})`);
    });
    
    const totalStudents = await prisma.student.count();
    const totalApplications = await prisma.application.count();
    const totalDocuments = await prisma.document.count();
    const totalMessages = await prisma.message.count();
    const totalSponsorships = await prisma.sponsorship.count();
    
    console.log(`\nData counts:`);
    console.log(`- Students: ${totalStudents}`);
    console.log(`- Applications: ${totalApplications}`);
    console.log(`- Documents: ${totalDocuments}`);
    console.log(`- Messages: ${totalMessages}`);
    console.log(`- Sponsorships: ${totalSponsorships}`);
    
    console.log('\n✨ Database cleaned! Ready for fresh testing.');
    console.log('💡 You can now test the complete workflow from scratch:');
    console.log('   1. Student registers and applies');
    console.log('   2. Student uploads required documents');
    console.log('   3. Admin reviews and approves (with document validation)');
    console.log('   4. Student appears in marketplace for donors');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();