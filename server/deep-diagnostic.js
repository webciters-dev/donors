// Deep diagnostic for case worker assignment issue
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== DEEP DIAGNOSTIC: Case Worker Assignment Issue ===\n");

  // Case Worker 1's ID (from previous diagnostic)
  const caseWorkerId = "cmilm4eku0000kfmdfw8kfi7i";
  
  // Step 1: Verify case worker exists and has correct role
  console.log("1️⃣  Case Worker User Record:");
  const caseWorker = await prisma.user.findUnique({
    where: { id: caseWorkerId },
    select: { id: true, name: true, email: true, role: true, passwordHash: true }
  });
  console.log(JSON.stringify(caseWorker, null, 2));

  if (!caseWorker) {
    console.log(" Case Worker not found!");
    return;
  }

  // Step 2: Check ALL FieldReview assignments for this case worker
  console.log("\n2️⃣  ALL FieldReview Assignments for Case Worker:");
  const allAssignments = await prisma.fieldReview.findMany({
    where: { officerUserId: caseWorkerId },
    include: {
      application: { include: { student: { select: { id: true, name: true, email: true } } } },
      officer: { select: { id: true, name: true, email: true } }
    }
  });
  
  console.log(`Found: ${allAssignments.length} assignment(s)`);
  console.log(JSON.stringify(allAssignments, null, 2));

  // Step 3: Check what admin sees
  console.log("\n3️⃣  ALL FieldReview Assignments in Database:");
  const allReviews = await prisma.fieldReview.findMany({
    include: {
      application: { include: { student: { select: { id: true, name: true } } } },
      officer: { select: { id: true, name: true, email: true, role: true } }
    }
  });
  console.log(`Total FieldReviews in DB: ${allReviews.length}`);
  allReviews.forEach((review, idx) => {
    console.log(`\nReview ${idx + 1}:`);
    console.log(`  ID: ${review.id}`);
    console.log(`  Application: ${review.application.student.name} (${review.applicationId})`);
    console.log(`  Officer: ${review.officer.name} (${review.officer.email}) [Role: ${review.officer.role}]`);
    console.log(`  Status: ${review.status}`);
    console.log(`  TaskType: ${review.taskType || "Complete Verification"}`);
    console.log(`  Created: ${review.createdAt}`);
  });

  // Step 4: Simulate what SubAdminDashboard.jsx does
  console.log("\n4️⃣  SIMULATING DASHBOARD QUERY:");
  const role = "SUB_ADMIN";
  const userId = caseWorkerId;
  
  console.log(`Role: ${role}`);
  console.log(`User ID: ${userId}`);
  
  const where = (role === "SUB_ADMIN" || role === "CASE_WORKER")
    ? { officerUserId: userId }
    : {};
  
  console.log(`WHERE clause: ${JSON.stringify(where)}`);
  
  const dashboardReviews = await prisma.fieldReview.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });
  
  console.log(`\nDashboard would show: ${dashboardReviews.length} assignment(s)`);
  if (dashboardReviews.length === 0) {
    console.log(" CASE WORKER SEES EMPTY DASHBOARD");
  } else {
    console.log(" Case worker should see assignments:");
    dashboardReviews.forEach(r => console.log(`   - ${r.applicationId}`));
  }

  // Step 5: Check if issue is with frontend or backend
  console.log("\n5️⃣  CHECKING API ENDPOINT SIMULATION:");
  console.log("Calling GET /api/field-reviews with case worker JWT...");
  
  const apiResponse = await prisma.fieldReview.findMany({
    where: { officerUserId: caseWorkerId },
    orderBy: { createdAt: "desc" },
    include: {
      application: { include: { student: { select: { id: true, name: true } } } },
      officer: { select: { id: true, name: true, email: true } }
    }
  });
  
  console.log(`API returns: ${apiResponse.length} assignment(s)`);
  console.log(JSON.stringify(apiResponse, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
