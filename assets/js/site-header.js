(function () {
  const script = document.currentScript;
  const rootUrl = script ? new URL('../../', script.src) : new URL('/', window.location.href);

  function siteUrl(path) {
    return new URL(path, rootUrl).href;
  }

  function attr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function lucideRefresh() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function brandHtml(options) {
    const opts = options || {};
    const href = opts.href || siteUrl('index.html');
    const logo = opts.logo || siteUrl('logo.png');
    const ucc = opts.ucc === false ? '' : `<img src="${siteUrl('assets/ucc-logo.png')}" alt="${opts.uccAlt || 'UCC Logo'}" class="${opts.uccClass || 'hidden sm:block h-9 w-9 object-contain'}">`;
    const asLink = opts.asLink !== false;
    const label = opts.logoAlt || 'Luban Workshop Restaurant';
    const textClass = opts.textClass || 'serif font-bold text-xl tracking-tight text-stone-900 truncate';
    const imageClass = opts.logoClass || 'h-10 w-10 rounded-full object-contain bg-white';
    const content = `
      <img src="${logo}" alt="${attr(label)}" class="${imageClass}">
      ${ucc}
      <span class="${textClass}">Luban <span class="text-red-700">Workshop</span></span>
    `;

    if (!asLink) {
      return `<div class="${opts.wrapperClass || 'min-w-0 flex items-center gap-2'}">${content}</div>`;
    }

    return `<a href="${href}" class="${opts.wrapperClass || 'min-w-0 flex items-center gap-2 text-stone-900'}">${content}</a>`;
  }

  function renderBackHeader(mount) {
    const homeHref = mount.getAttribute('data-luban-header-home') || siteUrl('index.html');
    const backHref = mount.getAttribute('data-luban-header-back-href') || homeHref;
    const backLabel = mount.getAttribute('data-luban-header-back-label') || 'Back to Home';
    const includeMenu = mount.getAttribute('data-luban-header-menu-link') === 'true';
    const sticky = mount.getAttribute('data-luban-header-sticky') === 'true';
    const navClass = sticky
      ? 'w-full bg-white/95 backdrop-blur-sm shadow-md z-50 sticky top-0'
      : 'w-full bg-white/95 backdrop-blur-sm shadow-md z-50';
    const menuLink = includeMenu
      ? `<a href="${siteUrl('menu.html')}" class="text-stone-600 hover:text-red-700 transition-colors font-medium text-sm hidden sm:inline">Menu</a>`
      : '';

    return `
      <nav class="${navClass}">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            ${brandHtml({ href: homeHref, ucc: includeMenu, wrapperClass: 'flex-shrink-0 flex items-center gap-2' })}
            <div class="flex items-center gap-4">
              ${menuLink}
              <a href="${backHref}" class="text-stone-600 hover:text-red-700 transition-colors font-medium text-sm">&larr; ${attr(backLabel)}</a>
            </div>
          </div>
        </div>
      </nav>
    `;
  }

  function renderAccountHeader(mount) {
    const backHref = mount.getAttribute('data-luban-header-back-href') || siteUrl('customer-profile.html');
    const backLabel = mount.getAttribute('data-luban-header-back-label') || 'Back to profile';
    return `
      <nav class="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          ${brandHtml({ href: siteUrl('index.html'), ucc: false, textClass: 'serif font-bold text-lg' })}
          <a href="${backHref}" class="text-sm font-semibold text-stone-700 hover:text-red-700">${attr(backLabel)}</a>
        </div>
      </nav>
    `;
  }

  function renderProfileHeader() {
    return `
      <nav class="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="h-16 flex items-center justify-between gap-4">
            ${brandHtml({ href: siteUrl('index.html'), ucc: false, textClass: 'serif font-bold text-lg' })}
            <div class="flex items-center gap-2">
              <a href="${siteUrl('index.html#menu')}" class="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-stone-700 hover:text-red-700">
                <i data-lucide="utensils" class="h-4 w-4"></i>
                Menu
              </a>
              <a href="${siteUrl('index.html#my-orders')}" class="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-stone-700 hover:text-red-700">
                <i data-lucide="package" class="h-4 w-4"></i>
                Orders
              </a>
              <button id="profile-logout-btn" type="button" class="hidden items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-md">
                <i data-lucide="log-out" class="h-4 w-4"></i>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
  }

  function renderMenuHeader(chinese) {
    const home = chinese ? siteUrl('chinese/index.html') : siteUrl('index.html');
    const menu = chinese ? siteUrl('chinese/menu.html') : siteUrl('menu.html');
    const homeLabel = chinese ? '首页' : 'Home';
    const menuLabel = chinese ? '菜单' : 'Menu';
    const alt = chinese ? '鲁班工坊标志' : 'Luban Workshop Restaurant';
    const ucc = chinese ? false : true;

    return `
      <nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-md z-50">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            ${brandHtml({
              href: home,
              logoAlt: alt,
              ucc,
              wrapperClass: 'flex items-center gap-2',
              textClass: chinese ? 'serif text-lg font-bold text-red-800' : 'serif text-xl font-bold text-red-800'
            })}
            <div class="flex gap-4 items-center">
              <a href="${home}" class="text-stone-600 hover:text-red-700 text-sm font-medium transition">${homeLabel}</a>
              <a href="${menu}" class="text-red-700 font-semibold text-sm border-b-2 border-red-600">${menuLabel}</a>
            </div>
          </div>
        </div>
      </nav>
    `;
  }

  function renderShopHeader() {
    return `
      <nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-md z-50 transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="min-w-0 flex items-center gap-2 cursor-pointer" onclick="window.scrollTo(0,0)">
              <img src="${siteUrl('logo.png')}" alt="Luban Workshop Logo" class="h-10 w-10 rounded-full object-contain bg-white">
              <img src="${siteUrl('assets/ucc-logo.png')}" alt="UCC Logo" class="hidden sm:block h-9 w-9 object-contain">
              <span class="serif font-bold text-xl tracking-tight text-stone-900 truncate">Luban <span class="text-red-700">Workshop</span></span>
            </div>
            <div class="hidden md:flex items-center gap-5 text-sm font-medium text-stone-600" aria-label="Primary navigation">
              <a href="${siteUrl('meet-bao.html')}" class="hover:text-red-700 transition-colors">Meet Bao</a>
              <a href="#menu" class="hover:text-red-700 transition-colors">Menu</a>
              <a href="${siteUrl('events-and-catering.html')}" class="hover:text-red-700 transition-colors">Reservations</a>
              <a href="${siteUrl('contact-us.html')}" class="hover:text-red-700 transition-colors">Contact</a>
              <a href="${siteUrl('faq.html')}" class="hover:text-red-700 transition-colors">FAQ</a>
              <a id="admin-btn-desktop" href="${siteUrl('admin.html')}" class="hidden items-center rounded-md bg-stone-900 px-3 py-1.5 text-white hover:bg-stone-800 transition-colors">Admin</a>
            </div>
            <div class="flex items-center gap-2">
              <a href="#my-orders" id="my-orders-link-desktop" class="hidden md:inline-flex p-2 text-stone-600 hover:text-red-700 transition-colors" aria-label="My Orders">
                <i data-lucide="package" class="h-6 w-6"></i>
              </a>
              <button onclick="toggleCart()" aria-label="Open cart" class="relative p-2 text-stone-600 hover:text-red-700 transition-colors">
                <i data-lucide="shopping-bag" class="h-6 w-6"></i>
                <span id="cart-badge-desktop" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-700 rounded-full hidden">0</span>
              </button>
              <button id="auth-btn-desktop" onclick="toggleAuthModal()" class="hidden md:inline-flex px-3 py-1.5 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors">
                Sign Up / Login
              </button>
              <button onclick="toggleNavDrawer()" class="md:hidden shrink-0 p-2 text-stone-600 hover:text-red-700 transition-colors" aria-label="Open navigation menu">
                <i data-lucide="menu" class="h-6 w-6"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div id="nav-drawer-overlay" class="md:hidden fixed inset-0 bg-black/40 z-[60] opacity-0 pointer-events-none transition-opacity duration-300" onclick="toggleNavDrawer()"></div>
      <div id="nav-drawer" class="md:hidden fixed top-0 right-0 h-dvh w-72 max-w-full bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 flex flex-col mobile-drawer-panel">
        <div class="flex justify-between items-center p-4 border-b border-stone-100">
          <div class="flex items-center gap-2">
            <img src="${siteUrl('logo.png')}" alt="Luban" class="h-8 w-8 rounded-full object-contain bg-white">
            <img src="${siteUrl('assets/ucc-logo.png')}" alt="UCC" class="h-7 w-7 object-contain">
            <span class="serif font-bold text-stone-900 text-sm">Menu</span>
          </div>
          <button onclick="toggleNavDrawer()" class="p-2 text-stone-600 hover:text-red-700 transition-colors" aria-label="Close menu">
            <i data-lucide="x" class="h-6 w-6"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-1">
          <a href="${siteUrl('meet-bao.html')}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <i data-lucide="sparkles" class="h-5 w-5 flex-shrink-0"></i> Meet Bao
          </a>
          <a href="#menu" onclick="toggleNavDrawer()" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <i data-lucide="utensils" class="h-5 w-5 flex-shrink-0"></i> Our Menu
          </a>
          <a href="#my-orders" id="my-orders-link-mobile" onclick="toggleNavDrawer()" class="hidden items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <i data-lucide="package" class="h-5 w-5 flex-shrink-0"></i> My Orders
          </a>
          <a href="${siteUrl('events-and-catering.html')}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <i data-lucide="calendar" class="h-5 w-5 flex-shrink-0"></i> Reserve a Table
          </a>
          <a href="#location" onclick="toggleNavDrawer()" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <i data-lucide="map-pin" class="h-5 w-5 flex-shrink-0"></i> Locate Us
          </a>
          <a href="${siteUrl('faq.html')}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <i data-lucide="help-circle" class="h-5 w-5 flex-shrink-0"></i> FAQ
          </a>
          <a href="${siteUrl('contact-us.html')}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <i data-lucide="phone" class="h-5 w-5 flex-shrink-0"></i> Contact Us
          </a>
          <a id="admin-btn-mobile" href="${siteUrl('admin.html')}" class="hidden items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-stone-800 hover:bg-stone-900 font-medium transition-colors">
            <i data-lucide="shield" class="h-5 w-5 flex-shrink-0"></i> Admin Dashboard
          </a>
        </div>
        <div class="px-4 pb-2">
          <button onclick="toggleNavDrawer(); toggleCart();" class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-stone-700 hover:text-red-700 hover:bg-red-50 font-medium transition-colors">
            <span class="flex items-center gap-3">
              <i data-lucide="shopping-bag" class="h-5 w-5 flex-shrink-0"></i> View Cart
            </span>
            <span id="cart-badge-mobile" class="hidden items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-700 rounded-full">0</span>
          </button>
        </div>
        <div class="border-t border-stone-100 p-4 pb-safe-6">
          <button id="auth-btn-sidebar" onclick="toggleAuthModal(); toggleNavDrawer();" class="w-full px-3 py-2 rounded-md text-sm font-medium text-white bg-red-700 hover:bg-red-800 transition-colors">Sign Up / Login</button>
          <div id="user-info-sidebar" class="hidden w-full text-left px-3 py-2 rounded-md text-sm font-medium text-stone-600 hover:text-red-700 flex items-center justify-between">
            <div class="home-user-info-row">
              <i data-lucide="user" class="h-4 w-4 inline mr-2"></i>
              <span id="user-email-sidebar"></span>
            </div>
            <div class="home-user-actions">
              <a id="manage-account-btn" href="${siteUrl('customer-profile.html')}" aria-label="Manage account" class="p-1 text-stone-600 hover:text-red-700" title="Manage profile">
                <i data-lucide="settings" class="h-4 w-4"></i>
              </a>
              <button id="logout-sidebar-btn" aria-label="Sign out" class="p-1 text-stone-600 hover:text-red-700" onclick="logout()">
                <i data-lucide="log-out" class="h-4 w-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderChineseHomeHeader() {
    return `
      <nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-md z-50 transition-all duration-300">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            ${brandHtml({
              href: siteUrl('chinese/index.html'),
              logo: siteUrl('logo.png'),
              logoAlt: '鲁班工坊标志',
              ucc: false,
              wrapperClass: 'flex-shrink-0 flex items-center',
              logoClass: 'h-10 w-10 rounded-full object-contain bg-white mr-2',
              textClass: 'serif font-bold text-lg text-stone-900'
            })}
            <div class="hidden md:flex space-x-5 items-center">
              <a href="#menu" class="text-stone-600 hover:text-red-700 transition-colors font-medium">菜单</a>
              <a href="#reservation" class="text-stone-600 hover:text-red-700 transition-colors font-medium">预订</a>
              <a href="#location" class="text-stone-600 hover:text-red-700 transition-colors font-medium">位置</a>
              <a href="${siteUrl('chinese/events-and-catering.html')}" class="text-stone-600 hover:text-red-700 transition-colors font-medium">活动</a>
              <a href="${siteUrl('chinese/contact-us.html')}" class="text-stone-600 hover:text-red-700 transition-colors font-medium">联系</a>
              <a href="${siteUrl('chinese/about-us.html')}" class="text-stone-600 hover:text-red-700 transition-colors font-medium">关于</a>
              <a href="${siteUrl('chinese/menu.html')}" class="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors">查看菜单</a>
            </div>
            <div class="flex items-center md:hidden gap-4">
              <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" aria-label="Toggle navigation menu" class="text-stone-600 hover:text-red-700 p-2">
                <i data-lucide="menu" class="h-6 w-6"></i>
              </button>
            </div>
          </div>
        </div>
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-stone-100">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#menu" class="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-red-700 hover:bg-stone-50">菜单</a>
            <a href="#reservation" class="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-red-700 hover:bg-stone-50">预订</a>
            <a href="#location" class="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-red-700 hover:bg-stone-50">位置</a>
            <a href="${siteUrl('chinese/events-and-catering.html')}" class="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-red-700 hover:bg-stone-50">活动与外烩</a>
            <a href="${siteUrl('chinese/contact-us.html')}" class="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-red-700 hover:bg-stone-50">联系我们</a>
            <a href="${siteUrl('chinese/about-us.html')}" class="block px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-red-700 hover:bg-stone-50">关于我们</a>
            <a href="${siteUrl('chinese/menu.html')}" class="block px-3 py-2 rounded-md text-base font-medium text-white bg-red-700 hover:bg-red-800">查看菜单</a>
          </div>
        </div>
      </nav>
    `;
  }

  function renderSimpleAboutHeader(chinese) {
    const home = chinese ? siteUrl('chinese/index.html') : siteUrl('index.html');
    const menu = chinese ? siteUrl('chinese/menu.html') : siteUrl('menu.html');
    const about = chinese ? siteUrl('chinese/about-us.html') : siteUrl('about-us/');
    const labels = chinese
      ? { home: '首页', menu: '菜单', about: '关于我们', alt: '鲁班工坊标志' }
      : { home: 'Home', menu: 'Menu', about: 'About Us', alt: 'Luban Workshop Logo' };

    return `
      <nav>
        <div>
          <a href="${home}" class="brand">
            <img src="${siteUrl('logo.png')}" alt="${labels.alt}" style="height:36px;width:36px;border-radius:50%;object-fit:contain;background:#fff;">
            <span>Luban <em>Workshop</em></span>
          </a>
          <div class="nav-links">
            <a href="${home}">${labels.home}</a>
            <a href="${menu}">${labels.menu}</a>
            <a href="${about}" class="active">${labels.about}</a>
          </div>
        </div>
      </nav>
    `;
  }

  function renderHeader(mount) {
    const variant = mount.getAttribute('data-luban-header') || 'back';
    if (variant === 'shop') return renderShopHeader();
    if (variant === 'profile') return renderProfileHeader();
    if (variant === 'account') return renderAccountHeader(mount);
    if (variant === 'menu') return renderMenuHeader(false);
    if (variant === 'menu-zh') return renderMenuHeader(true);
    if (variant === 'home-zh') return renderChineseHomeHeader();
    if (variant === 'about') return renderSimpleAboutHeader(false);
    if (variant === 'about-zh') return renderSimpleAboutHeader(true);
    return renderBackHeader(mount);
  }

  function renderHeaders() {
    document.querySelectorAll('[data-luban-header]').forEach((mount) => {
      mount.outerHTML = renderHeader(mount);
    });
    lucideRefresh();
  }

  if (document.readyState === 'loading' && !document.querySelector('[data-luban-header]')) {
    document.addEventListener('DOMContentLoaded', renderHeaders);
  } else {
    renderHeaders();
  }
}());
