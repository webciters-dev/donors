# PostgreSQL Installation for Vimexx VPS (Ubuntu/Debian)
# SSH into your VPS and run these commands

#!/bin/bash
set -e

echo "🚀 Installing PostgreSQL on Vimexx VPS..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL and additional tools
sudo apt install postgresql postgresql-contrib postgresql-client -y

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check PostgreSQL version and status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

echo "✅ PostgreSQL installed successfully!"

# Create database and user for AWAKE Connect
echo "🗄️ Setting up AWAKE database..."

# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create user for awake application
CREATE USER awake_user WITH PASSWORD 'your_secure_password_here';

-- Create database
CREATE DATABASE awake_production OWNER awake_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE awake_production TO awake_user;

-- Show created databases
\l

-- Exit
\q
EOF

echo "✅ Database setup completed!"

# Configure PostgreSQL for remote connections (if needed)
echo "🔧 Configuring PostgreSQL..."

# Backup original config
sudo cp /etc/postgresql/*/main/postgresql.conf /etc/postgresql/*/main/postgresql.conf.backup
sudo cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup

# Allow connections (uncomment and modify listen_addresses)
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql

echo "🎉 PostgreSQL setup complete!"
echo "📊 Database details:"
echo "   Host: localhost"  
echo "   Port: 5432"
echo "   Database: awake_production"
echo "   User: awake_user"
echo "   Password: your_secure_password_here"