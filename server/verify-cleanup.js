#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyCleanup() {
  try {
    console.log(" Verifying database cleanup...\n");

    // Check for all students
    const students = await prisma.student.findMany({});
    console.log(` Total Students: ${students.count}`);
    if (students.length > 0) {
      console.log("   Students found:");
      students.forEach(s => {
        console.log(`   - ${s.email} (ID: ${s.id})`);
      });
    } else {
      console.log("    No students found");
    }

    console.log();

    // Check for users with applicant role or student-related accounts
    const allUsers = await prisma.user.findMany({});
    console.log(` Total Users: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log("   Users found:");
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (Role: ${u.role}, StudentID: ${u.studentId})`);
      });
    }

    console.log();

    // Specifically search for test+1@webciters.com
    console.log(" Searching for test+1@webciters.com...");
    const testStudent = await prisma.student.findUnique({
      where: { email: "test+1@webciters.com" }
    });
    
    if (testStudent) {
      console.log(` FOUND: test+1@webciters.com (ID: ${testStudent.id})`);
      console.log(`   This student STILL EXISTS in the database!`);
    } else {
      console.log(` test+1@webciters.com: NOT FOUND (successfully deleted)`);
    }

    console.log();

    // Check for any applications
    const applications = await prisma.application.findMany({});
    console.log(` Total Applications: ${applications.length}`);
    if (applications.length > 0) {
      console.log("    Applications still exist!");
    } else {
      console.log("    No applications found");
    }

  } catch (error) {
    console.error(" Error during verification:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanup();
