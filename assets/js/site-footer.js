(function () {
  const script = document.currentScript;
  const rootUrl = script ? new URL('../../', script.src) : new URL('/', window.location.href);
  const siteConfig = window.LUBAN_SITE_CONFIG || {};
  const siteCredits = siteConfig.siteCredits || {};
  const leadDeveloper = siteCredits.leadDeveloper || {
    name: 'Francis Pwavwe',
    company: 'AZ Learner',
    companyUrl: 'https://azlearner.me',
    url: 'https://francis.azlearner.me',
    email: 'francis@azlearner.me'
  };
  const coDeveloper = siteCredits.coDeveloper || {
    name: 'Chinedum Okwonkwo Udeaja',
    email: 'udeajachinedum19@gmail.com'
  };

  function siteUrl(path) {
    return new URL(path, rootUrl).href;
  }

  function loadAssistantButton() {
    if (document.querySelector('script[src*="firebase-ai-chatbot.js"]')) return;
    if (window.__lubanAiChatbotLoading) return;

    window.__lubanAiChatbotLoading = true;
    import(siteUrl('assets/js/firebase-ai-chatbot.js?v=20260530-assistant-button')).catch((error) => {
      window.__lubanAiChatbotLoading = false;
      console.warn('Could not load Luban assistant button:', error);
    });
  }

  function fullNameList() {
    return [leadDeveloper.name, coDeveloper.name].filter(Boolean).join(', ');
  }

  function leadDeveloperDisplayName() {
    return leadDeveloper.company ? `${leadDeveloper.name} (${leadDeveloper.company})` : leadDeveloper.name;
  }

  function injectAuthorMetadata() {
    const head = document.head;
    if (!head || head.querySelector('meta[name="author"][data-luban-author]')) {
      return;
    }

    const authorMeta = document.createElement('meta');
    authorMeta.name = 'author';
    authorMeta.content = fullNameList();
    authorMeta.setAttribute('data-luban-author', 'true');
    head.appendChild(authorMeta);

    const jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.setAttribute('data-luban-author', 'true');
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          name: leadDeveloper.name,
          url: leadDeveloper.url,
          email: leadDeveloper.email,
          worksFor: leadDeveloper.company ? {
            '@type': 'Organization',
            name: leadDeveloper.company,
            url: leadDeveloper.companyUrl || 'https://azlearner.me'
          } : undefined
        },
        {
          '@type': 'Person',
          name: coDeveloper.name,
          email: coDeveloper.email
        }
      ]
    });
    head.appendChild(jsonLd);
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
          rights: '\u7248\u6743\u6240\u6709\u3002',
          reservations: '\u9884\u8ba2\u7535\u8bdd',
          terms: '\u4f7f\u7528\u6761\u6b3e',
          privacy: '\u9690\u79c1\u653f\u7b56',
          about: '\u5173\u4e8e\u6211\u4eec',
          contact: '\u8054\u7cfb\u6211\u4eec',
          faq: '\u5e38\u89c1\u95ee\u9898',
          facebook: 'Luban Workshop \u7684 Facebook',
          instagram: 'Luban Workshop \u7684 Instagram',
        }
      : {
          rights: 'All rights reserved.',
          reservations: 'For reservations',
          terms: 'Terms of Use',
          privacy: 'Privacy Policy',
          meetBao: 'Meet Bao',
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
          ['meet-bao.html', labels.meetBao],
          ['about-us/', labels.about],
          ['contact-us.html', labels.contact],
          ['faq.html', labels.faq],
        ];

      const creditLine = chinese
        ? `由 ${leadDeveloperDisplayName()} 与 ${coDeveloper.name} 共同开发。`
        : `Developed by ${leadDeveloperDisplayName()} and ${coDeveloper.name}.`;

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
          <p class="mt-6 text-xs text-stone-500">${creditLine}</p>
        </div>
      </footer>
    `;
  }

  function renderFooters() {
    injectAuthorMetadata();
    loadAssistantButton();

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
