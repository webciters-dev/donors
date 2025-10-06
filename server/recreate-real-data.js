// recreate-real-data.js
// This script recreates your real application data structure

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Clearing existing demo data...');
  
  // Clear existing demo data
  await prisma.disbursement.deleteMany();
  await prisma.sponsorship.deleteMany();
  await prisma.application.deleteMany();
  await prisma.student.deleteMany();
  await prisma.donor.deleteMany();
  
  console.log('✅ Demo data cleared');

  console.log('📝 Creating real application structure...');

  // Create students based on what I saw in your screenshot
  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: 'Hassan Malik',
        email: 'hassan.malik@example.com',
        gender: 'M',
        university: 'Institute of Business Administration, Karachi',
        field: 'Business',
        program: 'Business Administration',
        gpa: 3.7,
        gradYear: 2025,
        city: 'Karachi',
        country: 'Pakistan',
        province: 'Sindh',
        needUSD: 2000,
        sponsored: false
      }
    }),
    prisma.student.create({
      data: {
        name: 'Muhammad Ahmed',
        email: 'ahmed.muhammad@example.com',
        gender: 'M',
        university: 'National University of Sciences and Technology',
        field: 'Engineering',
        program: 'Mechanical Engineering',
        gpa: 3.6,
        gradYear: 2024,
        city: 'Islamabad',
        country: 'Pakistan',
        province: 'Islamabad',
        needUSD: 3000,
        sponsored: false
      }
    }),
    prisma.student.create({
      data: {
        name: 'Zara Sheikh',
        email: 'zara.sheikh@example.com',
        gender: 'F',
        university: 'University of the Punjab',
        field: 'Engineering',
        program: 'Electrical Engineering',
        gpa: 3.5,
        gradYear: 2024,
        city: 'Lahore',
        country: 'Pakistan',
        province: 'Punjab',
        needUSD: 2800,
        sponsored: true // This one was approved
      }
    })
  ]);

  console.log('✅ Created students:', students.length);

  // Create applications matching your screenshot statuses
  const applications = await Promise.all([
    prisma.application.create({
      data: {
        studentId: students[0].id, // Hassan Malik
        term: 'Fall 2025',
        needUSD: 2000,
        status: 'PROCESSING',
        submittedAt: new Date('2025-10-05')
      }
    }),
    prisma.application.create({
      data: {
        studentId: students[1].id, // Muhammad Ahmed
        term: 'Spring 2025',
        needUSD: 3000,
        status: 'PENDING',
        submittedAt: new Date('2025-10-05')
      }
    }),
    prisma.application.create({
      data: {
        studentId: students[2].id, // Zara Sheikh  
        term: 'Fall 2024',
        needUSD: 2800,
        status: 'APPROVED',
        submittedAt: new Date('2025-10-05')
      }
    })
  ]);

  console.log('✅ Created applications:', applications.length);

  // Create a donor for the approved student
  const donor = await prisma.donor.create({
    data: {
      name: 'John Smith',
      email: 'john.smith@example.com',
      country: 'United States',
      totalFunded: 2800
    }
  });

  // Create sponsorship for approved student
  const sponsorship = await prisma.sponsorship.create({
    data: {
      donorId: donor.id,
      studentId: students[2].id, // Zara Sheikh (approved)
      amount: 2800,
      status: 'active',
      date: new Date('2025-10-05')
    }
  });

  console.log('✅ Created sponsorship for approved student');

  console.log('🎉 Real application data recreated successfully!');
  console.log('📊 Summary:');
  console.log(`   - ${students.length} students created`);
  console.log(`   - ${applications.length} applications created`);
  console.log('   - 1 PENDING (Muhammad Ahmed)');
  console.log('   - 1 PROCESSING (Hassan Malik)'); 
  console.log('   - 1 APPROVED (Zara Sheikh)');
  console.log('   - 1 sponsorship active');
}

main()
  .catch((e) => {
    console.error('❌ Error recreating data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });