// server/test-stripe.cjs
const Stripe = require('stripe');
const dotenv = require('dotenv');

dotenv.config();

async function testStripe() {
  console.log('🧪 Testing NEW Stripe Integration...');
  
  // Use the new key directly for testing
  const secretKey = 'sk_test_51SEV0FBA3ZdfR2SV9WU3SDy6hP3aFWWr8PzkWi2O5LEzijbpdoHkV2z21d3qRHGOt6kh2LvWiaoYEHdMnrX7LNZZ00WpCksHPv';
  console.log('Secret key present:', !!secretKey);
  console.log('Secret key starts with sk_test_:', secretKey?.startsWith('sk_test_'));
  console.log('Secret key length:', secretKey?.length);
  
  if (!secretKey) {
    console.log('❌ No STRIPE_SECRET_KEY found');
    return;
  }
  
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16'
    });
    
    console.log('🔧 Stripe instance created successfully');
    
    // Test with a simple payment intent
    console.log('💳 Testing payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      payment_method_types: ['card'],
      description: 'Test payment intent'
    });
    
    console.log('✅ Payment intent created successfully!');
    console.log('   ID:', paymentIntent.id);
    console.log('   Amount:', paymentIntent.amount);
    console.log('   Status:', paymentIntent.status);
    console.log('   Client Secret:', paymentIntent.client_secret ? 'Present' : 'Missing');
    
  } catch (error) {
    console.log('❌ Stripe Error:');
    console.log('   Message:', error.message);
    console.log('   Type:', error.type);
    console.log('   Code:', error.code);
    console.log('   Full error:', error);
  }
}

testStripe();