import { test, expect } from '@playwright/test';

test.describe('focus flow', () => {
  test('course map loads and lesson opens in focus mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Command Overview' })).toBeVisible();
    await page.locator('a.digest-cell').first().click();
    await expect(page.getByRole('tab', { name: 'Focus' })).toBeVisible();
    await expect(page.locator('.session-progress-text')).toContainText(/Example 1 of/i);
  });

  test('review page loads with filter', async ({ page }) => {
    await page.goto('/review');
    await expect(page.getByRole('heading', { name: 'Review Session' })).toBeVisible();
    await expect(page.getByLabel(/Filter by lesson/i)).toBeVisible();
  });

  test('dashboard heatmap has practice links', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Telemetry Log' })).toBeVisible();
    await expect(page.getByText('Concept heatmap')).toBeVisible();
  });
});
