'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

function cloudFunctionStub(_options, handler) {
  return handler || _options;
}

function defineStringStub(_name, options = {}) {
  return {
    value() {
      return options.default || '';
    },
  };
}

function defineSecretStub(name) {
  return {
    value() {
      return process.env[name] || '';
    },
  };
}

function createFunctionRequire() {
  return function functionRequire(request) {
    if (request === 'firebase-functions/v2/firestore') {
      return {
        onDocumentCreated: cloudFunctionStub,
        onDocumentDeleted: cloudFunctionStub,
        onDocumentUpdated: cloudFunctionStub,
      };
    }
    if (request === 'firebase-functions/v2/https') {
      return { onRequest: cloudFunctionStub };
    }
    if (request === 'firebase-functions/params') {
      return { defineString: defineStringStub, defineSecret: defineSecretStub };
    }
    if (request === 'firebase-functions/logger') {
      return { info() {}, warn() {}, error() {} };
    }
    if (request === 'axios') {
      return {};
    }
    if (request === 'nodemailer') {
      return { createTransport: () => ({ sendMail: async () => {} }) };
    }
    if (request === './business-hours') {
      return require(path.join(ROOT, 'functions', 'business-hours.js'));
    }
    if (request === './agent-platform') {
      return { generateAgentPlatformText: async () => ({ text: 'ok' }) };
    }
    if (request === './secure-api') {
      return {};
    }
    if (request === './menu-catalog') {
      return require(path.join(ROOT, 'functions', 'menu-catalog.js'));
    }
    if (request === './order-pricing') {
      return require(path.join(ROOT, 'functions', 'order-pricing.js'));
    }
    return require(request);
  };
}

function loadFunctionInternals(fileName, exposedNames) {
  const filePath = path.join(ROOT, 'functions', fileName);
  const source = fs.readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const sandbox = {
    Buffer,
    console,
    exports: module.exports,
    module,
    process,
    require: createFunctionRequire(),
    URL,
  };
  const exportSource = `\nmodule.exports.__test__ = { ${exposedNames.join(', ')} };\n`;
  vm.runInNewContext(source + exportSource, sandbox, { filename: filePath });
  return module.exports.__test__;
}

test('order emails include a direct status link and payment breakdown', () => {
  const { buildCustomerOrderEmail } = loadFunctionInternals('index.js', ['buildCustomerOrderEmail']);
  const email = buildCustomerOrderEmail({
    orderId: 'order_abc123',
    type: 'placed',
    order: {
      customerName: 'Ama',
      orderType: 'takeout',
      orderTypeLabel: 'Take out',
      items: [
        { id: 'R1', name: 'Steamed Rice', quantity: 2, price: 29 },
        { id: 'DR1', name: 'Coca-Cola 300ml', quantity: 3, price: 15 },
      ],
      subtotal: 103,
      packagingFee: 10,
      packagingFeePerDish: 5,
      packagingItemCount: 2,
      total: 113,
    },
  });

  assert.match(email.text, /View order status: https:\/\/lubanrestaurant\.com\/order-status\.html\?order=order_abc123/);
  assert.match(email.text, /Subtotal: GHS 103\.00/);
  assert.match(email.text, /Packaging \(2 non-drink dishes x GHS 5\.00\): GHS 10\.00/);
  assert.match(email.text, /Total: GHS 113\.00/);
  assert.match(email.html, /href="https:\/\/lubanrestaurant\.com\/order-status\.html\?order=order_abc123"/);
  assert.match(email.html, /Payment summary/);
});

test('requested pre-order emails use request lifecycle copy', () => {
  const { buildCustomerOrderEmail } = loadFunctionInternals('index.js', ['buildCustomerOrderEmail']);
  const email = buildCustomerOrderEmail({
    orderId: 'order_request_new',
    type: 'placed',
    order: {
      status: 'requested',
      orderTiming: 'pre_order_request',
      customerName: 'Ama',
      orderType: 'takeout',
      orderTypeLabel: 'Take out',
      requestedForLabel: 'Mon, 6 Jul 2026, 11:00',
      items: [{ id: 'R1', name: 'Steamed Rice', quantity: 1, price: 29 }],
      subtotal: 29,
      packagingFee: 5,
      packagingFeePerDish: 5,
      packagingItemCount: 1,
      total: 34,
    },
  });

  assert.match(email.subject, /pre-order request/);
  assert.match(email.text, /Status: requested/);
  assert.match(email.text, /Requested for: Mon, 6 Jul 2026, 11:00/);
  assert.match(email.text, /Please do not come for collection until it is accepted/);
  assert.match(email.html, />REQUESTED</);
});

test('accepted pre-order emails and SMS use accepted lifecycle copy', () => {
  const { buildCustomerOrderEmail, buildCustomerOrderStatusSmsMessage } = loadFunctionInternals('index.js', [
    'buildCustomerOrderEmail',
    'buildCustomerOrderStatusSmsMessage',
  ]);
  const order = {
    status: 'accepted',
    orderTiming: 'pre_order_request',
    customerName: 'Ama',
    customerPhone: '+233201234567',
    orderType: 'takeout',
    orderTypeLabel: 'Take out',
    requestedForLabel: 'Mon, 6 Jul 2026, 11:00',
    items: [{ id: 'R1', name: 'Steamed Rice', quantity: 1, price: 29 }],
    subtotal: 29,
    packagingFee: 5,
    packagingFeePerDish: 5,
    packagingItemCount: 1,
    total: 34,
  };

  const email = buildCustomerOrderEmail({
    orderId: 'order_request_123',
    type: 'accepted',
    order,
  });
  const sms = buildCustomerOrderStatusSmsMessage(order, 'accepted', 'requested');

  assert.match(email.subject, /pre-order request was accepted/);
  assert.match(email.text, /Status: accepted/);
  assert.match(email.text, /Requested for: Mon, 6 Jul 2026, 11:00/);
  assert.match(email.html, />ACCEPTED</);
  assert.match(sms, /pre-order request for Mon, 6 Jul 2026, 11:00 has been accepted/);
  assert.match(sms, /preparation starts/);
});

test('rejected pre-order emails and SMS use rejection lifecycle copy', () => {
  const { buildCustomerOrderEmail, buildCustomerOrderStatusSmsMessage } = loadFunctionInternals('index.js', [
    'buildCustomerOrderEmail',
    'buildCustomerOrderStatusSmsMessage',
  ]);
  const order = {
    status: 'rejected',
    orderTiming: 'pre_order_request',
    customerName: 'Ama',
    customerPhone: '+233201234567',
    orderType: 'takeout',
    orderTypeLabel: 'Take out',
    requestedForLabel: 'Mon, 6 Jul 2026, 11:00',
    items: [{ id: 'R1', name: 'Steamed Rice', quantity: 1, price: 29 }],
    subtotal: 29,
    packagingFee: 5,
    packagingFeePerDish: 5,
    packagingItemCount: 1,
    total: 34,
  };

  const email = buildCustomerOrderEmail({
    orderId: 'order_request_456',
    type: 'rejected',
    order,
  });
  const sms = buildCustomerOrderStatusSmsMessage(order, 'rejected', 'requested');

  assert.match(email.subject, /request was not accepted/);
  assert.match(email.text, /Status: rejected/);
  assert.match(email.text, /Requested for: Mon, 6 Jul 2026, 11:00/);
  assert.match(email.html, />NOT ACCEPTED</);
  assert.match(sms, /pre-order request for Mon, 6 Jul 2026, 11:00 could not be accepted/);
  assert.match(sms, /020 543 8455/);
});

test('withdrawn pre-order restaurant notifications keep request-specific copy', () => {
  const { buildRestaurantOrderEmail, buildCustomerOrderStatusSmsMessage } = loadFunctionInternals('index.js', [
    'buildRestaurantOrderEmail',
    'buildCustomerOrderStatusSmsMessage',
  ]);
  const order = {
    status: 'cancelled',
    orderTiming: 'pre_order_request',
    cancelledBy: 'customer',
    customerName: 'Ama',
    customerPhone: '+233201234567',
    orderType: 'takeout',
    orderTypeLabel: 'Take out',
    requestedForLabel: 'Mon, 6 Jul 2026, 11:00',
    items: [{ id: 'R1', name: 'Steamed Rice', quantity: 1, price: 29 }],
    total: 34,
  };

  const email = buildRestaurantOrderEmail({
    orderId: 'order_request_withdrawn',
    type: 'cancelled',
    previousStatus: 'requested',
    order,
  });

  assert.match(email.subject, /Order Cancelled/);
  assert.match(email.text, /A customer withdrew a pre-order request before it was accepted/);
  assert.match(email.text, /Previous Status: requested/);
  assert.equal(buildCustomerOrderStatusSmsMessage(order, 'rejected', 'accepted'), '');
});

test('confirmed reservation emails keep the secure status link for guest changes', () => {
  const { buildCustomerReservationEmail } = loadFunctionInternals('index.js', ['buildCustomerReservationEmail']);
  const statusUrl = 'https://lubanrestaurant.com/reservation-status.html?token=secure-token';
  const email = buildCustomerReservationEmail({
    reservationId: 'res_456',
    type: 'confirmed',
    reservation: {
      name: 'Kojo',
      date: '2026-07-10',
      time: '18:00',
      guests: '4',
      reservationStatusUrl: statusUrl,
    },
  });

  assert.match(email.text, /Secure reservation status link: https:\/\/lubanrestaurant\.com\/reservation-status\.html\?token=secure-token/);
  assert.match(email.text, /request a change, or request cancellation/);
  assert.match(email.html, /href="https:\/\/lubanrestaurant\.com\/reservation-status\.html\?token=secure-token"/);
  assert.match(email.html, /View, change, or cancel reservation/);
});

test('reservation confirmation link generation produces status-page tokens', () => {
  const previousEmulator = process.env.FUNCTIONS_EMULATOR;
  process.env.FUNCTIONS_EMULATOR = 'true';

  try {
    const { buildFreshReservationStatusAccessLink } = loadFunctionInternals('index.js', [
      'buildFreshReservationStatusAccessLink',
    ]);
    const link = buildFreshReservationStatusAccessLink('res_789');
    const parsed = new URL(link.url);
    const token = parsed.searchParams.get('token');

    assert.equal(parsed.origin, 'https://lubanrestaurant.com');
    assert.equal(parsed.pathname, '/reservation-status.html');
    assert.match(token, /^[^.]+\.[^.]+$/);
    assert.match(link.tokenHash, /^[a-f0-9]{64}$/);
    assert.ok(Number.isFinite(new Date(link.expiresAt).getTime()));
  } finally {
    if (previousEmulator === undefined) {
      delete process.env.FUNCTIONS_EMULATOR;
    } else {
      process.env.FUNCTIONS_EMULATOR = previousEmulator;
    }
  }
});

test('reservation access validation accepts original and confirmation link hashes', () => {
  const { isReservationAccessTokenHashAllowed } = loadFunctionInternals('secure-api.js', [
    'isReservationAccessTokenHashAllowed',
  ]);

  assert.equal(isReservationAccessTokenHashAllowed({ accessLinkHash: 'original-hash' }, 'original-hash'), true);
  assert.equal(
    isReservationAccessTokenHashAllowed(
      { accessLinkHash: 'original-hash', accessLinkHashes: ['confirmation-hash'] },
      'confirmation-hash'
    ),
    true
  );
  assert.equal(
    isReservationAccessTokenHashAllowed(
      { accessLinkHash: 'original-hash', accessLinkHashes: ['confirmation-hash'] },
      'unknown-hash'
    ),
    false
  );
});
