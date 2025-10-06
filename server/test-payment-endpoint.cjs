// server/test-payment-endpoint.cjs
const fetch = require('node-fetch');

async function testPaymentEndpoint() {
  const API = 'http://localhost:3001';
  
  try {
    // Test if we can get the student first
    const studentRes = await fetch(`${API}/api/students/approved/cmf9zffkl000510linjq1e4zu`);
    console.log('Student API response status:', studentRes.status);
    
    if (studentRes.ok) {
      const studentData = await studentRes.json();
      console.log('Student from API:', {
        id: studentData.student?.id,
        name: studentData.student?.name,
        needUSD: studentData.student?.needUSD
      });
    } else {
      console.log('Student API error:', await studentRes.text());
    }
    
    // Test payment endpoint (this will fail due to auth, but we can see if it reaches the endpoint)
    const paymentRes = await fetch(`${API}/api/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      },
      body: JSON.stringify({
        studentId: 'cmf9zffkl000510linjq1e4zu',
        amount: 50000,
        paymentFrequency: 'monthly',
        userId: 'fake-user-id'
      })
    });
    
    console.log('Payment endpoint status:', paymentRes.status);
    const paymentResult = await paymentRes.text();
    console.log('Payment endpoint response:', paymentResult);
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testPaymentEndpoint();