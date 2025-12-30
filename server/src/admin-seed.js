import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(' Starting super admin seed...');

  const pwd = process.env.ADMIN_DEFAULT_PASSWORD;

  // Create admin user
  const passwordHash = await bcrypt.hash(String(pwd), 12);
  
  const newAdmin = await prisma.user.create({
    data: { 
      name: "Super Admin", 
      email: "super@awake.nl", 
      passwordHash, 
      role: "ADMIN" 
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true,
      createdAt: true 
    }
  });
  
  console.log(' Super admin created:', newAdmin);
}

main()
  .catch((e) => {
    console.error(' Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });