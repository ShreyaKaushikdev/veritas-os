@echo off
REM DOGFOOD OS - Reseed Database Script
REM This script restores demo data for testing

echo.
echo ================================================
echo   DOGFOOD OS - Database Reseed Utility
echo ================================================
echo.
echo This will restore demo data:
echo   - 40 demo projects
echo   - 120 ballots
echo   - 2 disputes
echo   - Trust ledger entries
echo.

set /p confirm="Proceed with reseeding? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo.
    echo Operation cancelled.
    pause
    exit /b
)

echo.
echo Reseeding database with demo data...
echo.

curl -X POST http://localhost:4000/database/reseed

echo.
echo.
echo ================================================
echo   Database Reseeded Successfully!
echo ================================================
echo.
echo Next steps:
echo   1. Refresh your organizer dashboard
echo   2. You should see demo data populated
echo   3. Great for testing and demonstrations
echo.
echo To clear all data: run "clear-database.bat"
echo.
pause
