import { expect, test } from '@playwright/test';

test('a blog post opens from the list and renders its Markdown body', async ({ page }) => {
  await page.goto('/blog');
  await page.getByRole('link', { name: 'Hello, world' }).click();
  await expect(page).toHaveURL(/\/blog\/hello-world$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello, world');
  await expect(page.getByText('Placeholder post body.')).toBeVisible();
});
