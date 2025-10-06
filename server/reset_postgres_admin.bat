@echo off
REM PostgreSQL Password Reset Script - Run as Administrator
echo ================================
echo PostgreSQL Password Reset Script
echo ================================
echo.
echo This script will:
echo 1. Restart PostgreSQL service
echo 2. Connect without password 
echo 3. Set a new password
echo 4. Restore security settings
echo.
pause

echo Stopping PostgreSQL service...
net stop postgresql-x64-16

echo Starting PostgreSQL service...
net start postgresql-x64-16

echo.
echo Connecting to PostgreSQL (no password needed now)...
echo You will see the PostgreSQL prompt. Type these commands:
echo.
echo   ALTER USER postgres PASSWORD 'YourNewPassword123!';
echo   \q
echo.
pause

psql -U postgres

echo.
echo Restoring security configuration...
powershell -Command "(Get-Content 'C:\PostgreSQL\16\data\pg_hba.conf') -replace 'trust', 'scram-sha-256' | Set-Content 'C:\PostgreSQL\16\data\pg_hba.conf'"

echo Restarting PostgreSQL with restored security...
net stop postgresql-x64-16
net start postgresql-x64-16

echo.
echo Password reset complete!
echo Your new password is: YourNewPassword123!
echo.
pause