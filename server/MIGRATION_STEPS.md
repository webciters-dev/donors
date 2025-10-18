# MANUAL SAFE MIGRATION STEPS
# ============================

# Step 1: Navigate to server directory
cd C:\projects\donors\server

# Step 2: Validate schema syntax  
npx prisma validate
# ✅ Should show "Environment variables loaded from .env" and no errors

# Step 3: Generate Prisma client to ensure no syntax issues
npx prisma generate  
# ✅ Should regenerate client with new StudentPhase enum

# Step 4: Create and apply migration
npx prisma migrate dev --name "add-student-phase-system"
# ✅ This will:
#    - Create migration file
#    - Apply to database  
#    - Add StudentPhase enum
#    - Add studentPhase field with default APPLICATION
#    - Keep ALL existing data intact

# Step 5: Verify migration success
npx prisma studio
# ✅ Open Prisma Studio to verify:
#    - StudentPhase enum exists
#    - All existing students have studentPhase = APPLICATION
#    - All other data unchanged

# SAFETY NOTES:
# - Migration is 100% additive (no data loss)
# - All existing functionality continues working
# - New field is optional with safe default
# - Can be rolled back if needed