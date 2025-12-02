#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log(' CLEANING UP TEST DATA & DUPLICATE APPLICATIONS\n');
    
    let totalDeleted = 0;
    
    // Delete all DRAFT applications with 1 PKR (test data)
    console.log('Step 1: Removing test data (DRAFT with 1 PKR)...');
    const testApps = await prisma.application.findMany({
      where: {
        status: 'DRAFT',
        amount: 1,
        currency: 'PKR'
      }
    });
    
    for (const testApp of testApps) {
      const student = await prisma.student.findUnique({
        where: { id: testApp.studentId },
        select: { name: true }
      });
      
      console.log(`   Deleting test app: ${student.name} | ${testApp.id.substring(0, 8)} | ${testApp.term}`);
      
      // Delete field reviews first
      await prisma.fieldReview.deleteMany({
        where: { applicationId: testApp.id }
      });
      
      // Delete application
      await prisma.application.delete({
        where: { id: testApp.id }
      });
      
      totalDeleted++;
    }
    
    console.log(`\nStep 2: Checking for legitimate duplicates...`);
    
    // Find students with multiple legitimate applications
    const students = await prisma.student.findMany({
      include: {
        applications: {
          orderBy: { submittedAt: 'asc' }
        }
      }
    });
    
    for (const student of students) {
      if (student.applications.length > 1) {
        console.log(`\n   ${student.name}: ${student.applications.length} legitimate applications`);
        student.applications.forEach((app, i) => {
          console.log(`     ${i+1}. ${app.id.substring(0, 8)} | ${app.term} | ${app.status} | ${app.amount} ${app.currency}`);
        });
        console.log(`     ℹ️  Multiple applications for different terms are allowed`);
      }
    }
    
    console.log(`\n\n CLEANUP COMPLETE`);
    console.log(`   Total applications deleted: ${totalDeleted}`);
    
  } catch (error) {
    console.error(' Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
