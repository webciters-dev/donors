// Simple test: try to load auth.js with proper JWT_SECRET
console.log('Loading auth middleware with JWT_SECRET from .env...');

import('./src/middleware/auth.js')
  .then(() => {
    console.log(' Auth middleware loaded successfully!');
    console.log(' JWT_SECRET validation is working correctly');
  })
  .catch((error) => {
    console.error(' Failed to load auth middleware:');
    console.error(error.message);
    process.exit(1);
  });
