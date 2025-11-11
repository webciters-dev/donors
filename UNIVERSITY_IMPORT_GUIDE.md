# University Data Import Guide

## 📚 Overview

This guide explains how to import your 3000+ Pakistani university records into the AWAKE Connect database. The system supports Excel (`.xlsx`, `.xls`) and CSV (`.csv`) files.

## 📋 File Format Requirements

Your Excel/CSV file should have these columns (case-insensitive):

| Column Name | Variations Supported | Required | Example |
|------------|---------------------|----------|---------|
| **University** | University, Uni, Institution, College | ✅ Yes | University of the Punjab |
| **Programme** | Programme, Program, Course | ✅ Yes | Computer Science |
| **Field** | Field, Department, Field/Department, Dept | ✅ Yes | Computer Science |
| **Degree Level** | Degree Level, DegreeLevel, Level, Degree | ✅ Yes | Bachelor's |

### Sample Data Structure:
```
University                              | Programme                    | Field             | Degree Level
University of the Punjab                | Computer Science             | Computer Science  | Bachelor
Lahore University of Management Sciences | Software Engineering        | Engineering       | Bachelor
National University of Sciences & Tech  | Mechanical Engineering       | Engineering       | Master
University of Karachi                   | Business Administration      | Business          | Bachelor
```

## 🚀 Import Process

### Step 1: Prepare Your Environment
```bash
cd C:\projects\donors\server
npm install
```

### Step 2: Validate Your File (Recommended)
```bash
# Check file format and preview data
npm run import:validate path/to/your/universities.xlsx

# Check current database status
npm run import:status
```

### Step 3: Create Backup (Safety First!)
```bash
# Create database backup before import
npm run import:backup
```

### Step 4: Test Import (Recommended)
```bash
# Test with sample data to ensure everything works
npm run import:test
```

### Step 5: Run Full Import
```bash
# Import your actual file
npm run import:universities path/to/your/universities.xlsx
```

## 📊 Import Features

### ✅ Smart Data Handling
- **Automatic deduplication** - Prevents duplicate entries
- **Case-insensitive matching** - Handles various column name formats
- **Data normalization** - Standardizes degree level names
- **Country assignment** - Automatically sets country to "Pakistan"

### ✅ Error Handling
- **Validation** - Checks for required fields
- **Error reporting** - Shows which rows failed and why
- **Partial imports** - Continues processing if some rows fail
- **Statistics** - Detailed import results

### ✅ Database Structure
Your data creates this hierarchy:
```
Universities
├── University of the Punjab
│   ├── Bachelor's Degree
│   │   ├── Computer Science (Field)
│   │   │   └── Computer Science (Programme)
│   │   └── Engineering (Field)
│   │       ├── Software Engineering (Programme)
│   │       └── Mechanical Engineering (Programme)
│   └── Master's Degree
│       └── Computer Science (Field)
│           └── Advanced Computer Science (Programme)
```

## 🔧 Commands Reference

### Validation Commands
```bash
# Validate file format and show preview
npm run import:validate ./universities.xlsx

# Show current database statistics
npm run import:status

# Test import with sample data
npm run import:test
```

### Import Commands
```bash
# Create database backup
npm run import:backup

# Import universities (main command)
npm run import:universities ./path/to/file.xlsx

# Alternative direct command
node import-universities.js ./universities.xlsx
```

### Database Commands
```bash
# Reset database (if needed)
npm run db:reset

# Generate Prisma client (after schema changes)
npm run db:generate
```

## 📈 Expected Results

After importing your 3000+ records, you'll see:

```
📊 IMPORT COMPLETE - Final Statistics
=====================================
📁 Total Rows Processed: 3000+
⏭️ Skipped Rows: 0 (or minimal)

🏛️ Universities:
   ✅ Created: ~12 (your Pakistani universities)
   🔄 Existing: 0 (or any previously imported)

🎓 Degree Levels:
   ✅ Created: ~10 (Bachelor's, Master's, PhD, etc.)

📚 Fields:
   ✅ Created: ~50+ (Computer Science, Engineering, Business, etc.)

📖 Programs:
   ✅ Created: 3000+ (your actual programs)

🎉 Import completed successfully!
```

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### ❌ "No data found in file"
- Check file format (.xlsx, .xls, or .csv)
- Ensure file is not corrupted
- Verify file path is correct

#### ❌ "Missing required fields"
- Check column names match expected format
- Ensure all required columns exist: University, Programme, Field, Degree Level

#### ❌ "File not found"
- Use full file path: `C:\path\to\universities.xlsx`
- Ensure file exists and is accessible

#### ❌ Database connection errors
- Check your `.env` file has correct DATABASE_URL
- Ensure PostgreSQL is running
- Run `npm run db:generate` to update Prisma

### File Format Tips

#### ✅ Excel Files
- Use `.xlsx` format (most compatible)
- Ensure data starts from row 1 (headers)
- No merged cells in data area
- Remove any extra formatting

#### ✅ CSV Files
- Use UTF-8 encoding
- Comma-separated values
- Quote text fields if they contain commas
- No extra spaces around values

## 🎯 Integration with AWAKE Connect

After import, your university data will be available in:

### Student Registration
- Students can select from official university dropdown
- Programs auto-populate based on university selection
- Fields filter based on degree level

### Admin Dashboard
- University management interface
- Program and field administration
- Student filtering by university/program

### Applications
- University validation during application
- Program-specific requirements
- Field-based categorization

## 📝 Example Import Session

```bash
# Navigate to server directory
cd C:\projects\donors\server

# Validate your file first
npm run import:validate ./my-universities.xlsx
# 👀 Import Preview
# ================
# 📊 Total rows in file: 3000
# 📋 Detected columns: University | Programme | Field | Degree Level

# Create backup
npm run import:backup
# 💾 Creating database backup...
# ✅ Backup created: ./backup-universities-2025-11-11.json

# Run the import
npm run import:universities ./my-universities.xlsx
# 🚀 Starting University Data Import
# ==================================
# 📁 Reading file: ./my-universities.xlsx
# ✅ Successfully read 3000 rows from ./my-universities.xlsx
# 📊 Processing 3000 records...
# ...
# 🎉 Import completed successfully!
```

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review error messages** - they usually indicate the exact problem
3. **Use validation commands** to test before full import
4. **Create backups** before major imports

Your 3000+ university records will be properly imported and organized in the AWAKE Connect database, ready for student registrations and applications! 🚀