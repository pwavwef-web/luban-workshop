const { expect, test } = require('@playwright/test');

test.describe('critical customer flows', () => {
  test('menu page renders categories and menu items', async ({ page }) => {
    await page.goto('/menu.html', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Our Menu' })).toBeVisible();
    await expect(page.locator('.category-tab')).toHaveCount(12);
    await expect(page.locator('.category-section')).toHaveCount(11);
    await expect(page.locator('.menu-card').first()).toBeVisible();
    await expect(page.locator('#drinks')).toContainText('Coca-Cola');
  });

  test('checkout page exposes the protected order flow', async ({ page }) => {
    await page.goto('/checkout.html', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expect(page.locator('#auth-gate')).toBeVisible();
    await expect(page.locator('#checkout-content')).toHaveClass(/hidden/);
    await expect(page.locator('#place-order-btn')).toHaveText('Place Order');
    await expect(page.locator('#verify-contact-link')).toHaveAttribute(
      'href',
      'verify-contact.html'
    );
  });

  test('order status page exposes the protected tracking flow', async ({ page }) => {
    await page.goto('/order-status.html?order=test-order', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Order Status' })).toBeVisible();
    await expect(page.locator('#auth-gate')).toBeVisible();
    await expect(page.locator('#order-content')).toHaveClass(/hidden/);
    await expect(page.locator('#refresh-btn')).toHaveText('Refresh Status');
  });
});
