# Production deployment script for AWAKE Connect - Windows
# Requires: Node.js, npm, PM2 (npm install -g pm2)

$ProjectDir = "C:\projects\donor"
Set-Location $ProjectDir

Write-Host "🚀 Starting AWAKE Connect Backend with PM2..." -ForegroundColor Cyan

# Set production environment
$env:NODE_ENV = "production"

# Kill any existing PM2 processes
pm2 delete all 2>$null

# Clean logs directory
$logsDir = Join-Path $ProjectDir "logs"
if (Test-Path $logsDir) {
    Remove-Item "$logsDir\*.log" -Force -ErrorAction SilentlyContinue
}

# Start the backend with ecosystem.config.js
pm2 start ecosystem.config.js --env production

Write-Host "✅ Backend started successfully" -ForegroundColor Green
Write-Host "📊 View logs with: pm2 logs awake-backend" -ForegroundColor Yellow
Write-Host "📊 View all processes: pm2 status" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify the backend is running: pm2 status"
Write-Host "2. Check the logs: pm2 logs awake-backend"
Write-Host "3. Monitor the application"
