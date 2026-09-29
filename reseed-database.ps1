# DOGFOOD OS - Reseed Database Script (PowerShell)
# This script restores demo data for testing

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DOGFOOD OS - Database Reseed Utility" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will restore demo data:" -ForegroundColor Yellow
Write-Host "  - 40 demo projects" -ForegroundColor White
Write-Host "  - 120 ballots" -ForegroundColor White
Write-Host "  - 2 disputes" -ForegroundColor White
Write-Host "  - Trust ledger entries" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Proceed with reseeding? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host ""
    Write-Host "Operation cancelled." -ForegroundColor Red
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Reseeding database with demo data..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/database/reseed" -Method POST
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Database Reseeded Successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Refresh your organizer dashboard" -ForegroundColor White
    Write-Host "  2. You should see demo data populated" -ForegroundColor White
    Write-Host "  3. Great for testing and demonstrations" -ForegroundColor White
    Write-Host ""
    Write-Host "To clear all data: run " -NoNewline -ForegroundColor White
    Write-Host ".\clear-database.ps1" -ForegroundColor Red
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  Error Reseeding Database" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure the API is running: npm run dev" -ForegroundColor White
    Write-Host "  2. Check if localhost:4000 is accessible" -ForegroundColor White
    Write-Host "  3. Check API logs for errors" -ForegroundColor White
    Write-Host ""
}

pause
