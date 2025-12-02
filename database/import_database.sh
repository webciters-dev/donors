#!/bin/bash

# Database Import Script for Donors Management System
# This script imports PostgreSQL database from exported files

set -e

# Configuration
DB_NAME="donors_dev"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
IMPORT_DIR="database"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE} Database Import Utility${NC}"
echo "=================================="

# Function to check if files exist
check_files() {
    if [ ! -d "$IMPORT_DIR" ]; then
        echo -e "${RED} Import directory '$IMPORT_DIR' does not exist!${NC}"
        exit 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    echo -e "${YELLOW} Checking if database exists...${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${YELLOW}️  Database '$DB_NAME' already exists.${NC}"
        read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}️  Dropping existing database...${NC}"
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
        else
            echo -e "${BLUE}ℹ️  Using existing database.${NC}"
            return
        fi
    fi
    
    echo -e "${BLUE}️  Creating database '$DB_NAME'...${NC}"
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo -e "${GREEN} Database created successfully!${NC}"
}

# Function to import schema
import_schema() {
    if [ -f "$IMPORT_DIR/schema.sql" ]; then
        echo -e "${BLUE} Importing database schema...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$IMPORT_DIR/schema.sql" -q
        echo -e "${GREEN} Schema imported successfully!${NC}"
    else
        echo -e "${RED} Schema file not found: $IMPORT_DIR/schema.sql${NC}"
        return 1
    fi
}

# Function to import data
import_data() {
    if [ -f "$IMPORT_DIR/seed_data.sql" ]; then
        echo -e "${BLUE} Importing database data...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$IMPORT_DIR/seed_data.sql" -q
        echo -e "${GREEN} Data imported successfully!${NC}"
    else
        echo -e "${YELLOW}️  Data file not found: $IMPORT_DIR/seed_data.sql${NC}"
        echo "Skipping data import."
    fi
}

# Function to import full database
import_full() {
    if [ -f "$IMPORT_DIR/full_dump.sql" ]; then
        echo -e "${BLUE} Importing full database...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$IMPORT_DIR/full_dump.sql" -q
        echo -e "${GREEN} Full database imported successfully!${NC}"
    else
        echo -e "${RED} Full dump file not found: $IMPORT_DIR/full_dump.sql${NC}"
        return 1
    fi
}

# Function to import sample data
import_sample() {
    if [ -f "$IMPORT_DIR/sample_data.sql" ]; then
        echo -e "${BLUE} Importing sample data...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$IMPORT_DIR/sample_data.sql" -q
        echo -e "${GREEN} Sample data imported successfully!${NC}"
    else
        echo -e "${RED} Sample data file not found: $IMPORT_DIR/sample_data.sql${NC}"
        return 1
    fi
}

# Function to verify import
verify_import() {
    echo -e "${BLUE} Verifying import...${NC}"
    
    # Check if tables exist
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo -e "${GREEN} Found $TABLE_COUNT tables in the database${NC}"
        
        # Show table counts
        echo -e "${BLUE} Table record counts:${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            SELECT 
                tablename as \"Table\",
                n_tup_ins - n_tup_del as \"Records\"
            FROM pg_stat_user_tables 
            ORDER BY tablename;
        "
    else
        echo -e "${RED} No tables found in the database!${NC}"
        return 1
    fi
}

# Function to run Prisma migrations (if available)
run_prisma_migrations() {
    if [ -f "../server/package.json" ] && [ -d "../server/prisma" ]; then
        echo -e "${BLUE} Running Prisma migrations...${NC}"
        cd ../server
        if npm list prisma &> /dev/null; then
            npx prisma migrate deploy
            npx prisma generate
            echo -e "${GREEN} Prisma migrations completed!${NC}"
        else
            echo -e "${YELLOW}️  Prisma not found, skipping migrations${NC}"
        fi
        cd ../database
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Import Options:"
    echo "1) Import full database (structure + data)"
    echo "2) Import schema only, then data"
    echo "3) Import sample data only"
    echo "4) Create empty database and run Prisma migrations"
    echo "5) Exit"
    echo ""
}

# Main execution
check_files

while true; do
    show_menu
    read -p "Choose an option (1-5): " choice
    
    case $choice in
        1)
            create_database
            import_full
            verify_import
            break
            ;;
        2)
            create_database
            import_schema
            import_data
            verify_import
            break
            ;;
        3)
            create_database
            import_sample
            verify_import
            break
            ;;
        4)
            create_database
            run_prisma_migrations
            echo -e "${GREEN} Empty database ready for development!${NC}"
            break
            ;;
        5)
            echo -e "${BLUE} Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED} Invalid option. Please choose 1-5.${NC}"
            ;;
    esac
done

echo ""
echo -e "${GREEN} Database import completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "   Update your .env file with the database URL"
echo "   Start your application server"
echo "   Test the database connection"
echo ""