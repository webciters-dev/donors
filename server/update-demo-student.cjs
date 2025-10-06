// server/update-demo-student.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const studentId = 'cmf9zffkl000510linjq1e4zu';
  
  try {
    // Update demo student to have 50,000 USD need for 2-year program
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        needUSD: 50000, // $50,000 for 2-year program
        sponsored: false // Ensure not already sponsored
      },
    });

    console.log('✅ Demo student updated successfully!');
    console.log(`   Student: ${updatedStudent.name}`);
    console.log(`   Educational Need: $${updatedStudent.needUSD.toLocaleString()}`);
    console.log(`   Sponsored: ${updatedStudent.sponsored}`);
    
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ Demo student not found with ID:', studentId);
      console.log('   Creating new demo student...');
      
      // Create a new demo student
      const newStudent = await prisma.student.create({
        data: {
          id: studentId,
          name: "Ahmad Khan",
          email: "ahmad.khan@demo.edu.pk", 
          gender: "M",
          university: "University of Punjab",
          field: "Computer Science",
          program: "BS Computer Science (2-year)",
          gpa: 3.8,
          gradYear: 2027,
          city: "Lahore", 
          province: "Punjab",
          needUSD: 50000,
          sponsored: false
        }
      });
      
      console.log('✅ New demo student created!');
      console.log(`   Student: ${newStudent.name}`);
      console.log(`   Educational Need: $${newStudent.needUSD.toLocaleString()}`);
    } else {
      throw error;
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Error updating demo student:', e);
    prisma.$disconnect();
    process.exit(1);
  });