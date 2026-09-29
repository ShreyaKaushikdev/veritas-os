# DOGFOOD OS - Clear Database Script (PowerShell)
# This script clears all seeded/demo data from the database

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DOGFOOD OS - Database Clear Utility" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will PERMANENTLY DELETE all demo data:" -ForegroundColor Yellow
Write-Host "  - 40 demo projects" -ForegroundColor White
Write-Host "  - 120 ballots" -ForegroundColor White
Write-Host "  - 2 disputes" -ForegroundColor White
Write-Host "  - All trust ledger entries" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host ""
    Write-Host "Operation cancelled." -ForegroundColor Red
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Clearing database..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/database/clear" -Method POST
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Database Cleared Successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Refresh your organizer dashboard" -ForegroundColor White
    Write-Host "  2. All counters should now show 0" -ForegroundColor White
    Write-Host "  3. Ready for real hackathon data" -ForegroundColor White
    Write-Host ""
    Write-Host "To reseed demo data: run " -NoNewline -ForegroundColor White
    Write-Host ".\reseed-database.ps1" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  Error Clearing Database" -ForegroundColor Red
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
