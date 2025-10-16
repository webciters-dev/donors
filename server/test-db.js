// Quick database test
import prisma from "./src/prismaClient.js";

async function testDatabase() {
  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection: SUCCESS");
    
    // Test models
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const applicationCount = await prisma.application.count();
    
    console.log(`📊 Database stats:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Applications: ${applicationCount}`);
    
    // Test our recent test data
    const testStudent = await prisma.student.findUnique({
      where: { email: "test.ai.student@example.com" },
      include: { applications: true }
    });
    
    if (testStudent) {
      console.log(`✅ Test student found: ${testStudent.name}`);
      console.log(`   Applications: ${testStudent.applications.length}`);
    }
    
  } catch (error) {
    console.error("❌ Database error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();