#!/bin/bash
# Script to create delete-all-donors.js on VPS
# Run this on your VPS: bash delete-all-donors-vps.sh

cat > server/delete-all-donors.js << 'EOF'
// Script to delete all donors and their related data
// WARNING: This will permanently delete all donors and their related records!
import prisma from './src/prismaClient.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deleteAllDonors() {
  try {
    console.log('\n⚠️  WARNING: This will delete ALL donors and their related data!');
    console.log('This includes:');
    console.log('  - All donors');
    console.log('  - All sponsorships (automatically via CASCADE)');
    console.log('  - All user accounts linked to donors');
    console.log('  - All conversations/messages from donors');
    console.log('\nThis action CANNOT be undone!\n');

    // Get counts first
    const donorCount = await prisma.donor.count();
    const sponsorshipCount = await prisma.sponsorship.count();
    
    // Count users linked to donors
    const donorUsersCount = await prisma.user.count({
      where: { donorId: { not: null } }
    });

    // Count conversations with donors
    const conversationsWithDonors = await prisma.conversation.count({
      where: { type: 'DONOR_STUDENT' }
    });

    console.log('Current database counts:');
    console.log(`  Donors: ${donorCount}`);
    console.log(`  Sponsorships: ${sponsorshipCount}`);
    console.log(`  Users linked to donors: ${donorUsersCount}`);
    console.log(`  Donor-Student conversations: ${conversationsWithDonors}`);
    console.log('');

    // Confirm deletion
    const answer1 = await askQuestion('Are you sure you want to proceed? (yes/no): ');
    if (answer1.toLowerCase() !== 'yes') {
      console.log('Deletion cancelled.');
      rl.close();
      return;
    }

    const answer2 = await askQuestion('Type "DELETE ALL DONORS" to confirm: ');
    if (answer2 !== 'DELETE ALL DONORS') {
      console.log('Deletion cancelled. You must type exactly "DELETE ALL DONORS"');
      rl.close();
      return;
    }

    console.log('\n🗑️  Starting deletion process...\n');

    // Delete in correct order to avoid foreign key constraints
    
    // 1. Delete sponsorships (they have CASCADE, but let's be explicit)
    console.log('Deleting sponsorships...');
    const sponsorshipsDeleted = await prisma.sponsorship.deleteMany({});
    console.log(`  ✓ Deleted ${sponsorshipsDeleted.count} sponsorships`);

    // 2. Update users to remove donorId references (set to null)
    console.log('Removing donor references from users...');
    const usersUpdated = await prisma.user.updateMany({
      where: { donorId: { not: null } },
      data: { donorId: null }
    });
    console.log(`  ✓ Updated ${usersUpdated.count} user accounts (removed donor link)`);

    // 3. Delete conversations with donors (DONOR_STUDENT type)
    // Note: Conversation messages will be deleted via CASCADE
    console.log('Deleting donor-student conversations...');
    const conversationsDeleted = await prisma.conversation.deleteMany({
      where: { type: 'DONOR_STUDENT' }
    });
    console.log(`  ✓ Deleted ${conversationsDeleted.count} donor-student conversations`);

    // 4. Delete donors (last, as everything else is cleaned up)
    // Note: Sponsorships will be automatically deleted via CASCADE
    console.log('Deleting donors...');
    const donorsDeleted = await prisma.donor.deleteMany({});
    console.log(`  ✓ Deleted ${donorsDeleted.count} donors`);

    console.log('\n✅ Deletion completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Donors deleted: ${donorsDeleted.count}`);
    console.log(`  - Sponsorships deleted: ${sponsorshipsDeleted.count}`);
    console.log(`  - User accounts updated: ${usersUpdated.count} (donor link removed)`);
    console.log(`  - Conversations deleted: ${conversationsDeleted.count}`);
    console.log('\nNote: User accounts were preserved but their donor links were removed.');
    console.log('      You may want to delete those user accounts separately if needed.');

  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

deleteAllDonors();
EOF

echo "File created successfully at server/delete-all-donors.js"
echo "You can now run: cd server && node delete-all-donors.js"

