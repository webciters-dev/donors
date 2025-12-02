/**
 * End-to-End Tests for API
 * Run with: npm run test:e2e
 */
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

test.describe('API Health', () => {
  test('GET /health returns healthy status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.checks).toBeDefined();
  });
  
  test('GET /ping returns ok', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ping`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});

test.describe('API Auth Validation', () => {
  test('POST /api/auth/login rejects invalid email', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: 'invalid-email',
        password: 'password123',
      },
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });
});
