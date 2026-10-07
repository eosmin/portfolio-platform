import { expect, test } from '@playwright/test';

// A slug the api does not know must be a real 404 (not a 200 page), so search engines drop it.
// The last two are the slug that `next build` prerenders as a placeholder: it must never show content.
for (const path of [
  '/projects/does-not-exist',
  '/blog/does-not-exist',
  '/projects/__build-placeholder__',
  '/blog/__build-placeholder__',
]) {
  test(`${path} answers 404 with the not-found page`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  });
}
