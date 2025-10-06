// Test script to verify student API data
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testStudentAPI() {
  try {
    console.log('🔍 Testing Student API Data...\n');
    
    // Get Ahmad Khan's data directly from database
    const student = await prisma.student.findFirst({
      where: { name: 'Ahmad Khan' }
    });
    
    if (!student) {
      console.log('❌ Student not found in database');
      return;
    }
    
    console.log('📊 Ahmad Khan Profile from Database:');
    console.log('Name:', student.name);
    console.log('Email:', student.email);
    console.log('University:', student.university);
    console.log('Program:', student.program);
    console.log('CNIC:', student.cnic);
    console.log('Date of Birth:', student.dateOfBirth);
    console.log('Guardian Name:', student.guardianName);
    console.log('Guardian CNIC:', student.guardianCnic);
    console.log('Phone:', student.phone);
    console.log('Address:', student.address);
    console.log('City:', student.city);
    console.log('Province:', student.province);
    console.log('GPA:', student.gpa);
    console.log('Grad Year:', student.gradYear);
    
    // Check profile completeness
    const requiredFields = [
      'cnic', 'dateOfBirth', 'guardianName', 'guardianCnic', 
      'phone', 'address', 'city', 'province', 'university', 
      'program', 'gpa', 'gradYear'
    ];
    
    const missing = requiredFields.filter(field => {
      const value = student[field];
      return value === null || value === undefined || value === '' || 
             (typeof value === 'string' && value.trim() === '') ||
             Number.isNaN(value);
    });
    
    const completed = requiredFields.length - missing.length;
    const percentage = Math.round((completed / requiredFields.length) * 100);
    
    console.log(`\n📈 Profile Completeness: ${completed}/${requiredFields.length} = ${percentage}%`);
    
    if (missing.length > 0) {
      console.log('❌ Missing fields:', missing);
    } else {
      console.log('✅ Profile is 100% complete!');
    }
    
    // Test application data
    const application = await prisma.application.findFirst({
      where: { studentId: student.id },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, university: true,
            program: true, gender: true, city: true, province: true,
            currentInstitution: true, currentCity: true, 
            currentCompletionYear: true, gpa: true, gradYear: true,
            cnic: true, dateOfBirth: true, guardianName: true,
            guardianCnic: true, phone: true, address: true,
          }
        }
      }
    });
    
    console.log('\n🗃️  Application API Data:');
    if (application?.student) {
      const apiStudent = application.student;
      console.log('API includes CNIC:', !!apiStudent.cnic);
      console.log('API includes dateOfBirth:', !!apiStudent.dateOfBirth);
      console.log('API includes guardianName:', !!apiStudent.guardianName);
      console.log('API includes guardianCnic:', !!apiStudent.guardianCnic);
      console.log('API includes phone:', !!apiStudent.phone);
      console.log('API includes address:', !!apiStudent.address);
    }
    
  } catch (error) {
    console.error('❌ Error testing student API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentAPI();