#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log(' CHECKING ALL APPLICATIONS\n');
    
    // Get ALL applications
    const allApps = await prisma.application.findMany({
      include: { student: { select: { name: true } } }
    });
    
    console.log('Total applications in database:', allApps.length);
    allApps.forEach((app, i) => {
      console.log(`${i+1}. ${app.student.name.padEnd(20)} | Status: ${app.status.padEnd(10)} | Amount: ${app.amount} ${app.currency}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
