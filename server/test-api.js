import fetch from 'node-fetch';

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/students/approved');
    const data = await response.json();
    
    console.log('🔍 API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.students) {
      console.log('\n📊 Student amounts:');
      data.students.forEach(s => {
        console.log(`${s.name}:`);
        console.log(`  - Application amount: ${s.application?.amount || 'N/A'}`);
        console.log(`  - Application currency: ${s.application?.currency || 'N/A'}`);
        console.log(`  - Sponsored: ${s.sponsored}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
  }
}

testAPI();