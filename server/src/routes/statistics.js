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
        studentPhase: "ACTIVE",
        university: {
          not: null,
          not: ""
        }
      }
    });

    const universitiesCount = universities.length;

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