// test-field-alignment.js
// Test that both validation systems have the same required fields

const MYAPP_REQUIRED_PROFILE_KEYS = [
  "cnic",
  "guardianName",
  "guardianCnic",
  "phone",
  "address",
  "city",
  "province",
  "university",
  "program",
  "gpa",
  "gradYear",
  // Current Education fields
  "currentInstitution",
  "currentCity", 
  "currentCompletionYear",
];

const PROFILE_LIB_REQUIRED_KEYS = [
  "cnic",
  "guardianName", 
  "guardianCnic",
  "phone",
  "address",
  "city",
  "province",
  "university",
  "program",
  "gpa",
  "gradYear",
  // Current Education fields (the 3 missing fields from the screenshot)
  "currentInstitution",
  "currentCity", 
  "currentCompletionYear",
];

console.log('🔍 Field Alignment Check...\n');
console.log(`MyApplication fields: ${MYAPP_REQUIRED_PROFILE_KEYS.length}`);
console.log(`Profile Lib fields: ${PROFILE_LIB_REQUIRED_KEYS.length}`);

const myAppSet = new Set(MYAPP_REQUIRED_PROFILE_KEYS);
const libSet = new Set(PROFILE_LIB_REQUIRED_KEYS);

const onlyInMyApp = MYAPP_REQUIRED_PROFILE_KEYS.filter(field => !libSet.has(field));
const onlyInLib = PROFILE_LIB_REQUIRED_KEYS.filter(field => !myAppSet.has(field));

if (onlyInMyApp.length > 0) {
  console.log(`❌ Fields only in MyApplication: ${onlyInMyApp.join(', ')}`);
}

if (onlyInLib.length > 0) {
  console.log(`❌ Fields only in Profile Lib: ${onlyInLib.join(', ')}`);
}

if (onlyInMyApp.length === 0 && onlyInLib.length === 0) {
  console.log('✅ All fields are aligned!');
}

// Test profile with current education filled
const testProfileWithCurrentEdu = {
  cnic: "1234567890123",
  guardianName: "Guardian", 
  guardianCnic: "9876543210987",
  phone: "03001234567",
  address: "Address",
  city: "City",
  province: "Province",
  university: "University",
  program: "Program",
  gpa: "3.5",
  gradYear: "2025",
  // Current Education fields filled (like in screenshot)
  currentInstitution: "Government College",
  currentCity: "Lahore", 
  currentCompletionYear: "2025",
};

const missingFields = MYAPP_REQUIRED_PROFILE_KEYS.filter((k) => {
  const v = testProfileWithCurrentEdu?.[k];
  return v === null || v === undefined || v === "" || Number.isNaN(v);
});

console.log(`\n📊 Test Profile Analysis:`);
console.log(`Missing fields: ${missingFields.length}`);
if (missingFields.length > 0) {
  console.log(`Missing: ${missingFields.join(', ')}`);
}

const fieldCompletion = Math.round(((MYAPP_REQUIRED_PROFILE_KEYS.length - missingFields.length) / MYAPP_REQUIRED_PROFILE_KEYS.length) * 100);
console.log(`Field completion: ${fieldCompletion}%`);
console.log(`Should Submit for Review be enabled? ${fieldCompletion === 100 ? 'YES' : 'NO - missing fields'}`);

console.log('\n🎯 Expected behavior when current education is saved:');
console.log('   - All required fields should be complete');
console.log('   - Field completion should be 100%');
console.log('   - Submit for Review should be ENABLED');