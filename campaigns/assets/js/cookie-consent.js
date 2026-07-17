// Minimal cookie consent and script injector
(function(){
  const STORAGE_KEY = 'luban_cookie_consent_v1';
  const DEFAULTS = { analytics: false, timestamp: null, version: 1 };

  function read() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULTS; } catch(e){ return DEFAULTS; }
  }

  function write(obj) {
    obj.timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  function hasConsentFor(category){
    const s = read();
    return !!s[category];
  }

  function injectScriptsFor(category){
    // Find scripts with type text/plain and data-cookieconsent attribute
    const nodes = Array.from(document.querySelectorAll('script[type="text/plain"][data-cookieconsent="'+category+'"]'));
    nodes.forEach(n => {
      const src = n.getAttribute('data-src');
      if (src) {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        document.head.appendChild(s);
      } else {
        const s = document.createElement('script');
        s.text = n.textContent || '';
        document.head.appendChild(s);
      }
      n.parentNode && n.parentNode.removeChild(n);
    });
  }

  function setConsent(consentObj){
    const cur = Object.assign({}, read(), consentObj);
    write(cur);
    if (cur.analytics) injectScriptsFor('analytics');
    try { window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: cur })); } catch (e) {}
  }

  function revokeConsent(){
    localStorage.removeItem(STORAGE_KEY);
    alert('Cookie preferences removed. The page will reload to apply changes.');
    location.reload();
  }

  function createBanner(){
    if (document.getElementById('luban-cookie-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'luban-cookie-banner';
    banner.innerHTML = `
      <style>
      #luban-cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;background:#0f172a;color:#fff;padding:16px;border-radius:8px;box-shadow:0 6px 24px rgba(2,6,23,0.5);display:flex;gap:12px;align-items:center;z-index:9999;font-family: sans-serif}
      #luban-cookie-banner .cc-actions{margin-left:auto;display:flex;gap:8px}
      #luban-cookie-banner button{background:#111827;color:#fff;border:0;padding:8px 12px;border-radius:6px;cursor:pointer}
      #luban-cookie-banner button.secondary{background:transparent;border:1px solid rgba(255,255,255,0.12)}
      #luban-cookie-banner a.manage{color:#93c5fd;margin-left:8px;text-decoration:underline;cursor:pointer}
      @media(min-width:768px){#luban-cookie-banner{left:32px;right:32px}}
      </style>
      <div>
        We use cookies to improve your experience. Non-essential cookies (analytics) are disabled until you consent.
        <a class="manage" id="luban-manage-link">Manage</a>
      </div>
      <div class="cc-actions">
        <button id="luban-accept">Accept all</button>
        <button class="secondary" id="luban-reject">Reject non-essential</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('luban-accept').addEventListener('click', ()=>{
      setConsent({analytics:true});
      banner.remove();
    });
    document.getElementById('luban-reject').addEventListener('click', ()=>{
      setConsent({analytics:false});
      banner.remove();
    });
    document.getElementById('luban-manage-link').addEventListener('click', ()=>{
      alert('You can manage cookie preferences from the site privacy policy or revoke via the provided link.');
    });
  }

  // Public API
  window.cookieConsent = {
    get: read,
    set: setConsent,
    revoke: revokeConsent
  };

  document.addEventListener('DOMContentLoaded', ()=>{
    const cur = read();
    if (cur.analytics) injectScriptsFor('analytics');
    if (cur.timestamp === null) createBanner();
    try { window.dispatchEvent(new CustomEvent('cookieConsentReady', { detail: cur })); } catch (e) {}
  });
})();
