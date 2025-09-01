import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: 'Aisha Khan',
        email: 'aisha.khan@example.com',
        gender: 'F',
        university: 'University of Engineering and Technology, Lahore',
        field: 'Engineering',
        program: 'Computer Science',
        gpa: 3.8,
        gradYear: 2025,
        city: 'Lahore',
        province: 'Punjab',
        needUSD: 2500
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
        province: 'Islamabad',
        needUSD: 3000
      }
    }),
    prisma.student.create({
      data: {
        name: 'Fatima Ali',
        email: 'fatima.ali@example.com',
        gender: 'F',
        university: 'Aga Khan University',
        field: 'Medicine',
        program: 'Medicine (MBBS)',
        gpa: 3.9,
        gradYear: 2026,
        city: 'Karachi',
        province: 'Sindh',
        needUSD: 4500
      }
    }),
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
        province: 'Sindh',
        needUSD: 2000
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
        province: 'Punjab',
        needUSD: 2800
      }
    })
  ]);

  console.log('✅ Created students:', students.length);

  // Create sample donors
  const donors = await Promise.all([
    prisma.donor.create({
      data: {
        name: 'John Smith',
        email: 'john.smith@example.com',
        organization: 'Tech Innovations Inc.',
        totalFunded: 5000
      }
    }),
    prisma.donor.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        organization: 'Education Foundation',
        totalFunded: 3000
      }
    }),
    prisma.donor.create({
      data: {
        name: 'Robert Davis',
        email: 'robert.davis@example.com',
        totalFunded: 2500
      }
    })
  ]);

  console.log('✅ Created donors:', donors.length);

  // Create sample sponsorships
  const sponsorships = await Promise.all([
    prisma.sponsorship.create({
      data: {
        donorId: donors[0].id,
        studentId: students[0].id,
        amount: 2500
      }
    }),
    prisma.sponsorship.create({
      data: {
        donorId: donors[1].id,
        studentId: students[2].id,
        amount: 3000
      }
    })
  ]);

  // Mark sponsored students
  await prisma.student.update({
    where: { id: students[0].id },
    data: { sponsored: true }
  });

  await prisma.student.update({
    where: { id: students[2].id },
    data: { sponsored: true }
  });

  console.log('✅ Created sponsorships:', sponsorships.length);

  // Create sample applications
  const applications = await Promise.all([
    prisma.application.create({
      data: {
        studentId: students[1].id,
        term: 'Fall 2024',
        needUSD: 3000,
        status: 'PENDING',
        notes: 'Excellent academic record, needs funding for final year.'
      }
    }),
    prisma.application.create({
      data: {
        studentId: students[3].id,
        term: 'Spring 2024',
        needUSD: 2000,
        status: 'PROCESSING',
        notes: 'Business student with strong leadership experience.'
      }
    }),
    prisma.application.create({
      data: {
        studentId: students[4].id,
        term: 'Fall 2024',
        needUSD: 2800,
        status: 'APPROVED',
        notes: 'Engineering student with high GPA and community involvement.'
      }
    })
  ]);

  console.log('✅ Created applications:', applications.length);

  // Create sample disbursements
  const disbursements = await Promise.all([
    prisma.disbursement.create({
      data: {
        studentId: students[0].id,
        amount: 2500,
        status: 'COMPLETED',
        notes: 'Full sponsorship amount disbursed successfully.'
      }
    }),
    prisma.disbursement.create({
      data: {
        studentId: students[2].id,
        amount: 1500,
        status: 'COMPLETED',
        notes: 'First installment of sponsorship.'
      }
    }),
    prisma.disbursement.create({
      data: {
        studentId: students[2].id,
        amount: 1500,
        status: 'INITIATED',
        notes: 'Second installment pending.'
      }
    })
  ]);

  console.log('✅ Created disbursements:', disbursements.length);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });