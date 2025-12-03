# ============================================================
# AWAKE Connect - Deployment Setup Helper (Windows)
# ============================================================
# Run this on Windows to prepare files for deployment

param(
    [string]$VpsUser = "your_username",
    [string]$VpsIp = "your_vps_ip",
    [string]$SourcePath = "C:\projects\donor",
    [string]$TargetPath = "/home/beta-app/beta"
)

# Colors
$Colors = @{
    Green = 10
    Red = 12
    Yellow = 14
    Blue = 9
    Gray = 8
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    
    $Color = $Colors.Blue
    $Prefix = "→"
    
    switch ($Type) {
        "Success" { $Color = $Colors.Green; $Prefix = "✓" }
        "Error" { $Color = $Colors.Red; $Prefix = "✗" }
        "Warning" { $Color = $Colors.Yellow; $Prefix = "!" }
    }
    
    Write-Host "$Prefix $Message" -ForegroundColor $Color
}

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║    AWAKE Connect - Beta Deployment Helper (Windows)       ║" -ForegroundColor Blue
Write-Host "║    Preparing for: beta.aircrew.nl                         ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue

# Step 1: Check prerequisites
Write-Host "`nStep 1: Checking Prerequisites" -ForegroundColor Blue

if (-not (Test-Path $SourcePath)) {
    Write-Status "Source path not found: $SourcePath" "Error"
    exit 1
}

Write-Status "Source path verified: $SourcePath"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Status "Git not found. Please install Git." "Error"
    exit 1
}

Write-Status "Git found: $(git --version)"

# Step 2: Prepare deployment package
Write-Host "`nStep 2: Preparing Deployment Package" -ForegroundColor Blue

$DeploymentDir = Join-Path $SourcePath "deployment-package"

if (Test-Path $DeploymentDir) {
    Remove-Item $DeploymentDir -Recurse -Force
}

New-Item -ItemType Directory -Path $DeploymentDir | Out-Null
Write-Status "Created deployment directory: $DeploymentDir"

# Step 3: Copy essential files (excluding node_modules)
Write-Host "`nStep 3: Copying Application Files" -ForegroundColor Blue

$ExcludeFolders = @('node_modules', 'dist', '.git', 'logs', 'backups', '.next')

Get-ChildItem $SourcePath -Recurse -Attributes !Directory | ForEach-Object {
    $RelativePath = $_.FullName.Substring($SourcePath.Length + 1)
    $ShouldCopy = $true
    
    foreach ($Exclude in $ExcludeFolders) {
        if ($RelativePath -like "$Exclude*") {
            $ShouldCopy = $false
            break
        }
    }
    
    if ($ShouldCopy) {
        $DestPath = Join-Path $DeploymentDir $RelativePath
        $DestDir = Split-Path $DestPath
        
        if (-not (Test-Path $DestDir)) {
            New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
        }
        
        Copy-Item $_.FullName -Destination $DestPath -Force
    }
}

Write-Status "Application files copied to deployment package"

# Step 4: Create deployment scripts
Write-Host "`nStep 4: Creating Deployment Scripts" -ForegroundColor Blue

# Create SCP commands file
$ScpScript = @"
# ============================================================
# Deploy Application to beta.aircrew.nl
# ============================================================

# 1. Copy application files to VPS
scp -r $DeploymentDir\* $($VpsUser)@$($VpsIp):/home/beta-app/beta/

# 2. SSH into VPS
# ssh $($VpsUser)@$($VpsIp)

# 3. Once on VPS, run:
# cd /home/beta-app/beta
# npm install
# cd server && npm install && cd ..
# npm run build
# npx prisma migrate deploy --skip-generate
# pm2 start ecosystem.config.js
"@

$ScpScript | Out-File -FilePath (Join-Path $DeploymentDir "01-upload-files.bat") -Encoding ASCII
Write-Status "Created upload script"

# Create environment template
$EnvTemplate = @"
# ==========================================
# Backend Environment - .env.production
# ==========================================

NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/awake_db"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here

# Frontend URLs
FRONTEND_URL=https://beta.aircrew.nl
FRONTEND_URLS=https://beta.aircrew.nl

# Email Configuration
EMAIL_HOST=mail.aircrew.nl
EMAIL_PORT=587
EMAIL_USER=noreply@aircrew.nl
EMAIL_PASS=RoG*741#NoR
EMAIL_FROM=AWAKE Connect (Beta) <noreply@aircrew.nl>

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/home/beta-app/beta/server/uploads

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
RECAPTCHA_SITE_KEY=6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX

# Logging
LOG_LEVEL=info
LOG_DIR=/home/beta-app/beta/logs
"@

$EnvTemplate | Out-File -FilePath (Join-Path $DeploymentDir "server\.env.production.template") -Encoding ASCII
Write-Status "Created environment template"

# Create Nginx config
$NginxConfig = @"
# Nginx configuration for beta.aircrew.nl
# Save as: /etc/nginx/sites-available/beta.aircrew.nl

server {
    listen 80;
    server_name beta.aircrew.nl;
    return 301 https:
//`$server_name`$request_uri;
}

server {
    listen 443 ssl http2;
    server_name beta.aircrew.nl;

    ssl_certificate /etc/letsencrypt/live/beta.aircrew.nl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beta.aircrew.nl/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 500M;
    root /home/beta-app/beta/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }

    location /uploads/ {
        alias /home/beta-app/beta/server/uploads/;
        expires 30d;
    }

    location / {
        try_files `$uri `$uri/ /index.html;
    }
}
"@

$NginxConfig | Out-File -FilePath (Join-Path $DeploymentDir "nginx-beta.conf") -Encoding ASCII
Write-Status "Created Nginx configuration"

# Step 5: Create deployment instructions
Write-Host "`nStep 5: Creating Deployment Instructions" -ForegroundColor Blue

$Instructions = @"
# ============================================================
# AWAKE Connect Beta Deployment Instructions
# ============================================================

## Quick Deployment Steps

### Phase 1: Prepare (On Windows Machine)
1. Run this script: deploy-beta-prepare.ps1
2. Review files in 'deployment-package' folder
3. Upload to VPS using provided SCP commands

### Phase 2: Upload
# Option A: Using SCP (Windows Command Prompt)
scp -r deployment-package\* $($VpsUser)@$($VpsIp):/home/beta-app/beta/

# Option B: Using WinSCP or similar SFTP client
1. Open WinSCP
2. Connect to $($VpsIp) with user: $($VpsUser)
3. Drag deployment-package folder to remote /home/beta-app/beta/

### Phase 3: Configure (On VPS via SSH)
ssh $($VpsUser)@$($VpsIp)

# Once connected:
cd /home/beta-app/beta

# Copy environment template to actual env file
cp server/.env.production.template server/.env.production

# Edit environment file with your actual values
nano server/.env.production

# Install dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build

### Phase 4: Migrate Database
npx prisma migrate deploy --skip-generate

### Phase 5: Start Application
pm2 start ecosystem.config.js

### Phase 6: Configure Nginx
# Copy Nginx config
sudo cp nginx-beta.conf /etc/nginx/sites-available/beta.aircrew.nl

# Create symlink
sudo ln -s /etc/nginx/sites-available/beta.aircrew.nl /etc/nginx/sites-enabled/

# Test Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

### Phase 7: Generate SSL Certificate
sudo certbot certonly --standalone -d beta.aircrew.nl

## Verification

# Test backend
curl http://localhost:3001/api/health

# Test frontend in browser
https://beta.aircrew.nl

# Monitor logs
pm2 logs

# Check status
pm2 status

## Quick Reference

Deployment Package Size: $(if (Test-Path $DeploymentDir) { "{0:N2} MB" -f ((Get-ChildItem $DeploymentDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB) } else { "0 MB" })
VPS Target: $($VpsUser)@$($VpsIp):$($TargetPath)
Domain: beta.aircrew.nl
Environment: Production

## Support

For detailed instructions, see: BETA_DEPLOYMENT_GUIDE.md
"@

$Instructions | Out-File -FilePath (Join-Path $DeploymentDir "DEPLOYMENT_STEPS.md") -Encoding ASCII
Write-Status "Created deployment instructions"

# Step 6: Create upload helper script
Write-Host "`nStep 6: Creating Helper Scripts" -ForegroundColor Blue

$UploadBatch = @"
@echo off
REM ============================================================
REM Upload to beta.aircrew.nl
REM ============================================================

setlocal enabledelayedexpansion

set VPS_USER=$($VpsUser)
set VPS_IP=$($VpsIp)
set SOURCE_DIR=%~dp0
set TARGET_DIR=/home/beta-app/beta/

echo Uploading deployment package to VPS...
echo VPS: !VPS_IP! (User: !VPS_USER!)
echo.

REM Check if SCP is available
where scp >nul 2>nul
if errorlevel 1 (
    echo ERROR: SCP not found. Please ensure Git Bash or OpenSSH is installed.
    pause
    exit /b 1
)

REM Perform upload
scp -r "!SOURCE_DIR!*" "!VPS_USER!@!VPS_IP!:!TARGET_DIR!"

if errorlevel 1 (
    echo ERROR: Upload failed!
    pause
    exit /b 1
)

echo.
echo Upload completed successfully!
echo.
echo Next steps:
echo 1. SSH to VPS: ssh !VPS_USER!@!VPS_IP!
echo 2. cd /home/beta-app/beta
echo 3. Run: npm install
echo 4. Review DEPLOYMENT_STEPS.md for full instructions
echo.
pause
"@

$UploadBatch | Out-File -FilePath (Join-Path $DeploymentDir "upload-to-vps.bat") -Encoding ASCII
Write-Status "Created upload helper script"

# Step 7: Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║          DEPLOYMENT PACKAGE READY                          ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue

$PackageSize = (Get-ChildItem $DeploymentDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "`nDeployment Package Summary:" -ForegroundColor Yellow
Write-Host "  Location: $DeploymentDir"
Write-Host "  Size: $([Math]::Round($PackageSize, 2)) MB"
Write-Host "  Files: $(Get-ChildItem $DeploymentDir -Recurse | Measure-Object).Count"

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Review files in: deployment-package"
Write-Host "  2. Edit environment template: server\.env.production.template"
Write-Host "  3. Run upload script: upload-to-vps.bat"
Write-Host "  4. Follow DEPLOYMENT_STEPS.md on VPS"

Write-Host "`nQuick Upload Command:" -ForegroundColor Cyan
Write-Host "  scp -r `"$DeploymentDir\*`" $($VpsUser)@$($VpsIp):/home/beta-app/beta/"

Write-Host "`nTarget Environment:" -ForegroundColor Cyan
Write-Host "  Domain: beta.aircrew.nl"
Write-Host "  VPS: $($VpsIp)"
Write-Host "  User: $($VpsUser)"
Write-Host "  Path: /home/beta-app/beta"

Write-Host "`n✓ Preparation complete!`n" -ForegroundColor Green
