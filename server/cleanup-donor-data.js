// Additional cleanup to remove all donor data
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDonorData() {
  try {
    console.log('🧹 Cleaning up donor-related data...');
    
    // Delete all sponsorships
    const sponsorships = await prisma.sponsorship.deleteMany({});
    console.log(`✅ Deleted ${sponsorships.count} sponsorship(s)`);
    
    // Delete all disbursements  
    const disbursements = await prisma.disbursement.deleteMany({});
    console.log(`✅ Deleted ${disbursements.count} disbursement(s)`);
    
    // Delete all donor users
    const donorUsers = await prisma.user.deleteMany({
      where: { role: "DONOR" }
    });
    console.log(`✅ Deleted ${donorUsers.count} donor user account(s)`);
    
    // Delete all donor records
    const donors = await prisma.donor.deleteMany({});
    console.log(`✅ Deleted ${donors.count} donor record(s)`);
    
    // Verify final counts
    const remainingUsers = await prisma.user.findMany();
    const remainingStudents = await prisma.student.findMany();
    const remainingApplications = await prisma.application.findMany();
    
    console.log('\n🎉 Donor cleanup completed!');
    console.log(`📊 Current database state:`);
    console.log(`   Users: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`     - ${user.email} (${user.role})`);
    });
    console.log(`   Students: ${remainingStudents.length}`);
    remainingStudents.forEach(student => {
      console.log(`     - ${student.name} (${student.email})`);
    });
    console.log(`   Applications: ${remainingApplications.length}`);
    console.log(`   Donors: 0 (clean slate for donor implementation)`);
    console.log(`   Sponsorships: 0`);
    console.log(`   Disbursements: 0`);
    
  } catch (error) {
    console.error('❌ Error during donor cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDonorData();