// Phase 2 Export Enhancement - Additional endpoints for donors and sub-admins
// Add these to server/src/routes/export.js

/**
 * GET /api/export/donors
 * Export all donors data as CSV
 * Admin only
 */
router.get("/donors", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const donors = await prisma.donor.findMany({
      include: {
        sponsorships: {
          include: {
            application: {
              include: {
                student: {
                  select: { name: true, email: true, university: true }
                }
              }
            }
          }
        },
        disbursements: true,
        user: {
          select: { createdAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform data for CSV export
    const csvData = donors.map(donor => ({
      "Donor ID": donor.id,
      "Name": donor.name,
      "Email": donor.email,
      "Phone": donor.phone || "",
      "Address": donor.address || "",
      "City": donor.city || "",
      "Province": donor.province || "",
      "Country": donor.country || "",
      "Donor Type": donor.donorType || "",
      "Total Sponsored": donor.sponsorships.length,
      "Active Sponsorships": donor.sponsorships.filter(s => s.status === "ACTIVE").length,
      "Total Disbursements": donor.disbursements.length,
      "Total Disbursed Amount": donor.disbursements.reduce((sum, d) => sum + (d.amount || 0), 0),
      "Registration Date": donor.createdAt?.toISOString().split('T')[0] || "",
      "Last Updated": donor.updatedAt?.toISOString().split('T')[0] || "",
      "Sponsored Students": donor.sponsorships.map(s => s.application?.student?.name).filter(Boolean).join("; "),
      "Status": donor.sponsorships.length > 0 ? "Active Donor" : "Registered"
    }));

    // Convert to CSV and send
    const csv = convertToCSV(csvData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="donors_export.csv"');
    res.send(csv);
    
  } catch (error) {
    console.error("Donor export error:", error);
    res.status(500).json({ error: "Failed to export donors data" });
  }
});

/**
 * GET /api/export/sub-admins
 * Export all sub-admin (field officers) data as CSV
 * Admin only
 */
router.get("/sub-admins", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const subAdmins = await prisma.user.findMany({
      where: { role: "SUB_ADMIN" },
      include: {
        fieldReviews: {
          include: {
            application: {
              include: {
                student: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform data for CSV export
    const csvData = subAdmins.map(officer => ({
      "Officer ID": officer.id,
      "Name": officer.name,
      "Email": officer.email,
      "Role": officer.role,
      "Total Reviews": officer.fieldReviews.length,
      "Pending Reviews": officer.fieldReviews.filter(r => r.status === "PENDING").length,
      "Approved Reviews": officer.fieldReviews.filter(r => r.status === "APPROVED").length,
      "Rejected Reviews": officer.fieldReviews.filter(r => r.status === "REJECTED").length,
      "Needs Info Reviews": officer.fieldReviews.filter(r => r.status === "NEEDS_INFO").length,
      "Last Review Date": officer.fieldReviews.length > 0 
        ? officer.fieldReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt.toISOString().split('T')[0]
        : "",
      "Account Created": officer.createdAt?.toISOString().split('T')[0] || "",
      "Last Login": officer.updatedAt?.toISOString().split('T')[0] || "",
      "Reviewed Students": officer.fieldReviews.map(r => r.application?.student?.name).filter(Boolean).join("; "),
      "Status": officer.fieldReviews.length > 0 ? "Active Officer" : "Inactive"
    }));

    // Convert to CSV and send
    const csv = convertToCSV(csvData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sub_admins_export.csv"');
    res.send(csv);
    
  } catch (error) {
    console.error("Sub-admin export error:", error);
    res.status(500).json({ error: "Failed to export sub-admins data" });
  }
});

/**
 * GET /api/export/complete-system
 * Export complete system data (all entities) as a ZIP file with multiple CSVs
 * Super Admin only
 */
router.get("/complete-system", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    // This would create a ZIP file with separate CSVs for:
    // - applications.csv (existing)
    // - donors.csv  
    // - sub_admins.csv
    // - sponsorships.csv
    // - messages_summary.csv
    // - system_statistics.csv
    
    res.json({ 
      message: "Complete system export functionality", 
      available_exports: [
        "/api/export/applications",
        "/api/export/donors", 
        "/api/export/sub-admins"
      ]
    });
    
  } catch (error) {
    console.error("Complete export error:", error);
    res.status(500).json({ error: "Failed to export complete system data" });
  }
});