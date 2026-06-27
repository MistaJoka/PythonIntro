import { test, expect } from '@playwright/test';

test.describe('focus flow', () => {
  test('course map loads and lesson opens in focus mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'All modules' })).toBeVisible();
    await page.locator('a.module-row').first().click();
    await expect(page.getByRole('tab', { name: 'Practice' })).toBeVisible();
    await expect(page.locator('.tactical-progress')).toContainText(/1\/\d+/);
  });

  test('review page loads with filter', async ({ page }) => {
    await page.goto('/review');
    await expect(page.getByText(/Spaced repetition/i)).toBeVisible();
    await expect(page.getByLabel(/Module filter/i)).toBeVisible();
  });

  test('dashboard heatmap has practice links', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Competency matrix' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Module status' })).toBeVisible();
  });
});
