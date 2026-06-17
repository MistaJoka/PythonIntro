import { test, expect } from '@playwright/test';

test.describe('focus flow', () => {
  test('course map loads and lesson opens in focus mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'C2 — COMMAND POST' })).toBeVisible();
    await page.locator('a.digest-cell').first().click();
    await expect(page.getByRole('tab', { name: 'Engage' })).toBeVisible();
    await expect(page.locator('.tactical-progress')).toContainText(/1\/\d+/);
  });

  test('review page loads with filter', async ({ page }) => {
    await page.goto('/review');
    await expect(page.getByRole('heading', { name: 'TRG — SRS REVIEW' })).toBeVisible();
    await expect(page.getByLabel(/Module filter/i)).toBeVisible();
  });

  test('dashboard heatmap has practice links', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'LOG — MISSION TELEMETRY' })).toBeVisible();
    await expect(page.getByText('Competency matrix')).toBeVisible();
  });
});
