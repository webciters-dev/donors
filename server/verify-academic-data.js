// server/verify-academic-data.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAcademicData() {
  console.log(' Verifying Pakistani University Academic Data...\n');

  // Get all Pakistani universities with their academic data
  const pakistaniUniversities = await prisma.university.findMany({
    where: {
      country: 'Pakistan'
    },
    include: {
      degreeLevels: {
        include: {
          fields: {
            include: {
              programs: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log(` Found ${pakistaniUniversities.length} Pakistani Universities:\n`);

  pakistaniUniversities.forEach((university, index) => {
    console.log(`${index + 1}. ️  ${university.name}`);
    console.log(`   ID: ${university.id}`);
    
    const totalDegrees = university.degreeLevels.length;
    const totalFields = university.degreeLevels.reduce((sum, degree) => sum + degree.fields.length, 0);
    const totalPrograms = university.degreeLevels.reduce((sum, degree) => 
      sum + degree.fields.reduce((fieldSum, field) => fieldSum + field.programs.length, 0), 0
    );
    
    console.log(`    ${totalDegrees} degree levels, ${totalFields} fields, ${totalPrograms} programs`);

    if (university.degreeLevels.length > 0) {
      university.degreeLevels.forEach(degree => {
        console.log(`      ${degree.degreeLevel} (${degree.fields.length} fields)`);
        
        degree.fields.forEach(field => {
          console.log(`        ${field.fieldName} (${field.programs.length} programs)`);
          
          // Show first few programs as examples
          const programNames = field.programs.slice(0, 3).map(p => p.programName);
          if (field.programs.length > 3) {
            programNames.push(`... and ${field.programs.length - 3} more`);
          }
          console.log(`          ${programNames.join(', ')}`);
        });
      });
    } else {
      console.log('     ️  No academic data found');
    }
    console.log('');
  });

  // Summary statistics
  const totalStats = await Promise.all([
    prisma.universityDegreeLevel.count({ where: { university: { country: 'Pakistan' } } }),
    prisma.universityField.count({ where: { university: { country: 'Pakistan' } } }),
    prisma.universityProgram.count({ where: { university: { country: 'Pakistan' } } })
  ]);

  console.log('\n Pakistani Universities Summary:');
  console.log(`️  Universities: ${pakistaniUniversities.length}`);
  console.log(` Total Degree Levels: ${totalStats[0]}`);
  console.log(` Total Fields of Study: ${totalStats[1]}`);
  console.log(` Total Specific Programs: ${totalStats[2]}`);

  // Show popular degree levels and fields
  const popularDegrees = await prisma.universityDegreeLevel.groupBy({
    by: ['degreeLevel'],
    where: { university: { country: 'Pakistan' } },
    _count: { degreeLevel: true },
    orderBy: { _count: { degreeLevel: 'desc' } }
  });

  const popularFields = await prisma.universityField.groupBy({
    by: ['fieldName'],
    where: { university: { country: 'Pakistan' } },
    _count: { fieldName: true },
    orderBy: { _count: { fieldName: 'desc' } },
    take: 10
  });

  console.log('\n Most Common Degree Levels:');
  popularDegrees.forEach(degree => {
    console.log(`    ${degree.degreeLevel}: ${degree._count.degreeLevel} universities`);
  });

  console.log('\n Most Common Fields of Study:');
  popularFields.forEach(field => {
    console.log(`    ${field.fieldName}: ${field._count.fieldName} universities`);
  });

  console.log('\n Academic data verification complete!');
  console.log(' Ready for testing the university selection system!');
}

async function main() {
  try {
    await verifyAcademicData();
  } catch (error) {
    console.error(' Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();