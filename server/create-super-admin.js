// server/create-super-admin.js - One-time script to create the first SUPER_ADMIN user
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log(" Creating first SUPER_ADMIN user...");
    
    const email = "superadmin@awakeconnect.com"; // Change this to your email
    const password = "super123456"; // Change this to a secure password
    const name = "Super Administrator";
    
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" }
    });
    
    if (existingSuperAdmin) {
      console.log(" A SUPER_ADMIN user already exists:");
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.name || "Not set"}`);
      console.log(`   Created: ${existingSuperAdmin.createdAt}`);
      return;
    }
    
    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(` Email ${email} is already in use by user with role: ${existingUser.role}`);
      console.log("   Please use a different email address.");
      return;
    }
    
    // Create the super admin user
    const passwordHash = await bcrypt.hash(password, 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(" SUPER_ADMIN user created successfully!");
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Password: ${password} (change this after first login)`);
    console.log(`   Created: ${superAdmin.createdAt}`);
    console.log("");
    console.log(" IMPORTANT SECURITY NOTES:");
    console.log("   1. Change the default password after first login");
    console.log("   2. Use this account to create regular admin users");
    console.log("   3. Only give SUPER_ADMIN access to trusted personnel");
    console.log("   4. All SUPER_ADMIN actions are logged for security");
    
  } catch (error) {
    console.error(" Failed to create SUPER_ADMIN user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();