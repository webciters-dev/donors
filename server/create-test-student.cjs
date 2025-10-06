const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestStudent() {
  const prisma = new PrismaClient();
  
  try {
    // First create the student record
    const student = await prisma.student.create({
      data: {
        name: 'Ahmad Hassan',
        email: 'student.test@example.com',
        gender: 'Male',
        university: 'University of Punjab', 
        field: 'Engineering',
        program: 'Computer Science',
        gpa: 3.7,
        gradYear: 2026,
        city: 'Lahore',
        province: 'Punjab',
        needUSD: 540,
        phone: '+92-300-1234567',
        cnic: '35201-1234567-1',
        dateOfBirth: new Date('2003-05-15')
      }
    });

    // Create user account linked to student
    const hashedPassword = await bcrypt.hash('student123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Ahmad Hassan',
        email: 'student.test@example.com',
        passwordHash: hashedPassword,
        role: 'STUDENT',
        studentId: student.id
      }
    });

    // Create application
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        term: 'Fall 2024',
        needPKR: 150000,
        needUSD: 540,
        currency: 'PKR',
        purpose: 'Tuition fees for Computer Science program at University of Punjab',
        notes: 'I am a second-year CS student who needs financial assistance to complete my education.',
        status: 'PENDING',
        tuitionFee: 120000,
        hostelFee: 30000,
        familyIncome: 45000,
        familyContribution: 15000
      }
    });

    console.log('✅ Test student created successfully!');
    console.log('Email: student.test@example.com');
    console.log('Password: student123');
    console.log('Student ID:', student.id);
    console.log('Application ID:', application.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestStudent();