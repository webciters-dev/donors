// University Import Validation and Testing Script
import { PrismaClient } from '@prisma/client';
import { UniversityImporter } from './import-universities.js';
import fs from 'fs';

const prisma = new PrismaClient();

class ImportValidator {
  
  // Create sample test data
  async createTestFile() {
    console.log('📝 Creating test Excel file...');
    
    const testData = [
      { University: 'University of the Punjab', Programme: 'Computer Science', Field: 'Computer Science', 'Degree Level': 'Bachelor' },
      { University: 'Lahore University of Management Sciences', Programme: 'Software Engineering', Field: 'Engineering', 'Degree Level': 'Bachelor' },
      { University: 'National University of Sciences and Technology', Programme: 'Mechanical Engineering', Field: 'Engineering', 'Degree Level': 'Bachelor' },
      { University: 'University of the Punjab', Programme: 'Masters in Computer Science', Field: 'Computer Science', 'Degree Level': 'Master' },
      { University: 'Karachi University', Programme: 'Business Administration', Field: 'Business', 'Degree Level': 'Bachelor' }
    ];

    // Convert to CSV for testing
    const csvContent = [
      'University,Programme,Field,Degree Level',
      ...testData.map(row => `"${row.University}","${row.Programme}","${row.Field}","${row['Degree Level']}"`)
    ].join('\n');

    fs.writeFileSync('./test-universities.csv', csvContent);
    console.log('✅ Test file created: ./test-universities.csv');
    return './test-universities.csv';
  }

  // Validate existing data before import
  async validateDatabase() {
    console.log('🔍 Validating database state...');
    
    const counts = {
      universities: await prisma.university.count(),
      degreeLevels: await prisma.universityDegreeLevel.count(),
      fields: await prisma.universityField.count(),
      programs: await prisma.universityProgram.count()
    };

    console.log('📊 Current database counts:');
    console.log(`   Universities: ${counts.universities}`);
    console.log(`   Degree Levels: ${counts.degreeLevels}`);
    console.log(`   Fields: ${counts.fields}`);
    console.log(`   Programs: ${counts.programs}`);
    
    return counts;
  }

  // Test import with sample data
  async testImport() {
    console.log('🧪 Running import test...');
    
    // Create test file
    const testFile = await this.createTestFile();
    
    // Get initial counts
    const beforeCounts = await this.validateDatabase();
    
    // Run import
    const importer = new UniversityImporter();
    await importer.importFromFile(testFile);
    
    // Get final counts
    const afterCounts = await this.validateDatabase();
    
    // Show changes
    console.log('\n📈 Changes from test import:');
    console.log(`   Universities: ${beforeCounts.universities} → ${afterCounts.universities} (+${afterCounts.universities - beforeCounts.universities})`);
    console.log(`   Degree Levels: ${beforeCounts.degreeLevels} → ${afterCounts.degreeLevels} (+${afterCounts.degreeLevels - beforeCounts.degreeLevels})`);
    console.log(`   Fields: ${beforeCounts.fields} → ${afterCounts.fields} (+${afterCounts.fields - beforeCounts.fields})`);
    console.log(`   Programs: ${beforeCounts.programs} → ${afterCounts.programs} (+${afterCounts.programs - beforeCounts.programs})`);
    
    // Clean up test file
    fs.unlinkSync(testFile);
    console.log('🗑️ Test file cleaned up');
    
    return {
      before: beforeCounts,
      after: afterCounts,
      success: true
    };
  }

  // Create database backup before import
  async createBackup() {
    console.log('💾 Creating database backup...');
    
    try {
      // Export current data
      const backup = {
        timestamp: new Date().toISOString(),
        universities: await prisma.university.findMany({
          include: {
            degreeLevels: true,
            fields: true,
            programs: true
          }
        })
      };

      const backupFile = `./backup-universities-${new Date().toISOString().slice(0, 10)}.json`;
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      
      console.log(`✅ Backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  // Validate file format before import
  validateFile(filePath) {
    console.log(`🔍 Validating file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Unsupported file format: ${fileExtension}. Allowed: ${allowedExtensions.join(', ')}`);
    }

    console.log(`✅ File format valid: ${fileExtension}`);
    return true;
  }

  // Show import preview
  async previewImport(filePath, maxRows = 5) {
    console.log('👀 Import Preview');
    console.log('================');
    
    const importer = new UniversityImporter();
    const data = await importer.readFile(filePath);
    
    console.log(`📊 Total rows in file: ${data.length}`);
    console.log(`🔍 Showing first ${Math.min(maxRows, data.length)} rows:\n`);
    
    // Show column headers
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      console.log('📋 Detected columns:', headers.join(' | '));
      console.log('');
      
      // Show sample data
      data.slice(0, maxRows).forEach((row, index) => {
        console.log(`Row ${index + 1}:`);
        headers.forEach(header => {
          console.log(`   ${header}: ${row[header]}`);
        });
        console.log('');
      });
    }

    return data;
  }
}

// Main validation function
async function main() {
  const command = process.argv[2];
  const filePath = process.argv[3];

  const validator = new ImportValidator();

  try {
    switch (command) {
      case 'test':
        console.log('🧪 Running Import Test');
        console.log('======================');
        await validator.testImport();
        break;

      case 'validate':
        if (!filePath) {
          console.error('❌ Please provide file path for validation');
          process.exit(1);
        }
        console.log('🔍 Validating File');
        console.log('==================');
        validator.validateFile(filePath);
        await validator.previewImport(filePath);
        break;

      case 'backup':
        console.log('💾 Creating Backup');
        console.log('==================');
        await validator.createBackup();
        break;

      case 'status':
        console.log('📊 Database Status');
        console.log('==================');
        await validator.validateDatabase();
        break;

      default:
        console.log('📚 University Import Validator');
        console.log('==============================');
        console.log('Usage:');
        console.log('  node validate-import.js test              # Run test import');
        console.log('  node validate-import.js validate <file>   # Validate file format');
        console.log('  node validate-import.js backup            # Create database backup');
        console.log('  node validate-import.js status            # Show database status');
        console.log('');
        console.log('Examples:');
        console.log('  node validate-import.js validate ./universities.xlsx');
        console.log('  node validate-import.js test');
        break;
    }
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ImportValidator };