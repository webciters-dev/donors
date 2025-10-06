@echo off
echo Resetting PostgreSQL postgres user password...
echo.
echo This will temporarily stop PostgreSQL service and reset the password
echo.
pause

REM Stop PostgreSQL service
net stop postgresql-x64-16

REM Start PostgreSQL in single-user mode to reset password
echo Starting PostgreSQL in recovery mode...
cd "C:\Program Files\PostgreSQL\16\bin"

REM Create a temporary SQL script to reset password
echo ALTER USER postgres PASSWORD 'NewPassword123!'; > temp_reset.sql

REM Start PostgreSQL with authentication disabled temporarily
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start -o "-c hba_file=C:\temp\pg_hba_temp.conf"

REM Execute password reset
psql -U postgres -f temp_reset.sql

REM Clean up
del temp_reset.sql

REM Restart PostgreSQL service normally
net start postgresql-x64-16

echo Password reset complete! New password is: NewPassword123!
pause