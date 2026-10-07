import { expect, test } from '@playwright/test';

test('home renders the profile hero and the main navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Erick Monjaras' })).toBeVisible();
  const nav = page.getByRole('navigation').first();
  for (const name of ['Projects', 'Blog', 'About', 'Contact']) {
    await expect(nav.getByRole('link', { name })).toBeVisible();
  }
});
