@echo off
REM DOGFOOD OS - Clear Database Script
REM This script clears all seeded/demo data from the database

echo.
echo ================================================
echo   DOGFOOD OS - Database Clear Utility
echo ================================================
echo.
echo This will PERMANENTLY DELETE all demo data:
echo   - 40 demo projects
echo   - 120 ballots
echo   - 2 disputes
echo   - All trust ledger entries
echo.

set /p confirm="Are you sure you want to proceed? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo.
    echo Operation cancelled.
    pause
    exit /b
)

echo.
echo Clearing database...
echo.

curl -X POST http://localhost:4000/database/clear

echo.
echo.
echo ================================================
echo   Database Cleared Successfully!
echo ================================================
echo.
echo Next steps:
echo   1. Refresh your organizer dashboard
echo   2. All counters should now show 0
echo   3. Ready for real hackathon data
echo.
echo To reseed demo data: run "reseed-database.bat"
echo.
pause
