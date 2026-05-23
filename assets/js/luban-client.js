(function () {
  const CART_STORAGE_KEY = 'luban:cart:v2';
  let turnstileReadyPromise = null;

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getSiteConfig() {
    return window.LUBAN_SITE_CONFIG || {};
  }

  function getApiBase() {
    return String(getSiteConfig().apiBase || '/api').replace(/\/+$/, '');
  }

  function normalizeGhanaPhone(phone) {
    const cleaned = String(phone || '').replace(/[^\d+]/g, '');
    if (!cleaned) return '';
    if (/^\+233\d{9}$/.test(cleaned)) return cleaned;
    if (/^233\d{9}$/.test(cleaned)) return '+' + cleaned;
    if (/^0\d{9}$/.test(cleaned)) return '+233' + cleaned.slice(1);
    return '';
  }

  function maskPhone(phone) {
    const normalized = normalizeGhanaPhone(phone) || String(phone || '').trim();
    if (!normalized) return '';
    const visible = normalized.slice(-3);
    return normalized.slice(0, 4) + '••••••' + visible;
  }

  function maskEmail(email) {
    const value = String(email || '').trim();
    const parts = value.split('@');
    if (parts.length !== 2) return value;
    const local = parts[0];
    const domain = parts[1];
    if (local.length <= 2) return local.charAt(0) + '•@' + domain;
    return local.slice(0, 2) + '•••@' + domain;
  }

  function formatMoney(value) {
    const amount = Number(value || 0);
    return '₵' + amount.toFixed(2);
  }

  function readCart() {
    const items = safeJsonParse(window.localStorage.getItem(CART_STORAGE_KEY), []);
    return Array.isArray(items) ? items : [];
  }

  function writeCart(items) {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items : []));
    window.dispatchEvent(new CustomEvent('luban:cart-changed', {
      detail: {
        items: readCart()
      }
    }));
  }

  function clearCart() {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('luban:cart-changed', {
      detail: {
        items: []
      }
    }));
  }

  function countCartItems(items) {
    return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  async function getAuthToken(user) {
    if (!user || typeof user.getIdToken !== 'function') return '';
    return user.getIdToken();
  }

  async function api(path, options) {
    const opts = Object.assign({ method: 'GET' }, options || {});
    const headers = Object.assign({}, opts.headers || {});
    const user = opts.user || null;
    if (user) {
      const token = await getAuthToken(user);
      if (token) headers.Authorization = 'Bearer ' + token;
    }
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(getApiBase() + path, {
      method: opts.method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
    });
    const rawText = await response.text();
    const data = safeJsonParse(rawText, {});
    if (!response.ok) {
      const fallbackMessage = typeof rawText === 'string' && rawText.trim() ? rawText.trim() : 'Request failed';
      const error = new Error(data.error || fallbackMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function ensureTurnstileScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileReadyPromise) return turnstileReadyPromise;
    turnstileReadyPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = getSiteConfig().turnstileScript || 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => reject(new Error('Failed to load Turnstile.'));
      document.head.appendChild(script);
    });
    return turnstileReadyPromise;
  }

  async function mountTurnstile(container, callbacks) {
    await ensureTurnstileScript();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) throw new Error('Turnstile container not found.');
    const siteKey = String(getSiteConfig().turnstileSiteKey || '').trim();
    if (!siteKey) {
      throw new Error('Turnstile is not configured yet. Add a public site key before using this form.');
    }
    target.innerHTML = '';
    const widgetId = window.turnstile.render(target, {
      sitekey: siteKey,
      callback: callbacks && callbacks.onSuccess ? callbacks.onSuccess : undefined,
      'expired-callback': callbacks && callbacks.onExpired ? callbacks.onExpired : undefined,
      'error-callback': callbacks && callbacks.onError ? callbacks.onError : undefined
    });
    return widgetId;
  }

  function getTurnstileToken(widgetId) {
    if (!window.turnstile || widgetId === undefined || widgetId === null) return '';
    return window.turnstile.getResponse(widgetId) || '';
  }

  function resetTurnstile(widgetId) {
    if (window.turnstile && widgetId !== undefined && widgetId !== null) {
      window.turnstile.reset(widgetId);
    }
  }

  window.lubanClient = {
    api,
    clearCart,
    countCartItems,
    formatMoney,
    getApiBase,
    getAuthToken,
    getTurnstileToken,
    maskEmail,
    maskPhone,
    mountTurnstile,
    normalizeGhanaPhone,
    readCart,
    resetTurnstile,
    writeCart
  };
}());
