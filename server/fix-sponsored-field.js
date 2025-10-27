// Fix sponsored field for approved students without actual sponsorships
// This script corrects the bug where admin approval incorrectly set sponsored=true

import prisma from './src/prismaClient.js';

async function fixSponsoredField() {
  console.log('🔧 Fixing sponsored field for approved students...\n');

  try {
    // Find all students who are marked as sponsored but don't have actual sponsorships
    const incorrectlySponsored = await prisma.student.findMany({
      where: {
        sponsored: true,
        sponsorships: {
          none: {} // No sponsorships exist
        }
      },
      include: {
        sponsorships: true,
        applications: {
          where: { status: 'APPROVED' },
          select: { id: true, status: true, submittedAt: true }
        }
      }
    });

    console.log(`Found ${incorrectlySponsored.length} students incorrectly marked as sponsored:\n`);

    for (const student of incorrectlySponsored) {
      console.log(`📋 ${student.name}:`);
      console.log(`   - Currently sponsored: ${student.sponsored}`);
      console.log(`   - Actual sponsorships: ${student.sponsorships.length}`);
      console.log(`   - Approved applications: ${student.applications.length}`);

      // Fix: Set sponsored to false for students without actual sponsorships
      await prisma.student.update({
        where: { id: student.id },
        data: { sponsored: false }
      });

      console.log(`   ✅ Fixed: sponsored set to false\n`);
    }

    console.log('🎉 Fix completed! Students with approved applications will now appear in marketplace.');

  } catch (error) {
    console.error('❌ Error fixing sponsored field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSponsoredField();