(function () {
  const script = document.currentScript;
  const rootUrl = script ? new URL('../../', script.src) : new URL('/', window.location.href);

  function siteUrl(path) {
    return new URL(path, rootUrl).href;
  }

  function isChinesePage(mount) {
    const override = mount.getAttribute('data-luban-footer');
    if (override === 'zh' || override === 'en') {
      return override === 'zh';
    }

    const lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    return lang.startsWith('zh') || window.location.pathname.includes('/chinese/');
  }

  function socialIcon(name) {
    if (name === 'facebook') {
      return '<svg class="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1z"></path></svg>';
    }

    return '<svg class="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none"></circle></svg>';
  }

  function footerHtml(chinese) {
    const labels = chinese
      ? {
          rights: '版权所有。',
          reservations: '预订电话',
          terms: '使用条款',
          privacy: '隐私政策',
          about: '关于我们',
          contact: '联系我们',
          faq: '常见问题',
          facebook: 'Luban Workshop 的 Facebook',
          instagram: 'Luban Workshop 的 Instagram',
        }
      : {
          rights: 'All rights reserved.',
          reservations: 'For reservations',
          terms: 'Terms of Use',
          privacy: 'Privacy Policy',
          about: 'About Us',
          contact: 'Contact Us',
          faq: 'FAQ',
          facebook: 'Luban Workshop on Facebook',
          instagram: 'Luban Workshop on Instagram',
        };

    const links = chinese
      ? [
          ['terms-of-use.html', labels.terms],
          ['chinese/privacy-policy.html', labels.privacy],
          ['chinese/about-us.html', labels.about],
          ['chinese/contact-us.html', labels.contact],
          ['chinese/faq.html', labels.faq],
        ]
      : [
          ['terms-of-use.html', labels.terms],
          ['privacy-policy.html', labels.privacy],
          ['about-us/', labels.about],
          ['contact-us.html', labels.contact],
          ['faq.html', labels.faq],
        ];

    const navLinks = links
      .map(([href, label]) => `<a href="${siteUrl(href)}" class="hover:text-white transition-colors">${label}</a>`)
      .join('');

    return `
      <footer class="bg-stone-900 text-stone-400 py-12">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="flex justify-center items-center gap-3 mb-6">
            <img src="${siteUrl('logo.png')}" alt="Luban Workshop" class="h-10 w-10 rounded-full object-contain bg-white">
            <img src="${siteUrl('assets/ucc-logo.png')}" alt="UCC" class="h-9 w-9 object-contain">
            <span class="serif font-bold text-2xl text-white">Luban Workshop</span>
          </div>
          <p class="mb-6">&copy; <span data-luban-footer-year></span> Luban Workshop Restaurant. ${labels.rights}</p>
          <p class="mb-6 text-sm">${labels.reservations}: 020 543 8455</p>
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm mb-6">
            ${navLinks}
          </div>
          <div class="flex justify-center space-x-6">
            <a href="https://www.facebook.com/profile.php/?id=61583678376642" aria-label="${labels.facebook}" target="_blank" rel="noopener noreferrer" class="text-stone-400 hover:text-white transition-colors">${socialIcon('facebook')}</a>
            <a href="https://www.instagram.com/lubanworkshoprestaurant/" aria-label="${labels.instagram}" target="_blank" rel="noopener noreferrer" class="text-stone-400 hover:text-white transition-colors">${socialIcon('instagram')}</a>
          </div>
        </div>
      </footer>
    `;
  }

  function renderFooters() {
    document.querySelectorAll('[data-luban-footer]').forEach((mount) => {
      mount.outerHTML = footerHtml(isChinesePage(mount));
    });

    document.querySelectorAll('[data-luban-footer-year]').forEach((year) => {
      year.textContent = new Date().getFullYear();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFooters);
  } else {
    renderFooters();
  }
}());
