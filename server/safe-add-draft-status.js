// safe-add-draft-status.js
// This script safely adds DRAFT status and updates existing applications
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting safe DRAFT status addition...');
  
  try {
    // First, let's manually add the DRAFT status to the enum using raw SQL
    console.log('📝 Adding DRAFT status to ApplicationStatus enum...');
    
    await prisma.$executeRaw`
      ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
    `;
    
    console.log('✅ DRAFT status added to enum');
    
    // Now update all existing applications to have DRAFT status instead of PENDING
    // (This is the fix for the auto-submission issue)
    console.log('🔄 Updating existing applications to DRAFT status...');
    
    const updatedApps = await prisma.application.updateMany({
      where: {
        status: 'PENDING'
      },
      data: {
        status: 'DRAFT'
      }
    });
    
    console.log(`✅ Updated ${updatedApps.count} applications from PENDING to DRAFT`);
    
    // Show current status of applications
    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('📊 Current application status counts:');
    statusCounts.forEach(group => {
      console.log(`   - ${group.status}: ${group._count}`);
    });
    
    console.log('🎉 Safe DRAFT status addition completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });