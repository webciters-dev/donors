// test-profile-validation.js
// Test the updated profile validation logic
import { calculateProfileCompleteness, getReadableFieldNames } from './src/lib/profileValidation.js';

console.log('🧪 Testing Profile Validation Updates...\n');

// Test profile with missing Current Education fields (like in the screenshot)
const testProfile = {
  cnic: "1234567890123",
  guardianName: "Test Guardian", 
  guardianCnic: "9876543210987",
  phone: "03001234567",
  address: "Test Address",
  city: "Test City",
  province: "Test Province",
  university: "Test University",
  program: "Test Program",
  gpa: "3.5",
  gradYear: "2025",
  // Missing Current Education fields (the 3 fields from screenshot)
  currentInstitution: "", // empty
  currentCity: "", // empty  
  currentCompletionYear: "", // empty
};

const result = calculateProfileCompleteness(testProfile);

console.log('📋 Profile Validation Results:');
console.log(`   Completion: ${result.percent}% (should NOT be 100%)`);
console.log(`   Is Complete: ${result.isComplete} (should be false)`);
console.log(`   Missing Fields: ${result.missing.length}`);

if (result.missing.length > 0) {
  const readableFields = getReadableFieldNames(result.missing);
  console.log(`   Missing: ${readableFields.join(', ')}`);
}

// Test profile that is actually complete
const completeProfile = {
  ...testProfile,
  currentInstitution: "Current University",
  currentCity: "Current City",
  currentCompletionYear: "2024"
};

const completeResult = calculateProfileCompleteness(completeProfile);
console.log('\n✅ Complete Profile Test:');
console.log(`   Completion: ${completeResult.percent}% (should be 100%)`);
console.log(`   Is Complete: ${completeResult.isComplete} (should be true)`);

console.log('\n🎯 Expected Behavior:');
console.log('   - Profile with missing Current Education fields: < 100%');
console.log('   - Submit for Review: ENABLED (documents optional)'); 
console.log('   - Profile completion shows accurate percentage');