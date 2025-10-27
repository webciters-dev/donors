# Database Reset Script for Donors Management System
# PowerShell version for Windows development

param(
    [string]$DbName = "donors_dev",
    [string]$DbUser = $env:DB_USER ?? "postgres",
    [string]$DbHost = $env:DB_HOST ?? "localhost",
    [string]$DbPort = $env:DB_PORT ?? "5432",
    [switch]$KeepAdmin
)

Write-Host "🔄 Database Reset Utility" -ForegroundColor Blue
Write-Host "========================="

# Function to check if PostgreSQL tools are available
function Test-PostgreSQLTools {
    try {
        & pg_dump --help | Out-Null
        return $true
    } catch {
        Write-Host "❌ PostgreSQL tools not found! Please install PostgreSQL or add it to PATH." -ForegroundColor Red
        return $false
    }
}

# Function to check if database exists
function Test-DatabaseExists {
    param([string]$database)
    
    try {
        & psql -h $DbHost -p $DbPort -U $DbUser -d $database -c "\q" 2>$null
        return $true
    } catch {
        return $false
    }
}

# Function to reset database
function Reset-Database {
    Write-Host "🗑️  Dropping existing database..." -ForegroundColor Yellow
    
    if (Test-DatabaseExists -database $DbName) {
        & dropdb -h $DbHost -p $DbPort -U $DbUser $DbName
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to drop database!" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "🏗️  Creating fresh database..." -ForegroundColor Blue
    & createdb -h $DbHost -p $DbPort -U $DbUser $DbName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create database!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Database reset successfully!" -ForegroundColor Green
}

# Function to run Prisma operations
function Invoke-PrismaOperations {
    $serverPath = Join-Path $PSScriptRoot ".." "server"
    
    if (Test-Path $serverPath) {
        Write-Host "🔧 Running Prisma migrations..." -ForegroundColor Blue
        Push-Location $serverPath
        
        try {
            # Check if Prisma is available
            & npm list prisma 2>$null
            if ($LASTEXITCODE -eq 0) {
                & npx prisma migrate deploy
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Prisma migrations completed!" -ForegroundColor Green
                    
                    & npx prisma generate
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ Prisma client generated!" -ForegroundColor Green
                    }
                } else {
                    Write-Host "❌ Prisma migrations failed!" -ForegroundColor Red
                }
            } else {
                Write-Host "⚠️  Prisma not found, skipping migrations" -ForegroundColor Yellow
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "⚠️  Server directory not found, skipping Prisma operations" -ForegroundColor Yellow
    }
}

# Function to seed database
function Invoke-DatabaseSeed {
    $serverPath = Join-Path $PSScriptRoot ".." "server"
    
    if (Test-Path $serverPath) {
        Write-Host "🌱 Seeding database..." -ForegroundColor Blue
        Push-Location $serverPath
        
        try {
            if ($KeepAdmin) {
                Write-Host "👤 Running admin-preserving seed..." -ForegroundColor Yellow
                & node clear-database-keep-admin.js
            } else {
                Write-Host "🌱 Running full seed..." -ForegroundColor Blue
                & npm run seed
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
            } else {
                Write-Host "❌ Database seeding failed!" -ForegroundColor Red
            }
        } finally {
            Pop-Location
        }
    }
}

# Main execution
if (-not (Test-PostgreSQLTools)) {
    exit 1
}

Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow

# Confirm reset
$confirmation = Read-Host "⚠️  This will completely reset the database '$DbName'. Continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "🚫 Operation cancelled." -ForegroundColor Yellow
    exit 0
}

# Perform reset
Reset-Database
Invoke-PrismaOperations
Invoke-DatabaseSeed

# Verify results
Write-Host "🔍 Verifying database setup..." -ForegroundColor Blue
$tableCount = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

if ($tableCount -gt 0) {
    Write-Host "✅ Found $tableCount tables in the database" -ForegroundColor Green
    
    Write-Host "📊 Table record counts:" -ForegroundColor Blue
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "SELECT tablename as `"Table`", n_tup_ins - n_tup_del as `"Records`" FROM pg_stat_user_tables ORDER BY tablename;"
} else {
    Write-Host "❌ No tables found in the database!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database reset completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  🔧 Update your .env file if needed"
Write-Host "  🚀 Start your application server"
Write-Host "  🌐 Test the database connection"
Write-Host ""