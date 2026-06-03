let specialMenusCache = [];
let editingSpecialMenuId = null;
let specialMenuItems = [];

function getAdminDb() {
    if (!window.db) throw new Error('Admin database is not initialized yet.');
    return window.db;
}

function getAdminAuth() {
    if (!window.auth) throw new Error('Admin auth is not initialized yet.');
    return window.auth;
}

function generateSpecialMenuCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'event-';
    for (let i = 0; i < 8; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)].toLowerCase();
    }
    return code;
}

function getSpecialMenuUrl(id) {
    const basePath = window.location.pathname.replace(/admin\.html.*$/, '');
    return `${window.location.origin}${basePath}special-menu.html?menu=${encodeURIComponent(id)}`;
}

function getQrImageUrl(url) {
    if (window.adminQrTools && typeof window.adminQrTools.createSvgDataUrl === 'function') {
        return window.adminQrTools.createSvgDataUrl(url, { cellSize: 8, margin: 4 });
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(url)}`;
}

function getSpecialMenuQrFilename(item, extension = 'png') {
    const baseName = item && item.data && item.data.title ? item.data.title : item.id;
    if (window.adminQrTools && typeof window.adminQrTools.sanitizeFilename === 'function') {
        return window.adminQrTools.sanitizeFilename(`luban-${baseName}-qr`, extension);
    }
    return `luban-special-menu-qr.${extension}`;
}

function getSpecialMenuTimestamp(data) {
    const date = getFirestoreDate(data.updatedAt || data.createdAt);
    return date ? date.getTime() : 0;
}

async function copyTextToClipboard(value) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const helper = document.createElement('textarea');
    helper.value = value;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.top = '-9999px';
    document.body.appendChild(helper);
    helper.select();

    try {
        if (!document.execCommand('copy')) {
            throw new Error('Copy command was rejected.');
        }
    } finally {
        helper.remove();
    }
}

async function downloadSpecialMenuQrImage(id) {
    const item = specialMenusCache.find(entry => entry.id === id);
    if (!item) return;

    const url = getSpecialMenuUrl(id);
    const filename = getSpecialMenuQrFilename(item, 'png');

    if (window.adminQrTools && typeof window.adminQrTools.downloadQrImage === 'function') {
        await window.adminQrTools.downloadQrImage({
            text: url,
            filename,
            size: 1400
        });
        return;
    }

    const fallbackLink = document.createElement('a');
    fallbackLink.href = getQrImageUrl(url);
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    fallbackLink.remove();
}

function openSpecialMenuQrPrintView(id) {
    const item = specialMenusCache.find(entry => entry.id === id);
    if (!item) return;

    const url = getSpecialMenuUrl(id);
    const title = item.data && item.data.title ? item.data.title : 'Special Menu';

    if (window.adminQrTools && typeof window.adminQrTools.openPrintView === 'function') {
        window.adminQrTools.openPrintView({
            title,
            url,
            subtitle: 'Scan to open the event guest menu'
        });
        return;
    }

    window.open(url, '_blank');
}

function renderSpecialMenuItems() {
    const list = document.getElementById('special-menu-items-list');
    const count = document.getElementById('special-menu-items-count');
    count.textContent = `${specialMenuItems.length} item${specialMenuItems.length === 1 ? '' : 's'}`;

    if (!specialMenuItems.length) {
        list.innerHTML = '<p class="text-sm text-stone-500 italic border border-dashed border-stone-300 rounded-lg p-4">No special items added yet.</p>';
        return;
    }

    list.innerHTML = specialMenuItems.map((item, index) => `
                <div class="flex items-start justify-between gap-3 border border-stone-200 rounded-lg p-3 bg-white">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-stone-900">${escapeHtml(item.name)}</p>
                            ${item.category ? `<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-100 text-stone-700">${escapeHtml(item.category)}</span>` : ''}
                            ${item.price !== null && item.price !== undefined && item.price !== '' ? `<span class="text-xs font-bold text-red-700">${escapeHtml(formatCurrency(item.price))}</span>` : ''}
                        </div>
                        ${item.description ? `<p class="text-xs text-stone-500 mt-1">${escapeHtml(item.description)}</p>` : ''}
                    </div>
                    <button type="button" data-special-item-remove="${index}" class="text-stone-500 hover:text-red-700" aria-label="Remove special item">
                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                    </button>
                </div>
            `).join('');

    list.querySelectorAll('[data-special-item-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            specialMenuItems.splice(Number(btn.dataset.specialItemRemove), 1);
            renderSpecialMenuItems();
        });
    });
    lucide.createIcons();
}

function addSpecialMenuItem() {
    const nameInput = document.getElementById('special-item-name');
    const priceInput = document.getElementById('special-item-price');
    const categoryInput = document.getElementById('special-item-category');
    const descriptionInput = document.getElementById('special-item-description');
    const name = nameInput.value.trim();
    const price = priceInput.value === '' ? null : parseFloat(priceInput.value);

    if (!name) {
        showSpecialMenuFeedback('Add a dish name first.', true);
        return;
    }
    if (priceInput.value !== '' && (!Number.isFinite(price) || price < 0)) {
        showSpecialMenuFeedback('Add a valid item price.', true);
        return;
    }

    specialMenuItems.push({
        name,
        price,
        category: categoryInput.value.trim(),
        description: descriptionInput.value.trim()
    });

    nameInput.value = '';
    priceInput.value = '';
    categoryInput.value = '';
    descriptionInput.value = '';
    nameInput.focus();
    renderSpecialMenuItems();
}

function showSpecialMenuFeedback(message, isError) {
    const feedback = document.getElementById('special-menu-feedback');
    feedback.textContent = message;
    feedback.className = `text-sm p-3 rounded-md ${isError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`;
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 5000);
}

function listenToSpecialMenus() {
    getAdminDb().collection('specialMenus').onSnapshot(snapshot => {
        specialMenusCache = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() || {} }));
        renderSpecialMenusList();
    }, err => {
        console.error('Special menus listener error:', err);
        document.getElementById('special-menus-list').innerHTML =
            '<p class="px-6 py-8 text-center text-red-600 italic">Failed to load special menus.</p>';
        document.getElementById('special-menu-count').textContent = 'Could not load menus.';
    });
}

function renderSpecialMenusList() {
    const list = document.getElementById('special-menus-list');
    const count = document.getElementById('special-menu-count');

    if (!specialMenusCache.length) {
        list.innerHTML = '<p class="px-6 py-8 text-center text-stone-500 italic">No special menus yet.</p>';
        count.textContent = '0 menus';
        return;
    }

    const activeCount = specialMenusCache.filter(item => item.data.active === true).length;
    count.textContent = `${activeCount} active, ${specialMenusCache.length - activeCount} hidden`;

    list.innerHTML = [...specialMenusCache]
        .sort((a, b) => getSpecialMenuTimestamp(b.data) - getSpecialMenuTimestamp(a.data))
        .map(item => {
            const data = item.data;
            const url = getSpecialMenuUrl(item.id);
            const active = data.active === true;
            const statusBadge = active
                ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>'
                : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-stone-100 text-stone-700">Hidden</span>';
            return `
                        <article class="p-5 ${active ? '' : 'opacity-65'}">
                            <div class="flex flex-col xl:flex-row gap-5 xl:items-start xl:justify-between">
                                <div class="min-w-0 flex-1">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <h4 class="text-base font-bold text-stone-900">${escapeHtml(data.title || item.id)}</h4>
                                        ${statusBadge}
                                        ${data.eventDate ? `<span class="text-xs font-semibold text-stone-500">${escapeHtml(data.eventDate)}</span>` : ''}
                                    </div>
                                    <p class="text-sm text-stone-500 mt-1">${Array.isArray(data.items) ? data.items.length : 0} menu items</p>
                                    ${data.note ? `<p class="text-sm text-stone-600 mt-2">${escapeHtml(truncateText(data.note, 180))}</p>` : ''}
                                    <p class="mt-3 text-xs text-stone-500 break-all">${escapeHtml(url)}</p>
                                    <div class="mt-3 flex flex-wrap items-center gap-2">
                                        <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800">
                                            <i data-lucide="external-link" class="h-4 w-4"></i> Open guest menu
                                        </a>
                                        <button type="button" data-special-action="copy" data-special-url="${escapeHtml(url)}" class="inline-flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900">
                                            <i data-lucide="copy" class="h-4 w-4"></i> Copy guest link
                                        </button>
                                        <button type="button" data-special-action="download" data-special-id="${escapeHtml(item.id)}" class="inline-flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900">
                                            <i data-lucide="download" class="h-4 w-4"></i> Download QR
                                        </button>
                                        <button type="button" data-special-action="print" data-special-id="${escapeHtml(item.id)}" class="inline-flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900">
                                            <i data-lucide="printer" class="h-4 w-4"></i> Print QR
                                        </button>
                                    </div>
                                </div>
                                <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
                                    <img class="admin-qr-preview" src="${escapeHtml(getQrImageUrl(url))}" alt="QR code for ${escapeHtml(data.title || item.id)}">
                                    <div class="flex xl:flex-col gap-3">
                                        <button type="button" data-special-action="edit" data-special-id="${escapeHtml(item.id)}" class="text-stone-600 hover:text-blue-600" title="Edit menu" aria-label="Edit special menu"><i data-lucide="pencil" class="h-4 w-4"></i></button>
                                        <button type="button" data-special-action="toggle" data-special-id="${escapeHtml(item.id)}" class="text-stone-600 hover:text-red-700" title="${active ? 'Hide menu' : 'Show menu'}" aria-label="${active ? 'Hide menu' : 'Show menu'}"><i data-lucide="${active ? 'eye-off' : 'eye'}" class="h-4 w-4"></i></button>
                                        <button type="button" data-special-action="delete" data-special-id="${escapeHtml(item.id)}" class="text-stone-600 hover:text-red-700" title="Delete menu" aria-label="Delete special menu"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    `;
        }).join('');

    list.querySelectorAll('[data-special-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => openSpecialMenuEditor(btn.dataset.specialId));
    });
    list.querySelectorAll('[data-special-action="toggle"]').forEach(btn => {
        btn.addEventListener('click', () => toggleSpecialMenu(btn.dataset.specialId));
    });
    list.querySelectorAll('[data-special-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => deleteSpecialMenu(btn.dataset.specialId));
    });
    list.querySelectorAll('[data-special-action="copy"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await copyTextToClipboard(btn.dataset.specialUrl);
                showSpecialMenuFeedback('Guest link copied. You can send it straight to staff or guests.', false);
            } catch (error) {
                showSpecialMenuFeedback('Could not copy the guest link. Open the menu and copy it from the address bar.', true);
            }
        });
    });
    list.querySelectorAll('[data-special-action="download"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await downloadSpecialMenuQrImage(btn.dataset.specialId);
                showSpecialMenuFeedback('QR image downloaded for staff handoff.', false);
            } catch (error) {
                console.error('Failed to download special menu QR:', error);
                showSpecialMenuFeedback(`Could not download the QR image: ${error.message}`, true);
            }
        });
    });
    list.querySelectorAll('[data-special-action="print"]').forEach(btn => {
        btn.addEventListener('click', () => {
            try {
                openSpecialMenuQrPrintView(btn.dataset.specialId);
            } catch (error) {
                console.error('Failed to open special menu QR print view:', error);
                showSpecialMenuFeedback(`Could not open the print view: ${error.message}`, true);
            }
        });
    });
    lucide.createIcons();
}

function resetSpecialMenuForm() {
    editingSpecialMenuId = null;
    specialMenuItems = [];
    document.getElementById('special-menu-form').reset();
    document.getElementById('special-menu-status').value = 'active';
    document.getElementById('special-menu-form-title').textContent = 'New Special Menu';
    document.getElementById('special-menu-editing-pill').classList.add('hidden');
    document.getElementById('special-menu-save-btn').textContent = 'Save & Create QR';
    document.getElementById('special-menu-reset-btn').textContent = 'Clear';
    renderSpecialMenuItems();
}

function openSpecialMenuEditor(id) {
    const item = specialMenusCache.find(entry => entry.id === id);
    if (!item) return;

    editingSpecialMenuId = id;
    specialMenuItems = Array.isArray(item.data.items) ? item.data.items.map(menuItem => ({ ...menuItem })) : [];
    document.getElementById('special-menu-title').value = item.data.title || '';
    document.getElementById('special-menu-date').value = item.data.eventDate || '';
    document.getElementById('special-menu-status').value = item.data.active === false ? 'hidden' : 'active';
    document.getElementById('special-menu-note').value = item.data.note || '';
    document.getElementById('special-menu-form-title').textContent = 'Edit Special Menu';
    document.getElementById('special-menu-editing-pill').classList.remove('hidden');
    document.getElementById('special-menu-save-btn').textContent = 'Update QR Menu';
    document.getElementById('special-menu-reset-btn').textContent = 'Cancel';
    renderSpecialMenuItems();
    document.getElementById('special-menu-title').focus();
}

async function saveSpecialMenu(event) {
    event.preventDefault();
    const title = document.getElementById('special-menu-title').value.trim();
    const eventDate = document.getElementById('special-menu-date').value;
    const note = document.getElementById('special-menu-note').value.trim();
    const active = document.getElementById('special-menu-status').value !== 'hidden';
    const user = getAdminAuth().currentUser;
    const saveBtn = document.getElementById('special-menu-save-btn');

    if (!title) {
        showSpecialMenuFeedback('Please add an event or menu name.', true);
        return;
    }
    if (!specialMenuItems.length) {
        showSpecialMenuFeedback('Add at least one special menu item.', true);
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = editingSpecialMenuId ? 'Updating...' : 'Creating...';

    const id = editingSpecialMenuId || generateSpecialMenuCode();
    const payload = {
        title,
        eventDate,
        note,
        items: specialMenuItems,
        active,
        status: active ? 'active' : 'hidden',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: user && user.email ? user.email : 'unknown'
    };

    try {
        const existingSpecialMenu = editingSpecialMenuId ? specialMenusCache.find(entry => entry.id === id) : null;
        const existingData = existingSpecialMenu ? existingSpecialMenu.data : {};
        await getAdminDb().collection('specialMenus').doc(id).set({
            ...payload,
            createdAt: editingSpecialMenuId ? (existingData.createdAt || firebase.firestore.FieldValue.serverTimestamp()) : firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: editingSpecialMenuId ? (existingData.createdBy || (user && user.email ? user.email : 'unknown')) : (user && user.email ? user.email : 'unknown')
        }, { merge: true });
        showSpecialMenuFeedback(`Special menu saved. QR link: ${getSpecialMenuUrl(id)}`, false);
        resetSpecialMenuForm();
    } catch (error) {
        console.error('Failed to save special menu:', error);
        showSpecialMenuFeedback(`Could not save special menu: ${error.message}`, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = editingSpecialMenuId ? 'Update QR Menu' : 'Save & Create QR';
    }
}

async function toggleSpecialMenu(id) {
    const item = specialMenusCache.find(entry => entry.id === id);
    if (!item) return;
    const active = item.data.active !== true;
    const user = getAdminAuth().currentUser;
    try {
        await getAdminDb().collection('specialMenus').doc(id).update({
            active,
            status: active ? 'active' : 'hidden',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user && user.email ? user.email : 'unknown'
        });
        if (editingSpecialMenuId === id) document.getElementById('special-menu-status').value = active ? 'active' : 'hidden';
    } catch (error) {
        console.error('Failed to toggle special menu:', error);
        alert(`Could not update special menu: ${error.message}`);
    }
}

async function deleteSpecialMenu(id) {
    const item = specialMenusCache.find(entry => entry.id === id);
    const title = item && item.data && item.data.title ? item.data.title : 'this special menu';
    if (!confirm(`Delete "${title}"? The QR link will stop working.`)) return;
    try {
        await getAdminDb().collection('specialMenus').doc(id).delete();
        if (editingSpecialMenuId === id) resetSpecialMenuForm();
    } catch (error) {
        console.error('Failed to delete special menu:', error);
        alert(`Could not delete special menu: ${error.message}`);
    }
}

// Special menu search filter
function filterSpecialMenusTable(query) {
    const q = query.toLowerCase().trim();
    const items = document.querySelectorAll('#special-menus-list article');
    items.forEach(item => {
        if (!q) { item.style.display = ''; return; }
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
    });
}

// Bind special menu form events (deferred to after DOM ready)
setTimeout(() => {
    document.getElementById('special-menu-form').addEventListener('submit', saveSpecialMenu);
    document.getElementById('special-menu-reset-btn').addEventListener('click', resetSpecialMenuForm);
    document.getElementById('special-item-add-btn').addEventListener('click', addSpecialMenuItem);
    renderSpecialMenuItems();
}, 0);

window.listenToSpecialMenus = listenToSpecialMenus;
window.renderSpecialMenusList = renderSpecialMenusList;
window.filterSpecialMenusTable = filterSpecialMenusTable;
