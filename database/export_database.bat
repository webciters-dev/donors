@echo off
REM Database Export Script for Windows (PowerShell/CMD)
REM This script exports the PostgreSQL database in different formats

setlocal enabledelayedexpansion

REM Configuration
set DB_NAME=donors_dev
if "%DB_USER%"=="" set DB_USER=postgres
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
set EXPORT_DIR=database

echo 🗄️  Database Export Utility (Windows)
echo ==================================

REM Check if database directory exists
if not exist "%EXPORT_DIR%" (
    echo 📁 Creating database directory...
    mkdir "%EXPORT_DIR%"
)

REM Check if database exists
pg_dump --help >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL tools not found! Please install PostgreSQL or add it to PATH.
    pause
    exit /b 1
)

echo 🔍 Checking database connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\q" >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot connect to database '%DB_NAME%'!
    echo Please check your database configuration.
    pause
    exit /b 1
)

echo 📋 Exporting database schema...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --schema-only --no-owner --no-privileges --clean --if-exists > "%EXPORT_DIR%\schema.sql"
echo ✅ Schema exported to %EXPORT_DIR%\schema.sql

echo 📊 Exporting database data...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --data-only --no-owner --no-privileges --disable-triggers --column-inserts > "%EXPORT_DIR%\seed_data.sql"
echo ✅ Data exported to %EXPORT_DIR%\seed_data.sql

echo 💾 Exporting full database...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --no-owner --no-privileges --clean --if-exists --column-inserts > "%EXPORT_DIR%\full_dump.sql"
echo ✅ Full database exported to %EXPORT_DIR%\full_dump.sql

echo 📋 Creating database info file...
echo Database Export Information > "%EXPORT_DIR%\database_info.txt"
echo =========================== >> "%EXPORT_DIR%\database_info.txt"
echo. >> "%EXPORT_DIR%\database_info.txt"
echo Database Name: %DB_NAME% >> "%EXPORT_DIR%\database_info.txt"
echo Export Date: %date% %time% >> "%EXPORT_DIR%\database_info.txt"
echo. >> "%EXPORT_DIR%\database_info.txt"

echo.
echo 🎉 Database export completed successfully!
echo.
echo Generated files:
echo   📋 schema.sql      - Database structure only
echo   📊 seed_data.sql   - Data only (for existing schema)
echo   💾 full_dump.sql   - Complete database (structure + data)
echo   📋 database_info.txt - Export metadata
echo.
echo To import on another system:
echo   🔧 Schema only:    psql -U username -d dbname -f database\schema.sql
echo   📊 Data only:      psql -U username -d dbname -f database\seed_data.sql
echo   💾 Full database:  psql -U username -d dbname -f database\full_dump.sql
echo.

pause