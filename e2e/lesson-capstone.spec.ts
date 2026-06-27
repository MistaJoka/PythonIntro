import { test, expect } from '@playwright/test';

test.describe('lesson flow', () => {
  test('submit a trace-steps example in focus mode', async ({ page }) => {
    await page.goto('/lesson/lesson01');
    await expect(page.getByRole('tab', { name: 'Practice' })).toBeVisible();

    for (let step = 0; step < 3; step += 1) {
      await page.getByRole('button', { name: 'Next step' }).click();
    }
    await expect(page.getByText(/Step 4 of 4/i)).toBeVisible();

    await page.getByRole('radio', { name: /float/i }).check();
    await page.getByRole('button', { name: 'Check Answer' }).click();

    await expect(page.locator('.feedback.correct')).toBeVisible();
    await expect(page.locator('.feedback.correct')).toContainText(/correct/i);
  });
});

test.describe('capstone flow', () => {
  test('capstone editor loads with run controls and persists code', async ({ page }) => {
    await page.goto('/capstones/cap-01');
    await expect(page.getByRole('heading', { name: 'Project Workspace' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Your work' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tests' })).toBeVisible();

    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.type('# draft solution');
    await page.waitForTimeout(500);

    await page.reload();
    await expect(page.locator('.cm-content')).toContainText('# draft solution');
  });
});
