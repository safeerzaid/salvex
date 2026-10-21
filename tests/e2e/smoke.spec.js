import { test, expect } from '@playwright/test';

function attachConsoleAndAssetListeners(page, allowedWarnings = []) {
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isAllowed = allowedWarnings.some((w) => text.includes(w));
      if (!isAllowed) {
        errors.push(`Console error: ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`Page error: ${err.message}`);
  });

  page.on('response', (response) => {
    const url = response.url();
    // Only fail on local 4xx/5xx responses (ignore external unsplash fallback network quirks if any)
    if (url.includes('localhost:5173') && response.status() >= 400) {
      errors.push(`Failed local asset (${response.status()}): ${url}`);
    }
  });

  return errors;
}

test.describe('Phase 1 Smoke & Route Tests', () => {
  const routesToTest = [
    { path: '/', titleExpected: 'Salvex' },
    { path: '/vehicles', headingText: 'Marketplace' },
    { path: '/vehicles/recent', headingText: 'Recently' },
    { path: '/auctions/live', headingText: 'Live' },
    { path: '/auctions/upcoming', headingText: 'Upcoming' },
    { path: '/how-it-works', headingText: 'How' },
    { path: '/bidding-rules', headingText: 'Rules' },
    { path: '/about', headingText: 'About' },
    { path: '/contact', headingText: 'Contact' },
    { path: '/faq', headingText: 'FAQ' },
    { path: '/legal', headingText: 'Terms' },
    { path: '/legal/terms', headingText: 'Terms' },
    { path: '/legal/privacy', headingText: 'Privacy' },
    { path: '/legal/refund', headingText: 'Refund' },
    { path: '/ready-to-lift', headingText: 'Ready' },
    { path: '/services/insurance', headingText: 'Insurance' },
    { path: '/services/recovery', headingText: 'Recovery' },
    { path: '/services/documentation', headingText: 'Documentation' },
    { path: '/login', headingText: 'Sign In' },
    { path: '/sell', headingText: 'List' },
  ];

  for (const { path } of routesToTest) {
    test(`Route ${path} loads without console errors or failed local assets`, async ({ page }) => {
      const errors = attachConsoleAndAssetListeners(page);
      await page.goto(path);
      // Wait for app root or body to be visible
      await expect(page.locator('#main-content')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('404 Page renders for unknown routes with button to return home', async ({ page }) => {
    const errors = attachConsoleAndAssetListeners(page);
    await page.goto('/unknown-nonexistent-route-404');
    await expect(page.locator('text=Page Not Found')).toBeVisible();
    await expect(page.locator('text=Return to Homepage')).toBeVisible();
    await page.click('text=Return to Homepage');
    await expect(page).toHaveURL('http://localhost:5173/');
    expect(errors).toEqual([]);
  });

  test('/vehicles/:id opens directly with specs and bidding panel', async ({ page }) => {
    const errors = attachConsoleAndAssetListeners(page);
    await page.goto('/vehicles/salvex-103');
    await expect(page.locator('text=Defender 110').first()).toBeVisible();
    await expect(page.locator('#btn-place-bid-primary')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('/payment/invalid redirects to /dashboard (or /login if not authenticated)', async ({ page }) => {
    const errors = attachConsoleAndAssetListeners(page);
    await page.goto('/payment/invalid-lot-id');
    // Without auth, protected route redirects to /login; with auth, invalid lot redirects to /dashboard
    await expect(page).toHaveURL(/(\/login|\/dashboard)/);
    expect(errors).toEqual([]);
  });

  test('Bidder persona cannot open /admin', async ({ page }) => {
    const errors = attachConsoleAndAssetListeners(page);
    await page.goto('/login');
    // Click Quick Persona Demo Login for Bidder
    const bidderBtn = page.locator('button:has-text("Demo Bidder")');
    if (await bidderBtn.isVisible()) {
      await bidderBtn.click();
    } else {
      await page.fill('input[type="email"], input[name="identifier"]', 'demo.bidder@example.com');
      await page.click('button[type="submit"]');
    }
    await page.waitForURL('**/dashboard');

    // Attempt navigating directly to /admin
    await page.goto('/admin');
    // Role 'bidder' is not allowed in /admin, should redirect back to /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    expect(errors).toEqual([]);
  });

  test('Admin persona can open /admin and stays after reload', async ({ page }) => {
    const errors = attachConsoleAndAssetListeners(page);
    await page.goto('/login');
    // Click Super Admin persona
    const adminBtn = page.locator('button:has-text("Super Admin")');
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
    }
    await page.waitForURL('**/admin');
    await expect(page.locator('text=SALVEX COMMAND CENTER')).toBeVisible();

    // Reload page
    await page.reload();
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('text=SALVEX COMMAND CENTER')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
