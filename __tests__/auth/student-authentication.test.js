// Test the students API to see what data is returned for Sara
console.log('🔍 Testing Students API for Sara Khan');

// Test the individual student endpoint
fetch('http://localhost:3001/api/students/approved/cmgkwiuqb0000eb8wm0dd2nfh')
.then(response => {
  console.log('Individual Student API status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Individual Student API data:', data);
  if (data.student) {
    console.log('Student currency:', data.student.currency);
    console.log('Student country:', data.student.country);
    console.log('Student application:', data.student.application);
  }
})
.catch(error => {
  console.log('Individual Student API error:', error);
});

// Test the approved students list endpoint 
fetch('http://localhost:3001/api/students/approved')
.then(response => {
  console.log('Approved Students API status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Approved Students API data length:', data.students?.length);
  const sara = data.students?.find(s => s.id === 'cmgkwiuqb0000eb8wm0dd2nfh');
  if (sara) {
    console.log('Sara from approved list:');
    console.log('  Currency:', sara.currency);
    console.log('  Country:', sara.country);
    console.log('  Application:', sara.application);
    console.log('  Application Currency:', sara.application?.currency);
  } else {
    console.log('Sara not found in approved students list');
  }
})
.catch(error => {
  console.log('Approved Students API error:', error);
});