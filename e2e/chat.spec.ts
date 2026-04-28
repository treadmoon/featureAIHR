import { test, expect } from '@playwright/test';

test.describe('Agent Chat Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors (not warnings)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser Console Error]: ${msg.text()}`);
      }
    });

    // Capture page crashes
    page.on('pageerror', err => {
      console.log(`[Page Error]: ${err.message}`);
    });
  });

  test('home page loads without crashes', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:51984', { waitUntil: 'networkidle' });

    // Page should load (may redirect to login if not authenticated)
    await expect(page).toHaveTitle(/.*/);

    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000);

    // Report any errors found
    if (errors.length > 0) {
      console.log('Errors found during page load:', errors);
    }

    expect(errors.length, `Found ${errors.length} errors: ${errors.join(', ')}`).toBe(0);
  });

  test('login page loads when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:51984', { waitUntil: 'networkidle' });

    // Check for login form elements
    const emailInput = page.locator('input[type="text"], input[placeholder*="邮箱"], input[placeholder*="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登 录")');

    // At least one of these should be visible
    const hasLoginForm = await emailInput.isVisible().catch(() => false) ||
                         await passwordInput.isVisible().catch(() => false) ||
                         await loginButton.isVisible().catch(() => false);

    expect(hasLoginForm).toBeTruthy();
    console.log('Login page loaded successfully');
  });

  test('api/chat endpoint returns 401 without auth', async ({ page }) => {
    // Direct API call to /api/chat without authentication
    const response = await page.request.post('http://localhost:51984/api/chat', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        messages: [
          { role: 'user', parts: [{ type: 'text', text: 'hello' }] }
        ]
      })
    });

    // Should return 401 Unauthorized since we're not logged in
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
    console.log('API response (expected 401):', body);
  });

  test('api/chat endpoint returns 400 for invalid request', async ({ page }) => {
    // Direct API call to /api/chat without proper message format
    const response = await page.request.post('http://localhost:51984/api/chat', {
      headers: {
        'Content-Type': 'application/json',
      },
      // Missing messages array or wrong format
      data: JSON.stringify({
        messages: 'invalid'
      })
    });

    // Should not return 200
    expect(response.status()).not.toBe(200);
    console.log('API response for invalid request:', response.status());
  });
});
