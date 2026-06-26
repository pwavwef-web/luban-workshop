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

    await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
    await expect(page.locator('#auth-gate')).toBeVisible();
    await expect(page.locator('#checkout-login-form')).toBeVisible();
    await expect(page.locator('#checkout-signup-tab')).toBeVisible();
    await expect(page.locator('#checkout-content')).toHaveClass(/hidden/);
    await expect(page.locator('input[name="order-type"]')).toHaveCount(2);
    await expect(page.locator('#place-order-btn')).toHaveText('Place Order');
    await expect(page.locator('#verify-contact-link')).toHaveAttribute(
      'href',
      'verify-contact.html?returnTo=checkout'
    );

    await page.evaluate(() => {
      window.renderVerificationStatus({ emailVerified: false, phoneVerified: false });
    });
    await expect(page.locator('#checkout-warning a')).toHaveAttribute(
      'href',
      'verify-contact.html?returnTo=checkout'
    );
    await expect(page.locator('#checkout-warning a')).toHaveText('Open phone verification');

    await page.evaluate(() => {
      window.lubanClient.writeCart([
        { id: 'R1', name: 'Steamed Rice', price: 29, quantity: 2 },
        { id: 'DR1', name: 'Coca-Cola 300ml', price: 15, quantity: 3 },
      ]);
      const takeout = document.querySelector('input[name="order-type"][value="takeout"]');
      takeout.checked = true;
      takeout.dispatchEvent(new Event('change', { bubbles: true }));
      window.renderCart();
    });
    await expect(page.locator('#cart-subtotal')).toHaveText(/103\.00/);
    await expect(page.locator('#packaging-fee')).toHaveText(/10\.00/);
    await expect(page.locator('#packaging-fee-note')).toContainText('2 dishes');
    await expect(page.locator('#cart-total')).toHaveText(/113\.00/);
  });

  test('order status page exposes the protected tracking flow', async ({ page }) => {
    await page.goto('/order-status.html?order=test-order', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Order Status' })).toBeVisible();
    await expect(page.locator('#auth-gate')).toBeVisible();
    await expect(page.locator('#order-content')).toHaveClass(/hidden/);
    await expect(page.locator('#refresh-btn')).toHaveText('Refresh Status');
  });
});
