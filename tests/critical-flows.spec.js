const { expect, test } = require('@playwright/test');

const PRE_ORDER_ID = 'gmNt6ZPHVeHV2IB9f4Dm';
const PRE_ORDER_SERVICE_LABEL = 'Monday, 6 Jul 2026, 11:00';
const PRE_ORDER_FIXTURE_KEY = 'luban:e2e:preorder-lifecycle';
const PRE_ORDER_API_CALLS_KEY = 'luban:e2e:preorder-api-calls';
const PRE_ORDER_FIXTURE = {
  id: PRE_ORDER_ID,
  status: 'requested',
  orderTiming: 'pre_order_request',
  requestedFor: '2026-07-06T11:00:00.000Z',
  requestedForLabel: PRE_ORDER_SERVICE_LABEL,
  createdAt: '2026-07-04T18:45:00.000Z',
  updatedAt: '2026-07-04T18:45:00.000Z',
  customerName: 'Email Regression Customer',
  customerPhone: '+233501234567',
  customerEmail: 'preorder.lifecycle@example.com',
  orderType: 'takeout',
  items: [
    { id: 'R1', name: 'Steamed Rice', price: 29, quantity: 2 },
    { id: 'DR1', name: 'Coca-Cola 300ml', price: 15, quantity: 1 }
  ],
  subtotal: 73,
  packagingFee: 10,
  packagingFeePerDish: 5,
  packagingItemCount: 2,
  total: 83
};

async function mockBrowserDate(page, isoString) {
  await page.addInitScript((fixedIso) => {
    const RealDate = Date;
    const fixedTime = new RealDate(fixedIso).getTime();
    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedTime);
        } else {
          super(...args);
        }
      }

      static now() {
        return fixedTime;
      }

      static parse(value) {
        return RealDate.parse(value);
      }

      static UTC(...args) {
        return RealDate.UTC(...args);
      }
    }
    window.Date = MockDate;
  }, isoString);
}

function buildFirebaseFixtureScript() {
  return `
(function () {
  const STORE_KEY = ${JSON.stringify(PRE_ORDER_FIXTURE_KEY)};
  const CALLS_KEY = ${JSON.stringify(PRE_ORDER_API_CALLS_KEY)};
  const ORDER_ID = ${JSON.stringify(PRE_ORDER_ID)};
  const INITIAL_ORDER = ${JSON.stringify(PRE_ORDER_FIXTURE)};
  const SERVER_NOW = '2026-07-05T09:15:00.000Z';
  const TIMESTAMP_FIELDS = new Set([
    'acceptedAt',
    'cancelledAt',
    'completedAt',
    'createdAt',
    'preparingAt',
    'rejectedAt',
    'requestedFor',
    'reopenedAt',
    'updatedAt'
  ]);
  const listeners = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readState() {
    let state = null;
    try {
      state = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null');
    } catch (error) {}
    if (!state || typeof state !== 'object') state = { orders: {} };
    if (!state.orders || typeof state.orders !== 'object') state.orders = {};
    if (!state.orders[ORDER_ID]) state.orders[ORDER_ID] = clone(INITIAL_ORDER);
    return state;
  }

  function writeState(state) {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function getRawOrder(id) {
    const state = readState();
    return state.orders[id] ? clone(state.orders[id]) : null;
  }

  function setRawOrder(id, order) {
    const state = readState();
    state.orders[id] = clone(order);
    writeState(state);
    notifyListeners();
  }

  function recordApiCall(path, options) {
    let calls = [];
    try {
      calls = JSON.parse(window.localStorage.getItem(CALLS_KEY) || '[]');
    } catch (error) {}
    calls.push({
      path,
      method: options && options.method ? options.method : 'GET',
      body: options && options.body ? clone(options.body) : null,
      userEmail: options && options.user ? options.user.email || '' : ''
    });
    window.localStorage.setItem(CALLS_KEY, JSON.stringify(calls));
  }

  function getApiCalls() {
    try {
      return JSON.parse(window.localStorage.getItem(CALLS_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function asTimestamp(isoString) {
    return {
      toDate: function () {
        return new Date(isoString);
      }
    };
  }

  function toFirestoreData(raw) {
    const data = clone(raw || {});
    Object.keys(data).forEach(function (key) {
      if (TIMESTAMP_FIELDS.has(key) && typeof data[key] === 'string') {
        data[key] = asTimestamp(data[key]);
      }
    });
    return data;
  }

  function materializeValue(value) {
    if (value && value.__serverTimestamp) return SERVER_NOW;
    if (value instanceof Date) return value.toISOString();
    return value;
  }

  function applyUpdate(collectionName, id, update) {
    if (collectionName !== 'orders') return;
    const state = readState();
    const order = state.orders[id] || {};
    Object.keys(update || {}).forEach(function (key) {
      const value = update[key];
      if (value && value.__deleteField) {
        delete order[key];
      } else {
        order[key] = materializeValue(value);
      }
    });
    state.orders[id] = order;
    writeState(state);
    notifyListeners();
  }

  function applySet(collectionName, id, data, options) {
    if (collectionName !== 'orders') return;
    const state = readState();
    state.orders[id] = options && options.merge
      ? Object.assign({}, state.orders[id] || {}, clone(data || {}))
      : clone(data || {});
    writeState(state);
    notifyListeners();
  }

  function makeDocSnapshot(collectionName, id, rawData) {
    const exists = Boolean(rawData);
    return {
      id,
      exists,
      data: function () {
        return exists ? toFirestoreData(rawData) : undefined;
      }
    };
  }

  function makeQuerySnapshot(collectionName) {
    const state = readState();
    const docs = collectionName === 'orders'
      ? Object.keys(state.orders).map(function (id) {
        return makeDocSnapshot(collectionName, id, state.orders[id]);
      })
      : [];
    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: function (callback) {
        docs.forEach(callback);
      }
    };
  }

  function notifyListeners() {
    listeners.slice().forEach(function (listener) {
      window.setTimeout(function () {
        listener.next(makeQuerySnapshot(listener.collectionName));
      }, 0);
    });
  }

  function createDocRef(collectionName, id) {
    return {
      id,
      get: function () {
        const raw = collectionName === 'orders' ? getRawOrder(id) : null;
        return Promise.resolve(makeDocSnapshot(collectionName, id, raw));
      },
      set: function (data, options) {
        applySet(collectionName, id, data, options);
        return Promise.resolve();
      },
      update: function (update) {
        applyUpdate(collectionName, id, update);
        return Promise.resolve();
      },
      collection: function (childName) {
        return createCollectionApi(collectionName + '/' + id + '/' + childName);
      }
    };
  }

  function createCollectionApi(collectionName) {
    const api = {};
    api.doc = function (id) {
      return createDocRef(collectionName, id);
    };
    api.add = function (data) {
      const id = 'mock-' + Date.now();
      applySet(collectionName, id, data, {});
      return Promise.resolve(createDocRef(collectionName, id));
    };
    api.get = function () {
      return Promise.resolve(makeQuerySnapshot(collectionName));
    };
    api.orderBy = function () {
      return api;
    };
    api.where = function () {
      return api;
    };
    api.limit = function () {
      return api;
    };
    api.onSnapshot = function (next) {
      const listener = { collectionName, next };
      listeners.push(listener);
      window.setTimeout(function () {
        next(makeQuerySnapshot(collectionName));
      }, 0);
      return function unsubscribe() {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    };
    return api;
  }

  const db = {
    collection: createCollectionApi,
    runTransaction: async function (callback) {
      const transaction = {
        get: function (ref) {
          return ref.get();
        },
        set: function (ref, data, options) {
          return ref.set(data, options);
        },
        update: function (ref, update) {
          return ref.update(update);
        }
      };
      await callback(transaction);
      notifyListeners();
    },
    batch: function () {
      const operations = [];
      return {
        set: function (ref, data, options) {
          operations.push(function () {
            return ref.set(data, options);
          });
        },
        update: function (ref, update) {
          operations.push(function () {
            return ref.update(update);
          });
        },
        commit: function () {
          return Promise.all(operations.map(function (operation) {
            return operation();
          }));
        }
      };
    }
  };

  const testUser = {
    uid: 'preorder-lifecycle-user',
    email: 'preorder.lifecycle@example.com',
    displayName: 'Pre-order Lifecycle User',
    getIdToken: async function () {
      return 'preorder-lifecycle-token';
    },
    getIdTokenResult: async function () {
      return { claims: { admin: true } };
    }
  };

  const auth = {
    currentUser: testUser,
    onAuthStateChanged: function (callback) {
      window.setTimeout(function () {
        callback(auth.currentUser);
      }, 0);
      return function unsubscribe() {};
    },
    signInWithEmailAndPassword: async function () {
      auth.currentUser = testUser;
      return { user: testUser };
    },
    createUserWithEmailAndPassword: async function () {
      auth.currentUser = testUser;
      return { user: testUser };
    },
    signInWithPopup: async function () {
      auth.currentUser = testUser;
      return { user: testUser };
    },
    sendEmailVerification: async function () {},
    updateProfile: async function () {},
    signOut: async function () {
      auth.currentUser = null;
    }
  };

  const firebase = {
    apps: [],
    initializeApp: function (config) {
      if (!firebase.apps.length) firebase.apps.push({ options: config || {} });
      return firebase.apps[0];
    },
    analytics: function () {},
    auth: Object.assign(function () {
      return auth;
    }, {
      GoogleAuthProvider: function GoogleAuthProvider() {}
    }),
    firestore: Object.assign(function () {
      return db;
    }, {
      FieldValue: {
        serverTimestamp: function () {
          return { __serverTimestamp: true };
        },
        delete: function () {
          return { __deleteField: true };
        }
      }
    }),
    storage: function () {
      return {
        ref: function () {
          return {};
        }
      };
    }
  };

  window.__lubanE2E = {
    getOrder: getRawOrder,
    setOrder: setRawOrder,
    resetOrder: function () {
      setRawOrder(ORDER_ID, INITIAL_ORDER);
    },
    recordApiCall,
    getApiCalls
  };
  window.firebase = firebase;
}());
`;
}

function buildAdminCoreHarnessScript() {
  return `
(function () {
  initLubanFirebase(firebase);
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.lucide = window.lucide || { createIcons: function () {} };
  window.setMetricValue = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value || 0);
  };
  window.setMetricText = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '';
  };
  window.escapeHtml = function (value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  window.getFirestoreDate = function (value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  window.truncateText = function (value, maxLength) {
    const text = String(value || '').trim();
    return text.length > maxLength ? text.slice(0, maxLength - 1).trim() + '...' : text;
  };
  window.formatCurrency = function (value) {
    return 'GHS ' + Number(value || 0).toFixed(2);
  };
  window.fetchAdminApi = async function () {
    return {};
  };
  window.formatGhanaPhone = function (phone) {
    return phone || '';
  };
  window.showAdminNotification = function () {};
  window.checkSmsBalance = function () {};
  window.displaySmsBalance = function () {};
  window.logout = function () {};
  window.switchTab = function (tabName) {
    ['overview', 'menu', 'reservations', 'orders', 'promotions', 'special-menus', 'admin-users', 'messages', 'fraud-review', 'chatbot-knowledge', 'account'].forEach(function (tab) {
      const view = document.getElementById('view-' + tab);
      if (view) view.classList.toggle('hidden', tab !== tabName);
      const button = document.getElementById('tab-btn-' + tab);
      if (button) button.classList.toggle('admin-nav-active', tab === tabName);
    });
  };
  const login = document.getElementById('login-screen');
  const dashboard = document.getElementById('admin-dashboard');
  const splash = document.getElementById('splash-screen');
  const userEmail = document.getElementById('user-email');
  if (splash) {
    splash.classList.add('admin-splash--hide');
    splash.style.display = 'none';
  }
  if (login) login.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('hidden');
  if (userEmail) userEmail.textContent = window.auth.currentUser.email;
}());
`;
}

function buildNoopAdminModuleScript() {
  return `
(function () {
  [
    'listenToMenu',
    'listenToReservations',
    'listenToPromotions',
    'listenToSpecialMenus',
    'listenToAdminUsers',
    'initSmsCampaigns',
    'listenToMessages',
    'loadFraudReview',
    'listenToChatbotKnowledge',
    'startTour',
    'refreshSmsCampaigns',
    'checkSmsBalance'
  ].forEach(function (name) {
    window[name] = window[name] || function () {};
  });
}());
`;
}

async function installPreOrderLifecycleFixture(page) {
  await page.route('**/assets/js/firebase-modular.bundle.js*', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: buildFirebaseFixtureScript()
    });
  });

  await page.route('**/assets/js/admin-core.bundle.js*', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: buildAdminCoreHarnessScript()
    });
  });

  const noopAdminBundles = [
    'admin-qr.bundle.js',
    'admin-menu.bundle.js',
    'admin-reservations.bundle.js',
    'admin-promotions.bundle.js',
    'admin-special-menus.bundle.js',
    'admin-users.bundle.js',
    'admin-campaigns.bundle.js',
    'admin-messages.bundle.js',
    'admin-fraud.bundle.js',
    'admin-chatbot.bundle.js',
    'admin-export.bundle.js',
    'admin-tour.bundle.js',
    'firebase-ai-chatbot.js'
  ];
  for (const bundle of noopAdminBundles) {
    await page.route(`**/assets/js/${bundle}*`, async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: buildNoopAdminModuleScript()
      });
    });
  }

  await page.addInitScript(
    ({ orderId, initialOrder }) => {
      const clone = (value) => JSON.parse(JSON.stringify(value));
      const installMockApi = (client) => {
        if (!client || client.__preOrderLifecycleApiInstalled) return;
        const originalApi = client.api ? client.api.bind(client) : null;
        client.api = async (path, options = {}) => {
          if (!window.__lubanE2E) {
            throw new Error('Pre-order lifecycle fixture is not initialized.');
          }
          window.__lubanE2E.recordApiCall(path, options);
          if (path === '/accountStatus') {
            return {
              account: {
                email: 'preorder.lifecycle@example.com',
                emailVerified: true,
                phone: '+233501234567',
                phoneVerified: true
              }
            };
          }
          if (path === '/createOrder') {
            window.__lubanE2E.setOrder(orderId, clone(initialOrder));
            return {
              orderId,
              order: {
                status: 'requested',
                requestedFor: initialOrder.requestedFor,
                requestedForLabel: initialOrder.requestedForLabel
              }
            };
          }
          if (path === '/cancelOwnOrder') {
            const targetId = options.body && options.body.orderId ? options.body.orderId : orderId;
            const order = window.__lubanE2E.getOrder(targetId) || clone(initialOrder);
            order.status = 'cancelled';
            order.cancelledAt = '2026-07-05T08:20:00.000Z';
            order.cancelledBy = 'customer';
            order.cancellationReason = 'pre_order_request_withdrawn';
            order.updatedAt = order.cancelledAt;
            window.__lubanE2E.setOrder(targetId, order);
            return { orderId: targetId, status: 'cancelled' };
          }
          if (path === '/deleteOwnOrder') {
            return { orderId, deleted: true };
          }
          if (originalApi) return originalApi(path, options);
          throw new Error(`Unexpected API call: ${path}`);
        };
        client.__preOrderLifecycleApiInstalled = true;
      };

      let lubanClientValue;
      Object.defineProperty(window, 'lubanClient', {
        configurable: true,
        get() {
          return lubanClientValue;
        },
        set(value) {
          lubanClientValue = value;
          installMockApi(lubanClientValue);
        }
      });
    },
    { orderId: PRE_ORDER_ID, initialOrder: PRE_ORDER_FIXTURE }
  );
}

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
    await mockBrowserDate(page, '2026-07-02T12:00:00Z');
    await page.goto('/checkout.html', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
    await expect(page.locator('#business-hours-notice')).toHaveClass(/hidden/);
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
        { id: 'DR1', name: 'Coca-Cola 300ml', price: 15, quantity: 3 }
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

  test('checkout explains after-hours pre-order requests', async ({ page }) => {
    await mockBrowserDate(page, '2026-07-04T12:00:00Z');
    await page.goto('/checkout.html', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#business-hours-notice')).toBeVisible();
    await expect(page.locator('#business-hours-copy')).toContainText('pre-order request');
    await expect(page.locator('#business-hours-copy')).toContainText('Monday');
    await expect(page.locator('#place-order-btn')).toHaveText('Send Pre-order Request');
  });

  test('order status page exposes the protected tracking flow', async ({ page }) => {
    await page.goto('/order-status.html?order=test-order', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Order Status' })).toBeVisible();
    await expect(page.locator('#auth-gate')).toBeVisible();
    await expect(page.locator('#order-content')).toHaveClass(/hidden/);
    await expect(page.locator('#refresh-btn')).toHaveText('Refresh Status');
  });

  test('Jul 4-5 pre-order request lifecycle is covered without a live order', async ({ page }) => {
    await installPreOrderLifecycleFixture(page);
    await mockBrowserDate(page, '2026-07-04T12:00:00Z');

    await page.goto('/checkout.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.lubanClient.writeCart([
        { id: 'R1', name: 'Steamed Rice', price: 29, quantity: 2 },
        { id: 'DR1', name: 'Coca-Cola 300ml', price: 15, quantity: 1 }
      ]);
      const takeout = document.querySelector('input[name="order-type"][value="takeout"]');
      takeout.checked = true;
      takeout.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(page.locator('#auth-gate')).toHaveClass(/hidden/);
    await expect(page.locator('#checkout-content')).toBeVisible();
    await expect(page.locator('#business-hours-notice')).toBeVisible();
    await expect(page.locator('#business-hours-copy')).toContainText('pre-order request');
    await expect(page.locator('#business-hours-copy')).toContainText('Monday');
    await expect(page.locator('#business-hours-copy')).toContainText(
      'accept or reject it when service opens'
    );
    await expect(page.locator('#checkout-warning')).toContainText(
      'This will be sent as a pre-order request'
    );
    await expect(page.locator('#checkout-warning')).toContainText(
      'staff will confirm it when service opens'
    );
    await expect(page.locator('#place-order-btn')).toHaveText('Send Pre-order Request');
    await expect(page.locator('#place-order-btn')).toBeEnabled();

    await page.locator('#place-order-btn').click();
    await page.waitForURL(`**/order-status.html?order=${PRE_ORDER_ID}`);

    await expect(page.locator('#order-status-pill')).toHaveText('PRE-ORDER REQUEST');
    await expect(page.locator('#order-status-note')).toContainText(
      'Staff will accept or reject this pre-order request when service opens.'
    );
    await expect(page.locator('#order-status-note')).toContainText(
      `Requested for ${PRE_ORDER_SERVICE_LABEL}.`
    );
    await expect(page.locator('#cancel-btn')).toBeVisible();
    await expect(page.locator('#cancel-btn')).toHaveText('Withdraw Request');

    await page.locator('#cancel-btn').click();
    await expect(page.locator('.confirm-modal-panel')).toContainText(
      'Withdraw this pre-order request before staff accepts it?'
    );
    await page.locator('.confirm-ok').click();
    await expect(page.locator('#order-status-pill')).toHaveText('CANCELLED');
    await expect(
      page.locator('.toast').filter({ hasText: 'Pre-order request withdrawn.' })
    ).toBeVisible();
    await expect(page.locator('#cancel-btn')).toBeHidden();
    await expect(page.locator('#delete-btn')).toBeVisible();

    let apiCalls = await page.evaluate(() => window.__lubanE2E.getApiCalls());
    expect(apiCalls.map((call) => call.path)).toContain('/cancelOwnOrder');

    await page.evaluate(() => window.__lubanE2E.resetOrder());
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.listenToOrders === 'function');
    await page.evaluate(() => {
      window.switchTab('orders');
      window.listenToOrders();
    });

    const adminRow = page.locator(`[data-order-id="${PRE_ORDER_ID}"]`);
    await expect(adminRow).toContainText('REQUESTED');
    await expect(adminRow).toContainText(`Requested for ${PRE_ORDER_SERVICE_LABEL}`);
    await expect(adminRow.getByRole('button', { name: 'Accept pre-order request' })).toBeVisible();
    await expect(adminRow.getByRole('button', { name: 'Reject pre-order request' })).toBeVisible();

    await adminRow.getByRole('button', { name: 'Accept pre-order request' }).click();
    await expect(adminRow).toContainText('ACCEPTED');
    await expect(
      adminRow.getByRole('button', { name: 'Start accepted pre-order preparation' })
    ).toBeVisible();

    const acceptedOrder = await page.evaluate(
      (orderId) => window.__lubanE2E.getOrder(orderId),
      PRE_ORDER_ID
    );
    expect(acceptedOrder.status).toBe('accepted');
    expect(acceptedOrder.acceptedBy).toBe('preorder.lifecycle@example.com');
    expect(acceptedOrder.acceptedAt).toBeTruthy();

    await page.goto(`/order-status.html?order=${PRE_ORDER_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#order-status-pill')).toHaveText('ACCEPTED');
    await expect(page.locator('#order-status-note')).toContainText(
      'Staff accepted this pre-order request and will update it when preparation starts.'
    );
    await expect(page.locator('#order-status-note')).toContainText(
      `Requested for ${PRE_ORDER_SERVICE_LABEL}.`
    );
    await expect(page.locator('#cancel-btn')).toBeHidden();

    apiCalls = await page.evaluate(() => window.__lubanE2E.getApiCalls());
    expect(apiCalls.map((call) => call.path)).toContain('/createOrder');
  });
});
