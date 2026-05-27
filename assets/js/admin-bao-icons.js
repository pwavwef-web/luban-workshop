(function () {
    const face = `
        <path fill="#fff7ed" stroke="#7c2d12" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9.2 10.7c1-3.5 3.3-5.2 6.8-5.2s5.8 1.7 6.8 5.2c3 1.2 5 4 5 7.5 0 5.3-4.8 8.7-11.8 8.7S4.2 23.5 4.2 18.2c0-3.5 2-6.3 5-7.5Z"/>
        <path stroke="#7c2d12" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M9.9 10.9c1.3 1.5 3.1 2.1 6.1 2.1s4.8-.6 6.1-2.1M11.1 17.1c.7-.7 1.4-.7 2.1 0M18.8 17.1c.7-.7 1.4-.7 2.1 0"/>
        <path fill="#b91c1c" d="M12.4 20.7c1.6 1.4 5.6 1.4 7.2 0-.6 2.1-6.6 2.1-7.2 0Z"/>
        <circle cx="9.7" cy="19" r="1" fill="#fca5a5"/>
        <circle cx="22.3" cy="19" r="1" fill="#fca5a5"/>
    `;

    const accents = {
        brand: `
            <path stroke="#b91c1c" stroke-width="1.8" stroke-linecap="round" d="M6.2 7.2 13 14M25.8 7.2 19 14"/>
            <path stroke="#d97706" stroke-width="1.4" stroke-linecap="round" d="M7.8 5.7 15 12.9M24.2 5.7 17 12.9"/>
        `,
        menuToggle: `
            <path stroke="#b91c1c" stroke-width="2.1" stroke-linecap="round" d="M10 8.2h12M11.5 12h9M10 15.8h12"/>
        `,
        close: `
            <path stroke="#b91c1c" stroke-width="2.2" stroke-linecap="round" d="m10.8 8.2 10.4 10.4M21.2 8.2 10.8 18.6"/>
        `,
        dashboard: `
            <rect x="20.2" y="5.4" width="6.4" height="6.4" rx="1.2" fill="#fee2e2" stroke="#b91c1c" stroke-width="1.4"/>
            <path stroke="#b91c1c" stroke-width="1.3" stroke-linecap="round" d="M22.2 8.1h2.4M23.4 6.9v2.4"/>
        `,
        menuManager: `
            <rect x="19.6" y="5.2" width="7.2" height="8.7" rx="1.3" fill="#fef3c7" stroke="#92400e" stroke-width="1.4"/>
            <path stroke="#92400e" stroke-width="1.1" stroke-linecap="round" d="M21.4 8h3.6M21.4 10.2h3.2"/>
        `,
        reservations: `
            <rect x="19.2" y="5.5" width="7.8" height="7.2" rx="1.2" fill="#dcfce7" stroke="#166534" stroke-width="1.4"/>
            <path stroke="#166534" stroke-width="1.1" stroke-linecap="round" d="M21 4.7v2.1M25.2 4.7v2.1M19.4 8.2h7.3"/>
            <path stroke="#166534" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="m21.1 10.5 1.3 1.1 2.5-2.6"/>
        `,
        orders: `
            <path fill="#fee2e2" stroke="#b91c1c" stroke-width="1.4" stroke-linejoin="round" d="M19.5 8.7h7.1l-.8 6.6h-5.5l-.8-6.6Z"/>
            <path stroke="#b91c1c" stroke-width="1.3" stroke-linecap="round" d="M21.5 8.4c.1-2 1.3-3.1 2.1-3.1s2 1.1 2.1 3.1"/>
        `,
        promotions: `
            <path fill="#fde68a" stroke="#b45309" stroke-width="1.4" stroke-linejoin="round" d="M20.8 5.5h4.5l2 2v5.2l-5.8 1.4-2.4-4.9 1.7-3.7Z"/>
            <circle cx="23.3" cy="8.6" r=".8" fill="#b45309"/>
            <path stroke="#b45309" stroke-width="1.1" stroke-linecap="round" d="m21.8 12.1 3.7-3.7"/>
        `,
        specialMenus: `
            <rect x="19.4" y="5.4" width="7.5" height="7.5" rx="1.1" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.3"/>
            <path fill="#7c3aed" d="M21 7h1.6v1.6H21zM23.8 7h1.6v1.6h-1.6zM21 9.8h1.6v1.6H21zM24 10h1.3v1.3H24z"/>
        `,
        adminUsers: `
            <path fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.4" stroke-linejoin="round" d="M23.2 4.8 27 6.2v3.3c0 2.4-1.4 4.2-3.8 5.5-2.4-1.3-3.8-3.1-3.8-5.5V6.2l3.8-1.4Z"/>
            <path stroke="#1d4ed8" stroke-width="1.1" stroke-linecap="round" d="M21.3 9.6h3.8M23.2 7.7v3.8"/>
        `,
        messages: `
            <path fill="#e0f2fe" stroke="#0369a1" stroke-width="1.4" stroke-linejoin="round" d="M19.1 6.3h8.1v5.6c0 1-.8 1.8-1.8 1.8h-2.8l-3.1 2.2v-2.2h-.4V6.3Z"/>
            <path stroke="#0369a1" stroke-width="1.1" stroke-linecap="round" d="M21.1 9h4.1M21.1 11h2.8"/>
        `,
        fraudReview: `
            <path fill="#fee2e2" stroke="#991b1b" stroke-width="1.4" stroke-linejoin="round" d="M23.1 4.8 27 6.4v3.1c0 2.6-1.3 4.4-3.9 5.8-2.6-1.4-3.9-3.2-3.9-5.8V6.4l3.9-1.6Z"/>
            <path stroke="#991b1b" stroke-width="1.3" stroke-linecap="round" d="M23.1 7.4v3.2"/>
            <circle cx="23.1" cy="12.4" r=".7" fill="#991b1b"/>
        `,
        chatbot: `
            <path stroke="#0f766e" stroke-width="1.4" stroke-linecap="round" d="M22.8 5.6V3.9"/>
            <circle cx="22.8" cy="3.3" r=".9" fill="#99f6e4" stroke="#0f766e" stroke-width="1.1"/>
            <rect x="19.2" y="6.3" width="7.3" height="6.2" rx="2" fill="#ccfbf1" stroke="#0f766e" stroke-width="1.4"/>
            <path stroke="#0f766e" stroke-width="1.1" stroke-linecap="round" d="M21.3 9.1h.1M24.2 9.1h.1M21.8 10.8c.7.5 1.6.5 2.3 0"/>
        `,
        settings: `
            <circle cx="23.1" cy="9.3" r="2.2" fill="#e7e5e4" stroke="#57534e" stroke-width="1.3"/>
            <path stroke="#57534e" stroke-width="1.2" stroke-linecap="round" d="M23.1 5.2v1.2M23.1 12.2v1.2M19 9.3h1.2M26 9.3h1.2M20.2 6.4l.8.8M25.2 11.4l.8.8M26 6.4l-.8.8M21 11.4l-.8.8"/>
        `,
        profileReview: `
            <circle cx="23.1" cy="8.5" r="2.1" fill="#dcfce7" stroke="#166534" stroke-width="1.3"/>
            <path fill="#dcfce7" stroke="#166534" stroke-width="1.3" d="M19.7 14.1c.5-2 1.7-3 3.4-3s2.9 1 3.4 3"/>
            <path stroke="#166534" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" d="m21.2 14.2 1 1 2.5-2.7"/>
        `,
        chef: `
            <path fill="#fff" stroke="#7c2d12" stroke-width="1.4" stroke-linejoin="round" d="M10.5 8c0-1.4 1-2.6 2.5-2.6.5-1.3 1.6-2.1 3-2.1s2.5.8 3 2.1c1.5 0 2.5 1.2 2.5 2.6 0 1.2-.8 2.2-2 2.5H12.5c-1.2-.3-2-1.3-2-2.5Z"/>
            <path stroke="#7c2d12" stroke-width="1.2" stroke-linecap="round" d="M12.2 12.1h7.6"/>
        `,
        logout: `
            <path stroke="#b91c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M20.2 6.6h3.8v7.6h-3.8M22.3 10.4h6.3m-2-2.1 2 2.1-2 2.1"/>
        `,
        edit: `
            <path fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.4" stroke-linejoin="round" d="m19.7 13.5 1.2-3.6 4.6-4.6 2.4 2.4-4.6 4.6-3.6 1.2Z"/>
            <path stroke="#1d4ed8" stroke-width="1.1" stroke-linecap="round" d="m24.4 6.3 2.4 2.4"/>
        `,
        image: `
            <rect x="19.1" y="6" width="8" height="7.2" rx="1.2" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.4"/>
            <circle cx="24.9" cy="8.2" r=".8" fill="#7c3aed"/>
            <path stroke="#7c3aed" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="m20.4 12.1 2-2 1.3 1.3 1.1-1 1.4 1.7"/>
        `,
        show: `
            <path fill="#ecfeff" stroke="#0891b2" stroke-width="1.3" stroke-linejoin="round" d="M18.8 10.1c1.3-2.2 2.8-3.2 4.5-3.2s3.2 1 4.5 3.2c-1.3 2.2-2.8 3.2-4.5 3.2s-3.2-1-4.5-3.2Z"/>
            <circle cx="23.3" cy="10.1" r="1.2" fill="#0891b2"/>
        `,
        hide: `
            <path fill="#f1f5f9" stroke="#475569" stroke-width="1.3" stroke-linejoin="round" d="M18.8 10.1c1.3-2.2 2.8-3.2 4.5-3.2s3.2 1 4.5 3.2c-1.3 2.2-2.8 3.2-4.5 3.2s-3.2-1-4.5-3.2Z"/>
            <path stroke="#475569" stroke-width="1.4" stroke-linecap="round" d="m19.2 14.1 8.2-8.2"/>
        `,
        approve: `
            <circle cx="23.2" cy="9.8" r="4" fill="#dcfce7" stroke="#15803d" stroke-width="1.4"/>
            <path stroke="#15803d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m21.2 9.9 1.3 1.4 2.9-3.2"/>
        `,
        reject: `
            <circle cx="23.2" cy="9.8" r="4" fill="#fee2e2" stroke="#b91c1c" stroke-width="1.4"/>
            <path stroke="#b91c1c" stroke-width="1.5" stroke-linecap="round" d="m21.5 8.1 3.4 3.4M24.9 8.1l-3.4 3.4"/>
        `,
        revert: `
            <path fill="#fef3c7" stroke="#b45309" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M25.8 7.2a4.3 4.3 0 1 1-4.9-.5"/>
            <path stroke="#b45309" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M20.7 4.8v2.3h2.4"/>
        `,
        delete: `
            <path fill="#fee2e2" stroke="#991b1b" stroke-width="1.4" stroke-linejoin="round" d="M20.6 8h5.4l-.5 6.4h-4.4L20.6 8Z"/>
            <path stroke="#991b1b" stroke-width="1.2" stroke-linecap="round" d="M19.6 8h7.4M22 6.5h2.7M22.2 10v2.9M24.4 10v2.9"/>
        `,
        openLink: `
            <rect x="19.2" y="6.1" width="7.3" height="7.3" rx="1.2" fill="#e0f2fe" stroke="#0369a1" stroke-width="1.3"/>
            <path stroke="#0369a1" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M22 11.6 26.3 7.3M23.6 7.1h2.9V10"/>
        `,
        copy: `
            <rect x="18.9" y="7.4" width="5.2" height="5.2" rx="1" fill="#f5f3ff" stroke="#6d28d9" stroke-width="1.2"/>
            <rect x="21.5" y="5.5" width="5.2" height="5.2" rx="1" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.2"/>
        `,
        download: `
            <path fill="#dcfce7" stroke="#166534" stroke-width="1.3" stroke-linejoin="round" d="M19.3 12.4h7.8v2.4h-7.8z"/>
            <path stroke="#166534" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M23.2 5.2v6.1m-2.2-2 2.2 2.2 2.2-2.2"/>
        `,
        print: `
            <path fill="#e7e5e4" stroke="#57534e" stroke-width="1.3" stroke-linejoin="round" d="M20.5 5.5h5.4v3.3h-5.4zM19.1 9.1h8.2v4.5h-8.2z"/>
            <path stroke="#57534e" stroke-width="1.1" stroke-linecap="round" d="M21 12.2h4.4M21 14h4.4"/>
        `,
        refresh: `
            <path stroke="#0891b2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M25.8 7a4.1 4.1 0 0 0-6.5 1.2M20 5.4l-.8 2.8 2.9.3M20.7 13.1a4.1 4.1 0 0 0 6.4-1.4M26.4 14.8l.8-2.8-2.9-.3"/>
        `,
        sparkles: `
            <path fill="#fde68a" stroke="#b45309" stroke-width="1.1" stroke-linejoin="round" d="m23.1 4.7.9 2.5 2.4.9-2.4.9-.9 2.5-.9-2.5-2.4-.9 2.4-.9.9-2.5Z"/>
            <path fill="#fee2e2" stroke="#b91c1c" stroke-width="1" d="m27 12.1.4 1.2 1.2.4-1.2.5-.4 1.2-.5-1.2-1.2-.5 1.2-.4.5-1.2Z"/>
        `,
        loader: `
            <path stroke="#b91c1c" stroke-width="2" stroke-linecap="round" d="M23.2 5.6a4.4 4.4 0 0 1 3.9 6.5"/>
            <path stroke="#d97706" stroke-width="2" stroke-linecap="round" d="M21.3 13.7a4.4 4.4 0 0 1-2.1-5.8"/>
        `,
        map: `
            <path fill="#dcfce7" stroke="#166534" stroke-width="1.3" stroke-linejoin="round" d="m19.1 6.3 2.6-1 3 1 2.4-.9v7.3l-2.4.9-3-1-2.6 1V6.3Z"/>
            <path stroke="#166534" stroke-width="1.1" stroke-linecap="round" d="M21.7 5.5v7M24.7 6.3v7"/>
        `,
        archive: `
            <path fill="#f5f5f4" stroke="#57534e" stroke-width="1.3" stroke-linejoin="round" d="M19.3 8h7.8v6.3h-7.8z"/>
            <path fill="#e7e5e4" stroke="#57534e" stroke-width="1.3" d="M18.9 5.8h8.6V8h-8.6z"/>
            <path stroke="#57534e" stroke-width="1.1" stroke-linecap="round" d="M21.7 10.3h3"/>
        `,
        noEmail: `
            <path fill="#f1f5f9" stroke="#475569" stroke-width="1.3" stroke-linejoin="round" d="M19.1 6.7h8.3v6.4h-8.3z"/>
            <path stroke="#475569" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" d="m19.6 7.2 3.6 3 3.6-3"/>
            <path stroke="#991b1b" stroke-width="1.4" stroke-linecap="round" d="m18.8 14.2 8.9-8.9"/>
        `
    };

    const aliases = {
        'utensils-crossed': 'brand',
        menu: 'menuToggle',
        x: 'close',
        'layout-dashboard': 'dashboard',
        'book-open': 'menuManager',
        'calendar-clock': 'reservations',
        'shopping-bag': 'orders',
        'badge-percent': 'promotions',
        'qr-code': 'specialMenus',
        shield: 'adminUsers',
        mail: 'messages',
        'message-square': 'messages',
        'shield-alert': 'fraudReview',
        bot: 'chatbot',
        settings: 'settings',
        'user-check': 'profileReview',
        'chef-hat': 'chef',
        'log-out': 'logout',
        pencil: 'edit',
        image: 'image',
        eye: 'show',
        'eye-off': 'hide',
        check: 'approve',
        'rotate-ccw': 'revert',
        'trash-2': 'delete',
        'external-link': 'openLink',
        copy: 'copy',
        download: 'download',
        printer: 'print',
        'refresh-cw': 'refresh',
        sparkles: 'sparkles',
        loader: 'loader',
        map: 'map',
        archive: 'archive',
        'mail-x': 'noEmail'
    };

    function resolveIconName(name) {
        const raw = String(name || '').trim();
        return aliases[raw] || (accents[raw] ? raw : 'brand');
    }

    function svgMarkup(name) {
        const key = resolveIconName(name);
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" role="img" focusable="false" aria-hidden="true">${face}${accents[key]}</svg>`;
    }

    function createIconElement(name, className) {
        const template = document.createElement('template');
        template.innerHTML = svgMarkup(name).trim();
        const svg = template.content.firstElementChild;
        svg.setAttribute('class', `bao-icon ${className || ''}`.trim());
        return svg;
    }

    function render(root) {
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('[data-lucide], [data-bao-icon]').forEach(el => {
            const iconName = el.getAttribute('data-bao-icon') || el.getAttribute('data-lucide');
            const className = el.getAttribute('class') || '';
            el.replaceWith(createIconElement(iconName, className));
        });
    }

    window.adminBaoIcons = {
        mode: 'inline',
        render,
        svgMarkup
    };
    window.lucide = window.lucide || {};
    window.lucide.createIcons = () => render(document);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => render(document), { once: true });
    } else {
        render(document);
    }
})();
