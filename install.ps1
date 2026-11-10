# WMIS Installation Script for Windows PowerShell
# Run: .\install.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  WMIS - AGL Rwanda Installation Script    " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".\.env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".\.env.example" ".\.env"
    Write-Host ".env created. Edit it with your MongoDB URI if needed." -ForegroundColor Green
}

# Install root dependencies
Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install --no-audit --no-fund
Write-Host "Root dependencies installed." -ForegroundColor Green

# Install server dependencies
Write-Host ""
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install --no-audit --no-fund
Set-Location ..
Write-Host "Server dependencies installed." -ForegroundColor Green

# Install client dependencies
Write-Host ""
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location client
npm install --no-audit --no-fund
Set-Location ..
Write-Host "Client dependencies installed." -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Installation Complete!                   " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure MongoDB is running:" -ForegroundColor White
Write-Host "     net start MongoDB" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Seed the database:" -ForegroundColor White
Write-Host "     npm run seed" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Start the application (browser opens automatically):" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  App will open at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
