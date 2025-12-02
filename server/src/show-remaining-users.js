// server/src/show-remaining-users.js
// Show remaining admin and field officer accounts after cleanup

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function showRemainingUsers() {
  try {
    console.log(' Remaining user accounts after cleanup:\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { role: 'asc' }
    });

    if (users.length === 0) {
      console.log(' No users found! You may need to create an admin account.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.role}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log(`Total: ${users.length} user(s)\n`);
    
    // Show next steps
    console.log(' CLEAN SLATE WORKFLOW:');
    console.log('');
    console.log('1. ‍ STUDENTS:');
    console.log('   → Register at /apply');
    console.log('   → Fill out application form');
    console.log('   → Upload required documents');
    console.log('');
    console.log('2. ️ ADMINS:');
    console.log('   → Review applications at /admin');
    console.log('   → Assign field officers');
    console.log('   → Approve qualified students');
    console.log('');
    console.log('3.  DONORS:');
    console.log('   → Register donor accounts');
    console.log('   → Browse approved students at /marketplace or /donor/portal');
    console.log('   → Sponsor students through payment flow');
    console.log('');
    console.log('4. ‍️ FIELD OFFICERS:');
    console.log('   → Review assigned applications');
    console.log('   → Provide recommendations');
    console.log('');

  } catch (error) {
    console.error(' Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showRemainingUsers();