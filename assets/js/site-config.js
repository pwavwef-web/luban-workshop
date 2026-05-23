(function () {
  const existing = window.LUBAN_SITE_CONFIG || {};
  const host = String(window.location.hostname || '').toLowerCase();
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  window.LUBAN_SITE_CONFIG = Object.assign({
    apiBase: '/api',
    turnstileSiteKey: existing.turnstileSiteKey || window.LUBAN_TURNSTILE_SITE_KEY || (isLocalHost ? '1x00000000000000000000AA' : ''),
    turnstileScript: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  }, existing);
}());
