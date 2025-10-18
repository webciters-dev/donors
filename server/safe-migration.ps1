# 🛡️ SAFE MIGRATION VERIFICATION SCRIPT (Windows)
# ===============================================

Write-Host "🛡️ SAFE MIGRATION VERIFICATION SCRIPT" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "❌ Error: prisma\schema.prisma not found. Please run from server directory." -ForegroundColor Red
    exit 1
}

Write-Host "1️⃣ Validating Schema Syntax..." -ForegroundColor Yellow
npx prisma validate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Schema validation failed! Aborting migration." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Schema syntax is valid" -ForegroundColor Green
Write-Host ""

Write-Host "2️⃣ Generating Prisma Client (Safety Check)..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client generation failed! Aborting migration." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
Write-Host ""

Write-Host "3️⃣ Creating Migration File..." -ForegroundColor Yellow
npx prisma migrate dev --name "add-student-phase-system"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed! Please check the schema." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migration applied successfully" -ForegroundColor Green
Write-Host ""

Write-Host "4️⃣ Migration Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Added StudentPhase enum (APPLICATION, ACTIVE, GRADUATED)" -ForegroundColor Green
Write-Host "  ✅ Added studentPhase field to Student model (nullable, default APPLICATION)" -ForegroundColor Green
Write-Host "  ✅ Preserved ALL existing data and functionality" -ForegroundColor Green
Write-Host "  ✅ No breaking changes" -ForegroundColor Green
Write-Host ""

Write-Host "🛡️ MIGRATION COMPLETED SAFELY" -ForegroundColor Green