// server/check-student.cjs
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Check the student from the browser console
  const actualStudentId = 'cmg9mye970000a5guwc7im7y5';
  const demoStudentId = 'cmf9zffkl000510linjq1e4zu';
  
  console.log('Checking actual student from browser console:');
  const actualStudent = await prisma.student.findUnique({
    where: { id: actualStudentId },
    select: {
      id: true,
      name: true,
      needUSD: true,
      sponsored: true
    }
  });

  if (actualStudent) {
    console.log('✅ Actual student found:');
    console.log(`   ID: ${actualStudent.id}`);
    console.log(`   Name: ${actualStudent.name}`);
    console.log(`   Need USD: ${actualStudent.needUSD} (type: ${typeof actualStudent.needUSD})`);
    console.log(`   Sponsored: ${actualStudent.sponsored}`);
    
    // Update this student to have correct amount
    if (actualStudent.needUSD !== 50000) {
      console.log('\n🔧 Updating student to have $50,000 need...');
      const updated = await prisma.student.update({
        where: { id: actualStudentId },
        data: { needUSD: 50000, sponsored: false }
      });
      console.log(`✅ Updated: ${updated.name} now needs $${updated.needUSD}`);
    }
  } else {
    console.log('❌ Actual student not found');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Checking our demo student:');
  const demoStudent = await prisma.student.findUnique({
    where: { id: demoStudentId },
    select: {
      id: true,
      name: true,
      needUSD: true,
      sponsored: true
    }
  });

  if (demoStudent) {
    console.log('✅ Demo student found:');
    console.log(`   ID: ${demoStudent.id}`);
    console.log(`   Name: ${demoStudent.name}`);
    console.log(`   Need USD: ${demoStudent.needUSD} (type: ${typeof demoStudent.needUSD})`);
    console.log(`   Sponsored: ${demoStudent.sponsored}`);
  } else {
    console.log('❌ Demo student not found');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });