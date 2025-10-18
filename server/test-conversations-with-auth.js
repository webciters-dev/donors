import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const API = 'http://localhost:3001';

async function testConversationsWithAuth() {
  try {
    console.log('Testing conversations API with auth...');
    
    // Create admin token
    const token = jwt.sign(
      { id: 'test-admin', role: 'ADMIN', email: 'admin@test.com' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    const res = await fetch(`${API}/api/conversations?includeAllMessages=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Conversations Response:', JSON.stringify(data, null, 2));
      
      // Check if there are any donor messages
      if (data.conversations) {
        data.conversations.forEach(conv => {
          console.log(`\nConversation ${conv.id}:`);
          conv.messages?.forEach(msg => {
            console.log(`- From: ${msg.senderRole} | Text: ${msg.text?.substring(0, 40)}...`);
          });
        });
      }
    } else {
      const error = await res.text();
      console.log('Error:', error);
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

testConversationsWithAuth();