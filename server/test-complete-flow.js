const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteApplicationFlow() {
  try {
    console.log('🧪 Testing complete application flow...\n');
    
    // Step 1: Clean up - delete existing applications for test user
    console.log('🧹 Cleaning up existing applications...');
    await prisma.application.deleteMany({
      where: { 
        student: { email: 'test+1@webciters.com' }
      }
    });
    console.log('✅ Cleaned up existing applications\n');
    
    // Step 2: Get student
    const student = await prisma.student.findFirst({
      where: { email: 'test+1@webciters.com' }
    });
    
    if (!student) {
      console.log('❌ No test student found');
      return;
    }
    console.log('👤 Found student:', student.name, 'with ID:', student.id);
    
    // Step 3: Create application as DRAFT (simulating ApplicationForm.jsx)
    console.log('\n📝 Step 1: Creating application via ApplicationForm.jsx (should be DRAFT)...');
    const newApp = await prisma.application.create({
      data: {
        studentId: student.id,
        term: 'Fall 2025 Test Flow',
        status: 'DRAFT',
        currency: 'USD',
        needUSD: 3000,
        needPKR: null
      }
    });
    
    console.log('✅ Created application:');
    console.log('   - ID:', newApp.id);
    console.log('   - Status:', newApp.status);
    console.log('   - Created:', newApp.createdAt);
    
    // Step 4: Simulate loading MyApplication page (check what it shows)
    console.log('\n📱 Step 2: Student opens MyApplication.jsx page...');
    const loadedApp = await prisma.application.findFirst({
      where: { studentId: student.id },
      orderBy: { submittedAt: 'desc' },
      include: { student: true }
    });
    
    console.log('✅ MyApplication.jsx would load:');
    console.log('   - Application ID:', loadedApp.id);
    console.log('   - Status:', loadedApp.status);
    console.log('   - Student can submit?', loadedApp.status === 'DRAFT' ? 'YES' : 'NO (already submitted)');
    
    // Step 5: Simulate clicking "Submit for Review"
    console.log('\n🚀 Step 3: Student clicks "Submit for Review" button...');
    if (loadedApp.status === 'PENDING' || loadedApp.status === 'PROCESSING' || loadedApp.status === 'APPROVED') {
      console.log('❌ TOAST: "Application already submitted"');
      console.log('   - Current status:', loadedApp.status);
      console.log('   - This is why user sees "already submitted" message!');
    } else {
      console.log('✅ Proceeding with submission...');
      // Update status to PENDING
      await prisma.application.update({
        where: { id: loadedApp.id },
        data: { status: 'PENDING' }
      });
      console.log('✅ TOAST: "Application submitted for review"');
      console.log('   - Status changed from DRAFT to PENDING');
    }
    
    // Step 6: Check final state
    console.log('\n📊 Final State:');
    const finalApp = await prisma.application.findUnique({
      where: { id: newApp.id }
    });
    console.log('   - Application Status:', finalApp.status);
    console.log('   - Admin can see it?', finalApp.status === 'PENDING' ? 'YES' : 'NO');
    
    console.log('\n🧹 Cleaning up test application...');
    await prisma.application.delete({
      where: { id: newApp.id }
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

testCompleteApplicationFlow();