// test-final-validation.js
// Test the final validation logic for profile completion

console.log('🧪 Testing Final Profile Validation Logic...\n');

// Simulate the profile completeness calculation
const REQUIRED_PROFILE_KEYS = [
  "cnic", "dateOfBirth", "guardianName", "guardianCnic", "phone", "address", 
  "city", "province", "university", "program", "gpa", "gradYear",
  "currentInstitution", "currentCity", "currentCompletionYear" // Current Education fields
];

const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL"];

function computeProfileCompleteness(student, uploadedDocs = new Set()) {
  if (!student) return { percent: 0, missing: REQUIRED_PROFILE_KEYS, missingDocs: REQUIRED_DOCS };
  
  // Check profile fields
  const missingFields = REQUIRED_PROFILE_KEYS.filter((k) => {
    const v = student?.[k];
    return v === null || v === undefined || v === "" || Number.isNaN(v);
  });
  
  // Check documents
  const missingDocs = REQUIRED_DOCS.filter(doc => !uploadedDocs.has(doc));
  
  // Calculate total completeness (fields + documents)
  const totalRequiredItems = REQUIRED_PROFILE_KEYS.length + REQUIRED_DOCS.length;
  const completedItems = (REQUIRED_PROFILE_KEYS.length - missingFields.length) + (REQUIRED_DOCS.length - missingDocs.length);
  const percent = Math.round((completedItems / totalRequiredItems) * 100);
  
  return { 
    percent, 
    missing: missingFields, 
    missingDocs,
    fieldCompletion: Math.round(((REQUIRED_PROFILE_KEYS.length - missingFields.length) / REQUIRED_PROFILE_KEYS.length) * 100),
    docCompletion: Math.round(((REQUIRED_DOCS.length - missingDocs.length) / REQUIRED_DOCS.length) * 100)
  };
}

// Test case 1: Profile with missing Current Education fields and no documents
console.log('📋 Test Case 1: Missing Current Education + No Documents');
const testStudent = {
  cnic: "1234567890123", dateOfBirth: "1990-01-01", guardianName: "Guardian", 
  guardianCnic: "9876543210987", phone: "03001234567", address: "Address",
  city: "City", province: "Province", university: "University", 
  program: "Program", gpa: "3.5", gradYear: "2025",
  // Missing Current Education fields
  currentInstitution: "", currentCity: "", currentCompletionYear: ""
};

const noDocsResult = computeProfileCompleteness(testStudent, new Set());
console.log(`   Overall Completion: ${noDocsResult.percent}% (should be low)`);
console.log(`   Field Completion: ${noDocsResult.fieldCompletion}% (should be 80%)`);  
console.log(`   Doc Completion: ${noDocsResult.docCompletion}% (should be 0%)`);
console.log(`   Can Submit: ${noDocsResult.fieldCompletion < 100 ? 'NO - missing fields' : 'YES - fields complete'}`);

// Test case 2: Complete profile fields but no documents  
console.log('\n📋 Test Case 2: Complete Fields + No Documents');
const completeFieldsStudent = {
  ...testStudent,
  currentInstitution: "Current Uni", currentCity: "Current City", currentCompletionYear: "2024"
};

const completeFieldsResult = computeProfileCompleteness(completeFieldsStudent, new Set());
console.log(`   Overall Completion: ${completeFieldsResult.percent}% (should be ~65%)`);
console.log(`   Field Completion: ${completeFieldsResult.fieldCompletion}% (should be 100%)`);
console.log(`   Doc Completion: ${completeFieldsResult.docCompletion}% (should be 0%)`);
console.log(`   Can Submit: ${completeFieldsResult.fieldCompletion < 100 ? 'NO - missing fields' : 'YES - fields complete'}`);

// Test case 3: Complete profile + all documents
console.log('\n📋 Test Case 3: Complete Fields + All Documents');
const allDocs = new Set(REQUIRED_DOCS);
const fullResult = computeProfileCompleteness(completeFieldsStudent, allDocs);
console.log(`   Overall Completion: ${fullResult.percent}% (should be 100%)`);
console.log(`   Field Completion: ${fullResult.fieldCompletion}% (should be 100%)`);
console.log(`   Doc Completion: ${fullResult.docCompletion}% (should be 100%)`);
console.log(`   Can Submit: YES - everything complete`);

console.log('\n🎯 Expected UI Behavior:');
console.log('   - Profile complete: Shows accurate % including documents');
console.log('   - Required documents: Shows correct count (0/8, 4/8, 8/8, etc.)');
console.log('   - Submit for Review: Enabled when fields complete (even without docs)');
console.log('   - Current Education fields: Required for field completion');