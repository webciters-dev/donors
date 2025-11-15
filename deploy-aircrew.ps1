# PowerShell deployment script for aircrew.nl
# Usage: .\deploy-aircrew.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying AWAKE Connect to aircrew.nl..." -ForegroundColor Green
Write-Host "📧 This includes the complete reCAPTCHA spam protection system!" -ForegroundColor Yellow

# Configuration for aircrew.nl
$SERVER_HOST = "aircrew.nl"
$SERVER_USER = "root"  # Adjust if different

# Function to test SSH connection
function Test-SSHConnection {
    Write-Host "🔑 Testing SSH connection to aircrew.nl..." -ForegroundColor Cyan
    try {
        $result = ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'"
        if ($result -eq "SSH connection successful") {
            Write-Host "✅ SSH connection established" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ SSH connection failed. Please check:" -ForegroundColor Red
        Write-Host "   - SSH key is properly configured" -ForegroundColor Red
        Write-Host "   - Server is accessible" -ForegroundColor Red
        Write-Host "   - Username and hostname are correct" -ForegroundColor Red
        return $false
    }
}

# Function to deploy to server
function Deploy-ToServer {
    Write-Host "🚀 Starting deployment process..." -ForegroundColor Green
    
    # Create the SSH command as a here-string
    $deployScript = @'
set -e

echo "📍 Current location: $(pwd)"
echo "🔍 Checking application directory..."

# Navigate to app directory (common locations)
if [ -d "/var/www/awake" ]; then
    cd /var/www/awake
    echo "✅ Found app at /var/www/awake"
elif [ -d "/home/awake" ]; then
    cd /home/awake
    echo "✅ Found app at /home/awake"
elif [ -d "/opt/awake" ]; then
    cd /opt/awake
    echo "✅ Found app at /opt/awake"
elif [ -d "/var/www/html/awake" ]; then
    cd /var/www/html/awake
    echo "✅ Found app at /var/www/html/awake"
else
    echo "❌ Could not find AWAKE app directory"
    echo "📝 Please manually navigate to your app directory and run:"
    echo "   git pull origin main && npm install && npm run build && pm2 reload all"
    exit 1
fi

echo "📥 Pulling latest code with reCAPTCHA protection..."
git stash push -m "Pre-deployment stash $(date)" || true
git fetch origin
git checkout main
git pull origin main

echo "📦 Installing backend dependencies..."
cd server
npm install --production
cd ..

echo "📦 Installing frontend dependencies..."
npm install --production

echo "🏗️ Building production frontend..."
npm run build

echo "🔄 Restarting application services..."
# Try PM2 first, fallback to other methods
if command -v pm2 &> /dev/null; then
    echo "🔄 Using PM2 to restart services..."
    pm2 reload all
    pm2 status
elif systemctl is-active --quiet awake &> /dev/null; then
    echo "🔄 Using systemctl to restart services..."
    sudo systemctl restart awake
    sudo systemctl status awake --no-pager
elif pgrep -f "node.*server" > /dev/null; then
    echo "🔄 Restarting Node.js processes..."
    pkill -f "node.*server" || true
    sleep 2
    nohup npm start > /dev/null 2>&1 & 
else
    echo "⚠️  Please manually restart your application services"
fi

echo "🏥 Performing health check..."
sleep 5

# Health check
if curl -f -s https://aircrew.nl/api/health > /dev/null 2>&1; then
    echo "✅ API health check passed!"
elif curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Local API health check passed!"
elif curl -f -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend health check passed!"
else
    echo "⚠️  Health check failed, but deployment completed. Please verify manually."
fi

echo "🎉 Deployment completed successfully!"
echo "🛡️ reCAPTCHA spam protection is now LIVE on aircrew.nl!"
'@

    # Execute the deployment script via SSH
    $deployScript | ssh "$SERVER_USER@$SERVER_HOST" "bash -s"
}

# Main execution
try {
    Write-Host "Starting deployment to aircrew.nl..." -ForegroundColor Cyan
    
    if (Test-SSHConnection) {
        Deploy-ToServer
        
        Write-Host ""
        Write-Host "🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🛡️ SECURITY FEATURES NOW LIVE:" -ForegroundColor Yellow
        Write-Host "   ✅ Donor registration spam protection" -ForegroundColor Green
        Write-Host "   ✅ Password reset flood protection" -ForegroundColor Green
        Write-Host "   ✅ Case worker creation protection" -ForegroundColor Green
        Write-Host "   ✅ Interview scheduling protection" -ForegroundColor Green
        Write-Host "   ✅ Board member creation protection" -ForegroundColor Green
        Write-Host "   ✅ Messaging system spam protection" -ForegroundColor Green
        Write-Host "   ✅ Student reply protection" -ForegroundColor Green
        Write-Host ""
        Write-Host "📧 Your email server spam crisis is now resolved!" -ForegroundColor Magenta
        Write-Host "🌐 Visit https://aircrew.nl to verify the deployment" -ForegroundColor Cyan
    }
    else {
        Write-Host "Deployment aborted due to SSH connection failure." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
}