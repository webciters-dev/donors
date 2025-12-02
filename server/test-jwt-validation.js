// Test script to verify JWT_SECRET validation
import { spawn } from 'child_process';

console.log('Testing JWT_SECRET validation...\n');

// Test 1: With JWT_SECRET (should succeed)
console.log('Test 1: With JWT_SECRET environment variable');
const test1 = spawn('node', ['-e', 
  `process.env.JWT_SECRET = 'test_secret'; import('./src/middleware/auth.js').then(() => console.log('SUCCESS')).catch(e => console.error('FAILED:', e.message))`
], { 
  shell: true,
  env: { ...process.env, JWT_SECRET: 'test_secret' }
});

test1.stdout.on('data', (data) => console.log(`   ${data.toString().trim()}`));
test1.stderr.on('data', (data) => console.error(`   ${data.toString().trim()}`));

test1.on('close', (code) => {
  console.log(`  Exit code: ${code}\n`);
  
  // Test 2: Without JWT_SECRET (should fail)
  console.log('Test 2: Without JWT_SECRET environment variable');
  const envWithoutSecret = { ...process.env };
  delete envWithoutSecret.JWT_SECRET;
  
  const test2 = spawn('node', ['-e',
    `import('./src/middleware/auth.js').then(() => console.log('ERROR: Should have failed')).catch(e => console.error('SUCCESS: ' + e.message))`
  ], { 
    shell: true,
    env: envWithoutSecret
  });
  
  test2.stdout.on('data', (data) => console.log(`   ${data.toString().trim()}`));
  test2.stderr.on('data', (data) => console.log(`   ${data.toString().trim()}`));
  
  test2.on('close', (code) => {
    console.log(`  Exit code: ${code}\n`);
    console.log('JWT_SECRET validation test complete!');
  });
});
