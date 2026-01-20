/**
 * Playwright E2E: Admin edits approved AWAKE amount
 * Run with: npx playwright test --grep "admin edits approved amount"
 */
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@awake.com';
const ADMIN_PASSWORD = 'Admin@123';

// Utility: Login as admin and return page
async function adminLogin(page) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/applications');
}

test.describe('Admin edits approved amount', () => {
  test('should update approved AWAKE amount and persist', async ({ page, request }) => {
    // Login as admin
    await adminLogin(page);

    // Go to admin applications list
    await page.goto('http://localhost:3000/admin/applications');
    // Click first application in the list
    await page.click('a[href^="/admin/applications/"]');
    await page.waitForURL('**/admin/applications/*');

    // Find the approved amount input and change value
    const approvedAmountInput = page.locator('input[type="number"]');
    const oldValue = await approvedAmountInput.inputValue();
    const newValue = oldValue === '123456' ? '654321' : '123456';
    await approvedAmountInput.fill(newValue);

    // Click Save Changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Application updated successfully!')).toBeVisible();

    // Reload and verify value persisted
    await page.reload();
    await expect(approvedAmountInput).toHaveValue(newValue);
  });
});
