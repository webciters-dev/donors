#!/bin/bash

# Quick Database Setup for New Developers
# This script helps new developers get the database running quickly

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE} Quick Database Setup for Donors Management System${NC}"
echo "========================================================="

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "../server" ]; then
    echo -e "${RED} Please run this script from the database directory${NC}"
    exit 1
fi

# Function to check PostgreSQL installation
check_postgresql() {
    echo -e "${YELLOW} Checking PostgreSQL installation...${NC}"
    
    if ! command -v psql &> /dev/null; then
        echo -e "${RED} PostgreSQL is not installed or not in PATH${NC}"
        echo "Please install PostgreSQL first:"
        echo "  • Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        echo "  • CentOS/RHEL: sudo yum install postgresql postgresql-server"
        echo "  • macOS: brew install postgresql"
        echo "  • Windows: Download from https://www.postgresql.org/download/"
        exit 1
    fi
    
    echo -e "${GREEN} PostgreSQL found${NC}"
}

# Function to check Node.js and npm
check_nodejs() {
    echo -e "${YELLOW} Checking Node.js installation...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED} Node.js is not installed${NC}"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED} npm is not installed${NC}"
        echo "Please install npm (usually comes with Node.js)"
        exit 1
    fi
    
    echo -e "${GREEN} Node.js and npm found${NC}"
}

# Function to setup database
setup_database() {
    echo -e "${YELLOW}️  Setting up database...${NC}"
    
    DB_NAME="donors_dev"
    DB_USER="${DB_USER:-postgres}"
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${YELLOW}️  Database '$DB_NAME' already exists${NC}"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            dropdb "$DB_NAME"
        else
            echo -e "${BLUE}ℹ️  Using existing database${NC}"
            return
        fi
    fi
    
    echo -e "${BLUE}️  Creating database '$DB_NAME'...${NC}"
    createdb "$DB_NAME"
    echo -e "${GREEN} Database created${NC}"
}

# Function to setup server dependencies
setup_server() {
    echo -e "${YELLOW} Setting up server dependencies...${NC}"
    
    if [ -d "../server" ]; then
        cd ../server
        
        if [ ! -f "package.json" ]; then
            echo -e "${RED} No package.json found in server directory${NC}"
            exit 1
        fi
        
        echo -e "${BLUE} Installing dependencies...${NC}"
        npm install
        
        echo -e "${BLUE} Running Prisma setup...${NC}"
        npx prisma generate
        npx prisma migrate deploy
        
        echo -e "${BLUE} Seeding database...${NC}"
        npm run seed
        
        cd ../database
        echo -e "${GREEN} Server setup complete${NC}"
    else
        echo -e "${RED} Server directory not found${NC}"
        exit 1
    fi
}

# Function to create environment file
create_env_file() {
    echo -e "${YELLOW} Setting up environment file...${NC}"
    
    ENV_FILE="../server/.env"
    
    if [ -f "$ENV_FILE" ]; then
        echo -e "${BLUE}ℹ️  .env file already exists${NC}"
        return
    fi
    
    cat > "$ENV_FILE" << EOF
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/donors_dev"

# JWT Configuration  
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:8080"
EOF
    
    echo -e "${GREEN} Environment file created at $ENV_FILE${NC}"
    echo -e "${YELLOW}️  Please update the DATABASE_URL with your actual PostgreSQL credentials${NC}"
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN} Database setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1.  Update server/.env with your PostgreSQL credentials"
    echo "  2.  Start the backend server:"
    echo "     cd server && npm run dev"
    echo "  3.  Start the frontend (in another terminal):"
    echo "     npm run dev"
    echo "  4.  Test the setup by visiting http://localhost:8080"
    echo ""
    echo "Database management commands:"
    echo "  • Export database: ./export_database.sh"
    echo "  • Import database: ./import_database.sh"  
    echo "  • Reset database: ./reset_database.sh"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check database connection: psql -d donors_dev"
    echo "  • View Prisma studio: cd server && npx prisma studio"
    echo "  • Check server logs: cd server && npm run dev"
    echo ""
}

# Main execution
check_postgresql
check_nodejs
setup_database
create_env_file
setup_server
show_next_steps