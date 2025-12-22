import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(' Starting super admin seed...');

  const data = {
    name: "Super Admin",
    email: "super@awake.nl",
    password: process.env.ADMIN_DEFAULT_PASSWORD,
    role: "ADMIN",
  }

  // Create admin user
  const passwordHash = await bcrypt.hash(String(data.password), 12);
  
  const newAdmin = await prisma.user.create({
    data: { 
      name: data.name?.trim() || null, 
      email: data.email.toLowerCase().trim(), 
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