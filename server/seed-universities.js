// server/seed-universities.js
import { PrismaClient } from '@prisma/client';
import { UNIVERSITIES_BY_COUNTRY } from '../src/lib/universities.js';

const prisma = new PrismaClient();

async function seedUniversities() {
  console.log('🌱 Seeding universities database...');

  let totalSeeded = 0;
  let totalSkipped = 0;

  for (const [country, countryData] of Object.entries(UNIVERSITIES_BY_COUNTRY)) {
    console.log(`\n📍 Processing ${country}...`);
    
    for (const universityName of countryData.universities) {
      // Skip "Other" entries as these are not real universities
      if (universityName === 'Other') {
        continue;
      }

      try {
        // Check if university already exists
        const existing = await prisma.university.findUnique({
          where: {
            name_country: {
              name: universityName,
              country: country
            }
          }
        });

        if (existing) {
          console.log(`  ⏭️  ${universityName} already exists`);
          totalSkipped++;
          continue;
        }

        // Create new official university
        await prisma.university.create({
          data: {
            name: universityName,
            country: country,
            isOfficial: true,
            isCustom: false
          }
        });

        console.log(`  ✅ ${universityName}`);
        totalSeeded++;
      } catch (error) {
        console.error(`  ❌ Error seeding ${universityName}:`, error.message);
      }
    }
  }

  console.log(`\n🎉 Seeding completed!`);
  console.log(`📊 Summary:`);
  console.log(`  - Total seeded: ${totalSeeded}`);
  console.log(`  - Total skipped: ${totalSkipped}`);
  console.log(`  - Countries processed: ${Object.keys(UNIVERSITIES_BY_COUNTRY).length}`);

  // Show final count
  const totalCount = await prisma.university.count();
  console.log(`  - Total universities in database: ${totalCount}`);
}

seedUniversities()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });