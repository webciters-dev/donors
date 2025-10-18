import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function checkDonorData() {
  try {
    console.log('=== Checking Donor Database Records ===');
    
    // Check all donors
    const allDonors = await prisma.donor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            sponsorships: true
          }
        }
      }
    });
    
    console.log('All Donors in Database:');
    console.log(JSON.stringify(allDonors, null, 2));
    
    // Check users with donor role
    const donorUsers = await prisma.user.findMany({
      where: { role: 'DONOR' },
      include: {
        donor: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\nDonor Users:');
    console.log(JSON.stringify(donorUsers, null, 2));
    
    // Check sponsorships to see who sponsored Sana
    const sponsorships = await prisma.sponsorship.findMany({
      include: {
        donor: true,
        student: true
      }
    });
    
    console.log('\nAll Sponsorships:');
    console.log(JSON.stringify(sponsorships, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database Error:', error);
    await prisma.$disconnect();
  }
}

checkDonorData();