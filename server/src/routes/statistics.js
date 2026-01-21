// server/src/routes/statistics.js
import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

/* =========================
   GET /api/statistics
   Public endpoint for homepage statistics
========================= */
router.get("/", async (req, res) => {
  try {
    // Get count of sponsored students (ACTIVE phase + sponsored=true)
    const sponsoredCount = await prisma.student.count({
      where: {
        studentPhase: "ACTIVE",
        sponsored: true
      }
    });

    // Get count of available students (ACTIVE phase + sponsored=false) 
    // These are approved students ready for sponsorship matching
    const availableCount = await prisma.student.count({
      where: {
        studentPhase: "ACTIVE", 
        sponsored: false
      }
    });

    // Get unique universities count from ACTIVE students only
    const universities = await prisma.student.findMany({
      select: {
        university: true
      },
      distinct: ['university'],
      where: {
        studentPhase: "ACTIVE"
      }
    });

    // Filter out null/empty universities in JS
    const universitiesCount = universities.filter(u => u.university && u.university.trim()).length;

    // Calculate success rate (active students / total students who completed APPLICATION)
    const totalCompletedApplications = await prisma.student.count({
      where: {
        OR: [
          { studentPhase: "APPLICATION" },
          { studentPhase: "ACTIVE" },
          { studentPhase: "GRADUATED" }
        ]
      }
    });
    const totalActiveStudents = await prisma.student.count({
      where: {
        OR: [
          { studentPhase: "ACTIVE" },
          { studentPhase: "GRADUATED" }
        ]
      }
    });
    const successRate = totalCompletedApplications > 0 
      ? Math.round((totalActiveStudents / totalCompletedApplications) * 100) 
      : 0;

    // Additional helpful statistics
    const totalDonors = await prisma.user.count({
      where: {
        role: "DONOR"
      }
    });

    const totalStudents = await prisma.user.count({
      where: {
        role: "STUDENT"
      }
    });

    // Students in review phase
    const studentsInReview = await prisma.student.count({
      where: {
        studentPhase: "APPLICATION"
      }
    });

    const statistics = {
      sponsored: sponsoredCount,
      available: availableCount, 
      universities: universitiesCount,
      successRate: `${successRate}%`,
      // Additional stats for future use
      totalDonors,
      totalStudents,
      studentsInReview, // Students still in APPLICATION phase
      totalActiveStudents
    };

    console.log(' Statistics fetched:', statistics);
    
    return res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch statistics" 
    });
  }
});

/* =========================
   GET /api/statistics/sponsored-students
   Public endpoint for list of sponsored students with studies and amounts
========================= */
router.get("/sponsored-students", async (req, res) => {
  try {
    const sponsoredStudents = await prisma.student.findMany({
      where: {
        studentPhase: "ACTIVE",
        sponsored: true
      },
      select: {
        id: true,
        name: true,
        university: true,
        program: true,
        field: true,
        degreeLevel: true,
        country: true,
        photoThumbnailUrl: true,
        applications: {
          where: {
            status: "APPROVED"
          },
          select: {
            amount: true,
            currency: true
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format the response
    const formattedStudents = sponsoredStudents.map(student => {
      const approvedApp = student.applications[0];
      return {
        id: student.id,
        name: student.name,
        university: student.university,
        program: student.program,
        field: student.field,
        degreeLevel: student.degreeLevel,
        country: student.country,
        photoThumbnailUrl: student.photoThumbnailUrl,
        sponsoredAmount: approvedApp?.amount || 0,
        currency: approvedApp?.currency || 'USD'
      };
    });

    return res.json({
      success: true,
      data: formattedStudents,
      count: formattedStudents.length
    });

  } catch (error) {
    console.error("Failed to fetch sponsored students:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch sponsored students" 
    });
  }
});

/* =========================
   GET /api/statistics/universities
   Public endpoint for list of universities with student counts
========================= */
router.get("/universities", async (req, res) => {
  try {
    // Get universities from ACTIVE students
    const studentsWithUniversities = await prisma.student.findMany({
      where: {
        studentPhase: "ACTIVE"
      },
      select: {
        university: true,
        country: true
      }
    });

    // Group by university and count (filter out null/empty in JS)
    const universityMap = new Map();
    studentsWithUniversities.forEach(student => {
      if (student.university && student.university.trim()) {
        const key = student.university;
        if (universityMap.has(key)) {
          const existing = universityMap.get(key);
          existing.studentCount += 1;
        } else {
          universityMap.set(key, {
            name: student.university,
            country: student.country || 'Unknown',
            studentCount: 1
          });
        }
      }
    });

    // Convert to array and sort by student count
    const universities = Array.from(universityMap.values())
      .sort((a, b) => b.studentCount - a.studentCount);

    return res.json({
      success: true,
      data: universities,
      count: universities.length
    });

  } catch (error) {
    console.error("Failed to fetch universities:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch universities" 
    });
  }
});

/* =========================
   GET /api/statistics/detailed
   More detailed statistics for admin dashboard
========================= */
router.get("/detailed", async (req, res) => {
  try {
    // Applications by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Applications by country
    const applicationsByCountry = await prisma.application.groupBy({
      by: ['country'],
      _count: {
        id: true
      },
      where: {
        country: {
          not: null
        }
      }
    });

    // Monthly application trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyApplications = await prisma.application.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      }
    });

    // Average funding amount requested
    const avgFundingAmount = await prisma.application.aggregate({
      _avg: {
        amount: true
      }
    });

    const detailedStats = {
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      applicationsByCountry: applicationsByCountry.reduce((acc, item) => {
        acc[item.country] = item._count.id;
        return acc;
      }, {}),
      monthlyTrends: monthlyApplications,
      averageFundingAmount: avgFundingAmount._avg.amount || 0
    };

    return res.json({
      success: true,
      data: detailedStats
    });

  } catch (error) {
    console.error("Failed to fetch detailed statistics:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch detailed statistics" 
    });
  }
});

export default router;