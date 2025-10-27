@echo off
REM Database Import Script for Windows (PowerShell/CMD)
REM This script imports PostgreSQL database from exported files

setlocal enabledelayedexpansion

REM Configuration
set DB_NAME=donors_dev
if "%DB_USER%"=="" set DB_USER=postgres
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
set IMPORT_DIR=database

echo 📥 Database Import Utility (Windows)
echo ==================================

REM Check if import directory exists
if not exist "%IMPORT_DIR%" (
    echo ❌ Import directory '%IMPORT_DIR%' does not exist!
    pause
    exit /b 1
)

REM Check if PostgreSQL tools are available
pg_dump --help >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL tools not found! Please install PostgreSQL or add it to PATH.
    pause
    exit /b 1
)

echo 🔍 Checking if database exists...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "\q" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Database '%DB_NAME%' already exists.
    set /p "recreate=Do you want to drop and recreate it? (y/N): "
    if /i "!recreate!"=="y" (
        echo 🗑️  Dropping existing database...
        dropdb -h %DB_HOST% -p %DB_PORT% -U %DB_USER% %DB_NAME%
        goto create_db
    ) else (
        echo ℹ️  Using existing database.
        goto import_menu
    )
) else (
    goto create_db
)

:create_db
echo 🏗️  Creating database '%DB_NAME%'...
createdb -h %DB_HOST% -p %DB_PORT% -U %DB_USER% %DB_NAME%
if errorlevel 1 (
    echo ❌ Failed to create database!
    pause
    exit /b 1
)
echo ✅ Database created successfully!

:import_menu
echo.
echo Import Options:
echo 1) Import full database (structure + data)
echo 2) Import schema only, then data
echo 3) Create empty database (for Prisma migrations)
echo 4) Exit
echo.
set /p "choice=Choose an option (1-4): "

if "%choice%"=="1" goto import_full
if "%choice%"=="2" goto import_separate
if "%choice%"=="3" goto empty_db
if "%choice%"=="4" goto exit
echo ❌ Invalid option. Please choose 1-4.
goto import_menu

:import_full
if not exist "%IMPORT_DIR%\full_dump.sql" (
    echo ❌ Full dump file not found: %IMPORT_DIR%\full_dump.sql
    pause
    exit /b 1
)
echo 💾 Importing full database...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%IMPORT_DIR%\full_dump.sql" -q
echo ✅ Full database imported successfully!
goto verify

:import_separate
if not exist "%IMPORT_DIR%\schema.sql" (
    echo ❌ Schema file not found: %IMPORT_DIR%\schema.sql
    pause
    exit /b 1
)
echo 📋 Importing database schema...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%IMPORT_DIR%\schema.sql" -q
echo ✅ Schema imported successfully!

if exist "%IMPORT_DIR%\seed_data.sql" (
    echo 📊 Importing database data...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%IMPORT_DIR%\seed_data.sql" -q
    echo ✅ Data imported successfully!
) else (
    echo ⚠️  Data file not found: %IMPORT_DIR%\seed_data.sql
    echo Skipping data import.
)
goto verify

:empty_db
echo ✅ Empty database ready for Prisma migrations!
echo.
echo Next steps:
echo   1. cd server
echo   2. npx prisma migrate deploy
echo   3. npm run seed
goto end

:verify
echo 🔍 Verifying import...
for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLE_COUNT=%%i

if %TABLE_COUNT% gtr 0 (
    echo ✅ Found %TABLE_COUNT% tables in the database
    echo.
    echo 📊 Table record counts:
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT tablename as \"Table\", n_tup_ins - n_tup_del as \"Records\" FROM pg_stat_user_tables ORDER BY tablename;"
) else (
    echo ❌ No tables found in the database!
    pause
    exit /b 1
)

:end
echo.
echo 🎉 Database import completed successfully!
echo.
echo Next steps:
echo   🔧 Update your .env file with the database URL
echo   🚀 Start your application server
echo   🌐 Test the database connection
echo.

:exit
pause