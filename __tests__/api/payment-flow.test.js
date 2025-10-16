// Test payment creation for Sara Khan
console.log('🧪 TESTING SARA PAYMENT CREATION');
console.log('='.repeat(50));

// Check if we have auth
const token = localStorage.getItem('auth_token');
const userStr = localStorage.getItem('auth_user');

if (!token) {
  console.log('❌ No auth token - please login first');
} else {
  const user = JSON.parse(userStr);
  console.log('👤 Testing with user:', user.email, 'Role:', user.role);
  
  if (user.role !== 'DONOR') {
    console.log('❌ User is not a DONOR - need donor account for payment test');
  } else {
    console.log('💳 Testing payment intent creation for Sara Khan...');
    
    fetch('http://localhost:3001/api/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: 'cmgkwiuqb0000eb8wm0dd2nfh', // Sara Khan
        amount: 5000, // Her needUSD amount
        paymentFrequency: 'one-time',
        userId: user.id,
        currency: 'USD'
      })
    })
    .then(response => {
      console.log('💳 Payment Intent API status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('💳 Payment Intent API response:', data);
      
      if (data.clientSecret) {
        console.log('✅ Payment intent created successfully!');
        console.log('   Client Secret exists:', !!data.clientSecret);
        console.log('   Payment Intent ID:', data.paymentIntentId);
      } else {
        console.log('❌ Payment intent creation failed:', data.error);
      }
    })
    .catch(error => {
      console.log('❌ Payment Intent API error:', error);
    });
  }
}