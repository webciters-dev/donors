// Quick script to view students in the database
import prisma from './src/prismaClient.js';


async function viewStudents() {
  try {
    console.log('\n📚 STUDENTS IN DATABASE\n');
    console.log('='.repeat(80));
    
    // Get all students with their applications
    const students = await prisma.student.findMany({
      include: {
        applications: {
          orderBy: { submittedAt: 'desc' },
          take: 1, // Get most recent application
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (students.length === 0) {
      console.log('No students found in the database.');
      return;
    }

    console.log(`\nTotal Students: ${students.length}\n`);
    
    students.forEach((student, index) => {
      const app = student.applications[0];
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   University: ${student.university || 'N/A'}`);
      console.log(`   Program: ${student.program || 'N/A'}`);
      console.log(`   GPA: ${student.gpa} (${student.gradeType || 'CGPA'})`);
      console.log(`   Sponsored: ${student.sponsored ? 'Yes' : 'No'}`);
      console.log(`   Phase: ${student.studentPhase || 'N/A'}`);
      if (app) {
        console.log(`   Application Status: ${app.status}`);
        console.log(`   Amount: ${app.currency} ${app.amount}`);
        if (app.approvedAmount) {
          console.log(`   Approved Amount: ${app.currency} ${app.approvedAmount}`);
        }
      }
      console.log(`   Created: ${student.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Summary statistics
    console.log('\n📊 SUMMARY STATISTICS');
    console.log('='.repeat(80));
    const sponsored = students.filter(s => s.sponsored).length;
    const withApplications = students.filter(s => s.applications.length > 0).length;
    const avgGpa = students.reduce((sum, s) => sum + s.gpa, 0) / students.length;
    
    console.log(`Total Students: ${students.length}`);
    console.log(`Sponsored: ${sponsored}`);
    console.log(`Unsponsored: ${students.length - sponsored}`);
    console.log(`With Applications: ${withApplications}`);
    console.log(`Average GPA: ${avgGpa.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error fetching students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewStudents();
