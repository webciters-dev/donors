// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
global.testStartTime = Date.now();

console.log('Test environment initialized');
