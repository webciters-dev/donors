// Check current universities and look for potential duplicates
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeUniversities() {
  try {
    console.log('🔍 Analyzing Current University Data');
    console.log('===================================');
    
    // Get all universities
    const universities = await prisma.university.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            degreeLevels: true,
            fields: true,
            programs: true
          }
        }
      }
    });
    
    console.log(`📊 Total Universities: ${universities.length}`);
    console.log('');
    
    // Look for potential duplicates (universities with similar names)
    console.log('🔍 Checking for potential duplicates...');
    const potentialDuplicates = [];
    
    for (let i = 0; i < universities.length; i++) {
      for (let j = i + 1; j < universities.length; j++) {
        const name1 = universities[i].name.toLowerCase();
        const name2 = universities[j].name.toLowerCase();
        
        // Check for similar names or abbreviations
        if (name1.includes('lums') && name2.includes('lums') ||
            name1.includes('lahore university of management') && name2.includes('lahore university of management') ||
            name1.includes('nust') && name2.includes('nust') ||
            name1.includes('national university of sciences') && name2.includes('national university of sciences')) {
          potentialDuplicates.push({
            uni1: universities[i],
            uni2: universities[j]
          });
        }
      }
    }
    
    if (potentialDuplicates.length > 0) {
      console.log(`⚠️ Found ${potentialDuplicates.length} potential duplicate(s):`);
      potentialDuplicates.forEach((dup, index) => {
        console.log(`\n${index + 1}. Potential duplicates:`);
        console.log(`   "${dup.uni1.name}" (${dup.uni1._count.programs} programs)`);
        console.log(`   "${dup.uni2.name}" (${dup.uni2._count.programs} programs)`);
      });
    } else {
      console.log('✅ No obvious duplicates found');
    }
    
    // Show Pakistani universities
    console.log('\n🇵🇰 Pakistani Universities:');
    const pakistaniUnis = universities.filter(u => u.country === 'Pakistan');
    console.log(`   Found: ${pakistaniUnis.length} Pakistani universities`);
    
    if (pakistaniUnis.length > 0) {
      console.log('\nTop Pakistani universities by program count:');
      pakistaniUnis
        .sort((a, b) => b._count.programs - a._count.programs)
        .slice(0, 10)
        .forEach((uni, index) => {
          console.log(`   ${index + 1}. ${uni.name} (${uni._count.programs} programs)`);
        });
    }
    
    // Show sample of all countries
    console.log('\n🌍 Universities by Country:');
    const countryCounts = {};
    universities.forEach(uni => {
      countryCounts[uni.country] = (countryCounts[uni.country] || 0) + 1;
    });
    
    Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count} universities`);
      });

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUniversities();