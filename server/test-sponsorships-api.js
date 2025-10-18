import fetch from 'node-fetch';

const API = 'http://localhost:3001';

async function testSponsorshipsAPI() {
  try {
    console.log('Testing sponsorships API...');
    const res = await fetch(`${API}/api/sponsorships`);
    console.log('Status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await res.text();
      console.log('Error:', error);
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

testSponsorshipsAPI();