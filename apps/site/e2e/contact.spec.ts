import { expect, test, type Page } from '@playwright/test';
import { CONTACT_LIMIT_PER_HOUR } from './stack';

async function send(page: Page, n: number): Promise<void> {
  await page.getByLabel('Name').fill('E2E Visitor');
  await page.getByLabel('Email').fill('visitor@example.com');
  await page.getByLabel('Message').fill(`Hello from the E2E suite, message number ${n}.`);
  await page.getByRole('button', { name: 'Send message' }).click();
}

// The api keeps the rate-limit counter in memory per run, so the tests below depend on this order.
test.describe.configure({ mode: 'serial' });

test('invalid input shows field errors and sends nothing', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Send message' }).click();
  for (const label of ['Name', 'Email', 'Message']) {
    await expect(page.getByLabel(label)).toHaveAttribute('aria-invalid', 'true');
  }
  await expect(page.getByRole('status')).toHaveText('');
});

test('contact form submits', async ({ page }) => {
  await page.goto('/contact');
  await send(page, 1);
  await expect(page.getByRole('status')).toHaveText('Message sent. Thank you!');
});

test('the rate limit rejects the message after the hourly quota', async ({ page }) => {
  await page.goto('/contact');
  // One message went out in the previous test.
  for (let n = 2; n <= CONTACT_LIMIT_PER_HOUR; n += 1) {
    await send(page, n);
    await expect(page.getByRole('status')).toHaveText('Message sent. Thank you!');
  }
  await send(page, CONTACT_LIMIT_PER_HOUR + 1);
  await expect(page.getByRole('status')).toContainText('Rate limit exceeded');
});
