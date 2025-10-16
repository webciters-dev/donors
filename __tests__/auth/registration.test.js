// Test student registration to see detailed error
const testData = {
  name: "Test Student",
  email: "test-student@example.com", 
  password: "Test@123",
  university: "Test University",
  program: "Computer Science",
  country: "Pakistan",
  term: "Fall 2025",
  currency: "PKR",
  amount: "50000"
};

fetch('http://localhost:3001/api/auth/register-student', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
  console.log('Registration response:', data);
})
.catch(error => {
  console.error('Error:', error);
});