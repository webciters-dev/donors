import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function fixSaraToken() {
  try {
    console.log('🔧 FIXING SARA KHAN TOKEN WITH CORRECT SUB FIELD');
    console.log('='.repeat(60));
    
    // Get Sara's user account
    const saraUser = await prisma.user.findFirst({
      where: { 
        student: { name: 'Sara Khan' }
      },
      include: { student: true }
    });
    
    if (!saraUser) {
      console.log('❌ Sara Khan user not found');
      return;
    }
    
    console.log('✅ Found Sara Khan user:');
    console.log('   User ID:', saraUser.id);
    console.log('   Student ID:', saraUser.studentId);
    console.log('   Email:', saraUser.email);
    console.log('   Role:', saraUser.role);
    console.log('   Name:', saraUser.name);
    
    // Create JWT token with CORRECT payload structure (using 'sub' not 'id')
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        sub: saraUser.id,      // ✅ Using 'sub' like the real auth system
        role: saraUser.role,   // ✅ STUDENT
        email: saraUser.email  // ✅ sara.khan@example.com
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log('\n🎫 CORRECTED Sara Khan Token:');
    console.log('Bearer', token);
    
    // Verify the token structure is correct
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n🔍 Token payload verification:');
    console.log('   decoded.sub:', decoded.sub, '✅');
    console.log('   decoded.role:', decoded.role, '✅');
    console.log('   decoded.email:', decoded.email, '✅');
    
    if (!decoded.sub) {
      console.log('❌ ERROR: Token still missing sub field!');
      return;
    }
    
    // Test the conversations API with the fixed token
    console.log('\n🧪 Testing conversations API with corrected token...');
    
    try {
      const response = await fetch('http://localhost:3001/api/conversations?includeAllMessages=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.text();
      console.log('\n📡 API Response Status:', response.status);
      console.log('📡 API Response:', result);
      
      if (response.ok) {
        const data = JSON.parse(result);
        console.log('\n✅ SUCCESS! Conversations API working with fixed token');
        console.log('   Conversations found:', data.length);
        if (data.length > 0) {
          console.log('   First conversation messages:', data[0].messages?.length || 0);
        }
      } else {
        console.log('\n❌ API still failing:', result);
      }
      
    } catch (fetchError) {
      console.log('\n❌ Fetch error:', fetchError.message);
    }
    
    console.log('\n📱 To test in browser:');
    console.log('1. Open Sara Khan student dashboard');
    console.log('2. Open browser dev tools > Application > Local Storage');
    console.log('3. Set "auth_token" to:');
    console.log(token);
    console.log('4. Refresh the page');
    
  } catch (error) {
    console.error('❌ Error fixing Sara token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSaraToken();