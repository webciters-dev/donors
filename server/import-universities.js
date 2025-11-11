// University Data Import Script for AWAKE Connect
// Imports Excel/CSV data with University, Programme, Field, Degree Level
import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

class UniversityImporter {
  constructor() {
    this.stats = {
      universities: { created: 0, existing: 0, errors: 0 },
      degreeLevels: { created: 0, existing: 0, errors: 0 },
      fields: { created: 0, existing: 0, errors: 0 },
      programs: { created: 0, existing: 0, errors: 0 },
      totalRows: 0,
      skippedRows: 0
    };
  }

  // Read Excel or CSV file
  async readFile(filePath) {
    console.log(`📁 Reading file: ${filePath}`);
    
    const fileExtension = path.extname(filePath).toLowerCase();
    let data = [];

    try {
      if (fileExtension === '.csv') {
        // Read CSV
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        // Read Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        throw new Error('Unsupported file format. Please use .xlsx, .xls, or .csv');
      }

      console.log(`✅ Successfully read ${data.length} rows from ${filePath}`);
      this.stats.totalRows = data.length;
      return data;
    } catch (error) {
      console.error('❌ Error reading file:', error.message);
      throw error;
    }
  }

  // Normalize university names to handle variations like "LUMS" vs "Lahore University of Management Sciences (LUMS)"
  normalizeUniversityName(universityName) {
    const name = universityName.trim();
    
    // Common university name mappings for Pakistan
    const universityMappings = {
      'LUMS': 'Lahore University of Management Sciences (LUMS)',
      'Lahore University of Management Sciences': 'Lahore University of Management Sciences (LUMS)',
      'NUST': 'National University of Sciences and Technology (NUST)',
      'National University of Sciences and Technology': 'National University of Sciences and Technology (NUST)',
      'UET': 'University of Engineering and Technology (UET)',
      'University of Engineering and Technology': 'University of Engineering and Technology (UET)',
      'UCP': 'University of Central Punjab (UCP)',
      'University of Central Punjab': 'University of Central Punjab (UCP)',
      'FAST': 'Foundation for Advancement of Science and Technology (FAST)',
      'Foundation for Advancement of Science and Technology': 'Foundation for Advancement of Science and Technology (FAST)',
      'GCU': 'Government College University (GCU)',
      'Government College University': 'Government College University (GCU)',
      'COMSATS': 'COMSATS University',
      'IBA': 'Institute of Business Administration (IBA)',
      'Institute of Business Administration': 'Institute of Business Administration (IBA)',
      'SZABIST': 'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology (SZABIST)',
      'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology': 'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology (SZABIST)',
      'UMT': 'University of Management and Technology (UMT)',
      'University of Management and Technology': 'University of Management and Technology (UMT)',
      'BNU': 'Beaconhouse National University (BNU)',
      'Beaconhouse National University': 'Beaconhouse National University (BNU)',
      'ITU': 'Information Technology University (ITU)',
      'Information Technology University': 'Information Technology University (ITU)'
    };

    // Check for exact matches first
    if (universityMappings[name]) {
      return universityMappings[name];
    }

    // Check for partial matches (case-insensitive)
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(universityMappings)) {
      if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
        console.log(`📝 Normalized university name: "${name}" → "${value}"`);
        return value;
      }
    }

    return name; // Return original if no mapping found
  }

  // Normalize and validate row data
  normalizeRow(row, rowIndex) {
    // Handle different possible column names (case-insensitive)
    const normalizedRow = {};
    const keys = Object.keys(row);

    // Map common variations to standard field names
    const fieldMappings = {
      university: ['university', 'uni', 'institution', 'college'],
      programme: ['programme', 'program', 'course'],
      field: ['field', 'department', 'field/department', 'dept'],
      degreeLevel: ['degree level', 'degreelevel', 'level', 'degree']
    };

    // Find and normalize field names
    for (const [standardField, variations] of Object.entries(fieldMappings)) {
      const matchedKey = keys.find(key => 
        variations.some(variation => 
          key.toLowerCase().trim() === variation.toLowerCase()
        )
      );
      
      if (matchedKey && row[matchedKey]) {
        normalizedRow[standardField] = String(row[matchedKey]).trim();
      }
    }

    // Validate required fields
    const required = ['university', 'programme', 'field', 'degreeLevel'];
    const missing = required.filter(field => !normalizedRow[field]);

    if (missing.length > 0) {
      console.warn(`⚠️ Row ${rowIndex + 2}: Missing required fields: ${missing.join(', ')}`);
      return null;
    }

    // Normalize university name to handle variations
    normalizedRow.university = this.normalizeUniversityName(normalizedRow.university);
    
    // Normalize degree level
    normalizedRow.degreeLevel = this.normalizeDegreeLevel(normalizedRow.degreeLevel);
    
    // Set country (defaulting to Pakistan for your dataset)
    normalizedRow.country = 'Pakistan';

    return normalizedRow;
  }

  // Normalize degree level names
  normalizeDegreeLevel(degreeLevel) {
    const mappings = {
      'bachelor': "Bachelor's Degree",
      'bachelors': "Bachelor's Degree",
      'bs': "Bachelor's Degree",
      'bsc': "Bachelor's Degree",
      'ba': "Bachelor's Degree",
      'master': "Master's Degree",
      'masters': "Master's Degree",
      'ms': "Master's Degree",
      'msc': "Master's Degree",
      'ma': "Master's Degree",
      'phd': 'PhD',
      'doctorate': 'PhD',
      'associate': 'Associate Degree',
      'diploma': 'Diploma'
    };

    const normalized = degreeLevel.toLowerCase().trim();
    return mappings[normalized] || degreeLevel; // Return original if no mapping found
  }

  // Create or find university
  async createOrFindUniversity(universityData) {
    try {
      // Check if university already exists
      let university = await prisma.university.findFirst({
        where: {
          name: universityData.name,
          country: universityData.country
        }
      });

      if (university) {
        this.stats.universities.existing++;
        return university;
      }

      // Create new university
      university = await prisma.university.create({
        data: {
          name: universityData.name,
          country: universityData.country,
          isOfficial: true, // Mark as official since it's bulk imported
          isCustom: false
        }
      });

      this.stats.universities.created++;
      console.log(`✅ Created university: ${university.name}`);
      return university;
    } catch (error) {
      this.stats.universities.errors++;
      console.error(`❌ Error creating university ${universityData.name}:`, error.message);
      throw error;
    }
  }

  // Create or find degree level
  async createOrFindDegreeLevel(universityId, degreeLevel) {
    try {
      // Check if degree level already exists for this university
      let degreeLevelRecord = await prisma.universityDegreeLevel.findFirst({
        where: {
          universityId: universityId,
          degreeLevel: degreeLevel
        }
      });

      if (degreeLevelRecord) {
        this.stats.degreeLevels.existing++;
        return degreeLevelRecord;
      }

      // Create new degree level
      degreeLevelRecord = await prisma.universityDegreeLevel.create({
        data: {
          universityId: universityId,
          degreeLevel: degreeLevel
        }
      });

      this.stats.degreeLevels.created++;
      return degreeLevelRecord;
    } catch (error) {
      this.stats.degreeLevels.errors++;
      console.error(`❌ Error creating degree level ${degreeLevel}:`, error.message);
      throw error;
    }
  }

  // Create or find field
  async createOrFindField(universityId, degreeLevelId, degreeLevel, fieldName) {
    try {
      // Check if field already exists
      let field = await prisma.universityField.findFirst({
        where: {
          universityId: universityId,
          degreeLevel: degreeLevel,
          fieldName: fieldName
        }
      });

      if (field) {
        this.stats.fields.existing++;
        return field;
      }

      // Create new field
      field = await prisma.universityField.create({
        data: {
          universityId: universityId,
          universityDegreeLevelId: degreeLevelId,
          degreeLevel: degreeLevel,
          fieldName: fieldName
        }
      });

      this.stats.fields.created++;
      return field;
    } catch (error) {
      this.stats.fields.errors++;
      console.error(`❌ Error creating field ${fieldName}:`, error.message);
      throw error;
    }
  }

  // Create or find program
  async createOrFindProgram(universityId, degreeLevelId, fieldId, degreeLevel, fieldName, programName) {
    try {
      // Check if program already exists
      let program = await prisma.universityProgram.findFirst({
        where: {
          universityId: universityId,
          degreeLevel: degreeLevel,
          fieldName: fieldName,
          programName: programName
        }
      });

      if (program) {
        this.stats.programs.existing++;
        return program;
      }

      // Create new program
      program = await prisma.universityProgram.create({
        data: {
          universityId: universityId,
          universityDegreeLevelId: degreeLevelId,
          universityFieldId: fieldId,
          degreeLevel: degreeLevel,
          fieldName: fieldName,
          programName: programName
        }
      });

      this.stats.programs.created++;
      return program;
    } catch (error) {
      this.stats.programs.errors++;
      console.error(`❌ Error creating program ${programName}:`, error.message);
      throw error;
    }
  }

  // Import single row
  async importRow(rowData, rowIndex) {
    try {
      const data = this.normalizeRow(rowData, rowIndex);
      
      if (!data) {
        this.stats.skippedRows++;
        return;
      }

      // Create/find university
      const university = await this.createOrFindUniversity({
        name: data.university,
        country: data.country
      });

      // Create/find degree level
      const degreeLevel = await this.createOrFindDegreeLevel(
        university.id, 
        data.degreeLevel
      );

      // Create/find field
      const field = await this.createOrFindField(
        university.id,
        degreeLevel.id,
        data.degreeLevel,
        data.field
      );

      // Create/find program
      const program = await this.createOrFindProgram(
        university.id,
        degreeLevel.id,
        field.id,
        data.degreeLevel,
        data.field,
        data.programme
      );

      if ((rowIndex + 1) % 100 === 0) {
        console.log(`📊 Processed ${rowIndex + 1} rows...`);
      }

    } catch (error) {
      console.error(`❌ Error processing row ${rowIndex + 2}:`, error.message);
      this.stats.skippedRows++;
    }
  }

  // Main import function
  async importFromFile(filePath) {
    console.log('🚀 Starting University Data Import');
    console.log('==================================');
    
    try {
      // Read file
      const data = await this.readFile(filePath);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in file');
      }

      console.log(`📊 Processing ${data.length} records...`);
      console.log('');

      // Process each row
      for (let i = 0; i < data.length; i++) {
        await this.importRow(data[i], i);
      }

      // Print final statistics
      this.printStats();

    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
  }

  // Print import statistics
  printStats() {
    console.log('');
    console.log('📊 IMPORT COMPLETE - Final Statistics');
    console.log('=====================================');
    console.log(`📁 Total Rows Processed: ${this.stats.totalRows}`);
    console.log(`⏭️ Skipped Rows: ${this.stats.skippedRows}`);
    console.log('');
    console.log('🏛️ Universities:');
    console.log(`   ✅ Created: ${this.stats.universities.created}`);
    console.log(`   🔄 Existing: ${this.stats.universities.existing}`);
    console.log(`   ❌ Errors: ${this.stats.universities.errors}`);
    console.log('');
    console.log('🎓 Degree Levels:');
    console.log(`   ✅ Created: ${this.stats.degreeLevels.created}`);
    console.log(`   🔄 Existing: ${this.stats.degreeLevels.existing}`);
    console.log(`   ❌ Errors: ${this.stats.degreeLevels.errors}`);
    console.log('');
    console.log('📚 Fields:');
    console.log(`   ✅ Created: ${this.stats.fields.created}`);
    console.log(`   🔄 Existing: ${this.stats.fields.existing}`);
    console.log(`   ❌ Errors: ${this.stats.fields.errors}`);
    console.log('');
    console.log('📖 Programs:');
    console.log(`   ✅ Created: ${this.stats.programs.created}`);
    console.log(`   🔄 Existing: ${this.stats.programs.existing}`);
    console.log(`   ❌ Errors: ${this.stats.programs.errors}`);
    console.log('');
    console.log('🎉 Import completed successfully!');
  }
}

// Main execution function
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('❌ Please provide the file path as an argument');
    console.log('Usage: node import-universities.js <file-path>');
    console.log('Example: node import-universities.js ./data/universities.xlsx');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const importer = new UniversityImporter();
  
  try {
    await importer.importFromFile(filePath);
    console.log('');
    console.log('🎯 UNIVERSITY NAME NORMALIZATION SUMMARY');
    console.log('========================================');
    console.log('✅ University names are automatically normalized:');
    console.log('   • "LUMS" → "Lahore University of Management Sciences (LUMS)"');
    console.log('   • "NUST" → "National University of Sciences and Technology (NUST)"');
    console.log('   • "UET" → "University of Engineering and Technology (UET)"');
    console.log('   • And many more Pakistani university abbreviations');
    console.log('');
    console.log('📊 This prevents duplicate entries for the same university!');
  } catch (error) {
    console.error('💥 Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { UniversityImporter };