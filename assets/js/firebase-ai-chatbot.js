import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import {
  initializeFirestore,
  getFirestore,
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';
import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js';

const SCRIPT_URL = new URL(import.meta.url);
const SITE_ROOT = new URL('../../', SCRIPT_URL);

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDxgdwU84vFNoCOUTl-HRdGYonLIcDaXFw',
  authDomain: 'luban-workshop-restaurant.firebaseapp.com',
  projectId: 'luban-workshop-restaurant',
  storageBucket: 'luban-workshop-restaurant.firebasestorage.app',
  messagingSenderId: '360623290287',
  appId: '1:360623290287:web:89fae5ebbb342e5e13e15a'
};

const DEFAULT_CHATBOT_CONFIG = {
  appName: 'luban-workshop-chatbot'
};

const CHATBOT_CONFIG = {
  ...DEFAULT_CHATBOT_CONFIG,
  ...(window.LUBAN_CHATBOT_CONFIG || {})
};
const BAO_CHAT_AVATAR_URL = new URL('../mascots/bao-chat-avatar.png', import.meta.url).href;

if (typeof window !== 'undefined' && typeof Image === 'function') {
  window.__lubanBaoChatAvatarPreload = window.__lubanBaoChatAvatarPreload || new Image();
  window.__lubanBaoChatAvatarPreload.src = BAO_CHAT_AVATAR_URL;
}

const CONTACT = {
  restaurant: 'Luban Workshop Restaurant',
  siteUrl: 'https://lubanrestaurant.com',
  phone: '020 543 8455',
  email: 'reservations@lubanrestaurant.com',
  address: 'Cafe Roof Top, Casford Street, University of Cape Coast (UCC), Cape Coast, Ghana',
  hours: 'Monday to Friday, 11:00 to 17:30',
  contactPage: 'contact-us.html',
  reservationPage: 'events-and-catering.html#reservation',
  menuPage: 'menu.html',
  qrPage: 'assets/qr-codes/index.html',
  qrImage: 'assets/qr-codes/lubanrestaurant-com.png',
  instagram: 'https://www.instagram.com/lubanworkshoprestaurant/',
  facebook: 'https://www.facebook.com/profile.php/?id=61583678376642'
};

const MENU = [
  { id: 'SP1', name: 'Chicken & Sweet Corn Soup', category: 'Soups', price: 40, description: 'A smooth, savoury broth with tender chicken and sweet corn' },
  { id: 'SP2', name: 'Hot & Sour Soup', category: 'Soups', price: 40, description: 'Traditional Chinese hot and sour broth with tofu and vegetables' },
  { id: 'S1', name: 'Beef Spring Rolls (3 pcs)', category: 'Starters', price: 30, description: 'Crispy spring rolls filled with seasoned beef' },
  { id: 'S2', name: 'Vegetable Spring Rolls (3 pcs)', category: 'Starters', price: 25, description: 'Crispy spring rolls filled with fresh vegetables' },
  { id: 'S3', name: 'Beef Samosa (5 pcs)', category: 'Starters', price: 30, description: 'Golden fried samosas filled with spiced beef' },
  { id: 'S4', name: 'Fish Samosa (5 pcs)', category: 'Starters', price: 30, description: 'Golden fried samosas filled with seasoned fish' },
  { id: 'S5', name: 'Fried Chicken Pieces (6 pcs)', category: 'Starters', price: 65, description: 'Crispy fried chicken pieces, perfectly seasoned' },
  { id: 'S6', name: 'Special Chicken Wings', category: 'Starters', price: 65, description: 'Crispy chicken wings with our special seasoning' },
  { id: 'S7', name: 'Golden Fried Prawns', category: 'Starters', price: 90, description: 'Crunchy golden-fried prawns served with dipping sauce' },
  { id: 'S8', name: 'Fried Squid in Spicy Salt', category: 'Starters', price: 85, description: 'Tender squid fried with spicy salt seasoning' },
  { id: 'B1', name: 'Shredded Beef with Green Pepper & Onion', category: 'Beef & Lamb', price: 110, description: 'Tender shredded beef stir-fried with green pepper and onion in a savoury sauce' },
  { id: 'B2', name: 'Beef in Sichuan Sauce', category: 'Beef & Lamb', price: 110, description: 'Sliced beef in spicy, aromatic Sichuan sauce' },
  { id: 'B3', name: 'Sliced Beef in Curry Sauce', category: 'Beef & Lamb', price: 110, description: 'Tender sliced beef cooked in a rich curry sauce' },
  { id: 'B4', name: 'Beef in Oyster Sauce', category: 'Beef & Lamb', price: 110, description: 'Succulent beef cooked in rich oyster sauce' },
  { id: 'B5', name: 'Crispy Chilli Beef', category: 'Beef & Lamb', price: 85, description: 'Crispy strips of beef in a tangy chilli sauce' },
  { id: 'B6', name: 'Mongolian Shallot Lamb', category: 'Beef & Lamb', price: 115, description: 'Tender lamb stir-fried with shallots in Mongolian style' },
  { id: 'B7', name: 'Lamb Chops', category: 'Beef & Lamb', price: 85, description: 'Grilled lamb chops with herbs and spices' },
  { id: 'P1', name: 'Sweet & Sour Pork', category: 'Pork', price: 90, description: 'Classic pork in sweet and sour sauce with peppers and pineapple' },
  { id: 'P2', name: 'Pork Sichuan Style', category: 'Pork', price: 90, description: 'Pork cooked in bold, spicy Sichuan sauce' },
  { id: 'P3', name: 'Pork in Chilli Sauce', category: 'Pork', price: 90, description: 'Tender pork in a fiery chilli sauce' },
  { id: 'P4', name: 'Pork in Oyster Sauce', category: 'Pork', price: 90, description: 'Savoury pork in rich oyster sauce' },
  { id: 'P5', name: 'Fried Pork Ribs', category: 'Pork', price: 75, description: 'Crispy fried pork ribs with seasoning' },
  { id: 'K1', name: 'Sweet & Sour Chicken', category: 'Chicken', price: 100, description: 'Crispy chicken in classic sweet and sour sauce' },
  { id: 'K2', name: 'Chicken Sichuan Sauce', category: 'Chicken', price: 100, description: 'Tender chicken in spicy Sichuan sauce' },
  { id: 'K3', name: 'Chicken in Curry Sauce', category: 'Chicken', price: 100, description: 'Juicy chicken cooked in aromatic curry sauce' },
  { id: 'K4', name: 'Chicken in Oyster Sauce', category: 'Chicken', price: 100, description: 'Succulent chicken in rich oyster sauce' },
  { id: 'Q1', name: 'Squid in Luban Chilli Sauce', category: 'Seafood', price: 120, description: 'Tender squid in our signature Luban chilli sauce' },
  { id: 'Q2', name: 'Squid in Sichuan Sauce', category: 'Seafood', price: 120, description: 'Squid cooked in bold Sichuan sauce' },
  { id: 'Q3', name: 'Squid in Garlic Sauce', category: 'Seafood', price: 120, description: 'Squid in fragrant garlic sauce' },
  { id: 'F1', name: 'Fish Fillet in Chilli Sauce', category: 'Seafood', price: 115, description: 'Tender fish fillet in a fiery chilli sauce' },
  { id: 'F2', name: 'Fish Fillet in Vegetable Sauce', category: 'Seafood', price: 115, description: 'Fish fillet cooked with fresh vegetables' },
  { id: 'F3', name: 'Fish Fillet in Sichuan Sauce', category: 'Seafood', price: 115, description: 'Fish fillet in spicy Sichuan sauce' },
  { id: 'F4', name: 'Sweet & Sour Fish Fillet', category: 'Seafood', price: 115, description: 'Tender fish fillet in sweet and sour sauce' },
  { id: 'PR1', name: 'Prawns in Chilli Sauce', category: 'Seafood', price: 155, description: 'Succulent prawns in spicy chilli sauce' },
  { id: 'PR2', name: 'Prawns in Curry Sauce', category: 'Seafood', price: 155, description: 'Juicy prawns in aromatic curry sauce' },
  { id: 'PR3', name: 'Prawns in Sichuan Sauce', category: 'Seafood', price: 155, description: 'Prawns in bold Sichuan sauce' },
  { id: 'SF1', name: 'Special Seafood in Sichuan Sauce', category: 'Seafood', price: 170, description: 'A premium selection of seafood in signature Sichuan sauce' },
  { id: 'R1', name: 'Steamed Rice', category: 'Rice', price: 29, description: 'Plain steamed white rice' },
  { id: 'R2', name: 'Special Jollof Rice', category: 'Rice', price: 50, description: 'Fragrant jollof rice cooked in a special blend of spices' },
  { id: 'R3', name: 'Combo Fried Rice', category: 'Rice', price: 50, description: 'Fried rice with a combination of vegetables and meat' },
  { id: 'R4', name: 'Shrimp Fried Rice', category: 'Rice', price: 50, description: 'Fried rice with succulent shrimp' },
  { id: 'R5', name: 'Egg Fried Rice', category: 'Rice', price: 40, description: 'Classic egg fried rice' },
  { id: 'R6', name: 'Beef Fried Rice', category: 'Rice', price: 45, description: 'Fried rice with tender beef' },
  { id: 'R7', name: 'Chicken Fried Rice', category: 'Rice', price: 45, description: 'Fried rice with juicy chicken' },
  { id: 'R8', name: 'Seafood Fried Rice', category: 'Rice', price: 85, description: 'Fried rice with a medley of fresh seafood' },
  { id: 'R9', name: 'Pork Fried Rice', category: 'Rice', price: 45, description: 'Fried rice with pork' },
  { id: 'N1', name: 'Vegetable Noodles', category: 'Noodles', price: 45, description: 'Wok-tossed noodles with fresh vegetables' },
  { id: 'N2', name: 'Special Noodles', category: 'Noodles', price: 80, description: 'Our special noodle dish with a mix of proteins and vegetables' },
  { id: 'N4', name: 'Singapore Noodles', category: 'Noodles', price: 80, description: 'Vermicelli noodles with prawns, pork and vegetables in curry sauce' },
  { id: 'N5', name: 'Seafood Noodles', category: 'Noodles', price: 100, description: 'Noodles with a generous serving of fresh seafood' },
  { id: 'N6', name: 'Chicken Noodles', category: 'Noodles', price: 60, description: 'Noodles stir-fried with tender chicken' },
  { id: 'D1', name: 'Steamed Pork Dumpling', category: 'Dumplings', price: 30, description: 'Handcrafted steamed dumplings filled with seasoned pork' },
  { id: 'D2', name: 'Fried Pork Dumpling', category: 'Dumplings', price: 30, description: 'Crispy fried dumplings filled with seasoned pork' },
  { id: 'D3', name: 'Steamed Beef Dumpling', category: 'Dumplings', price: 30, description: 'Handcrafted steamed dumplings filled with seasoned beef' },
  { id: 'D4', name: 'Fried Beef Dumpling', category: 'Dumplings', price: 30, description: 'Crispy fried dumplings filled with seasoned beef' },
  { id: 'V1', name: 'Mixed Vegetable Sauce', category: 'Vegetable', price: 40, description: 'A medley of fresh vegetables in a savoury sauce' },
  { id: 'DR1', name: 'Coca-Cola 300ml', category: 'Drinks', price: 15, description: 'Refreshing Coca-Cola 300ml bottle' },
  { id: 'DR2', name: 'Fanta 300ml', category: 'Drinks', price: 15, description: 'Refreshing Fanta 300ml bottle' },
  { id: 'DR3', name: 'Sprite 300ml', category: 'Drinks', price: 15, description: 'Refreshing Sprite 300ml bottle' },
  { id: 'DR4', name: 'Water 300ml', category: 'Drinks', price: 5, description: 'Still mineral water 300ml bottle' }
];

const CEDI_SYMBOL = '\u20b5';
const PRICE_UNLISTED_TEXT = 'price available on request';
const ORDER_HISTORY_URL = 'index.html#my-orders';
const ADMIN_PANEL_URL = 'admin.html';
const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', aliases: ['overview', 'dashboard', 'home', 'command center'] },
  { id: 'menu', label: 'Menu Manager', aliases: ['menu', 'menu manager', 'dishes', 'prices', 'availability'] },
  { id: 'reservations', label: 'Reservations', aliases: ['reservation', 'reservations', 'booking', 'bookings', 'tables'] },
  { id: 'orders', label: 'Orders', aliases: ['order', 'orders', 'kitchen', 'tickets', 'incoming orders'] },
  { id: 'promotions', label: 'Promotions & Deals', aliases: ['promotion', 'promotions', 'deals', 'offers'] },
  { id: 'special-menus', label: 'Special Menus', aliases: ['special menu', 'special menus', 'qr menu', 'qr menus', 'event menus'] },
  { id: 'admin-users', label: 'Admin Users', aliases: ['admin users', 'admins', 'staff access', 'access'] },
  { id: 'messages', label: 'Messages & AI', aliases: ['messages', 'inbox', 'contact messages', 'ai reports', 'assistant reports'] },
  { id: 'fraud-review', label: 'Fraud Review', aliases: ['fraud', 'fraud review', 'security', 'security events', 'risk'] },
  { id: 'chatbot-knowledge', label: 'Chatbot Facts', aliases: ['chatbot facts', 'bao facts', 'chatbot knowledge', 'knowledge facts', 'facts'] },
  { id: 'account', label: 'Account Settings', aliases: ['account', 'settings', 'sms', 'sms campaigns', 'campaigns'] }
];

const state = {
  open: false,
  busy: false,
  app: null,
  authApp: null,
  auth: null,
  db: null,
  authReadyPromise: null,
  currentUser: null,
  account: null,
  accountPromise: null,
  menuCatalog: null,
  menuCatalogPromise: null,
  adminContext: null,
  adminSummary: null,
  adminSummaryPromise: null,
  pendingReport: null,
  lockedScrollY: 0,
  previousHtmlOverflow: '',
  previousBodyOverflow: '',
  previousBodyPosition: '',
  previousBodyTop: '',
  previousBodyWidth: '',
  previousBodyTouchAction: '',
  history: []
};

function initFirebase() {
  if (!state.app) {
    try {
      state.app = getApp(CHATBOT_CONFIG.appName);
    } catch (error) {
      state.app = initializeApp(FIREBASE_CONFIG, CHATBOT_CONFIG.appName);
    }
  }

  if (!state.authApp) {
    try {
      state.authApp = getApp();
    } catch (error) {
      state.authApp = initializeApp(FIREBASE_CONFIG);
    }
  }

  if (!state.auth) {
    state.auth = getAuth(state.authApp);
    state.authReadyPromise = new Promise((resolve) => {
      let resolved = false;
      onAuthStateChanged(
        state.auth,
        (user) => {
          const previousUid = state.currentUser && state.currentUser.uid;
          state.currentUser = user || null;
          if (previousUid !== (user && user.uid)) {
            state.account = null;
            state.accountPromise = null;
          }
          if (!resolved) {
            resolved = true;
            resolve(state.currentUser);
          }
        },
        () => {
          state.currentUser = null;
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }
      );
    });
  }

  if (!state.db) {
    try {
      state.db = initializeFirestore(state.app, { experimentalForceLongPolling: true });
    } catch (error) {
      state.db = getFirestore(state.app);
    }
  }

}

function getApiBase() {
  const config = window.LUBAN_SITE_CONFIG || {};
  return String(config.apiBase || '/api').replace(/\/+$/, '');
}

async function apiRequest(path, options = {}) {
  const opts = { method: 'GET', ...options };
  const headers = { ...(opts.headers || {}) };
  const user = opts.user || null;

  if (user && typeof user.getIdToken === 'function') {
    const token = await user.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    method: opts.method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  });
  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
  }

  if (!response.ok) {
    const fallback = rawText && rawText.trim() ? rawText.trim() : 'Request failed';
    throw new Error(data.error || fallback);
  }

  return data;
}

function getAssistantRequestHistory() {
  return state.history.slice(-12).map((item) => ({
    role: item.role,
    text: String(item.text || '').slice(0, 1000)
  }));
}

function getActiveAdminPanelLabel() {
  const activeTab = ADMIN_TABS.find((tab) => {
    const view = document.getElementById(`view-${tab.id}`);
    return view && !view.classList.contains('hidden');
  });
  return activeTab ? activeTab.label : '';
}

async function requestAssistantAgent(mode, body = {}) {
  const user = await waitForCurrentUser();
  const adminContext = isAdminAssistantMode()
    ? {
        ...state.adminContext,
        panel: getActiveAdminPanelLabel() || (state.adminContext && state.adminContext.panel) || 'admin'
      }
    : null;

  const response = await apiRequest('/assistant/chat', {
    method: 'POST',
    user,
    body: {
      mode,
      history: getAssistantRequestHistory(),
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      adminContext,
      ...body
    }
  });

  if (!response || response.ok !== true) {
    throw new Error(response && response.error ? response.error : 'Assistant request failed.');
  }

  return response;
}

async function waitForCurrentUser() {
  initFirebase();
  if (state.authReadyPromise) await state.authReadyPromise;
  return state.currentUser || (state.auth && state.auth.currentUser) || null;
}

async function getCurrentAccount(options = {}) {
  const user = await waitForCurrentUser();
  if (!user) {
    state.account = null;
    return null;
  }

  if (!options.force && state.account && state.account.uid === user.uid) {
    return state.account;
  }
  if (!options.force && state.accountPromise) {
    return state.accountPromise;
  }

  state.accountPromise = apiRequest('/accountStatus', { method: 'GET', user })
    .then((data) => {
      state.account = data && data.account ? data.account : buildFallbackAccount(user);
      return state.account;
    })
    .catch((error) => {
      console.warn('Could not load signed-in customer context:', error);
      state.account = buildFallbackAccount(user);
      return state.account;
    })
    .finally(() => {
      state.accountPromise = null;
    });

  return state.accountPromise;
}

function buildFallbackAccount(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email || '',
    emailMasked: maskEmailAddress(user.email || ''),
    emailVerified: user.emailVerified === true,
    phone: '',
    phoneMasked: '',
    phoneVerified: false,
    verificationStatus: user.emailVerified ? 'phone_pending' : 'pending',
    name: user.displayName || '',
    preferredContact: 'email',
    notes: ''
  };
}

function sanitizeAdminContext(context) {
  if (!context || context.isAdmin !== true) return null;
  const email = String(context.email || '').trim();
  const uid = String(context.uid || '').trim();
  if (!email && !uid) return null;

  return {
    isAdmin: true,
    uid,
    email,
    displayName: String(context.displayName || '').trim(),
    panel: String(context.panel || 'admin').trim(),
    verifiedAt: String(context.verifiedAt || '').trim()
  };
}

function syncAdminContext(context) {
  const sourceContext = arguments.length ? context : window.LUBAN_BAO_ADMIN_CONTEXT;
  const nextContext = sanitizeAdminContext(sourceContext);
  const previousEmail = state.adminContext && state.adminContext.email;
  state.adminContext = nextContext;

  if (!nextContext || previousEmail !== nextContext.email) {
    state.adminSummary = null;
    state.adminSummaryPromise = null;
  }

  updateChatbotModeUi();
}

function isAdminAssistantMode() {
  return Boolean(state.adminContext && state.adminContext.isAdmin === true);
}

function getAssistantStatusText() {
  return isAdminAssistantMode() ? 'Admin assistant' : 'Restaurant concierge';
}

function updateChatbotModeUi() {
  const root = document.getElementById('luban-ai-chatbot');
  const status = document.querySelector('[data-luban-status]');
  const input = document.querySelector('[data-luban-input]');
  const title = document.getElementById('luban-chatbot-title');

  if (root) root.classList.toggle('luban-chatbot--admin', isAdminAssistantMode());
  if (status && !state.busy) status.textContent = getAssistantStatusText();
  if (input) {
    input.placeholder = isAdminAssistantMode()
      ? 'Ask Bao about admin operations...'
      : 'Message Bao...';
    input.setAttribute(
      'aria-label',
      isAdminAssistantMode()
        ? 'Ask Bao about admin operations'
        : 'Ask Bao about the restaurant'
    );
  }
  if (title) title.textContent = 'Bao';
}

if (typeof window !== 'undefined') {
  syncAdminContext(window.LUBAN_BAO_ADMIN_CONTEXT);
  window.addEventListener('luban:bao-admin-context', (event) => {
    syncAdminContext(event.detail);
  });
}

function maskEmailAddress(email) {
  const value = String(email || '').trim();
  const parts = value.split('@');
  if (parts.length !== 2) return value;
  const local = parts[0];
  return `${local.slice(0, 2)}***@${parts[1]}`;
}

function injectStyles() {
  if (document.getElementById('luban-ai-chatbot-styles')) return;

  const style = document.createElement('style');
  style.id = 'luban-ai-chatbot-styles';
  style.textContent = `
    .luban-chatbot { position: fixed; right: 18px; bottom: calc(18px + var(--luban-chatbot-cookie-offset, 0px)); z-index: 55; font-family: Lato, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; pointer-events: none; }
    .luban-chatbot * { box-sizing: border-box; }
    .luban-chatbot__button { position: relative; min-width: 0; height: 54px; border: 1px solid rgba(15,23,42,.1); border-radius: 999px; background: rgba(255,255,255,.88); color: #111827; display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 6px 8px 6px 14px; box-shadow: 0 18px 46px rgba(15,23,42,.18), 0 0 0 1px rgba(239,68,68,.1), inset 0 1px 0 rgba(255,255,255,.9); cursor: pointer; transition: transform .2s ease, background .2s ease, border-color .2s ease, color .2s ease, opacity .18s ease, box-shadow .2s ease; pointer-events: auto; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
    .luban-chatbot__button::before { content: ""; position: absolute; inset: -7px; border-radius: 999px; background: radial-gradient(closest-side, rgba(14,165,233,.55), rgba(239,68,68,.32) 70%, transparent 82%); filter: blur(11px); opacity: .5; z-index: -1; pointer-events: none; animation: luban-chatbot-bao-glow 2.6s ease-in-out infinite; }
    .luban-chatbot__button:hover { background: #fff; border-color: rgba(14,165,233,.34); transform: translateY(-2px); box-shadow: 0 22px 54px rgba(15,23,42,.22), 0 0 0 1px rgba(239,68,68,.14), inset 0 1px 0 rgba(255,255,255,1); }
    .luban-chatbot__button--open { min-width: 58px; padding: 0 16px; color: #111827; background: #fff; border-color: rgba(15,23,42,.12); }
    .luban-chatbot__button--open:hover { background: #fff; border-color: rgba(14,165,233,.4); }
    .luban-chatbot__button:focus-visible, .luban-chatbot button:focus-visible, .luban-chatbot textarea:focus-visible { outline: 3px solid rgba(125,211,252,.34); outline-offset: 3px; }
    .luban-chatbot__button svg { width: 22px; height: 22px; display: block; flex: 0 0 auto; }
    .luban-chatbot__button .luban-chatbot__bao-face { width: 40px; height: 40px; display: block; flex: 0 0 auto; border-radius: 50%; box-shadow: 0 0 0 1px rgba(15,23,42,.08), 0 0 20px rgba(14,165,233,.18); }
    .luban-chatbot__button-label { font-size: 13px; font-weight: 800; line-height: 1; white-space: nowrap; letter-spacing: 0; }
    .luban-chatbot__panel { position: absolute; right: 0; bottom: 78px; width: min(404px, calc(100vw - 28px)); height: min(642px, calc(100dvh - 118px)); max-height: min(642px, calc(100vh - 118px)); background: #fff; border: 1px solid rgba(15,23,42,.1); border-radius: 8px; box-shadow: 0 30px 90px rgba(15,23,42,.24), 0 0 0 1px rgba(14,165,233,.08); overflow: hidden; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; transform-origin: bottom right; opacity: 0; pointer-events: none; transform: translateY(12px) scale(.98); transition: opacity .18s ease, transform .18s ease; overscroll-behavior: contain; backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); }
    .luban-chatbot__panel::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgba(14,165,233,.5), rgba(239,68,68,.55), rgba(14,165,233,.5)); height: 2px; opacity: .85; transform: translateX(-65%); }
    .luban-chatbot__panel[hidden] { display: none; }
    .luban-chatbot--open { z-index: 10010; pointer-events: auto; }
    .luban-chatbot--open .luban-chatbot__panel { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
    .luban-chatbot--open .luban-chatbot__button { opacity: 0; pointer-events: none; transform: translateY(6px) scale(.96); }
    .luban-chatbot--busy .luban-chatbot__panel::before { animation: luban-chatbot-scan 1.2s ease-in-out infinite; }
    .luban-chatbot__header { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 14px; background: rgba(255,255,255,.88); color: #111827; border-bottom: 1px solid rgba(15,23,42,.08); flex-shrink: 0; box-shadow: inset 0 -1px 0 rgba(14,165,233,.08); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
    .luban-chatbot__title { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .luban-chatbot__mark { width: 36px; height: 36px; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 0 1px rgba(15,23,42,.08), 0 0 22px rgba(14,165,233,.16); }
    .luban-chatbot__mark .luban-chatbot__bao-face { width: 36px; height: 36px; display: block; border-radius: 50%; }
    .luban-chatbot--busy .luban-chatbot__mark { animation: luban-chatbot-avatar-pulse 1.4s ease-in-out infinite; }
    .luban-chatbot__name { font-weight: 900; font-size: 15px; line-height: 1.1; letter-spacing: 0; }
    .luban-chatbot__status { position: relative; color: #64748b; font-size: 11px; line-height: 1.2; margin-top: 4px; max-width: 250px; padding-left: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .luban-chatbot__status::before { content: ""; position: absolute; left: 0; top: 50%; width: 5px; height: 5px; border-radius: 50%; background: #0ea5e9; box-shadow: 0 0 10px rgba(14,165,233,.75); transform: translateY(-50%); }
    .luban-chatbot--busy .luban-chatbot__status::before { animation: luban-chatbot-dot-pulse 1s ease-in-out infinite; }
    .luban-chatbot--admin .luban-chatbot__panel::before { background: linear-gradient(90deg, rgba(15,118,110,.55), rgba(185,28,28,.62), rgba(197,139,43,.58)); }
    .luban-chatbot--admin .luban-chatbot__status::before { background: #b91c1c; box-shadow: 0 0 10px rgba(185,28,28,.72); }
    .luban-chatbot--admin .luban-chatbot__typing { border-color: rgba(185,28,28,.22); box-shadow: 0 10px 26px rgba(185,28,28,.1), inset 0 1px 0 rgba(255,255,255,.95); }
    .luban-chatbot__icon-btn { border: 1px solid rgba(15,23,42,.1); width: 34px; height: 34px; border-radius: 8px; background: #fff; color: #111827; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease; }
    .luban-chatbot__icon-btn:hover { background: #f8fafc; border-color: rgba(14,165,233,.32); color: #0f172a; transform: translateY(-1px); }
    .luban-chatbot__icon-btn svg { width: 18px; height: 18px; }
    .luban-chatbot__messages { min-height: 0; overflow-y: auto; padding: 16px 14px; background: repeating-linear-gradient(90deg, rgba(14,165,233,.055) 0 1px, transparent 1px 42px), repeating-linear-gradient(0deg, rgba(15,23,42,.035) 0 1px, transparent 1px 42px), linear-gradient(180deg, #fff 0%, #f8fbff 100%); display: flex; flex-direction: column; gap: 11px; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; scrollbar-color: rgba(15,23,42,.22) transparent; }
    .luban-chatbot__message-row { max-width: 100%; display: flex; align-items: flex-end; gap: 8px; }
    .luban-chatbot__message-row--bot { align-self: flex-start; max-width: 94%; }
    .luban-chatbot__message-row--user { align-self: flex-end; justify-content: flex-end; max-width: 88%; }
    .luban-chatbot__avatar { width: 31px; height: 31px; flex: 0 0 31px; border-radius: 50%; align-self: flex-end; margin-bottom: 2px; box-shadow: 0 0 0 1px rgba(15,23,42,.08), 0 0 18px rgba(14,165,233,.14); }
    .luban-chatbot__avatar .luban-chatbot__bao-face { width: 100%; height: 100%; display: block; border-radius: 50%; }
    .luban-chatbot__avatar--typing { animation: luban-chatbot-avatar-pulse 1.4s ease-in-out infinite; }
    .luban-chatbot__message { min-width: 0; max-width: 100%; border-radius: 8px; padding: 10px 12px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
    .luban-chatbot__message--bot { background: rgba(255,255,255,.92); border: 1px solid rgba(15,23,42,.09); color: #111827; border-bottom-left-radius: 3px; box-shadow: 0 10px 26px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.95); }
    .luban-chatbot__message--user { background: linear-gradient(135deg, #ef4444, #991b1b); color: #fff; border-bottom-right-radius: 3px; box-shadow: 0 10px 26px rgba(153,27,27,.22); }
    .luban-chatbot__link { color: #b91c1c; font-weight: 800; text-decoration: underline; text-underline-offset: 2px; }
    .luban-chatbot__link:hover { color: #0284c7; }
    .luban-chatbot__typing-row { align-self: flex-start; max-width: 94%; display: flex; align-items: flex-end; gap: 8px; }
    .luban-chatbot__typing { position: relative; min-width: 176px; overflow: hidden; color: #475569; font-size: 13px; font-weight: 800; padding: 9px 12px; border: 1px solid rgba(14,165,233,.2); border-radius: 8px; border-bottom-left-radius: 3px; background: rgba(255,255,255,.94); box-shadow: 0 10px 26px rgba(14,165,233,.12), inset 0 1px 0 rgba(255,255,255,.95); }
    .luban-chatbot__typing::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(14,165,233,.12), transparent); transform: translateX(-100%); animation: luban-chatbot-shimmer 1.45s ease-in-out infinite; }
    .luban-chatbot__typing-label { position: relative; z-index: 1; }
    .luban-chatbot__typing-dots { position: relative; z-index: 1; display: inline-flex; gap: 4px; margin-left: 7px; vertical-align: middle; }
    .luban-chatbot__typing-dots span { width: 5px; height: 5px; border-radius: 50%; background: #0ea5e9; box-shadow: 0 0 10px rgba(14,165,233,.65); animation: luban-chatbot-dot-bounce .95s ease-in-out infinite; }
    .luban-chatbot__typing-dots span:nth-child(2) { animation-delay: .14s; }
    .luban-chatbot__typing-dots span:nth-child(3) { animation-delay: .28s; }
    .luban-chatbot__form { padding: 12px; border-top: 1px solid rgba(15,23,42,.08); background: rgba(255,255,255,.92); display: grid; grid-template-columns: 1fr 44px; gap: 9px; align-items: end; flex-shrink: 0; box-shadow: inset 0 1px 0 rgba(14,165,233,.08); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
    .luban-chatbot__input { min-height: 44px; max-height: 112px; resize: none; border: 1px solid rgba(15,23,42,.12); border-radius: 8px; padding: 11px 12px; font: inherit; font-size: 14px; color: #111827; background: #fff; caret-color: #0ea5e9; transition: border-color .18s ease, background .18s ease, box-shadow .18s ease; }
    .luban-chatbot__input::placeholder { color: #94a3b8; }
    .luban-chatbot__input:focus { border-color: rgba(14,165,233,.48); background: #fff; box-shadow: 0 0 0 1px rgba(14,165,233,.16), 0 0 0 6px rgba(14,165,233,.08); }
    .luban-chatbot--busy .luban-chatbot__input { border-color: rgba(14,165,233,.38); box-shadow: 0 0 0 1px rgba(14,165,233,.14), 0 0 0 6px rgba(14,165,233,.08); animation: luban-chatbot-input-glow 1.4s ease-in-out infinite; }
    .luban-chatbot__send { width: 44px; height: 44px; border: 1px solid rgba(239,68,68,.18); border-radius: 8px; background: #ef4444; color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 22px rgba(239,68,68,.22); transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease; }
    .luban-chatbot__send:hover:not(:disabled) { background: #f87171; border-color: rgba(239,68,68,.28); transform: translateY(-1px); box-shadow: 0 14px 28px rgba(239,68,68,.26); }
    .luban-chatbot__send:disabled { opacity: .88; cursor: not-allowed; background: #111827; border-color: rgba(15,23,42,.14); box-shadow: 0 10px 22px rgba(15,23,42,.18); }
    .luban-chatbot__send:disabled svg { animation: luban-chatbot-send-spin 1.1s linear infinite; }
    .luban-chatbot__send svg { width: 19px; height: 19px; }
    @keyframes luban-chatbot-scan { 0% { transform: translateX(-70%); } 55% { transform: translateX(70%); } 100% { transform: translateX(120%); } }
    @keyframes luban-chatbot-avatar-pulse { 0%, 100% { box-shadow: 0 0 0 1px rgba(15,23,42,.08), 0 0 18px rgba(14,165,233,.14); transform: translateY(0); } 50% { box-shadow: 0 0 0 1px rgba(14,165,233,.25), 0 0 28px rgba(14,165,233,.32); transform: translateY(-1px); } }
    @keyframes luban-chatbot-bao-glow { 0%, 100% { opacity: .35; transform: scale(.9); } 50% { opacity: .8; transform: scale(1.14); } }
    @media (prefers-reduced-motion: reduce) { .luban-chatbot__button::before { animation: none; opacity: .5; transform: scale(1); } }
    @keyframes luban-chatbot-dot-pulse { 0%, 100% { opacity: .85; transform: translateY(-50%) scale(1); } 50% { opacity: 1; transform: translateY(-50%) scale(1.35); } }
    @keyframes luban-chatbot-dot-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .45; } 40% { transform: translateY(-4px); opacity: 1; } }
    @keyframes luban-chatbot-shimmer { 0% { transform: translateX(-110%); } 100% { transform: translateX(110%); } }
    @keyframes luban-chatbot-input-glow { 0%, 100% { box-shadow: 0 0 0 1px rgba(14,165,233,.14), 0 0 0 6px rgba(14,165,233,.08); } 50% { box-shadow: 0 0 0 1px rgba(14,165,233,.22), 0 0 0 7px rgba(14,165,233,.12); } }
    @keyframes luban-chatbot-send-spin { to { transform: rotate(360deg); } }
    @media (max-width: 520px) {
      .luban-chatbot { top: auto; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px) + var(--luban-chatbot-cookie-offset, 0px)); left: auto; width: 58px; height: 58px; display: block; padding: 0; background: transparent; transition: background .18s ease; }
      .luban-chatbot--open { top: 0; right: 0; bottom: 0; left: 0; width: auto; height: auto; display: flex; align-items: flex-end; justify-content: center; padding: 72px 10px calc(10px + env(safe-area-inset-bottom, 0px)); background: rgba(15,23,42,.28); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
      .luban-chatbot__panel { position: relative; right: auto; bottom: auto; width: 100%; height: min(620px, calc(100dvh - 96px)); max-height: calc(100vh - 96px); border-radius: 8px; transform-origin: bottom center; }
      .luban-chatbot__button { position: static; width: 58px; min-width: 58px; height: 58px; padding: 6px; border-radius: 50%; }
      .luban-chatbot__button .luban-chatbot__bao-face { width: 44px; height: 44px; }
      .luban-chatbot__button--open { padding: 0; }
      .luban-chatbot__button-label { display: none; }
      .luban-chatbot--open .luban-chatbot__button { position: absolute; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
      .luban-chatbot--open .luban-chatbot__button { opacity: 0; pointer-events: none; transform: scale(.96); }
      .luban-chatbot__status { max-width: 190px; }
    }
    @supports (height: 100svh) {
      @media (max-width: 520px) {
        .luban-chatbot__panel { height: min(620px, calc(100svh - 96px)); max-height: calc(100svh - 96px); }
      }
    }
    @media (max-width: 520px) {
      /* Keyboard open: pin the overlay to the visual viewport so the panel top stays on screen */
      .luban-chatbot--open.luban-chatbot--vv { top: var(--luban-chatbot-vv-top, 0px); bottom: auto; height: var(--luban-chatbot-vv-height, 100%); padding: 10px; }
      .luban-chatbot--open.luban-chatbot--vv .luban-chatbot__panel { height: 100%; max-height: 100%; }
    }
  `;
  document.head.appendChild(style);
}

function createIcon(name) {
  const icons = {
    baoFace: `<img class="luban-chatbot__bao-face" src="${BAO_CHAT_AVATAR_URL}" alt="" aria-hidden="true">`,
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"></path><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z"></path></svg>'
  };
  return icons[name] || '';
}

function isMobileChatViewport() {
  return window.matchMedia && window.matchMedia('(max-width: 520px)').matches;
}

function lockPageScrollForChat() {
  if (!document.body || !document.documentElement || document.body.dataset.lubanChatLocked === 'true') return;
  state.lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  state.previousHtmlOverflow = document.documentElement.style.overflow;
  state.previousBodyOverflow = document.body.style.overflow;
  state.previousBodyPosition = document.body.style.position;
  state.previousBodyTop = document.body.style.top;
  state.previousBodyWidth = document.body.style.width;
  state.previousBodyTouchAction = document.body.style.touchAction;
  document.body.dataset.lubanChatLocked = 'true';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${state.lockedScrollY}px`;
  document.body.style.width = '100%';
  document.body.style.touchAction = 'none';
}

function unlockPageScrollForChat() {
  if (!document.body || !document.documentElement || document.body.dataset.lubanChatLocked !== 'true') return;
  const scrollY = state.lockedScrollY;
  document.documentElement.style.overflow = state.previousHtmlOverflow || '';
  document.body.style.overflow = state.previousBodyOverflow || '';
  document.body.style.position = state.previousBodyPosition || '';
  document.body.style.top = state.previousBodyTop || '';
  document.body.style.width = state.previousBodyWidth || '';
  document.body.style.touchAction = state.previousBodyTouchAction || '';
  delete document.body.dataset.lubanChatLocked;
  window.scrollTo(0, scrollY);
  state.lockedScrollY = 0;
  state.previousHtmlOverflow = '';
  state.previousBodyOverflow = '';
  state.previousBodyPosition = '';
  state.previousBodyTop = '';
  state.previousBodyWidth = '';
  state.previousBodyTouchAction = '';
}

function syncPageScrollLock() {
  if (state.open && isMobileChatViewport()) {
    lockPageScrollForChat();
  } else {
    unlockPageScrollForChat();
  }
}

function updateCookieBannerOffset(root) {
  if (!root) return;
  const banner = document.getElementById('luban-cookie-banner');
  if (!banner || !document.body || !document.body.contains(banner)) {
    root.style.setProperty('--luban-chatbot-cookie-offset', '0px');
    return;
  }

  const rect = banner.getBoundingClientRect();
  root.style.setProperty('--luban-chatbot-cookie-offset', `${Math.ceil(rect.height + 12)}px`);
}

function mountChatbot() {
  if (document.getElementById('luban-ai-chatbot')) return;

  injectStyles();

  const root = document.createElement('div');
  root.id = 'luban-ai-chatbot';
  root.className = 'luban-chatbot';
  root.innerHTML = `
    <section class="luban-chatbot__panel" role="dialog" aria-modal="false" aria-labelledby="luban-chatbot-title" hidden>
      <div class="luban-chatbot__header">
        <div class="luban-chatbot__title">
          <span class="luban-chatbot__mark">${createIcon('baoFace')}</span>
          <div>
            <div id="luban-chatbot-title" class="luban-chatbot__name">Bao</div>
            <div class="luban-chatbot__status" data-luban-status>Restaurant concierge</div>
          </div>
        </div>
        <button type="button" class="luban-chatbot__icon-btn" data-luban-close aria-label="Close chat">${createIcon('x')}</button>
      </div>
      <div class="luban-chatbot__messages" data-luban-messages></div>
      <form class="luban-chatbot__form" data-luban-form>
        <textarea class="luban-chatbot__input" data-luban-input rows="1" placeholder="Message Bao..." aria-label="Ask Bao about the restaurant"></textarea>
        <button type="submit" class="luban-chatbot__send" data-luban-send aria-label="Send message">${createIcon('send')}</button>
      </form>
    </section>
    <button type="button" class="luban-chatbot__button" data-luban-toggle aria-label="Open Bao chat" aria-expanded="false" title="Open Bao chat"><span class="luban-chatbot__button-label">Ask Bao</span>${createIcon('baoFace')}</button>
  `;

  document.body.appendChild(root);
  syncAdminContext(window.LUBAN_BAO_ADMIN_CONTEXT);
  const cookieBannerObserver = new MutationObserver(() => updateCookieBannerOffset(root));
  cookieBannerObserver.observe(document.body, { childList: true });
  updateCookieBannerOffset(root);
  window.setTimeout(() => updateCookieBannerOffset(root), 0);

  const panel = root.querySelector('.luban-chatbot__panel');
  const toggle = root.querySelector('[data-luban-toggle]');
  const close = root.querySelector('[data-luban-close]');
  const form = root.querySelector('[data-luban-form]');
  const input = root.querySelector('[data-luban-input]');

  function renderToggle(open) {
    toggle.classList.toggle('luban-chatbot__button--open', open);
    toggle.innerHTML = open
      ? `${createIcon('x')}<span class="luban-chatbot__button-label">Close chat</span>`
      : `<span class="luban-chatbot__button-label">Ask Bao</span>${createIcon('baoFace')}`;
    toggle.setAttribute('aria-label', open ? 'Close Bao chat' : 'Open Bao chat');
    toggle.setAttribute('title', open ? 'Close Bao chat' : 'Open Bao chat');
  }

  toggle.addEventListener('click', () => setOpen(!state.open));
  close.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value || state.busy) return;
    input.value = '';
    autoSizeInput(input);
    handleUserMessage(value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener('input', () => autoSizeInput(input));

  root.addEventListener('click', (event) => {
    if (event.target === root && state.open) {
      setOpen(false);
      return;
    }

  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.open) setOpen(false);
  });

  window.addEventListener('resize', () => {
    syncPageScrollLock();
    updateCookieBannerOffset(root);
  });

  // Keep the panel inside the visible area when the on-screen keyboard opens.
  // Mobile keyboards shrink only the visual viewport (and pan it), so a
  // layout-viewport-sized overlay would have its top pushed off screen.
  const KEYBOARD_MIN_OVERLAP = 140;
  function syncKeyboardInsets() {
    const vv = window.visualViewport;
    if (!vv) return;
    const keyboardOverlap = window.innerHeight - vv.height;
    const keyboardOpen = state.open && keyboardOverlap > KEYBOARD_MIN_OVERLAP;
    root.classList.toggle('luban-chatbot--vv', keyboardOpen);
    if (keyboardOpen) {
      root.style.setProperty('--luban-chatbot-vv-top', `${Math.round(vv.offsetTop)}px`);
      root.style.setProperty('--luban-chatbot-vv-height', `${Math.round(vv.height)}px`);
      const messages = getMessagesEl();
      if (messages) messages.scrollTop = messages.scrollHeight;
    } else {
      root.style.removeProperty('--luban-chatbot-vv-top');
      root.style.removeProperty('--luban-chatbot-vv-height');
    }
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncKeyboardInsets);
    window.visualViewport.addEventListener('scroll', syncKeyboardInsets);
  }

  function setOpen(open) {
    state.open = open;
    root.classList.toggle('luban-chatbot--open', open);
    if (document.body) document.body.classList.toggle('luban-chatbot-open', open);
    panel.hidden = !open;
    panel.setAttribute('aria-modal', String(open));
    toggle.setAttribute('aria-expanded', String(open));
    renderToggle(open);
    syncPageScrollLock();
    updateCookieBannerOffset(root);
    syncKeyboardInsets();

    if (open) {
      ensureGreeting();
      try {
        initFirebase();
        getCurrentAccount().catch(() => null);
      } catch (error) {
        console.warn('Could not prepare Luban chatbot:', error);
      }
      window.setTimeout(() => input.focus(), 80);
    } else {
      toggle.focus();
    }
  }
}

async function ensureGreeting() {
  const messages = getMessagesEl();
  if (!messages || messages.children.length > 0) return;

  if (isAdminAssistantMode()) {
    appendMessage('bot', `Hi, I'm Bao. I can see you're in the Luban admin panel. Ask me for an operations summary, to open an admin section, or to draft replies, reservation notes, promos, SMS copy, or chatbot facts.`);
    return;
  }

  appendMessage('bot', `Hi, I'm Bao. Ask me about Luban Workshop's menu, orders, reservations, QR, or account help.`);
}

function autoSizeInput(input) {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
}

function getMessagesEl() {
  return document.querySelector('[data-luban-messages]');
}

function createBaoAvatar(extraClass = '') {
  const avatar = document.createElement('span');
  avatar.className = `luban-chatbot__avatar${extraClass ? ` ${extraClass}` : ''}`;
  avatar.innerHTML = createIcon('baoFace');
  return avatar;
}

function appendMessage(role, text) {
  const messages = getMessagesEl();
  if (!messages) return;

  const isUser = role === 'user';
  const row = document.createElement('div');
  row.className = `luban-chatbot__message-row luban-chatbot__message-row--${isUser ? 'user' : 'bot'}`;

  const bubble = document.createElement('div');
  bubble.className = `luban-chatbot__message luban-chatbot__message--${isUser ? 'user' : 'bot'}`;

  if (isUser) {
    bubble.textContent = text;
  } else {
    row.appendChild(createBaoAvatar());
    renderFormattedMessage(bubble, text);
  }

  row.appendChild(bubble);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function renderFormattedMessage(container, text) {
  const source = String(text || '')
    .replace(/\\\*/g, '*')
    .replace(/\\_/g, '_');
  const markdownLinkPattern = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkPattern.exec(source)) !== null) {
    appendFormattedInline(container, source.slice(lastIndex, match.index));
    appendSafeLink(container, match[1], match[2]);
    lastIndex = markdownLinkPattern.lastIndex;
  }

  appendFormattedInline(container, source.slice(lastIndex));
}

function appendFormattedInline(container, text) {
  const combinedPattern = /((\*{2,3}|__)([^\n]+?)\2)|((?:https?:\/\/|mailto:|tel:)[^\s<>()]+)|(\b[\w.-]+@[\w.-]+\.[A-Za-z]{2,}\b)|(\b(?:\+233|0)\s?\d{2}\s?\d{3}\s?\d{4}\b)|(\b(?:(?:contact-us|menu|faq|events-and-catering|verify-contact|checkout|order-status|reservation-status|account-security|customer-profile|index|admin)\.html|assets\/qr-codes\/(?:index\.html|lubanrestaurant-com\.png))(?:#[A-Za-z0-9_-]+)?\b)/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedPattern.exec(text)) !== null) {
    appendTextWithBreaks(container, text.slice(lastIndex, match.index));

    if (match[3]) {
      const strong = document.createElement('strong');
      strong.textContent = match[3];
      container.appendChild(strong);
    } else {
      const value = match[4] || match[5] || match[6] || match[7];
      const href = match[5]
        ? `mailto:${value}`
        : match[6]
          ? `tel:${value.replace(/\s+/g, '')}`
          : value;
      appendSafeLink(container, value, href);
    }

    lastIndex = combinedPattern.lastIndex;
  }

  appendTextWithBreaks(container, text.slice(lastIndex));
}

function appendTextWithBreaks(container, text) {
  const parts = String(text || '').split('\n');
  parts.forEach((part, index) => {
    if (index > 0) container.appendChild(document.createElement('br'));
    if (part) container.appendChild(document.createTextNode(part));
  });
}

function appendSafeLink(container, label, href) {
  const safeHref = normalizeSafeHref(href);
  if (!safeHref) {
    container.appendChild(document.createTextNode(label));
    return;
  }

  const link = document.createElement('a');
  link.href = safeHref;
  link.textContent = label;
  link.className = 'luban-chatbot__link';

  if (/^https?:\/\//i.test(safeHref)) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  container.appendChild(link);
}

function normalizeSafeHref(href) {
  const value = String(href || '').trim();
  if (!value) return '';

  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  if (/^(?:\/|\.{0,2}\/)?(?:(?:contact-us|menu|faq|events-and-catering|verify-contact|checkout|order-status|reservation-status|account-security|customer-profile|index)\.html|assets\/qr-codes\/(?:index\.html|lubanrestaurant-com\.png))(?:#[A-Za-z0-9_-]+)?$/i.test(value)) {
    return new URL(value.replace(/^(?:\/|\.{0,2}\/)/, ''), SITE_ROOT).href;
  }

  if (isAdminAssistantMode() && /^(?:\/|\.{0,2}\/)?admin\.html(?:#[A-Za-z0-9_-]+)?$/i.test(value)) {
    return new URL(value.replace(/^(?:\/|\.{0,2}\/)/, ''), SITE_ROOT).href;
  }

  return '';
}

function setBusy(busy) {
  state.busy = busy;
  const root = document.getElementById('luban-ai-chatbot');
  const input = document.querySelector('[data-luban-input]');
  const send = document.querySelector('[data-luban-send]');
  const status = document.querySelector('[data-luban-status]');
  if (root) root.classList.toggle('luban-chatbot--busy', busy);
  if (status) status.textContent = busy
    ? (isAdminAssistantMode() ? 'Checking admin signals' : 'Bao is thinking')
    : getAssistantStatusText();
  if (input) input.disabled = busy;
  if (send) send.disabled = busy;
}

function showTyping() {
  const messages = getMessagesEl();
  if (!messages) return null;

  const row = document.createElement('div');
  row.className = 'luban-chatbot__typing-row';
  row.appendChild(createBaoAvatar('luban-chatbot__avatar--typing'));

  const node = document.createElement('div');
  node.className = 'luban-chatbot__typing';
  node.innerHTML = `<span class="luban-chatbot__typing-label">${isAdminAssistantMode() ? 'Checking admin signals' : 'Checking restaurant signals'}</span><span class="luban-chatbot__typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>`;
  row.appendChild(node);

  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return row;
}

function isReportIntent(text) {
  if (/\b(how|where|what|which|ways?|phone|email|number)\b[\s\S]{0,80}\bcontact\b/i.test(text)) {
    return false;
  }
  return /\b(report|complaint|complain|feedback|problem|issue)\b/i.test(text) ||
    /\b(send|submit|make|file)\s+(a\s+)?(report|complaint|message)\b/i.test(text) ||
    /\b(contact|tell|notify)\s+(the\s+)?(restaurant|team|staff|manager|admin)\b/i.test(text);
}

function isReportConfirmation(text) {
  return /^(send|send report|submit|submit report|yes|yeah|yep|please send|confirm)$/i.test(String(text || '').trim());
}

function isReportCancellation(text) {
  return /^(cancel|stop|never mind|nevermind|do not send|don't send)$/i.test(String(text || '').trim());
}

function wantsOriginalReportText(text) {
  return /\b(keep|use)\s+(it|this|my\s+words?|the\s+text)\s+(the\s+)?same\b/i.test(text) ||
    /\b(send|submit|report|use)\s+(it|this|my\s+message|my\s+words?)\s+exactly\b/i.test(text) ||
    /\bkeep\s+(my\s+)?wording\b/i.test(text) ||
    /\b(word\s*for\s*word|verbatim|exact\s+words?|exactly\s+as\s+i\s+wrote|as\s+written|as\s+is)\b/i.test(text) ||
    /\b(do\s+not|don't|dont|no)\s+(rewrite|rephrase|change|summari[sz]e)\b/i.test(text);
}

function extractReportMessage(text) {
  return String(text || '')
    .replace(/^\s*(please\s+)?(can\s+you\s+|could\s+you\s+|i\s+want\s+to\s+|i\s+need\s+to\s+)?(send|submit|make|file|contact|tell|notify)?\s*(a\s+)?(report|complaint|message|feedback)?\s*(to\s+)?(the\s+)?(restaurant|team|staff|manager|admin)?\s*(that|about|because|:|-)?\s*/i, '')
    .trim();
}

function buildReportSubject(message) {
  const cleaned = String(message || '')
    .replace(/\s+/g, ' ')
    .trim();
  const preview = cleaned.length > 58 ? `${cleaned.slice(0, 55)}...` : cleaned;
  return preview ? `Assistant report: ${preview}` : 'Assistant report';
}

function inferReportCategory(message) {
  const text = String(message || '').toLowerCase();
  if (/\b(order|checkout|cart|payment|pay|pickup|collect|delivery)\b/.test(text)) return 'Order';
  if (/\b(reservation|booking|table|event|catering|party)\b/.test(text)) return 'Reservation';
  if (/\b(account|sign in|login|verify|verification|otp|code|phone|email)\b/.test(text)) return 'Account';
  if (/\b(menu|dish|food|meal|allergy|allergic|diet|price|available)\b/.test(text)) return 'Menu';
  if (/\b(staff|service|wait|late|rude|manager)\b/.test(text)) return 'Service';
  return 'General';
}

function inferReportUrgency(message) {
  const text = String(message || '').toLowerCase();
  if (/\b(unsafe|sick|ill|allergic|allergy|medical|emergency|fraud|charged twice|double charge|wrong payment)\b/.test(text)) return 'high';
  if (/\b(today|now|currently|waiting|cannot|can't|failed|missing|wrong order|cancel)\b/.test(text)) return 'medium';
  return 'normal';
}

function cleanReportField(value, maxLength) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function parseReportDraftJson(text) {
  const source = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const match = source.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
}

function buildFallbackReportDraft(originalMessage, options = {}) {
  const original = cleanReportField(originalMessage, 2000);
  const preserveOriginal = options.preserveOriginal === true;
  const category = inferReportCategory(original);
  const urgency = inferReportUrgency(original);
  const description = preserveOriginal
    ? original
    : [
        `A signed-in customer is reporting a ${category.toLowerCase()} issue that needs staff review.`,
        '',
        `Issue details: ${original}`,
        '',
        'Please review the saved profile contact details and follow up with the customer.'
      ].join('\n');

  return {
    originalMessage: original,
    message: description,
    subject: buildReportSubject(description),
    category,
    urgency,
    preserveOriginal,
    mode: preserveOriginal ? 'original' : 'structured_fallback'
  };
}

async function draftReportDetails(originalMessage, _account, options = {}) {
  const preserveOriginal = options.preserveOriginal === true || wantsOriginalReportText(originalMessage);
  const fallback = buildFallbackReportDraft(originalMessage, { preserveOriginal });
  if (preserveOriginal) return fallback;

  try {
    const result = await requestAssistantAgent('report_draft', {
      originalMessage: fallback.originalMessage
    });
    const serverReport = result.report || {};
    const parsed = serverReport.message
      ? {
          subject: serverReport.subject,
          description: serverReport.message,
          category: serverReport.category,
          urgency: serverReport.urgency
        }
      : parseReportDraftJson(result.answer || '');
    if (!parsed || !parsed.description) return fallback;

    const description = cleanAnswer(parsed.description).slice(0, 2000);
    if (description.length < 10) return fallback;

    const category = ['Order', 'Reservation', 'Menu', 'Account', 'Service', 'General'].includes(parsed.category)
      ? parsed.category
      : inferReportCategory(`${fallback.originalMessage} ${description}`);
    const urgency = ['normal', 'medium', 'high'].includes(String(parsed.urgency || '').toLowerCase())
      ? String(parsed.urgency).toLowerCase()
      : inferReportUrgency(`${fallback.originalMessage} ${description}`);
    const subject = cleanReportField(parsed.subject, 80) || buildReportSubject(description);

    return {
      originalMessage: fallback.originalMessage,
      message: description,
      subject: cleanReportField(subject, 96),
      category,
      urgency,
      preserveOriginal: false,
      mode: serverReport.mode || 'ai_drafted'
    };
  } catch (error) {
    console.warn('Could not draft assistant report description:', error);
    return fallback;
  }
}

function buildReportConfirmation(report, account) {
  const contactBits = [
    account && account.name ? account.name : 'your saved name',
    account && account.emailMasked ? account.emailMasked : 'your signed-in email',
    account && account.phoneMasked ? account.phoneMasked : ''
  ].filter(Boolean);
  const category = report.category ? `Category: ${report.category}` : '';
  const urgency = report.urgency ? `Urgency: ${report.urgency}` : '';
  const meta = [category, urgency].filter(Boolean).join(' | ');
  const intro = report.preserveOriginal
    ? 'I can send your wording to the restaurant team now:'
    : 'I drafted a clearer version for the restaurant team:';
  const finalInstruction = report.preserveOriginal
    ? 'Reply "send report" to submit it, add a revised message, or type "cancel".'
    : 'Reply "send report" to submit it, "keep it same" to use your exact wording, add a revised message, or type "cancel".';

  return [
    intro,
    '',
    report.message,
    meta ? `\n${meta}` : '',
    `I will include ${contactBits.join(', ')} from your signed-in profile so the team can follow up.`,
    finalInstruction
  ].filter(line => line !== '').join('\n');
}

async function handleReportFlow(question) {
  const trimmed = String(question || '').trim();

  if (state.pendingReport && isReportCancellation(trimmed)) {
    state.pendingReport = null;
    return 'No problem. I have not sent anything.';
  }

  if (state.pendingReport && state.pendingReport.awaitingMessage) {
    const account = await getCurrentAccount();
    if (!account) {
      state.pendingReport = null;
      return `I can send reports directly once you're signed in. Please sign in, then tell me what to send, or use [Contact Us](${CONTACT.contactPage}).`;
    }

    const originalMessage = trimmed;
    if (originalMessage.length < 10) {
      return 'Please include a little more detail so the team knows what happened.';
    }

    state.pendingReport = {
      awaitingConfirmation: true,
      ...(await draftReportDetails(originalMessage, account, {
        preserveOriginal: wantsOriginalReportText(originalMessage)
      }))
    };
    return buildReportConfirmation(state.pendingReport, account);
  }

  if (state.pendingReport && state.pendingReport.awaitingConfirmation) {
    if (isReportConfirmation(trimmed)) {
      const report = state.pendingReport;
      const result = await submitAssistantReport(report);
      state.pendingReport = null;
      return result.message;
    }

    if (wantsOriginalReportText(trimmed)) {
      const account = await getCurrentAccount();
      state.pendingReport = {
        ...state.pendingReport,
        message: state.pendingReport.originalMessage || state.pendingReport.message,
        subject: buildReportSubject(state.pendingReport.originalMessage || state.pendingReport.message),
        preserveOriginal: true,
        mode: 'original'
      };
      return buildReportConfirmation(state.pendingReport, account);
    }

    const replacement = isReportIntent(trimmed) ? extractReportMessage(trimmed) : trimmed;
    if (replacement.length >= 10) {
      const account = await getCurrentAccount();
      state.pendingReport = {
        awaitingConfirmation: true,
        ...(await draftReportDetails(replacement, account, {
          preserveOriginal: wantsOriginalReportText(trimmed)
        }))
      };
      return buildReportConfirmation(state.pendingReport, account);
    }

    return 'Reply "send report" to submit it, "keep it same" to use your exact wording, add a revised message, or type "cancel".';
  }

  if (!isReportIntent(trimmed)) return null;

  const account = await getCurrentAccount();
  if (!account) {
    return `I can send reports directly once you're signed in. Please sign in, then tell me what to send, or use [Contact Us](${CONTACT.contactPage}).`;
  }

  const originalMessage = extractReportMessage(trimmed);
  if (originalMessage.length < 10) {
    state.pendingReport = { awaitingMessage: true };
    return 'I can send that directly from your signed-in account. What should I tell the restaurant team?';
  }

  state.pendingReport = {
    awaitingConfirmation: true,
    ...(await draftReportDetails(originalMessage, account, {
      preserveOriginal: wantsOriginalReportText(trimmed)
    }))
  };
  return buildReportConfirmation(state.pendingReport, account);
}

async function submitAssistantReport(report) {
  const user = await waitForCurrentUser();
  if (!user) {
    throw new Error('Please sign in before sending a report through the assistant.');
  }

  const payload = {
    subject: report.subject || buildReportSubject(report.message),
    message: report.message,
    originalMessage: report.originalMessage || report.message,
    generatedDescription: report.preserveOriginal ? '' : report.message,
    preserveOriginal: report.preserveOriginal === true,
    reportCategory: report.category || inferReportCategory(report.message),
    reportUrgency: report.urgency || inferReportUrgency(report.message),
    reportDescriptionMode: report.mode || (report.preserveOriginal ? 'original' : 'ai_drafted'),
    pageUrl: window.location.href
  };
  const data = await apiRequest('/submitAssistantReport', {
    method: 'POST',
    user,
    body: payload
  });

  await getCurrentAccount({ force: true });
  return {
    ok: data && data.ok === true,
    message: 'Sent. The restaurant team will see your report with your signed-in profile details so they can follow up through your saved contact info.'
  };
}

function isOrderStatusQuery(text) {
  const normalized = String(text || '').toLowerCase();
  return /\b(order|status|tracking?|my\s+orders?|recent\s+orders?|last\s+order)\b/.test(normalized) &&
    /\b(status|check|show|track|see|what|how|when|is|are|what's|whats)\b/.test(normalized);
}

async function retrieveUserOrders(user) {
  if (!user) return null;
  try {
    const response = await apiRequest('/getOwnOrders?limit=10', { method: 'GET', user });
    if (response && response.orders && Array.isArray(response.orders)) {
      return response;
    }
  } catch (error) {
    console.warn('Could not retrieve user orders:', error);
  }
  return null;
}

function formatOrderEmailMoney(value) {
  const amount = Number(value || 0);
  return `GHS ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function getOrderStatusMeta(status) {
  const normalized = String(status || 'unknown').trim().toLowerCase();
  if (normalized === 'requested') {
    return {
      label: 'Pre-order request received',
      raw: 'requested',
      emailUpdate: 'REQUESTED / Pre-order request received',
      nextStep: 'Staff will accept or reject this request when service opens. Please wait for acceptance before collection.'
    };
  }
  if (normalized === 'accepted') {
    return {
      label: 'Pre-order request accepted',
      raw: 'accepted',
      emailUpdate: 'ACCEPTED / Pre-order request accepted',
      nextStep: 'The request is accepted. We will let you know when preparation starts.'
    };
  }
  if (normalized === 'rejected') {
    return {
      label: 'Pre-order request not accepted',
      raw: 'rejected',
      emailUpdate: 'NOT ACCEPTED / Pre-order request rejected',
      nextStep: 'Please call 020 543 8455 if you would like help choosing another time or placing a fresh order.'
    };
  }
  if (normalized === 'pending') {
    return {
      label: 'Order received',
      raw: 'pending',
      emailUpdate: 'CONFIRMED / Order received',
      nextStep: 'We will let you know when your order moves forward. For quick help, call 020 543 8455.'
    };
  }
  if (normalized === 'preparing') {
    return {
      label: 'Preparing',
      raw: 'preparing',
      emailUpdate: '',
      nextStep: 'The kitchen is making your order.'
    };
  }
  if (normalized === 'completed') {
    return {
      label: 'Your order is ready',
      raw: 'completed',
      emailUpdate: 'READY / Completed order',
      nextStep: 'Please collect your order at the counter. Payment is completed at pickup unless our team has arranged otherwise with you directly.'
    };
  }
  if (normalized === 'cancelled') {
    return {
      label: 'Order cancelled',
      raw: 'cancelled',
      emailUpdate: '',
      nextStep: 'This order was cancelled. For questions, call 020 543 8455.'
    };
  }
  return {
    label: 'Status unavailable',
    raw: normalized || 'unknown',
    emailUpdate: '',
    nextStep: 'For quick help, call 020 543 8455.'
  };
}

function formatOrdersForResponse(ordersData) {
  if (!ordersData || !ordersData.orders || ordersData.orders.length === 0) {
    return 'You don\'t have any orders yet. Start by adding dishes to your cart from the menu!';
  }

  const lastOrder = ordersData.lastOrder;
  if (!lastOrder) return 'Could not find order information.';
  const statusMeta = getOrderStatusMeta(lastOrder.status);
  const placedAt = lastOrder.createdAt ? new Date(lastOrder.createdAt) : null;
  const placedLabel = placedAt && !Number.isNaN(placedAt.getTime())
    ? placedAt.toLocaleString()
    : 'recently';

  let response = `Your most recent order:\n\n**Order ${lastOrder.orderNumber}**\nStatus: **${statusMeta.label}** (${statusMeta.raw})\nPlaced: ${placedLabel}\nTotal: ${formatOrderEmailMoney(lastOrder.total)}\nNext step: ${statusMeta.nextStep}`;
  if (lastOrder.requestedForLabel && ['requested', 'accepted', 'rejected'].includes(statusMeta.raw)) {
    response += `\nRequested for: ${lastOrder.requestedForLabel}`;
  }
  if (statusMeta.emailUpdate) {
    response += `\nEmail update: ${statusMeta.emailUpdate}`;
  }
  response += '\n\nItems:';
  
  if (lastOrder.items && lastOrder.items.length > 0) {
    lastOrder.items.forEach((item) => {
      response += `\n- ${item.name} (x${item.quantity})`;
    });
  }

  if (lastOrder.statusUrl) {
    response += `\n\n[Open this order's detail page](${lastOrder.statusUrl})`;
  }
  if (ordersData.orders.length > 1) {
    response += `\n[View your order history](${ORDER_HISTORY_URL})`;
  }

  return response;
}

async function handleOrderStatusQuery() {
  const user = await waitForCurrentUser();
  if (!user) {
    return `I can show you your order status once you're signed in. Please sign in first!`;
  }

  const ordersData = await retrieveUserOrders(user);
  if (!ordersData) {
    return `I couldn't retrieve your orders right now. Please try again or [view your order history](${ORDER_HISTORY_URL}).`;
  }

  return formatOrdersForResponse(ordersData);
}

const QUANTITY_WORDS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10
};

const MENU_ITEM_ALIASES = {
  DR1: ['coke', 'cola', 'coca cola', 'coca-cola'],
  DR2: ['fanta'],
  DR3: ['sprite'],
  DR4: ['water', 'bottled water', 'mineral water'],
  N6: ['chicken noodles'],
  N5: ['seafood noodles'],
  N2: ['special noodles'],
  N1: ['vegetable noodles'],
  R7: ['chicken fried rice'],
  R6: ['beef fried rice'],
  R5: ['egg fried rice'],
  R4: ['shrimp fried rice'],
  R3: ['combo fried rice'],
  R2: ['jollof rice', 'special jollof'],
  D1: ['pork dumplings', 'steamed pork dumplings'],
  D2: ['fried pork dumplings'],
  D3: ['beef dumplings', 'steamed beef dumplings'],
  D4: ['fried beef dumplings']
};

const CART_ACTION_TOOLS = {
  addItems(items) {
    const cart = readAssistantCart();
    items.forEach(({ item, quantity }) => {
      const safeQuantity = Math.max(1, Math.min(99, Number(quantity) || 1));
      const existing = cart.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        existing.quantity = Math.min(99, Number(existing.quantity || 0) + safeQuantity);
        existing.name = item.name;
        existing.price = item.price;
        existing.image = item.image;
      } else {
        cart.push({ ...item, quantity: safeQuantity });
      }
    });
    writeAssistantCart(cart);
    return cart;
  },
  removeItems(items) {
    const cart = readAssistantCart();
    const removed = [];
    items.forEach(({ item, quantity }) => {
      const index = cart.findIndex((cartItem) => cartItem.id === item.id);
      if (index === -1) return;
      const currentQuantity = Number(cart[index].quantity || 0);
      const requestedQuantity = Number(quantity || 0);
      const removeQuantity = requestedQuantity > 0 ? Math.min(requestedQuantity, currentQuantity) : currentQuantity;
      if (removeQuantity >= currentQuantity) {
        cart.splice(index, 1);
      } else {
        cart[index].quantity = currentQuantity - removeQuantity;
      }
      removed.push({ item, quantity: removeQuantity });
    });
    writeAssistantCart(cart);
    return { cart, removed };
  },
  clearCart() {
    writeAssistantCart([]);
    return [];
  },
  showCart() {
    return readAssistantCart();
  },
  openCheckout() {
    window.setTimeout(() => {
      window.location.href = new URL('checkout.html', SITE_ROOT).href;
    }, 700);
  }
};

function getCartActionType(text) {
  const value = normalizeSearchText(text);
  if (!value || /\border status\b|\btrack (my )?order\b/.test(value)) return '';
  if (/\b(clear|empty)\b.*\b(cart|basket|order)\b/.test(value)) return 'clear';
  if (/\b(show|view|see|list|check|what is|whats|what's)\b.*\b(cart|basket|order)\b/.test(value)) return 'show';
  if (isCheckoutActionRequest(value)) return 'checkout';
  if (/\b(remove|delete|drop|take out|take off)\b/.test(value) && /\b(cart|basket|order|from)\b/.test(value)) return 'remove';
  if (/\b(add|put|include)\b/.test(value) && /\b(cart|basket|order)\b/.test(value)) return 'add';
  if (/\b(can you|could you|please|i want|i need|i would like|i'll have|ill have|order|get me)\b/.test(value) && /\b(add|cart|order|get|have)\b/.test(value)) return 'add';
  return '';
}

function isCheckoutActionRequest(value) {
  const text = String(value || '').trim();
  if (!/\b(?:checkout|check out)\b/.test(text)) return false;

  if (/\b(?:why|how|what|when|where|who)\b/.test(text)) return false;
  if (/\b(?:cant|cannot|unable|stuck|problem|issue|error|failed|failing|broken|not working|wont|dont|doesnt|isnt|no)\b/.test(text)) return false;
  if (/\b(?:can|could|should|would|do|did)\s+i\b.*\b(?:checkout|check out)\b/.test(text)) return false;

  return text === 'checkout' ||
    text === 'check out' ||
    /\b(?:open|go to|take me to|send me to|bring me to|start|begin|proceed to|continue to|head to|move to)\s+(?:the\s+)?(?:checkout|check out)(?:\s+page)?\b/.test(text) ||
    /\b(?:checkout|check out)\s+(?:now|please|page)\b/.test(text);
}

async function handleCartAction(question) {
  const action = getCartActionType(question);
  if (!action) return null;

  if (!window.lubanClient || typeof window.lubanClient.writeCart !== 'function') {
    return `I can't update the cart on this page right now. Please use [Menu](${CONTACT.menuPage}) or refresh the page and try again.`;
  }

  if (action === 'clear') {
    CART_ACTION_TOOLS.clearCart();
    return 'Done. I cleared your cart.';
  }

  if (action === 'show') {
    return formatCartSummary(CART_ACTION_TOOLS.showCart());
  }

  if (action === 'checkout') {
    const cart = CART_ACTION_TOOLS.showCart();
    if (!cart.length) {
      return `Your cart is empty. Tell me what to add, or browse the [Menu](${CONTACT.menuPage}).`;
    }
    CART_ACTION_TOOLS.openCheckout();
    return 'Opening checkout now. You will still review and confirm the order there.';
  }

  const resolution = await resolveCartMenuItems(question);
  if (resolution.status === 'no_match') {
    return `I couldn't match a menu item in that cart request. Try the dish name or code from the [Menu](${CONTACT.menuPage}), for example "add Chicken Noodles to cart".`;
  }
  if (resolution.status === 'ambiguous') {
    return `I found a few possible matches: ${resolution.options.map((item) => `${item.name} (${item.id})`).join(', ')}. Please tell me the exact item name or code to ${action === 'remove' ? 'remove' : 'add'}.`;
  }

  if (action === 'remove') {
    const result = CART_ACTION_TOOLS.removeItems(resolution.items);
    if (!result.removed.length) {
      return `I found the item, but it is not in your cart yet. ${formatCartSummary(result.cart)}`;
    }
    return `Removed ${formatActionItemList(result.removed)}.\n\n${formatCartSummary(result.cart)}`;
  }

  const cart = CART_ACTION_TOOLS.addItems(resolution.items);
  return `Added ${formatActionItemList(resolution.items)} to your cart.\n\n${formatCartSummary(cart)}`;
}

async function resolveCartMenuItems(text) {
  const catalog = await getLiveMenuCatalog();
  const normalized = normalizeSearchText(text);
  const directMatches = [];

  catalog.forEach((item) => {
    const aliases = getMenuItemAliases(item);
    let bestMatch = null;
    aliases.forEach((alias) => {
      const index = normalized.indexOf(alias);
      if (index === -1) return;
      if (!bestMatch || alias.length > bestMatch.alias.length) {
        bestMatch = { alias, index };
      }
    });
    if (bestMatch) {
      directMatches.push({
        item,
        quantity: inferQuantityForMatch(normalized, bestMatch.index, bestMatch.alias.length),
        index: bestMatch.index,
        aliasLength: bestMatch.alias.length
      });
    }
  });

  const dedupedMatches = dedupeCartMatches(directMatches);
  if (dedupedMatches.length) {
    return { status: 'matched', items: dedupedMatches };
  }

  const requestedTokens = getSignificantTokens(normalized);
  if (!requestedTokens.length) return { status: 'no_match' };

  const minimumScore = requestedTokens.length === 1 ? 1 : 2;
  const scored = catalog
    .map((item) => ({ item, score: scoreMenuItemMatch(item, requestedTokens) }))
    .filter((entry) => entry.score >= minimumScore)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));

  if (!scored.length) return { status: 'no_match' };
  const topScore = scored[0].score;
  const top = scored.filter((entry) => entry.score === topScore).slice(0, 5).map((entry) => entry.item);
  if (top.length > 1) {
    return { status: 'ambiguous', options: top };
  }

  return {
    status: 'matched',
    items: [{ item: top[0], quantity: inferGeneralQuantity(normalized) }]
  };
}

function dedupeCartMatches(matches) {
  const byId = new Map();
  matches
    .sort((a, b) => a.index - b.index || b.aliasLength - a.aliasLength)
    .forEach((match) => {
      if (!byId.has(match.item.id)) byId.set(match.item.id, { item: match.item, quantity: match.quantity });
    });
  return Array.from(byId.values());
}

function getMenuItemAliases(item) {
  const aliases = new Set();
  aliases.add(normalizeSearchText(item.id));
  aliases.add(normalizeSearchText(item.name));
  aliases.add(normalizeSearchText(item.name.replace(/\([^)]*\)/g, '')));
  (MENU_ITEM_ALIASES[item.id] || []).forEach((alias) => aliases.add(normalizeSearchText(alias)));
  return Array.from(aliases).filter((alias) => alias.length >= 2).sort((a, b) => b.length - a.length);
}

function scoreMenuItemMatch(item, requestedTokens) {
  const itemTokens = new Set(getSignificantTokens(`${item.id} ${item.name} ${item.category}`));
  return requestedTokens.reduce((score, token) => score + (itemTokens.has(token) ? 1 : 0), 0);
}

function getSignificantTokens(text) {
  const ignored = new Set(['add', 'put', 'include', 'remove', 'delete', 'drop', 'take', 'out', 'off', 'cart', 'basket', 'order', 'orders', 'please', 'can', 'could', 'you', 'me', 'my', 'the', 'to', 'for', 'of', 'and', 'with', 'get', 'have', 'want', 'need', 'like', 'would', 'ill']);
  return normalizeSearchText(text)
    .split(' ')
    .filter((token) => token.length > 1 && !ignored.has(token) && !QUANTITY_WORDS[token] && !/^\d+$/.test(token));
}

function inferQuantityForMatch(normalizedText, index, length) {
  const quantityPattern = '(\\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)';
  const before = normalizedText.slice(Math.max(0, index - 56), index);
  const after = normalizedText.slice(index + length, index + length + 24);
  const beforeMatch = before.match(new RegExp(`${quantityPattern}\\s*(?:x|orders? of|plates? of|servings? of|portions? of|bottles? of|cups? of|pieces? of)?\\s*$`, 'i'));
  if (beforeMatch) return parseQuantity(beforeMatch[1]);
  const afterMatch = after.match(new RegExp(`^\\s*(?:x\\s*)?${quantityPattern}\\b`, 'i'));
  if (afterMatch) return parseQuantity(afterMatch[1]);
  return 1;
}

function inferGeneralQuantity(normalizedText) {
  const match = normalizedText.match(/\b(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  return match ? parseQuantity(match[1]) : 1;
}

function parseQuantity(value) {
  const token = String(value || '').toLowerCase();
  const numeric = QUANTITY_WORDS[token] || Number(token);
  return Math.max(1, Math.min(20, Number.isFinite(numeric) ? numeric : 1));
}

function readAssistantCart() {
  const items = window.lubanClient && typeof window.lubanClient.readCart === 'function'
    ? window.lubanClient.readCart()
    : [];
  return Array.isArray(items) ? items : [];
}

function writeAssistantCart(items) {
  window.lubanClient.writeCart(Array.isArray(items) ? items : [], { source: 'assistant' });
}

function formatActionItemList(items) {
  return items
    .map(({ item, quantity }) => `${quantity} x ${item.name} (${formatCediPrice(item.price)} each)`)
    .join(', ');
}

function formatCartSummary(cart) {
  if (!Array.isArray(cart) || !cart.length) {
    return `Your cart is empty. You can ask me to add an item or browse the [Menu](${CONTACT.menuPage}).`;
  }

  const lines = cart.map((item) => `- ${item.name} x${Number(item.quantity || 0)} - ${formatCediPrice(Number(item.price || 0) * Number(item.quantity || 0))}`);
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  return `Cart now:\n${lines.join('\n')}\n\nSubtotal: **${formatCediPrice(total)}**\n\nWhen you're ready, say "checkout" or open [Checkout](checkout.html).`;
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAdminNavigationTarget(text) {
  const normalized = normalizeSearchText(text);
  if (!/\b(open|go to|switch|take me|bring me)\b/.test(normalized)) return null;

  return ADMIN_TABS.find((tab) => {
    return tab.aliases.some((alias) => {
      const normalizedAlias = normalizeSearchText(alias);
      return normalized === normalizedAlias || normalized.includes(normalizedAlias);
    });
  }) || null;
}

function maybeHandleAdminNavigation(question) {
  const target = getAdminNavigationTarget(question);
  if (!target) return null;

  if (typeof window.switchTab === 'function') {
    window.switchTab(target.id);
    return `Opened **${target.label}** in the admin panel.`;
  }

  return `I can help with **${target.label}**, but I can't switch tabs from here right now. Use [Admin Panel](${ADMIN_PANEL_URL}) and open ${target.label}.`;
}

function isAdminDraftRequest(text) {
  return /\b(draft|write|compose|word|rewrite|polish|prepare)\b/i.test(text);
}

function isAdminSummaryRequest(text) {
  const normalized = normalizeSearchText(text);
  if (isAdminDraftRequest(normalized)) return false;
  if (/\b(what needs attention|whats happening|what is happening|how are we doing|dashboard summary|operations summary)\b/.test(normalized)) return true;
  return /\b(summary|summarize|status|standing|how many|pending|unread|active|open|recent|queue|backlog|today|now|current|latest)\b/.test(normalized) &&
    /\b(order|orders|reservation|reservations|booking|bookings|message|messages|inbox|report|reports|fraud|security|fact|facts|knowledge|campaign|campaigns|sms|dashboard|operations)\b/.test(normalized);
}

function wantsFreshAdminSummary(text) {
  return /\b(refresh|latest|current|now|right now|today|reload)\b/i.test(text);
}

function getAdminSummaryFocus(text) {
  const normalized = normalizeSearchText(text);
  if (/\b(fraud|security|risk|otp|rate limit|mismatch)\b/.test(normalized)) return 'security';
  if (/\b(message|messages|inbox|report|reports|contact)\b/.test(normalized)) return 'messages';
  if (/\b(reservation|reservations|booking|bookings|table|tables)\b/.test(normalized)) return 'reservations';
  if (/\b(order|orders|kitchen|ticket|tickets)\b/.test(normalized)) return 'orders';
  if (/\b(fact|facts|knowledge|chatbot|bao)\b/.test(normalized)) return 'facts';
  if (/\b(sms|campaign|campaigns)\b/.test(normalized)) return 'campaigns';
  return 'dashboard';
}

async function getAdminAssistantContext(options = {}) {
  if (!isAdminAssistantMode()) {
    throw new Error('Admin assistant mode is not verified.');
  }

  const user = await waitForCurrentUser();
  if (!user) throw new Error('Please sign in as an admin first.');

  if (!options.force && state.adminSummary) return state.adminSummary;
  if (!state.adminSummaryPromise) {
    state.adminSummaryPromise = apiRequest('/admin/assistant-context', { method: 'GET', user })
      .then((data) => {
        state.adminSummary = data;
        return data;
      })
      .catch((error) => {
        if (/forbidden|authorization|authenticated/i.test(error && error.message ? error.message : '')) {
          syncAdminContext(null);
        }
        throw error;
      })
      .finally(() => {
        state.adminSummaryPromise = null;
      });
  }

  return state.adminSummaryPromise;
}

function formatAdminDate(value) {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleString();
}

function formatAdminOrderLine(order) {
  const items = Array.isArray(order.items) && order.items.length
    ? order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')
    : 'items not listed';
  return `- ${order.orderNumber}: **${order.status}**, ${order.customerName || 'Guest'}, ${formatCediPrice(order.total)}, ${items}`;
}

function formatAdminReservationLine(reservation) {
  const when = [reservation.date, reservation.time].filter(Boolean).join(' at ') || 'date not set';
  const notes = reservation.notesPreview ? ` - Notes: ${reservation.notesPreview}` : '';
  return `- ${reservation.name || 'Guest'}: **${reservation.status}**, ${when}, party of ${reservation.guests || '?'}${notes}`;
}

function formatAdminMessageLine(message) {
  const source = String(message.source || '').toLowerCase() === 'assistant' ? 'AI report' : 'Contact';
  const urgency = message.urgency ? `, ${message.urgency} urgency` : '';
  return `- ${source}: **${message.subject || 'Message'}** from ${message.name || 'Unknown'}${urgency} - ${message.preview || 'No preview'}`;
}

function formatAdminSecurityLine(event) {
  const detail = [event.scope, event.orderId, event.reservationId, event.userId].filter(Boolean).join(' | ');
  return `- ${event.kind}${detail ? `: ${detail}` : ''} (${formatAdminDate(event.createdAt)})`;
}

function formatAdminCampaignLine(campaign) {
  const status = campaign.status || 'unknown';
  return `- ${campaign.title || campaign.id}: **${status}**, ${campaign.recipientCount || 0} recipients, ${campaign.successCount || 0} sent, ${campaign.failedCount || 0} failed`;
}

function formatAdminFactLine(fact) {
  return `- ${fact.title || fact.id}: ${fact.active ? 'active' : 'archived'}`;
}

function formatAdminList(items, formatter, emptyText, limit = 5) {
  if (!Array.isArray(items) || !items.length) return emptyText;
  return items.slice(0, limit).map(formatter).join('\n');
}

function formatAdminSummaryForResponse(summary, focus = 'dashboard') {
  if (!summary || !summary.counts) {
    return 'I could not load the admin summary right now. Please refresh the admin panel and try again.';
  }

  const counts = summary.counts;
  const generated = summary.generatedAt ? `Updated ${formatAdminDate(summary.generatedAt)}.` : '';

  if (focus === 'orders') {
    return [
      `**Orders** ${generated}`,
      `${counts.activeOrders || 0} active orders across ${counts.recentOrders || 0} recent orders.`,
      formatAdminList(summary.orders && summary.orders.active, formatAdminOrderLine, 'No active kitchen tickets right now.')
    ].join('\n\n');
  }

  if (focus === 'reservations') {
    return [
      `**Reservations** ${generated}`,
      `${counts.pendingReservations || 0} pending reservations across ${counts.recentReservations || 0} recent reservation records.`,
      formatAdminList(summary.reservations && summary.reservations.pending, formatAdminReservationLine, 'No pending reservations right now.')
    ].join('\n\n');
  }

  if (focus === 'messages') {
    return [
      `**Messages & AI** ${generated}`,
      `${counts.unreadMessages || 0} unread messages. ${counts.assistantReports || 0} recent AI reports.`,
      formatAdminList(summary.messages && summary.messages.unread, formatAdminMessageLine, 'No unread messages right now.')
    ].join('\n\n');
  }

  if (focus === 'security') {
    return [
      `**Fraud Review** ${generated}`,
      `${counts.reviewSecurityEvents || 0} recent events need review out of ${counts.recentSecurityEvents || 0} security events loaded.`,
      formatAdminList(summary.security && summary.security.reviewEvents, formatAdminSecurityLine, 'No high-signal fraud review events in the recent window.')
    ].join('\n\n');
  }

  if (focus === 'facts') {
    return [
      `**Chatbot Facts** ${generated}`,
      `${counts.activeChatbotFacts || 0} active facts and ${counts.archivedChatbotFacts || 0} archived facts.`,
      formatAdminList(summary.chatbotKnowledge && summary.chatbotKnowledge.recent, formatAdminFactLine, 'No chatbot facts found.')
    ].join('\n\n');
  }

  if (focus === 'campaigns') {
    return [
      `**SMS Campaigns** ${generated}`,
      `${counts.recentSmsCampaigns || 0} recent SMS campaigns loaded.`,
      formatAdminList(summary.smsCampaigns && summary.smsCampaigns.recent, formatAdminCampaignLine, 'No recent SMS campaigns found.')
    ].join('\n\n');
  }

  const priorityLines = [
    counts.activeOrders ? `- ${counts.activeOrders} active order${counts.activeOrders === 1 ? '' : 's'} in the kitchen queue.` : '',
    counts.pendingReservations ? `- ${counts.pendingReservations} pending reservation${counts.pendingReservations === 1 ? '' : 's'} to confirm or reject.` : '',
    counts.unreadMessages ? `- ${counts.unreadMessages} unread message${counts.unreadMessages === 1 ? '' : 's'} in Messages & AI.` : '',
    counts.reviewSecurityEvents ? `- ${counts.reviewSecurityEvents} fraud/security event${counts.reviewSecurityEvents === 1 ? '' : 's'} worth reviewing.` : ''
  ].filter(Boolean);

  return [
    `**Admin Snapshot** ${generated}`,
    `Orders: **${counts.activeOrders || 0} active**. Reservations: **${counts.pendingReservations || 0} pending**. Messages: **${counts.unreadMessages || 0} unread**. Bao facts: **${counts.activeChatbotFacts || 0} active**.`,
    priorityLines.length ? `What needs attention:\n${priorityLines.join('\n')}` : 'Nothing urgent is showing in the current admin summary.',
    'Say "open orders", "open reservations", "open messages", or ask me to draft a reply, rejection reason, promo, SMS, or chatbot fact.'
  ].join('\n\n');
}

async function handleAdminAssistantMessage(question) {
  const navigationResponse = maybeHandleAdminNavigation(question);
  if (navigationResponse) return navigationResponse;

  const summaryRequest = isAdminSummaryRequest(question);
  if (summaryRequest) {
    try {
      const adminSummary = await getAdminAssistantContext({ force: summaryRequest || wantsFreshAdminSummary(question) });
      return formatAdminSummaryForResponse(adminSummary, getAdminSummaryFocus(question));
    } catch (error) {
      return `I recognize you're in the admin panel, but I could not load the protected admin summary: ${error.message || 'request failed'}. Please refresh the dashboard and try again.`;
    }
  }

  const result = await requestAssistantAgent('admin', { question });
  return cleanAnswer(result.answer) || 'I can help with admin operations, but I need a little more detail.';
}

async function handleUserMessage(question) {
  appendMessage('user', question);
  state.history.push({ role: isAdminAssistantMode() ? 'admin' : 'guest', text: question });
  setBusy(true);
  const typing = showTyping();
  const reportPath = Boolean(state.pendingReport) || isReportIntent(question);

  try {
    initFirebase();
    if (isAdminAssistantMode()) {
      const adminResponse = await handleAdminAssistantMessage(question);
      if (typing) typing.remove();
      const safeAdminResponse = removeRepeatedGreeting(adminResponse);
      appendMessage('bot', safeAdminResponse);
      state.history.push({ role: 'assistant', text: safeAdminResponse });
      return;
    }

    const reportResponse = await handleReportFlow(question);
    if (reportResponse) {
      if (typing) typing.remove();
      appendMessage('bot', reportResponse);
      state.history.push({ role: 'assistant', text: reportResponse });
      return;
    }

    if (isOrderStatusQuery(question)) {
      const orderResponse = await handleOrderStatusQuery();
      if (typing) typing.remove();
      appendMessage('bot', orderResponse);
      state.history.push({ role: 'assistant', text: orderResponse });
      return;
    }

    const cartResponse = await handleCartAction(question);
    if (cartResponse) {
      if (typing) typing.remove();
      appendMessage('bot', cartResponse);
      state.history.push({ role: 'assistant', text: cartResponse });
      return;
    }

    const result = await requestAssistantAgent('guest', { question });
    const answer = cleanAnswer(result.answer);
    const safeAnswer = removeRepeatedGreeting(answer) || contactFallback();

    if (typing) typing.remove();
    appendMessage('bot', safeAnswer);
    state.history.push({ role: 'assistant', text: safeAnswer });
  } catch (error) {
    console.warn('Luban chatbot error:', error);
    if (typing) typing.remove();
    appendMessage('bot', isAdminAssistantMode()
      ? adminConnectionFallback(error)
      : reportPath && error && error.message
        ? `I couldn't send that report: ${error.message}`
        : connectionFallback());
  } finally {
    setBusy(false);
    const input = document.querySelector('[data-luban-input]');
    if (state.open && input) input.focus();
  }
}

function cleanAnswer(text) {
  const cleaned = String(text || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2200);

  return normalizeCediFormatting(cleaned);
}

function removeRepeatedGreeting(answer) {
  const hasPriorAssistantReply = state.history.some((item) => item.role === 'assistant');
  if (!hasPriorAssistantReply) return answer;

  const text = String(answer || '').trim();
  const stripped = text.replace(/^\s*(?:hi|hello|hey)\b[^\n.!?]{0,90}[-,!:.]\s*/i, '');
  return stripped.trim() || text;
}

function contactFallback() {
  return `I don't have that detail in the restaurant information available here. Please call ${CONTACT.phone}, email ${CONTACT.email}, or send a message through [Contact Us](${CONTACT.contactPage}).`;
}

function connectionFallback() {
  return `Sorry, I can't reach the restaurant assistant just now. Please call ${CONTACT.phone}, email ${CONTACT.email}, or send a message through [Contact Us](${CONTACT.contactPage}).`;
}

function adminConnectionFallback(error) {
  const detail = error && error.message ? ` ${error.message}` : '';
  return `I couldn't reach the protected admin assistant context right now.${detail} You can still use the admin panel sections directly, or refresh and ask me again.`;
}

function normalizeCediFormatting(text) {
  return String(text || '').replace(/\bGHS\s*([0-9]+(?:\.[0-9]+)?)/gi, (_, value) => formatCediPrice(value));
}

function normalizePriceValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }
  return null;
}

function formatCediPrice(value) {
  const price = normalizePriceValue(value);
  if (price === null) return PRICE_UNLISTED_TEXT;

  const formatted = Number.isInteger(price)
    ? String(price)
    : String(price).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');

  return `${CEDI_SYMBOL}${formatted}`;
}

async function getLiveMenuCatalog() {
  if (state.menuCatalog) return state.menuCatalog;
  if (!state.menuCatalogPromise) {
    state.menuCatalogPromise = loadLiveMenuCatalog()
      .then((items) => {
        state.menuCatalog = items;
        return items;
      })
      .catch((error) => {
        console.warn('Could not prepare live menu catalog:', error && error.message ? error.message : error);
        state.menuCatalogPromise = null;
        state.menuCatalog = MENU.map(normalizeMenuItemForCart);
        return state.menuCatalog;
      });
  }
  return state.menuCatalogPromise;
}

async function loadLiveMenuCatalog() {
  initFirebase();
  const [
    hiddenSnapshot,
    menuPricesSnapshot,
    priceOverridesSnapshot,
    menuItemsSnapshot
  ] = await Promise.all([
    safeGetDocs(collection(state.db, 'dishAvailability')),
    safeGetDocs(collection(state.db, 'menuPrices')),
    safeGetDocs(collection(state.db, 'priceOverrides')),
    safeGetDocs(collection(state.db, 'menuItems'))
  ]);

  return buildMenuCatalogFromSnapshots(hiddenSnapshot, menuPricesSnapshot, priceOverridesSnapshot, menuItemsSnapshot);
}

function buildMenuCatalogFromSnapshots(hiddenSnapshot, menuPricesSnapshot, priceOverridesSnapshot, menuItemsSnapshot) {
  const hiddenIds = new Set();
  if (hiddenSnapshot) {
    hiddenSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.hidden === true) hiddenIds.add(docSnap.id);
    });
  }

  const livePrices = {};
  if (menuPricesSnapshot) {
    menuPricesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const price = normalizePriceValue(data && data.price);
      if (price !== null) livePrices[docSnap.id] = price;
    });
  }

  if (priceOverridesSnapshot) {
    const now = new Date();
    priceOverridesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const revertAt = toDate(data && data.revertAt);
      const newPrice = normalizePriceValue(data && data.newPrice);
      if (newPrice !== null && revertAt && revertAt > now) {
        livePrices[docSnap.id] = newPrice;
      }
    });
  }

  const menuById = new Map();
  MENU.forEach((item) => {
    if (hiddenIds.has(item.id)) return;
    menuById.set(item.id, normalizeMenuItemForCart({
      ...item,
      price: livePrices[item.id] !== undefined ? livePrices[item.id] : item.price
    }));
  });

  if (menuItemsSnapshot) {
    menuItemsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data || hiddenIds.has(docSnap.id)) return;
      const id = data.id || docSnap.id;
      menuById.set(id, normalizeMenuItemForCart({
        id,
        name: data.name || data.title || id,
        category: data.category || 'Menu',
        price: livePrices[id] !== undefined ? livePrices[id] : normalizePriceValue(data.price),
        description: data.description || data.details || '',
        image: data.image || data.imageUrl || data.photo || data.photoUrl || ''
      }));
    });
  }

  return Array.from(menuById.values())
    .sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.id).localeCompare(String(b.id)));
}

function normalizeMenuItemForCart(item) {
  const price = normalizePriceValue(item && item.price);
  return {
    id: String(item && item.id || '').trim(),
    name: String(item && item.name || item && item.id || 'Menu item').trim(),
    category: String(item && item.category || 'Menu').trim(),
    price: price === null ? 0 : price,
    description: String(item && item.description || '').trim(),
    image: String(item && item.image || '') || getDefaultMenuImage(item && item.id)
  };
}

function getDefaultMenuImage(id) {
  const itemId = String(id || '').trim();
  if (!itemId) return new URL('../../logo.png', import.meta.url).href;
  const drinkImages = {
    DR1: '../drinks/coca-cola-300ml.webp',
    DR2: '../drinks/fanta-300ml.webp',
    DR3: '../drinks/sprite-300ml.webp',
    DR4: '../drinks/water-300ml.webp'
  };
  return new URL(drinkImages[itemId] || `../menu-items-pictures/${itemId}.webp`, import.meta.url).href;
}

async function safeGetDocs(ref) {
  try {
    return await getDocs(ref);
  } catch (error) {
    console.warn('Could not read public Firestore context:', error && error.message ? error.message : error);
    return null;
  }
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

if (!window.__lubanAiChatbotMounted) {
  window.__lubanAiChatbotMounted = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountChatbot, { once: true });
  } else {
    mountChatbot();
  }
}
