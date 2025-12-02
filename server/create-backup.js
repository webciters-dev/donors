// Simple database backup script
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function createBackup() {
  try {
    console.log(' Creating database backup...');
    
    // Get current counts
    const counts = {
      universities: await prisma.university.count(),
      degreeLevels: await prisma.universityDegreeLevel.count(),
      fields: await prisma.universityField.count(),
      programs: await prisma.universityProgram.count()
    };
    
    console.log(' Current database state:');
    console.log(`   Universities: ${counts.universities}`);
    console.log(`   Degree Levels: ${counts.degreeLevels}`);
    console.log(`   Fields: ${counts.fields}`);
    console.log(`   Programs: ${counts.programs}`);
    
    // Export current data
    console.log(' Exporting university data...');
    const backup = {
      timestamp: new Date().toISOString(),
      counts: counts,
      universities: await prisma.university.findMany({
        include: {
          degreeLevels: true,
          fields: true,
          programs: true
        }
      })
    };

    const backupFile = `backup-universities-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(` Backup created: ${backupFile}`);
    console.log(` Backup contains ${backup.universities.length} universities with all related data`);
    
    return backupFile;
  } catch (error) {
    console.error(' Backup failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createBackup();