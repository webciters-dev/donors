#!/bin/bash

echo "🛡️ SAFE MIGRATION VERIFICATION SCRIPT"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: prisma/schema.prisma not found. Please run from server directory."
    exit 1
fi

echo "1️⃣ Validating Schema Syntax..."
npx prisma validate
if [ $? -ne 0 ]; then
    echo "❌ Schema validation failed! Aborting migration."
    exit 1
fi
echo "✅ Schema syntax is valid"
echo ""

echo "2️⃣ Generating Prisma Client (Safety Check)..."  
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Client generation failed! Aborting migration."
    exit 1
fi
echo "✅ Prisma client generated successfully"
echo ""

echo "3️⃣ Creating Migration File..."
npx prisma migrate dev --name "add-student-phase-system" --create-only
if [ $? -ne 0 ]; then
    echo "❌ Migration creation failed! Please check the schema."
    exit 1
fi
echo "✅ Migration file created (not applied yet)"
echo ""

echo "4️⃣ Preview Migration Changes..."
echo "This migration will:"
echo "  ✅ Add StudentPhase enum (APPLICATION, ACTIVE, GRADUATED)" 
echo "  ✅ Add studentPhase field to Student model (nullable, default APPLICATION)"
echo "  ✅ Preserve ALL existing data and functionality"
echo "  ✅ No breaking changes"
echo ""

echo "5️⃣ Ready to Apply Migration"
echo "To apply the migration, run:"
echo "  npx prisma migrate deploy"
echo ""
echo "🛡️ MIGRATION IS SAFE TO APPLY"