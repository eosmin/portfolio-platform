import { expect, test } from '@playwright/test';

test('projects list paginates', async ({ page }) => {
  await page.goto('/projects');
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expect(pagination.getByText('Page 1 of 2')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Demo Task Board' })).toBeVisible();

  await pagination.getByRole('link', { name: 'Next' }).click();
  await expect(page).toHaveURL(/\/projects\?page=2$/);
  await expect(
    page.getByRole('navigation', { name: 'Pagination' }).getByText('Page 2 of 2'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Demo Task Board' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Previous' }).click();
  await expect(page).toHaveURL(/\/projects$/);
});
