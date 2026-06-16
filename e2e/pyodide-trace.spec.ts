import { test, expect } from '@playwright/test';

test.describe('pyodide live trace', () => {
  test('loads runtime and traces lesson code without CDN mismatch', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/lesson/lesson01');
    await expect(page.getByRole('tab', { name: 'Focus' })).toBeVisible();

    await page.getByRole('button', { name: 'Live trace this code' }).click();
    await expect(page.getByText('Tracing execution…')).toBeVisible();

    const wrong = page.locator('.trace-panel .feedback.wrong');
    await expect(wrong).not.toBeVisible({ timeout: 90_000 });

    await expect(page.locator('.trace-panel')).toBeVisible();
    await expect(page.locator('.trace-panel')).not.toContainText(
      /Failed to fetch dynamically imported module/i,
    );
    await expect(page.locator('.trace-panel')).not.toContainText(/Pyodide version does not match/i);
    await expect(page.getByText(/Step 1 of/i)).toBeVisible({ timeout: 15_000 });
  });
});
