'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const { PACKAGING_FEE_PER_DISH, isDrinkItem, calculatePackagingFee } = require(
  path.join(ROOT, 'functions', 'order-pricing.js')
);

test('isDrinkItem detects drinks by category and by DR-code', () => {
  assert.equal(isDrinkItem({ id: 'DR1', category: 'drinks' }), true);
  assert.equal(isDrinkItem({ id: 'DR4' }), true);
  assert.equal(isDrinkItem({ id: 'dr2' }), true); // case-insensitive
  assert.equal(isDrinkItem({ category: 'Drinks' }), true);
  assert.equal(isDrinkItem({ id: 'B5', category: 'beef-lamb' }), false);
  assert.equal(isDrinkItem({}), false);
  assert.equal(isDrinkItem(null), false);
});

test('dine-in orders never incur a packaging fee', () => {
  const result = calculatePackagingFee([{ id: 'B5', quantity: 3 }], 'dine_in');
  assert.deepEqual(result, { packagingFee: 0, packagingItemCount: 0 });
});

test('unknown / missing order types never incur a packaging fee', () => {
  assert.equal(calculatePackagingFee([{ id: 'B5', quantity: 2 }], '').packagingFee, 0);
  assert.equal(calculatePackagingFee([{ id: 'B5', quantity: 2 }], undefined).packagingFee, 0);
});

test('takeout charges a flat fee per non-drink dish, by quantity', () => {
  const result = calculatePackagingFee([{ id: 'B5', quantity: 2 }], 'takeout');
  assert.equal(result.packagingItemCount, 2);
  assert.equal(result.packagingFee, 2 * PACKAGING_FEE_PER_DISH);
});

test('takeout excludes drinks from the packaging fee', () => {
  const items = [
    { id: 'B5', category: 'beef-lamb', quantity: 2 },
    { id: 'DR1', category: 'drinks', quantity: 4 }
  ];
  const result = calculatePackagingFee(items, 'takeout');
  assert.equal(result.packagingItemCount, 2);
  assert.equal(result.packagingFee, 2 * PACKAGING_FEE_PER_DISH);
});

test('empty or invalid baskets produce a zero fee', () => {
  assert.equal(calculatePackagingFee([], 'takeout').packagingFee, 0);
  assert.equal(calculatePackagingFee(null, 'takeout').packagingFee, 0);
});

test('the packaging fee ignores client-supplied price/fee fields (anti-tamper)', () => {
  // A tampered cart cannot inflate or zero-out the server-side packaging fee:
  // only quantity and drink status are used, never any client "price"/"fee".
  const tampered = [
    { id: 'B5', quantity: 1, price: 0, packagingFee: 9999 },
    { id: 'K1', quantity: 1, price: -500 }
  ];
  const result = calculatePackagingFee(tampered, 'takeout');
  assert.equal(result.packagingItemCount, 2);
  assert.equal(result.packagingFee, 2 * PACKAGING_FEE_PER_DISH);
});

test('packaging fee scales with a realistic mixed takeout basket', () => {
  const basket = [
    { id: 'B5', category: 'beef-lamb', quantity: 2 },
    { id: 'R1', category: 'rice', quantity: 3 },
    { id: 'DR1', category: 'drinks', quantity: 2 },
    { id: 'DR4', category: 'drinks', quantity: 1 }
  ];
  const nonDrinkQty = 2 + 3;
  const result = calculatePackagingFee(basket, 'takeout');
  assert.equal(result.packagingItemCount, nonDrinkQty);
  assert.equal(result.packagingFee, nonDrinkQty * PACKAGING_FEE_PER_DISH);
});
