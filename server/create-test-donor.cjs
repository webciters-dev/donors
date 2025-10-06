// server/create-test-donor.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'donor@test.com';
  const password = 'Test@123';
  const name = 'Test Donor';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ 
    where: { email } 
  });

  if (existingUser) {
    console.log('✅ Test donor already exists: donor@test.com / Test@123');
    return;
  }

  // Create donor record
  const donor = await prisma.donor.create({
    data: {
      name,
      email,
      organization: 'Test Organization',
    },
  });

  // Create user record
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'DONOR',
      donorId: donor.id,
    },
  });

  console.log('✅ Test donor created successfully!');
  console.log('   Email: donor@test.com');
  console.log('   Password: Test@123');
  console.log('   You can now login and test the payment flow');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Error creating test donor:', e);
    prisma.$disconnect();
    process.exit(1);
  });