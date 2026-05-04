import { test, expect } from '@playwright/test';

test.describe('TFT Overlay', () => {
  test('desktop page loads', async ({ page }) => {
    await page.goto('/desktop.html');
    await expect(page).toHaveTitle(/TFT/i);
  });

  test('no critical console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore network errors from live picker (expected when helper offline)
        if (!text.includes('favicon') && !text.includes('500') && !text.includes('localhost:8400')) {
          errors.push(text);
        }
      }
    });
    await page.goto('/desktop.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
