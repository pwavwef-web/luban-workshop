(function () {
  const existing = window.LUBAN_SITE_CONFIG || {};
  const host = String(window.location.hostname || '').toLowerCase();
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const productionTurnstileSiteKey = '0x4AAAAAADU76w9ajozZ_U-Y';
  window.LUBAN_SITE_CONFIG = Object.assign({
    apiBase: '/api',
    siteCredits: {
      leadDeveloper: {
        name: 'Francis Pwavwe',
        company: 'AZ Learner',
        companyUrl: 'https://azlearner.me',
        url: 'https://francis.azlearner.me',
        email: 'francis@azlearner.me'
      },
      coDeveloper: {
        name: 'Chinedum Okwonkwo Udeaja',
        email: 'udeajachinedum19@gmail.com'
      }
    },
    turnstileSiteKey: existing.turnstileSiteKey || window.LUBAN_TURNSTILE_SITE_KEY || (isLocalHost ? '1x00000000000000000000AA' : productionTurnstileSiteKey),
    turnstileScript: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  }, existing);
}());
