// Clean database - remove all users except ADMIN
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabaseExceptAdmin() {
  console.log('🧹 CLEANING DATABASE - KEEPING ONLY ADMIN');
  console.log('==========================================\n');

  try {
    // 1. Get admin user first
    console.log('1️⃣ Identifying admin user...');
    
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('   ❌ No admin user found! Cannot proceed.');
      return;
    }

    console.log(`   ✅ Admin found: ${adminUser.email} (ID: ${adminUser.id})`);

    // 2. Get count of users before cleanup
    console.log('\n2️⃣ Current database state...');
    
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    console.log('   📊 Current users by role:');
    userCounts.forEach(count => {
      console.log(`      ${count.role}: ${count._count.id} users`);
    });

    const totalUsers = await prisma.user.count();
    console.log(`   📊 Total users: ${totalUsers}`);

    // 3. Clean up related data first (to avoid foreign key constraints)
    console.log('\n3️⃣ Cleaning up related data...');

    // Delete progress updates
    const deletedProgress = await prisma.studentProgress.deleteMany({
      where: {
        student: {
          User: {
            role: { not: 'ADMIN' }
          }
        }
      }
    });
    console.log(`   🗑️ Deleted ${deletedProgress.count} progress updates`);

    // Delete sponsorships
    const deletedSponsorships = await prisma.sponsorship.deleteMany({});
    console.log(`   🗑️ Deleted ${deletedSponsorships.count} sponsorships`);

    // Delete field reviews
    const deletedFieldReviews = await prisma.fieldReview.deleteMany({
      where: {
        officer: {
          role: { not: 'ADMIN' }
        }
      }
    });
    console.log(`   🗑️ Deleted ${deletedFieldReviews.count} field reviews`);

    // Delete applications
    const deletedApplications = await prisma.application.deleteMany({
      where: {
        student: {
          User: {
            role: { not: 'ADMIN' }
          }
        }
      }
    });
    console.log(`   🗑️ Deleted ${deletedApplications.count} applications`);

    // Delete donors (entities)
    const deletedDonors = await prisma.donor.deleteMany({});
    console.log(`   🗑️ Deleted ${deletedDonors.count} donor records`);

    // Delete students (entities) 
    const deletedStudents = await prisma.student.deleteMany({
      where: {
        User: {
          role: { not: 'ADMIN' }
        }
      }
    });
    console.log(`   🗑️ Deleted ${deletedStudents.count} student records`);

    // 4. Delete non-admin users
    console.log('\n4️⃣ Removing non-admin users...');
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: { not: 'ADMIN' }
      }
    });

    console.log(`   🗑️ Deleted ${deletedUsers.count} non-admin users`);

    // 5. Verify final state
    console.log('\n5️⃣ Verifying final database state...');
    
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log('   📊 Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`      👑 ${user.role}: ${user.email} (${user.name})`);
    });

    // Get final counts
    const finalUserCount = await prisma.user.count();
    const finalStudentCount = await prisma.student.count();
    const finalDonorCount = await prisma.donor.count();
    const finalApplicationCount = await prisma.application.count();
    const finalSponsorshipCount = await prisma.sponsorship.count();
    const finalProgressCount = await prisma.studentProgress.count();
    const finalFieldReviewCount = await prisma.fieldReview.count();

    console.log('\n📊 FINAL DATABASE STATE:');
    console.log('========================');
    console.log(`   👥 Users: ${finalUserCount} (Admin only)`);
    console.log(`   🎓 Students: ${finalStudentCount}`);
    console.log(`   💝 Donors: ${finalDonorCount}`);
    console.log(`   📝 Applications: ${finalApplicationCount}`);
    console.log(`   🤝 Sponsorships: ${finalSponsorshipCount}`);
    console.log(`   📈 Progress Updates: ${finalProgressCount}`);
    console.log(`   🔍 Field Reviews: ${finalFieldReviewCount}`);

    console.log('\n✅ DATABASE CLEANUP COMPLETED!');
    console.log('==============================');
    console.log('🎯 Only admin user remains in the system');
    console.log('🧹 All test data has been removed');
    console.log('🚀 System is ready for fresh testing');
    
    console.log('\n👑 ADMIN LOGIN CREDENTIALS:');
    console.log('===========================');
    console.log('📧 Email: admin@awake.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 URL: http://localhost:8081/#/login');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabaseExceptAdmin();