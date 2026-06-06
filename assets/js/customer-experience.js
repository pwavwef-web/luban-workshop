(function () {
  const TOAST_TYPES = new Set(['success', 'error', 'info']);
  const CONFETTI_COLORS = ['#b91c1c', '#c58b2b', '#166534', '#2563eb', '#9333ea', '#f97316'];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getIcon(type) {
    if (type === 'success') {
      return '<svg class="toast-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
    }
    if (type === 'error') {
      return '<svg class="toast-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v5"></path><path d="M12 16h.01"></path></svg>';
    }
    return '<svg class="toast-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
  }

  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type, duration) {
    const normalizedType = TOAST_TYPES.has(type) ? type : 'info';
    const timeout = Number.isFinite(Number(duration)) ? Number(duration) : 3500;
    const toast = document.createElement('div');
    toast.className = `toast toast-${normalizedType}`;
    toast.setAttribute('role', normalizedType === 'error' ? 'alert' : 'status');
    toast.innerHTML = `
      ${getIcon(normalizedType)}
      <span class="toast-msg">${escapeHtml(message)}</span>
      <button class="toast-close" type="button" aria-label="Dismiss">&times;</button>
    `;

    const container = ensureToastContainer();
    container.appendChild(toast);

    let closed = false;
    function dismiss() {
      if (closed) return;
      closed = true;
      toast.classList.add('removing');
      window.setTimeout(() => toast.remove(), 220);
    }

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    if (timeout > 0) window.setTimeout(dismiss, timeout);
    return dismiss;
  }

  function showConfirmModal(title, message, options) {
    const opts = options || {};
    const confirmLabel = opts.confirmLabel || 'Confirm';
    const cancelLabel = opts.cancelLabel || 'Cancel';
    const previousFocus = document.activeElement;

    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'confirm-modal-backdrop';
      backdrop.setAttribute('role', 'presentation');
      backdrop.innerHTML = `
        <section class="confirm-modal-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
          <div class="confirm-modal-body">
            <h2 id="confirm-modal-title" class="confirm-modal-title">${escapeHtml(title)}</h2>
            <p class="confirm-modal-message">${escapeHtml(message)}</p>
          </div>
          <div class="confirm-modal-actions">
            <button class="confirm-cancel" type="button">${escapeHtml(cancelLabel)}</button>
            <button class="confirm-ok" type="button">${escapeHtml(confirmLabel)}</button>
          </div>
        </section>
      `;

      let resolved = false;
      function finish(value) {
        if (resolved) return;
        resolved = true;
        backdrop.remove();
        document.removeEventListener('keydown', handleKeydown);
        if (previousFocus && typeof previousFocus.focus === 'function') {
          previousFocus.focus();
        }
        resolve(value);
      }

      function handleKeydown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
          return;
        }
        if (event.key !== 'Tab') return;
        const focusable = Array.from(backdrop.querySelectorAll('button'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }

      backdrop.querySelector('.confirm-cancel').addEventListener('click', () => finish(false));
      backdrop.querySelector('.confirm-ok').addEventListener('click', () => finish(true));
      backdrop.addEventListener('click', event => {
        if (event.target === backdrop) finish(false);
      });
      document.addEventListener('keydown', handleKeydown);
      document.body.appendChild(backdrop);
      window.setTimeout(() => backdrop.querySelector('.confirm-cancel').focus(), 20);
    });
  }

  function initScrollToTop() {
    let button = document.getElementById('scroll-top-btn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'scroll-top-btn';
      button.type = 'button';
      button.className = 'scroll-top-btn';
      button.setAttribute('aria-label', 'Scroll to top');
      button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"></path></svg>';
      document.body.appendChild(button);
    }

    if (button.dataset.lubanScrollReady === 'true') return;
    button.dataset.lubanScrollReady = 'true';

    let ticking = false;
    function update() {
      button.classList.toggle('visible', window.scrollY > 500);
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    button.addEventListener('click', () => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      window.scrollTo({ top: 0, behavior });
    });
    update();
  }

  function spawnConfetti(options) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const opts = options || {};
    const count = Number.isFinite(Number(opts.count)) ? Number(opts.count) : 56;
    const layer = document.createElement('div');
    layer.className = 'luban-confetti-layer';

    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement('span');
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.className = 'luban-confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = color;
      piece.style.animationDelay = `${Math.random() * 0.65}s`;
      piece.style.animationDuration = `${1.8 + Math.random() * 1.25}s`;
      piece.style.setProperty('--confetti-drift', `${Math.round((Math.random() - 0.5) * 220)}px`);
      if (Math.random() > 0.5) piece.style.borderRadius = '999px';
      layer.appendChild(piece);
    }

    document.body.appendChild(layer);
    window.setTimeout(() => layer.remove(), 3600);
  }

  function enhanceImages(root) {
    const scope = root || document;
    scope.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      if (!img.hasAttribute('loading') && !img.hasAttribute('fetchpriority')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.hasAttribute('sizes') && /menu-items-pictures|\/drinks\//.test(img.getAttribute('src') || '')) {
        img.setAttribute('sizes', '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw');
      }
    });
  }

  function celebrateOrder(message) {
    spawnConfetti({ count: 64 });
    showToast(message || 'Order placed. Track it here.', 'success', 4500);
  }

  function bindUxEvents() {
    document.addEventListener('luban:toast', event => {
      const detail = event.detail || {};
      showToast(detail.message || '', detail.type || 'info', detail.duration);
    });

    document.addEventListener('luban:confirm', event => {
      const detail = event.detail || {};
      showConfirmModal(detail.title || 'Confirm', detail.message || '', detail.options || {}).then(result => {
        if (typeof detail.resolve === 'function') {
          detail.resolve(result);
        }
      });
    });

    document.addEventListener('luban:confetti', event => {
      spawnConfetti((event && event.detail) || {});
    });

    document.addEventListener('luban:celebrate-order', event => {
      const detail = event.detail || {};
      celebrateOrder(detail.message);
    });
  }

  function boot() {
    initScrollToTop();
    enhanceImages();
  }

  const api = {
    celebrateOrder,
    enhanceImages,
    escapeHtml,
    initScrollToTop,
    showConfirmModal,
    showToast,
    spawnConfetti
  };

  try {
    window.lubanUX = Object.assign({}, window.lubanUX || {}, api);
  } catch (error) {}

  bindUxEvents();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}());
