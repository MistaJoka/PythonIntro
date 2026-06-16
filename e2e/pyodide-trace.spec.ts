import { test, expect } from '@playwright/test';

test.describe('execution trace', () => {
  test('lesson shows one trace panel with step navigation', async ({ page }) => {
    await page.goto('/lesson/lesson01');
    await expect(page.getByRole('tab', { name: 'Focus' })).toBeVisible();

    await expect(page.getByText('Execution trace')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Live trace this code' })).toHaveCount(0);

    await expect(page.getByText(/Step 1 of/i)).toBeVisible();
    await page.getByRole('button', { name: 'Next →' }).click();
    await expect(page.getByText(/Step 2 of/i)).toBeVisible();
    await expect(page.getByText(/Explore .* more step/i)).toBeVisible();
  });
});

test.describe('pyodide live trace', () => {
  test('capstone trace loads runtime without CDN mismatch', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/capstones/cap-01');
    await expect(page.getByRole('button', { name: 'Trace' })).toBeVisible();
    await page.getByRole('button', { name: 'Trace' }).click();

    await expect(page.getByText('Tracing execution…')).toBeVisible();

    const wrong = page.locator('.execution-trace .feedback.wrong');
    await expect(wrong).not.toBeVisible({ timeout: 90_000 });

    await expect(page.getByText('Live execution trace')).toBeVisible();
    await expect(page.locator('.execution-trace')).not.toContainText(
      /Failed to fetch dynamically imported module/i,
    );
  });
});
