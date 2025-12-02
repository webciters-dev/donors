// Quick diagnostic script to check case worker assignment
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== DIAGNOSTIC: Case Worker Assignment Issue ===\n");

  // 1. Check Case Worker 1's user record
  console.log("1️⃣  Checking Case Worker 1's user record:");
  const caseWorker = await prisma.user.findUnique({
    where: { email: "test+31@webciters.com" },
    select: { id: true, name: true, email: true, role: true }
  });
  console.log(JSON.stringify(caseWorker, null, 2));

  if (!caseWorker) {
    console.log(" Case Worker not found!");
    return;
  }

  // 2. Check if FieldReview assignment exists
  console.log("\n2️⃣  Checking FieldReview for application 'fu41640p':");
  const fieldReview = await prisma.fieldReview.findFirst({
    where: { applicationId: "fu41640p" },
    include: {
      application: { include: { student: { select: { id: true, name: true, email: true } } } },
      officer: { select: { id: true, name: true, email: true, role: true } }
    }
  });
  
  if (fieldReview) {
    console.log(JSON.stringify(fieldReview, null, 2));
    
    // 3. Verify the link
    console.log("\n3️⃣  VERIFICATION:");
    console.log(` Application ID: ${fieldReview.applicationId}`);
    console.log(` Student: ${fieldReview.application.student.name} (${fieldReview.application.student.email})`);
    console.log(` Assigned Officer: ${fieldReview.officer.name} (${fieldReview.officer.email})`);
    console.log(` Officer Role: ${fieldReview.officer.role}`);
    console.log(` Officer ID: ${fieldReview.officer.id}`);
    console.log(` Task Type: ${fieldReview.taskType || "Complete Verification"}`);
    console.log(` Status: ${fieldReview.status}`);
    
    // 4. Check if the officer ID matches what the dashboard will query
    console.log("\n4️⃣  DASHBOARD QUERY CHECK:");
    const dashboardQuery = await prisma.fieldReview.findMany({
      where: { officerUserId: fieldReview.officer.id },
      select: { id: true, applicationId: true, studentId: true, officerUserId: true, status: true, taskType: true }
    });
    console.log(`When Case Worker (ID: ${fieldReview.officer.id}) queries dashboard:`);
    console.log(`Should see: ${dashboardQuery.length} assignment(s)`);
    console.log(JSON.stringify(dashboardQuery, null, 2));
  } else {
    console.log(" No FieldReview found for application 'fu41640p'!");
    console.log("\nSearching for ANY FieldReview assignments...");
    const allReviews = await prisma.fieldReview.findMany({
      take: 5,
      select: { id: true, applicationId: true, officerUserId: true, status: true }
    });
    console.log(`Found ${allReviews.length} FieldReview records:`);
    console.log(JSON.stringify(allReviews, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
