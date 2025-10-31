@echo off
echo Exporting local database data...
echo.
echo Please enter your local PostgreSQL username:
set /p USERNAME=Username: 
echo.
echo Please enter your local PostgreSQL password when prompted...
echo.

REM Export data only (no schema) with INSERT statements
pg_dump -h localhost -U %USERNAME% -d donors_db --data-only --inserts --no-owner --no-privileges -f donors_data.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Export successful! File created: donors_data.sql
    echo.
    echo Now upload this file to your server using:
    echo scp donors_data.sql sohail@136.144.175.93:~/projects/donors/
) else (
    echo.
    echo ✗ Export failed! Please check your database connection and credentials.
)

pause