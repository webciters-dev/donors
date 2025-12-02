// remove-old-donors.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('️ REMOVING OLD DONOR RECORDS\n');

const donorsToRemove = [
  'sarah@example.com',
  'imran@example.com', 
  'corp@paktech.com'
];

try {
  await prisma.$connect();
  
  // First, show current donors
  console.log(' Current donors before removal:');
  const currentDonors = await prisma.donor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      organization: true,
      totalFunded: true,
      createdAt: true
    }
  });
  
  currentDonors.forEach((donor, index) => {
    console.log(`${index + 1}. ${donor.name} (${donor.email}) - $${donor.totalFunded}`);
  });
  
  console.log('\n Removing specified donors...');
  
  // Remove each donor
  for (const email of donorsToRemove) {
    try {
      const deletedDonor = await prisma.donor.delete({
        where: { email: email }
      });
      console.log(` Removed: ${deletedDonor.name} (${deletedDonor.email})`);
    } catch (error) {
      if (error.code === 'P2025') {
        console.log(`️ Donor with email ${email} not found (may already be removed)`);
      } else {
        console.error(` Error removing ${email}:`, error.message);
      }
    }
  }
  
  // Show remaining donors
  console.log('\n Remaining donors after removal:');
  const remainingDonors = await prisma.donor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      organization: true,
      totalFunded: true,
      createdAt: true
    }
  });
  
  if (remainingDonors.length === 0) {
    console.log('   No donors remaining in database');
  } else {
    remainingDonors.forEach((donor, index) => {
      console.log(`${index + 1}. ${donor.name} (${donor.email}) - $${donor.totalFunded}`);
    });
  }
  
  // Final count
  const finalCount = await prisma.donor.count();
  console.log(`\n Final donor count: ${finalCount}`);
  
  await prisma.$disconnect();
  console.log('\n Donor removal completed');
  
} catch (error) {
  console.error(' Error:', error.message);
  process.exit(1);
}