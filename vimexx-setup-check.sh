# PostgreSQL Installation Guide for Vimexx VPS
# Run these commands on your Vimexx VPS via SSH

# First, check your current system
echo "🔍 Checking current system..."
uname -a
cat /etc/os-release
df -h
free -h

# Check if PostgreSQL is already installed
which psql || echo "PostgreSQL not found - will install"
systemctl status postgresql || echo "PostgreSQL service not running"