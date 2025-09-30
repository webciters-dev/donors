// server/prisma/seed-admin.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@awake.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@awake.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created/ensured: admin@awake.com / Admin@123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
