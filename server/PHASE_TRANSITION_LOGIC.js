// STUDENT PHASE TRANSITION LOGIC
// To be added AFTER migration is successful

// This code will be added to applications.js after line 290
// WHERE: prisma.application.update() call

// ADD THIS LOGIC AFTER SUCCESSFUL MIGRATION:

// If application is being approved, transition student to ACTIVE phase
if (status === "APPROVED" && updated.student?.id) {
  try {
    // Transition student from APPLICATION to ACTIVE phase
    await prisma.student.update({
      where: { id: updated.student.id },
      data: { 
        studentPhase: 'ACTIVE',
        // Keep existing sponsored field for backward compatibility
        sponsored: true 
      }
    });
    console.log(`🎓 Student ${updated.student.name} transitioned to ACTIVE phase`);
  } catch (phaseError) {
    // Log error but don't fail the application approval
    console.error('Phase transition error:', phaseError);
  }
}

// NOTES:
// - Only runs when application status changes to APPROVED
// - Gracefully handles errors (doesn't break existing flow)  
// - Maintains backward compatibility with 'sponsored' field
// - Logs transition for audit trail
// - Safe to add after migration is complete