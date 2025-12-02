// Quick system check
import prisma from './src/prismaClient.js';
import logger from './src/lib/logger.js';

async function checkSystem() {
  console.log('\n SYSTEM CHECK\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const checks = [];
  
  // 1. Database connection
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: 'Database Connection', status: ' PASS' });
    await prisma.$disconnect();
  } catch (e) {
    checks.push({ name: 'Database Connection', status: ` FAIL: ${e.message}` });
  }
  
  // 2. Logger
  try {
    logger.info('Test log');
    checks.push({ name: 'Winston Logger', status: ' PASS' });
  } catch (e) {
    checks.push({ name: 'Winston Logger', status: ` FAIL: ${e.message}` });
  }
  
  // 3. All critical modules
  const modules = [
    './src/middleware/auth.js',
    './src/middleware/validators.js',
    './src/middleware/rateLimiter.js',
    './src/lib/apiResponse.js',
    './src/lib/emailService.js',
    './src/monitoring/healthCheck.js',
  ];
  
  for (const mod of modules) {
    try {
      await import(mod);
      checks.push({ name: mod.split('/').pop(), status: ' PASS' });
    } catch (e) {
      checks.push({ name: mod.split('/').pop(), status: ` FAIL: ${e.message}` });
    }
  }
  
  // Print results
  checks.forEach(check => {
    console.log(`${check.status.padEnd(10)} ${check.name}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════════');
  
  const passed = checks.filter(c => c.status.includes('')).length;
  const total = checks.length;
  
  console.log(`\n Results: ${passed}/${total} checks passed (${((passed/total)*100).toFixed(1)}%)\n`);
  
  if (passed === total) {
    console.log(' ALL SYSTEMS OPERATIONAL\n');
    process.exit(0);
  } else {
    console.log('️  SOME CHECKS FAILED\n');
    process.exit(1);
  }
}

checkSystem();
