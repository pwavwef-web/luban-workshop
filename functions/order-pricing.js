'use strict';

// Pure, dependency-free order-pricing helpers, extracted from secure-api.js so the
// money-affecting logic can be unit-tested without the Firebase emulator. The
// authoritative subtotal (server-side catalog pricing that ignores client-supplied
// prices) still lives in secure-api.js's createOrder handler; these cover the
// takeout packaging fee, which is part of every takeout total.

const PACKAGING_FEE_PER_DISH = 5;

function normalize(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

// Drinks are exempt from the per-dish takeout packaging fee.
function isDrinkItem(item) {
  const id = normalize(item && item.id).toUpperCase();
  const category = normalize(item && item.category).toLowerCase();
  return category === 'drinks' || /^DR\d+$/.test(id);
}

// Takeout orders add a flat packaging fee per non-drink dish (by quantity).
// Dine-in orders never incur it.
function calculatePackagingFee(items, orderType, perDishFee = PACKAGING_FEE_PER_DISH) {
  if (orderType !== 'takeout') {
    return { packagingFee: 0, packagingItemCount: 0 };
  }

  const packagingItemCount = (Array.isArray(items) ? items : []).reduce((sum, item) => {
    return isDrinkItem(item) ? sum : sum + Number((item && item.quantity) || 0);
  }, 0);

  return {
    packagingFee: packagingItemCount * perDishFee,
    packagingItemCount
  };
}

module.exports = { PACKAGING_FEE_PER_DISH, isDrinkItem, calculatePackagingFee };
