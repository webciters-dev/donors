import fetch from 'node-fetch';

const API = process.env.VITE_API_URL || 'http://localhost:3001';

async function testOldMessagesAPI() {
  try {
    console.log('Testing old messages API...');
    
    // Test the messages endpoint with admin parameter
    const messagesRes = await fetch(`${API}/api/messages?admin=true`);
    console.log('Messages API Response Status:', messagesRes.status);
    
    if (messagesRes.ok) {
      const messagesData = await messagesRes.json();
      console.log('Messages API Response:', JSON.stringify(messagesData, null, 2));
    } else {
      const errorText = await messagesRes.text();
      console.log('Messages API Error:', errorText);
    }
    
    // Test conversations API
    console.log('\nTesting conversations API...');
    const convRes = await fetch(`${API}/api/conversations?includeAllMessages=true`);
    console.log('Conversations API Response Status:', convRes.status);
    
    if (convRes.ok) {
      const convData = await convRes.json();
      console.log('Conversations API Response:', JSON.stringify(convData, null, 2));
    } else {
      const errorText = await convRes.text();
      console.log('Conversations API Error:', errorText);
    }
    
  } catch (error) {
    console.error('Error testing APIs:', error);
  }
}

testOldMessagesAPI();