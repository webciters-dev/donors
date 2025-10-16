import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function fullBrowserSimulation() {
  try {
    console.log('🌐 FULL BROWSER SIMULATION - STEP BY STEP DEBUG');
    console.log('='.repeat(70));
    
    // Step 1: Get Sara's data
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
    
    console.log('✅ Step 1: Found Sara Khan');
    console.log('   User ID:', saraUser.id);
    console.log('   Student ID:', saraUser.studentId);
    console.log('   Email:', saraUser.email);
    
    // Step 2: Create correct localStorage objects
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        sub: saraUser.id,
        role: saraUser.role,
        email: saraUser.email
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    const userObject = {
      id: saraUser.id,
      name: saraUser.name || saraUser.student.name,
      email: saraUser.email,
      role: saraUser.role,
      studentId: saraUser.studentId
    };
    
    console.log('\n✅ Step 2: Created localStorage objects');
    console.log('   Token length:', token.length);
    console.log('   User object:', JSON.stringify(userObject, null, 2));
    
    // Step 3: Test Applications API
    console.log('\n🧪 Step 3: Testing Applications API...');
    const appResponse = await fetch('http://localhost:3001/api/applications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!appResponse.ok) {
      console.log('❌ Applications API failed:', appResponse.status);
      return;
    }
    
    const appData = await appResponse.json();
    const applications = Array.isArray(appData?.applications) ? appData.applications : appData;
    const userApp = applications.find(app => app.studentId === userObject?.studentId) || null;
    
    console.log('✅ Applications API success');
    console.log('   Total applications:', applications.length);
    console.log('   Sara\'s application found:', !!userApp);
    
    if (!userApp) {
      console.log('❌ No application found for Sara - this would stop message loading');
      return;
    }
    
    console.log('   Application ID:', userApp.id);
    console.log('   Application Status:', userApp.status);
    
    // Step 4: Test Old Messages API
    console.log('\n🧪 Step 4: Testing Old Messages API...');
    const msgResponse = await fetch(`http://localhost:3001/api/messages?studentId=${userApp.studentId}&applicationId=${userApp.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    let oldMessages = [];
    if (msgResponse.ok) {
      const msgData = await msgResponse.json();
      oldMessages = msgData.messages || [];
      console.log('✅ Old Messages API success - found:', oldMessages.length);
    } else {
      console.log('⚠️ Old Messages API failed:', msgResponse.status, '(this is OK, might not exist)');
    }
    
    // Step 5: Test Conversations API
    console.log('\n🧪 Step 5: Testing Conversations API...');
    const convResponse = await fetch('http://localhost:3001/api/conversations?includeAllMessages=true', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!convResponse.ok) {
      console.log('❌ Conversations API failed:', convResponse.status);
      const errorText = await convResponse.text();
      console.log('   Error:', errorText);
      return;
    }
    
    const convData = await convResponse.json();
    const conversations = convData.conversations || [];
    console.log('✅ Conversations API success');
    console.log('   Conversations found:', conversations.length);
    
    // Step 6: Process messages like frontend does
    let allMessages = [...oldMessages];
    
    conversations.forEach((conv, convIndex) => {
      console.log(`   Processing conversation ${convIndex + 1}:`, conv.id);
      console.log(`     Messages in conversation:`, conv.messages?.length || 0);
      
      if (conv.messages) {
        conv.messages.forEach((msg, msgIndex) => {
          console.log(`     Message ${msgIndex + 1}: ${msg.senderRole} - "${msg.text.substring(0, 50)}..."`);
          allMessages.push({
            id: msg.id,
            text: msg.text,
            fromRole: msg.senderRole.toLowerCase(),
            createdAt: msg.createdAt,
            senderName: msg.sender?.name || 'Unknown'
          });
        });
      }
    });
    
    // Step 7: Sort messages
    allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    console.log('\n✅ Step 6: Message Processing Complete');
    console.log('   Total messages after processing:', allMessages.length);
    console.log('   Message breakdown:');
    
    const messagesByRole = {};
    allMessages.forEach(msg => {
      messagesByRole[msg.fromRole] = (messagesByRole[msg.fromRole] || 0) + 1;
    });
    
    Object.entries(messagesByRole).forEach(([role, count]) => {
      console.log(`     ${role}: ${count} messages`);
    });
    
    console.log('\n📝 Step 7: Frontend Display Logic Check');
    console.log('   messages.length > 0:', allMessages.length > 0);
    console.log('   Would show message card:', allMessages.length > 0 ? 'YES' : 'NO');
    
    if (allMessages.length > 0) {
      console.log('   Last 3 messages to display:');
      const last3 = allMessages.slice(-3);
      last3.forEach((msg, idx) => {
        console.log(`     ${idx + 1}. [${msg.fromRole}] ${msg.senderName}: "${msg.text.substring(0, 100)}..."`);
      });
    }
    
    console.log('\n🎯 BROWSER SETUP COMMANDS:');
    console.log('Open browser console and run:');
    console.log(`localStorage.setItem('auth_token', '${token}');`);
    console.log(`localStorage.setItem('auth_user', '${JSON.stringify(userObject)}');`);
    console.log('location.reload();');
    
    // Step 8: Test if there are any console errors
    console.log('\n🔍 Step 8: Checking for potential issues...');
    
    if (allMessages.length === 0) {
      console.log('❌ ISSUE: No messages found after processing');
    } else if (allMessages.every(msg => msg.fromRole === 'admin')) {
      console.log('⚠️ ISSUE: Only admin messages found, no donor messages');
    } else {
      console.log('✅ Messages look good - should display in frontend');
    }
    
  } catch (error) {
    console.error('❌ Error in browser simulation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullBrowserSimulation();