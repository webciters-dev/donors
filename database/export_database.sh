#!/bin/bash

# Database Export Script for Donors Management System
# This script exports the PostgreSQL database in different formats

set -e

# Configuration
DB_NAME="donors_dev"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
EXPORT_DIR="database"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Database Export Utility${NC}"
echo "=================================="

# Check if database directory exists
if [ ! -d "$EXPORT_DIR" ]; then
    echo -e "${YELLOW}📁 Creating database directory...${NC}"
    mkdir -p "$EXPORT_DIR"
fi

# Function to check if database exists
check_database() {
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${RED}❌ Database '$DB_NAME' does not exist!${NC}"
        echo "Please create the database first or check your configuration."
        exit 1
    fi
}

# Function to export schema only
export_schema() {
    echo -e "${BLUE}📋 Exporting database schema...${NC}"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$EXPORT_DIR/schema.sql"
    echo -e "${GREEN}✅ Schema exported to $EXPORT_DIR/schema.sql${NC}"
}

# Function to export data only
export_data() {
    echo -e "${BLUE}📊 Exporting database data...${NC}"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --data-only \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        --column-inserts \
        > "$EXPORT_DIR/seed_data.sql"
    echo -e "${GREEN}✅ Data exported to $EXPORT_DIR/seed_data.sql${NC}"
}

# Function to export full database
export_full() {
    echo -e "${BLUE}💾 Exporting full database...${NC}"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --column-inserts \
        > "$EXPORT_DIR/full_dump.sql"
    echo -e "${GREEN}✅ Full database exported to $EXPORT_DIR/full_dump.sql${NC}"
}

# Function to export sample data (limited records for demo)
export_sample() {
    echo -e "${BLUE}🎯 Exporting sample data...${NC}"
    
    # Create a temporary file with sample data queries
    cat > "$EXPORT_DIR/sample_data.sql" << 'EOF'
-- Sample Data for Donors Management System
-- This file contains a limited set of data for development and testing

-- Clear existing data (in FK-safe order)
TRUNCATE TABLE conversation_messages, conversations, messages, sponsorships, applications, disbursements, field_reviews, student_progress, progress_report_attachments, progress_reports, documents, password_resets, users, donors, students, fx_rates CASCADE;

-- Reset sequences
SELECT setval('students_id_seq', 1, false);
SELECT setval('donors_id_seq', 1, false);
SELECT setval('applications_id_seq', 1, false);
SELECT setval('users_id_seq', 1, false);

EOF

    # Export limited sample data for each table
    echo "-- Sample Students" >> "$EXPORT_DIR/sample_data.sql"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "COPY (SELECT * FROM students LIMIT 5) TO STDOUT WITH CSV HEADER;" | \
        sed 's/^/INSERT INTO students VALUES (/' | sed 's/$/);/' >> "$EXPORT_DIR/sample_data.sql"
    
    echo -e "${GREEN}✅ Sample data exported to $EXPORT_DIR/sample_data.sql${NC}"
}

# Function to create database info file
create_info_file() {
    echo -e "${BLUE}📋 Creating database info file...${NC}"
    
    cat > "$EXPORT_DIR/database_info.txt" << EOF
Database Export Information
===========================

Database Name: $DB_NAME
Export Date: $(date)
PostgreSQL Version: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" | head -n1)

Tables and Record Counts:
-------------------------
EOF

    # Get table counts
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins - n_tup_del as row_count
        FROM pg_stat_user_tables 
        ORDER BY tablename;
    " >> "$EXPORT_DIR/database_info.txt"

    echo -e "${GREEN}✅ Database info saved to $EXPORT_DIR/database_info.txt${NC}"
}

# Main execution
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
check_database

echo -e "${YELLOW}📤 Starting export process...${NC}"

# Export all formats
export_schema
export_data
export_full
export_sample
create_info_file

# Generate checksums
echo -e "${BLUE}🔐 Generating checksums...${NC}"
if command -v sha256sum &> /dev/null; then
    sha256sum "$EXPORT_DIR"/*.sql > "$EXPORT_DIR/checksums.sha256"
    echo -e "${GREEN}✅ Checksums saved to $EXPORT_DIR/checksums.sha256${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Database export completed successfully!${NC}"
echo ""
echo "Generated files:"
echo "  📋 schema.sql      - Database structure only"
echo "  📊 seed_data.sql   - Data only (for existing schema)"
echo "  💾 full_dump.sql   - Complete database (structure + data)"
echo "  🎯 sample_data.sql - Limited sample data for testing"
echo "  📋 database_info.txt - Export metadata"
echo ""
echo "To import on another system:"
echo "  🔧 Schema only:    psql -U username -d dbname < database/schema.sql"
echo "  📊 Data only:      psql -U username -d dbname < database/seed_data.sql"
echo "  💾 Full database:  psql -U username -d dbname < database/full_dump.sql"
echo ""