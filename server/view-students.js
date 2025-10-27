import prisma from './src/prismaClient.js';

async function viewStudentsTable() {
  try {
    console.log('📊 Students Table Data\n');
    console.log('=' .repeat(50));
    
    // Get all students with key information
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            amount: true,
            submittedAt: true
          },
          orderBy: { submittedAt: 'desc' },
          take: 1 // Get latest application
        },
        messages: {
          select: { id: true },
        },
        documents: {
          select: { id: true, type: true }
        }
      }
    });
    
    if (students.length === 0) {
      console.log('❌ No students found in the database');
      return;
    }
    
    console.log(`✅ Found ${students.length} students:\n`);
    
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   📧 Email: ${student.email}`);
      console.log(`   🎓 University: ${student.university}`);
      console.log(`   📚 Field: ${student.field} (${student.program})`);
      console.log(`   📊 GPA: ${student.gpa}/4.0`);
      console.log(`   🌍 Location: ${student.city || 'N/A'}, ${student.country}`);
      console.log(`   💰 Need: $${student.needUSD.toLocaleString()}`);
      console.log(`   ✅ Sponsored: ${student.sponsored ? 'Yes' : 'No'}`);
      console.log(`   📅 Phase: ${student.studentPhase}`);
      console.log(`   🎯 Graduation: ${student.gradYear}`);
      
      if (student.applications.length > 0) {
        const latestApp = student.applications[0];
        console.log(`   📝 Latest Application: ${latestApp.status} ($${latestApp.amount?.toLocaleString() || 'N/A'})`);
      }
      
      console.log(`   📨 Messages: ${student.messages.length}`);
      console.log(`   📄 Documents: ${student.documents.length}`);
      console.log(`   📅 Created: ${student.createdAt.toLocaleDateString()}`);
      console.log('-'.repeat(40));
    });
    
    // Summary statistics
    console.log('\n📈 Summary Statistics:');
    console.log('=' .repeat(30));
    console.log(`Total Students: ${students.length}`);
    console.log(`Sponsored: ${students.filter(s => s.sponsored).length}`);
    console.log(`Unsponsored: ${students.filter(s => !s.sponsored).length}`);
    console.log(`Active Phase: ${students.filter(s => s.studentPhase === 'ACTIVE').length}`);
    console.log(`Application Phase: ${students.filter(s => s.studentPhase === 'APPLICATION').length}`);
    console.log(`Graduated: ${students.filter(s => s.studentPhase === 'GRADUATED').length}`);
    
    const totalFundingNeed = students.reduce((sum, s) => sum + (s.needUSD || 0), 0);
    console.log(`Total Funding Need: $${totalFundingNeed.toLocaleString()}`);
    
    const avgGPA = students.reduce((sum, s) => sum + s.gpa, 0) / students.length;
    console.log(`Average GPA: ${avgGPA.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error viewing students table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewStudentsTable();