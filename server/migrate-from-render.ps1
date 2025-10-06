# Database Migration Script
# This script helps you migrate data from Render to your local PostgreSQL

Write-Host "🔄 Database Migration from Render to Local PostgreSQL" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Step 1: Get Render DATABASE_URL
Write-Host "📝 Step 1: Render Database Connection" -ForegroundColor Yellow
Write-Host "Please provide your original Render DATABASE_URL"
Write-Host "It should look like: postgresql://username:password@hostname.render.com:5432/database_name"
Write-Host ""
$renderUrl = Read-Host "Enter your Render DATABASE_URL"

if ($renderUrl -eq "") {
    Write-Host "❌ No URL provided. Exiting..." -ForegroundColor Red
    exit
}

# Step 2: Export from Render
Write-Host ""
Write-Host "📤 Step 2: Exporting data from Render..." -ForegroundColor Yellow
$backupFile = "render_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

try {
    pg_dump $renderUrl > $backupFile
    Write-Host "✅ Export completed: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "❌ Export failed: $_" -ForegroundColor Red
    exit
}

# Step 3: Clear local database
Write-Host ""
Write-Host "🧹 Step 3: Clearing local database..." -ForegroundColor Yellow
try {
    psql -U postgres -d awake_local_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    Write-Host "✅ Local database cleared" -ForegroundColor Green
} catch {
    Write-Host "❌ Clear failed: $_" -ForegroundColor Red
    exit
}

# Step 4: Import to local
Write-Host ""
Write-Host "📥 Step 4: Importing to local database..." -ForegroundColor Yellow
try {
    psql -U postgres -d awake_local_db < $backupFile
    Write-Host "✅ Import completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Import failed: $_" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🎉 Migration Complete!" -ForegroundColor Green
Write-Host "Your Render data is now available in your local PostgreSQL database." -ForegroundColor Green
Write-Host "Backup file saved as: $backupFile" -ForegroundColor Cyan