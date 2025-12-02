// check-duplicate-emails.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log(' Checking for duplicate email addresses in the database...\n');

try {
  await prisma.$connect();
  
  // Check for duplicate emails in users table
  console.log(' USERS TABLE:');
  console.log('='.repeat(50));
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      studentId: true,
      donorId: true
    },
    orderBy: { email: 'asc' }
  });
  
  console.log(`Total users: ${users.length}\n`);
  
  // Group by email to find duplicates
  const emailGroups = {};
  users.forEach(user => {
    if (!emailGroups[user.email]) {
      emailGroups[user.email] = [];
    }
    emailGroups[user.email].push(user);
  });
  
  // Check specifically for test@webciters.com
  const testEmail = 'test@webciters.com';
  if (emailGroups[testEmail]) {
    console.log(` FOUND: ${testEmail} appears ${emailGroups[testEmail].length} times:`);
    emailGroups[testEmail].forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id} | Role: ${user.role} | Created: ${user.createdAt.toISOString().split('T')[0]} | StudentId: ${user.studentId || 'null'} | DonorId: ${user.donorId || 'null'}`);
    });
    console.log('');
  } else {
    console.log(` ${testEmail} not found in database\n`);
  }
  
  // Find all duplicate emails
  const duplicates = Object.entries(emailGroups).filter(([email, userList]) => userList.length > 1);
  
  if (duplicates.length > 0) {
    console.log('️  DUPLICATE EMAILS FOUND:');
    console.log('='.repeat(50));
    duplicates.forEach(([email, userList]) => {
      console.log(` ${email} (${userList.length} accounts):`);
      userList.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.role} | Created: ${user.createdAt.toISOString().split('T')[0]} | ID: ${user.id}`);
      });
      console.log('');
    });
  } else {
    console.log(' No duplicate emails found in users table\n');
  }
  
  // Check students table for duplicates
  console.log(' STUDENTS TABLE:');
  console.log('='.repeat(50));
  
  const students = await prisma.student.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    },
    orderBy: { email: 'asc' }
  });
  
  console.log(`Total students: ${students.length}\n`);
  
  const studentEmailGroups = {};
  students.forEach(student => {
    if (!studentEmailGroups[student.email]) {
      studentEmailGroups[student.email] = [];
    }
    studentEmailGroups[student.email].push(student);
  });
  
  // Check for test@webciters.com in students
  if (studentEmailGroups[testEmail]) {
    console.log(` FOUND: ${testEmail} in students table (${studentEmailGroups[testEmail].length} times):`);
    studentEmailGroups[testEmail].forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} | ID: ${student.id} | Created: ${student.createdAt.toISOString().split('T')[0]}`);
    });
    console.log('');
  }
  
  const studentDuplicates = Object.entries(studentEmailGroups).filter(([email, studentList]) => studentList.length > 1);
  
  if (studentDuplicates.length > 0) {
    console.log('️  DUPLICATE EMAILS IN STUDENTS:');
    console.log('='.repeat(50));
    studentDuplicates.forEach(([email, studentList]) => {
      console.log(` ${email} (${studentList.length} students):`);
      studentList.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} | Created: ${student.createdAt.toISOString().split('T')[0]}`);
      });
      console.log('');
    });
  } else {
    console.log(' No duplicate emails found in students table\n');
  }
  
  await prisma.$disconnect();
  console.log(' Database check completed');
  
} catch (error) {
  console.error(' Error:', error.message);
  process.exit(1);
}