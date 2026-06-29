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
    import(siteUrl('assets/js/firebase-ai-chatbot.js?v=20260629-bao-glow')).catch((error) => {
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

  function contactIcon(name, cls) {
    const klass = cls || 'h-4 w-4';
    const open = `<svg class="${klass}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;

    if (name === 'map-pin') {
      return `${open}<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    }
    if (name === 'phone') {
      return `${open}<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
    }
    if (name === 'mail') {
      return `${open}<rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`;
    }

    return `${open}<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`;
  }

  function footerHtml(chinese) {
    const labels = chinese
      ? {
          rights: '版权所有。',
          terms: '使用条款',
          privacy: '隐私政策',
          menu: '菜单',
          about: '关于我们',
          reservationsCatering: '预订与宴会',
          faq: '常见问题',
          contact: '联系我们',
          facebook: 'Luban Workshop 的 Facebook',
          instagram: 'Luban Workshop 的 Instagram',
          tagline: '位于海岸角大学（UCC）的正宗中式料理。',
          explore: '探索',
          visit: '到访我们',
          hoursHeading: '营业时间',
          directions: '获取路线',
          hoursWeekdays: '周一至周五：11:00 – 17:30',
          hoursWeekend: '周六至周日：休息',
          reserveCta: '预订餐桌',
          secondaryCta: '查看菜单',
          addressAria: '在 Google 地图中查看 Luban Workshop 的位置',
          phoneAria: '致电 Luban Workshop',
          emailAria: '给 Luban Workshop 发送邮件',
        }
      : {
          rights: 'All rights reserved.',
          terms: 'Terms of Use',
          privacy: 'Privacy Policy',
          menu: 'Menu',
          meetBao: 'Meet Bao',
          about: 'About Us',
          reservationsCatering: 'Reservations & Catering',
          faq: 'FAQ',
          contact: 'Contact Us',
          facebook: 'Luban Workshop on Facebook',
          instagram: 'Luban Workshop on Instagram',
          tagline: 'Authentic Chinese cuisine at the University of Cape Coast.',
          explore: 'Explore',
          visit: 'Visit Us',
          hoursHeading: 'Opening Hours',
          directions: 'Get directions',
          hoursWeekdays: 'Mon – Fri: 11:00 – 17:30',
          hoursWeekend: 'Sat – Sun: Closed',
          reserveCta: 'Reserve a Table',
          secondaryCta: 'Order Online',
          addressAria: 'View Luban Workshop on Google Maps',
          phoneAria: 'Call Luban Workshop',
          emailAria: 'Email Luban Workshop',
        };

    const exploreLinks = chinese
      ? [
          ['chinese/menu.html', labels.menu],
          ['chinese/about-us.html', labels.about],
          ['chinese/events-and-catering.html', labels.reservationsCatering],
          ['chinese/faq.html', labels.faq],
          ['chinese/contact-us.html', labels.contact],
        ]
      : [
          ['menu.html', labels.menu],
          ['meet-bao.html', labels.meetBao],
          ['about-us/', labels.about],
          ['events-and-catering.html', labels.reservationsCatering],
          ['faq.html', labels.faq],
          ['contact-us.html', labels.contact],
        ];

    const legalLinks = chinese
      ? [
          ['terms-of-use.html', labels.terms],
          ['chinese/privacy-policy.html', labels.privacy],
        ]
      : [
          ['terms-of-use.html', labels.terms],
          ['privacy-policy.html', labels.privacy],
        ];

    const reserveHref = chinese
      ? siteUrl('chinese/events-and-catering.html')
      : siteUrl('events-and-catering.html#reservation');
    const secondaryHref = chinese
      ? siteUrl('chinese/menu.html')
      : siteUrl('index.html#menu');

    const mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=5.117627511674501,-1.2856029509704792&destination_place_id=ChIJj-h4NwD_3Q8RDh9AYUqkSLI';
    const addressLine1 = 'Cafe Roof Top, Casford Street';
    const addressLine2 = chinese ? '海岸角大学（UCC），加纳' : 'UCC, Cape Coast, Ghana';
    const phoneDisplay = '020 543 8455';
    const phoneHref = 'tel:+233205438455';
    const email = 'reservations@lubanrestaurant.com';

    const creditLine = chinese
      ? `由 ${leadDeveloperDisplayName()} 与 ${coDeveloper.name} 共同开发。`
      : `Developed by ${leadDeveloperDisplayName()} and ${coDeveloper.name}.`;

    const navLinks = exploreLinks
      .map(([href, label]) => `<a href="${siteUrl(href)}" class="w-fit text-stone-400 hover:text-white transition-colors">${label}</a>`)
      .join('');

    const legalLinksHtml = legalLinks
      .map(([href, label]) => `<a href="${siteUrl(href)}" class="hover:text-stone-300 transition-colors">${label}</a>`)
      .join('');

    return `
      <footer class="bg-stone-900 text-stone-400">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div class="grid gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <div class="flex items-center gap-3">
                <img src="${siteUrl('logo.png')}" alt="Luban Workshop" class="h-11 w-11 rounded-full object-contain bg-white">
                <img src="${siteUrl('assets/ucc-logo.png')}" alt="UCC" class="h-9 w-9 object-contain">
              </div>
              <p class="mt-4 serif text-2xl font-bold text-white">Luban Workshop</p>
              <p class="mt-3 max-w-xs text-sm leading-relaxed">${labels.tagline}</p>
              <div class="mt-5 flex gap-3">
                <a href="https://www.facebook.com/profile.php/?id=61583678376642" aria-label="${labels.facebook}" target="_blank" rel="noopener noreferrer" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white transition-colors">${socialIcon('facebook')}</a>
                <a href="https://www.instagram.com/lubanworkshoprestaurant/" aria-label="${labels.instagram}" target="_blank" rel="noopener noreferrer" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white transition-colors">${socialIcon('instagram')}</a>
              </div>
            </div>

            <div>
              <h3 class="text-xs font-semibold uppercase tracking-widest text-red-300">${labels.explore}</h3>
              <nav aria-label="${labels.explore}" class="mt-4 flex flex-col gap-2.5 text-sm">
                ${navLinks}
              </nav>
            </div>

            <div>
              <h3 class="text-xs font-semibold uppercase tracking-widest text-red-300">${labels.visit}</h3>
              <address class="mt-4 space-y-3 text-sm not-italic">
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" aria-label="${labels.addressAria}" class="group flex items-start gap-3 hover:text-white transition-colors">
                  ${contactIcon('map-pin', 'h-4 w-4 mt-0.5 flex-shrink-0 text-red-300')}
                  <span>${addressLine1}<br>${addressLine2}<br><span class="text-xs font-semibold text-red-300 group-hover:text-white">${labels.directions} &rarr;</span></span>
                </a>
                <a href="${phoneHref}" aria-label="${labels.phoneAria}" class="flex items-center gap-3 hover:text-white transition-colors">
                  ${contactIcon('phone', 'h-4 w-4 flex-shrink-0 text-red-300')}
                  <span>${phoneDisplay}</span>
                </a>
                <a href="mailto:${email}" aria-label="${labels.emailAria}" class="flex items-center gap-3 hover:text-white transition-colors">
                  ${contactIcon('mail', 'h-4 w-4 flex-shrink-0 text-red-300')}
                  <span class="break-all">${email}</span>
                </a>
              </address>
            </div>

            <div>
              <h3 class="text-xs font-semibold uppercase tracking-widest text-red-300">${labels.hoursHeading}</h3>
              <div class="mt-4 flex items-start gap-3 text-sm">
                ${contactIcon('clock', 'h-4 w-4 mt-0.5 flex-shrink-0 text-red-300')}
                <div class="space-y-1">
                  <p>${labels.hoursWeekdays}</p>
                  <p>${labels.hoursWeekend}</p>
                </div>
              </div>
              <div class="mt-5 flex flex-col gap-2.5">
                <a href="${reserveHref}" class="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 transition-colors">${labels.reserveCta}</a>
                <a href="${secondaryHref}" class="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">${labels.secondaryCta}</a>
              </div>
            </div>

          </div>

          <div class="mt-12 pt-8 border-t border-stone-800 flex flex-col gap-4 text-xs text-stone-500 md:flex-row md:items-center md:justify-between">
            <div class="flex flex-col gap-x-4 gap-y-2 sm:flex-row sm:items-center">
              <p>&copy; <span data-luban-footer-year></span> Luban Workshop Restaurant. ${labels.rights}</p>
              <div class="flex items-center gap-4">
                ${legalLinksHtml}
              </div>
            </div>
            <p>${creditLine}</p>
          </div>
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
