import jwt from 'jsonwebtoken';

async function decodeToken() {
  try {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZ2t3aXV3ZDAwMDJlYjh3dXpyNHdlNTAiLCJyb2xlIjoiU1RVREVOVCIsInN0dWRlbnRJZCI6ImNtZ2t3aXVxYjAwMDBlYjh3bTBkZDJuZmgiLCJlbWFpbCI6InRlc3QrMUB3ZWJjaXRlcnMuY29tIiwibmFtZSI6IlNhcmEgS2hhbiIsImlhdCI6MTc2MDI3NTgxMywiZXhwIjoxNzYwMzYyMjEzfQ.YOxFACu58BST7CIqwqhbsPszCTSBOXR03hbypTXV9Q4";
    
    const JWT_SECRET = "8a5b9f1f1f8a4b6c9f0d2c7e0a4f6b7c2e9d4a1b7f3c8e0d9a2f5b6c7d8e9f0";
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('🔍 Token payload:', decoded);
    console.log('🔍 Available fields:', Object.keys(decoded));
    
    // Check what the auth middleware expects vs what we have
    console.log('\n🔍 What auth middleware expects:');
    console.log('   payload.sub:', decoded.sub);
    console.log('   payload.role:', decoded.role);
    console.log('   payload.email:', decoded.email);
    
    console.log('\n🔍 What our token actually has:');
    console.log('   payload.id:', decoded.id);
    console.log('   payload.role:', decoded.role);
    console.log('   payload.email:', decoded.email);
    
    if (!decoded.sub && decoded.id) {
      console.log('\n❌ MISMATCH: Token has "id" but middleware expects "sub"');
    }
    
  } catch (error) {
    console.error('❌ Error decoding token:', error);
  }
}

decodeToken();