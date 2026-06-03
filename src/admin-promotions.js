let promotionsCache = [];
let editingPromotionId = null;
let promotionSelectedItems = [];

function getAdminDb() {
    if (!window.db) throw new Error('Admin database is not initialized yet.');
    return window.db;
}

function getAdminAuth() {
    if (!window.auth) throw new Error('Admin auth is not initialized yet.');
    return window.auth;
}

function getMenuItems() {
    return Array.isArray(window.HARDCODED_MENU) ? window.HARDCODED_MENU : [];
}

function getCurrentDishPrice(dish) {
    return typeof window.getDishCurrentPrice === 'function'
        ? window.getDishCurrentPrice(dish)
        : Number(dish.price || 0);
}

function getDishImage(dish) {
    return typeof window.getDishImagePath === 'function' ? window.getDishImagePath(dish) : '';
}

function getMenuImageOverrides() {
    return window.menuImageOverrides || {};
}

function getPromotionItemSummary(items) {
    if (!Array.isArray(items) || !items.length) return '';
    return items.map(item => item.name || item.id).filter(Boolean).join(', ');
}

function calculatePromotionItemPrice(dish, discountType, percent) {
    const basePrice = getCurrentDishPrice(dish);
    if (discountType === 'percent' && Number.isFinite(percent) && percent > 0) {
        return Math.max(0, Math.round(basePrice * (100 - percent)) / 100);
    }
    const selected = promotionSelectedItems.find(item => item.id === dish.id);
    return selected && Number.isFinite(Number(selected.promoPrice)) ? Number(selected.promoPrice) : '';
}

function renderPromotionDishSelector() {
    const list = document.getElementById('promotion-dish-list');
    if (!list) return;
    const discountType = document.getElementById('promotion-discount-type').value;
    const percent = parseFloat(document.getElementById('promotion-discount-percent').value);
    const selectedIds = new Set(promotionSelectedItems.map(item => item.id));

    list.innerHTML = getMenuItems().map(dish => {
        const selected = selectedIds.has(dish.id);
        const currentPrice = getCurrentDishPrice(dish);
        const promoPrice = calculatePromotionItemPrice(dish, discountType, percent);
        const disabledPrice = discountType !== 'custom' ? 'disabled' : '';
        return `
                    <label class="admin-check-row">
                        <input type="checkbox" data-promotion-dish-id="${escapeHtml(dish.id)}" ${selected ? 'checked' : ''}
                            aria-label="Include ${escapeHtml(dish.name)} in promotion"
                            class="h-4 w-4 rounded border-stone-300 text-red-700 focus:ring-red-700">
                        <span class="min-w-0">
                            <span class="block text-sm font-semibold text-stone-900 truncate">${escapeHtml(dish.name)}</span>
                            <span class="block text-xs text-stone-500">${escapeHtml(dish.category)} - ${formatCurrency(currentPrice)}</span>
                        </span>
                        <input type="number" min="0" step="1" data-promotion-price-id="${escapeHtml(dish.id)}"
                            value="${selected && promoPrice !== '' ? Number(promoPrice) : ''}" ${disabledPrice}
                            aria-label="Promotion price for ${escapeHtml(dish.name)}"
                            class="w-full px-2 py-1 border border-stone-300 rounded-md focus:ring-2 focus:ring-red-700 focus:outline-none text-sm disabled:bg-stone-100"
                            placeholder="Promo">
                    </label>
                `;
    }).join('');

    list.querySelectorAll('[data-promotion-dish-id]').forEach(input => {
        input.addEventListener('change', syncPromotionSelectionFromInputs);
    });
    list.querySelectorAll('[data-promotion-price-id]').forEach(input => {
        input.addEventListener('input', syncPromotionSelectionFromInputs);
    });
    updatePromotionSelectionSummary();
}

function syncPromotionSelectionFromInputs() {
    const selected = [];
    document.querySelectorAll('[data-promotion-dish-id]').forEach(checkbox => {
        if (!checkbox.checked) return;
        const dish = getMenuItems().find(item => item.id === checkbox.dataset.promotionDishId);
        if (!dish) return;
        const priceInput = Array.from(document.querySelectorAll('[data-promotion-price-id]'))
            .find(input => input.dataset.promotionPriceId === dish.id);
        const promoPrice = priceInput && priceInput.value !== '' ? parseFloat(priceInput.value) : null;
        selected.push({
            id: dish.id,
            name: dish.name,
            category: dish.category,
            originalPrice: getCurrentDishPrice(dish),
            promoPrice: Number.isFinite(promoPrice) ? promoPrice : null,
            image: getMenuImageOverrides()[dish.id] || getDishImage(dish)
        });
    });
    promotionSelectedItems = selected;
    updatePromotionSelectionSummary();
}

function updatePromotionSelectionSummary() {
    const summary = document.getElementById('promotion-selection-summary');
    if (!summary) return;
    summary.textContent = `${promotionSelectedItems.length} selected`;
}

function getPromotionPricingLine(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    if (data.discountType === 'bundle' && data.bundlePrice !== undefined && data.bundlePrice !== null && data.bundlePrice !== '') {
        return `Combo price ${formatCurrency(data.bundlePrice)}`;
    }
    if (data.discountType === 'percent' && data.discountPercent) {
        return `${Number(data.discountPercent)}% off selected dishes`;
    }
    const priced = items.filter(item => item.promoPrice !== null && item.promoPrice !== undefined && item.promoPrice !== '');
    if (priced.length) return priced.map(item => `${item.name}: ${formatCurrency(item.promoPrice)}`).join(' | ');
    return '';
}

function listenToPromotions() {
    getAdminDb().collection('promotions').onSnapshot(snapshot => {
        promotionsCache = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data() || {}
        }));
        renderPromotionsTable();
    }, err => {
        console.error('Promotions listener error:', err);
        document.getElementById('promotions-table').innerHTML =
            '<tr><td colspan="4" class="px-6 py-8 text-center text-red-600 italic">Failed to load promotions and deals.</td></tr>';
        document.getElementById('promotion-count').textContent = 'Could not load offers.';
    });
}

function isPromotionVisible(data) {
    return data.active === true || data.status === 'active' || data.visible === true;
}

function getPromotionTimestamp(data) {
    const date = getFirestoreDate(data.updatedAt || data.createdAt);
    return date ? date.getTime() : 0;
}

function sortPromotions(items) {
    const sortMode = document.getElementById('promotion-sort').value;
    const titleCompare = (a, b) => String(a.data.title || a.id).localeCompare(String(b.data.title || b.id));
    const visibleRank = item => isPromotionVisible(item.data) ? 0 : 1;
    const newestCompare = (a, b) => getPromotionTimestamp(b.data) - getPromotionTimestamp(a.data) || titleCompare(a, b);

    return items.sort((a, b) => {
        if (sortMode === 'oldest') return getPromotionTimestamp(a.data) - getPromotionTimestamp(b.data) || titleCompare(a, b);
        if (sortMode === 'visible') return visibleRank(a) - visibleRank(b) || newestCompare(a, b);
        if (sortMode === 'hidden') return visibleRank(b) - visibleRank(a) || newestCompare(a, b);
        return newestCompare(a, b);
    });
}

function renderPromotionsTable() {
    const tableBody = document.getElementById('promotions-table');
    const countEl = document.getElementById('promotion-count');

    if (!promotionsCache.length) {
        tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-stone-500 italic">No promotions or deals yet.</td></tr>';
        countEl.textContent = '0 offers';
        return;
    }

    const visibleCount = promotionsCache.filter(item => isPromotionVisible(item.data)).length;
    const hiddenCount = promotionsCache.length - visibleCount;
    countEl.textContent = `${visibleCount} visible, ${hiddenCount} hidden`;

    const rows = sortPromotions([...promotionsCache]).map(item => {
        const data = item.data;
        const visible = isPromotionVisible(data);
        const type = data.type === 'deal' ? 'Deal' : 'Promotion';
        const statusBadge = visible
            ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Visible</span>'
            : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-700">Hidden</span>';
        const rowClass = visible ? '' : ' opacity-60';
        const toggleIcon = visible ? 'eye-off' : 'eye';
        const toggleTitle = visible ? 'Hide from customer profile' : 'Show on customer profile';
        const title = data.title || item.id;
        const offer = data.offer ? `<p class="text-xs text-red-700 font-semibold mt-1">${escapeHtml(data.offer)}</p>` : '';
        const code = data.code ? `<span class="text-xs font-mono text-stone-500 ml-2">${escapeHtml(data.code)}</span>` : '';
        const itemSummary = getPromotionItemSummary(data.items);
        const itemLine = itemSummary ? `<p class="text-xs text-stone-600 mt-1"><span class="font-semibold">Dishes:</span> ${escapeHtml(truncateText(itemSummary, 130))}</p>` : '';
        const pricingLine = getPromotionPricingLine(data);
        const pricing = pricingLine ? `<p class="text-xs text-emerald-700 font-semibold mt-1">${escapeHtml(pricingLine)}</p>` : '';

        return `
                    <tr class="hover:bg-stone-50 transition-colors border-b border-stone-100${rowClass}">
                        <td class="px-6 py-4 align-top">
                            <div class="flex flex-wrap items-center gap-2">
                                <p class="text-sm font-semibold text-stone-900">${escapeHtml(title)}</p>
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-50 text-red-700 border border-red-100">${type}</span>
                                ${code}
                            </div>
                            ${offer}
                            ${pricing}
                            ${itemLine}
                            <p class="text-xs text-stone-500 mt-1 max-w-md">${escapeHtml(truncateText(data.description || '', 150))}</p>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap align-top">${statusBadge}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500 align-top">${escapeHtml(data.expiresAt || 'No expiry')}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                            <button type="button" data-promotion-action="edit" data-promotion-id="${escapeHtml(item.id)}"
                                aria-label="Edit promotion" class="text-stone-600 hover:text-blue-600 transition-colors mr-3" title="Edit offer">
                                <i data-lucide="pencil" class="h-4 w-4"></i>
                            </button>
                            <button type="button" data-promotion-action="toggle" data-promotion-id="${escapeHtml(item.id)}"
                                aria-label="${toggleTitle}" class="text-stone-600 hover:text-red-700 transition-colors mr-3" title="${toggleTitle}">
                                <i data-lucide="${toggleIcon}" class="h-4 w-4"></i>
                            </button>
                            <button type="button" data-promotion-action="delete" data-promotion-id="${escapeHtml(item.id)}"
                                aria-label="Delete promotion" class="text-stone-600 hover:text-red-700 transition-colors" title="Delete offer">
                                <i data-lucide="trash-2" class="h-4 w-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
    }).join('');

    tableBody.innerHTML = rows;
    tableBody.querySelectorAll('[data-promotion-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => openPromotionEditor(btn.dataset.promotionId));
    });
    tableBody.querySelectorAll('[data-promotion-action="toggle"]').forEach(btn => {
        btn.addEventListener('click', () => togglePromotionVisibility(btn.dataset.promotionId));
    });
    tableBody.querySelectorAll('[data-promotion-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => deletePromotion(btn.dataset.promotionId));
    });

    lucide.createIcons();
}

function showPromotionFeedback(message, isError) {
    const feedback = document.getElementById('promotion-feedback');
    feedback.textContent = message;
    feedback.className = `text-sm p-3 rounded-md ${isError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`;
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 5000);
}

function updatePromotionDescriptionCount() {
    const value = document.getElementById('promotion-description').value;
    document.getElementById('promotion-description-count').textContent = `${value.length} / 1000`;
}

function resetPromotionForm() {
    editingPromotionId = null;
    promotionSelectedItems = [];
    document.getElementById('promotion-form').reset();
    document.getElementById('promotion-active').checked = true;
    document.getElementById('promotion-discount-type').value = 'custom';
    document.getElementById('promotion-discount-percent').value = '';
    document.getElementById('promotion-bundle-price').value = '';
    document.getElementById('promotion-form-title').textContent = 'New Offer';
    document.getElementById('promotion-editing-pill').classList.add('hidden');
    document.getElementById('promotion-save-btn').textContent = 'Save Offer';
    document.getElementById('promotion-reset-btn').textContent = 'Clear';
    updatePromotionDescriptionCount();
    renderPromotionDishSelector();
}

function openPromotionEditor(id) {
    const item = promotionsCache.find(entry => entry.id === id);
    if (!item) return;

    editingPromotionId = id;
    document.getElementById('promotion-type').value = item.data.type === 'deal' ? 'deal' : 'promotion';
    document.getElementById('promotion-expires').value = item.data.expiresAt || '';
    document.getElementById('promotion-title').value = item.data.title || '';
    document.getElementById('promotion-offer').value = item.data.offer || '';
    document.getElementById('promotion-code').value = item.data.code || '';
    document.getElementById('promotion-description').value = item.data.description || '';
    document.getElementById('promotion-discount-type').value = item.data.discountType || 'custom';
    document.getElementById('promotion-discount-percent').value = item.data.discountPercent || '';
    document.getElementById('promotion-bundle-price').value = item.data.bundlePrice || '';
    promotionSelectedItems = Array.isArray(item.data.items) ? item.data.items.map(promoItem => ({
        id: promoItem.id,
        name: promoItem.name,
        category: promoItem.category || '',
        originalPrice: Number(promoItem.originalPrice || 0),
        promoPrice: promoItem.promoPrice === undefined ? null : promoItem.promoPrice,
        image: promoItem.image || ''
    })) : [];
    document.getElementById('promotion-active').checked = isPromotionVisible(item.data);
    document.getElementById('promotion-form-title').textContent = 'Edit Offer';
    document.getElementById('promotion-editing-pill').classList.remove('hidden');
    document.getElementById('promotion-save-btn').textContent = 'Update Offer';
    document.getElementById('promotion-reset-btn').textContent = 'Cancel';
    updatePromotionDescriptionCount();
    renderPromotionDishSelector();
    document.getElementById('promotion-title').focus();
}

async function savePromotion(event) {
    event.preventDefault();
    const type = document.getElementById('promotion-type').value === 'deal' ? 'deal' : 'promotion';
    const title = document.getElementById('promotion-title').value.trim();
    const offer = document.getElementById('promotion-offer').value.trim();
    const code = document.getElementById('promotion-code').value.trim();
    const description = document.getElementById('promotion-description').value.trim();
    const expiresAt = document.getElementById('promotion-expires').value;
    const discountType = document.getElementById('promotion-discount-type').value;
    const discountPercent = parseFloat(document.getElementById('promotion-discount-percent').value);
    const bundlePrice = parseFloat(document.getElementById('promotion-bundle-price').value);
    const active = document.getElementById('promotion-active').checked;
    const user = getAdminAuth().currentUser;
    const saveBtn = document.getElementById('promotion-save-btn');

    if (!title || !description) {
        showPromotionFeedback('Please add a title and description.', true);
        return;
    }

    syncPromotionSelectionFromInputs();
    if (discountType === 'percent' && (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100)) {
        showPromotionFeedback('Please enter a percent discount between 1 and 100.', true);
        return;
    }
    if (discountType === 'bundle' && (!Number.isFinite(bundlePrice) || bundlePrice <= 0)) {
        showPromotionFeedback('Please enter a valid combo bundle price.', true);
        return;
    }

    const normalizedItems = promotionSelectedItems.map(item => {
        const dish = getMenuItems().find(menuItem => menuItem.id === item.id);
        const basePrice = dish ? getCurrentDishPrice(dish) : Number(item.originalPrice || 0);
        const promoPrice = discountType === 'percent'
            ? Math.round(basePrice * (100 - discountPercent)) / 100
            : (Number.isFinite(Number(item.promoPrice)) ? Number(item.promoPrice) : null);
        return {
            id: item.id,
            name: item.name,
            category: item.category || '',
            originalPrice: basePrice,
            promoPrice,
            image: item.image || (dish ? getMenuImageOverrides()[dish.id] || getDishImage(dish) : '')
        };
    });

    saveBtn.disabled = true;
    saveBtn.textContent = editingPromotionId ? 'Updating...' : 'Saving...';

    const payload = {
        type,
        title,
        offer,
        code,
        description,
        expiresAt,
        discountType,
        discountPercent: discountType === 'percent' ? discountPercent : null,
        bundlePrice: discountType === 'bundle' ? bundlePrice : null,
        items: normalizedItems,
        active,
        visible: active,
        status: active ? 'active' : 'hidden',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: user && user.email ? user.email : 'unknown'
    };

    try {
        if (editingPromotionId) {
            await getAdminDb().collection('promotions').doc(editingPromotionId).update(payload);
            showPromotionFeedback('Offer updated.', false);
        } else {
            await getAdminDb().collection('promotions').add({
                ...payload,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: user && user.email ? user.email : 'unknown'
            });
            showPromotionFeedback('Offer created.', false);
        }
        resetPromotionForm();
    } catch (error) {
        console.error('Failed to save promotion:', error);
        showPromotionFeedback(`Could not save offer: ${error.message}`, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = editingPromotionId ? 'Update Offer' : 'Save Offer';
    }
}

async function togglePromotionVisibility(id) {
    const item = promotionsCache.find(entry => entry.id === id);
    if (!item) return;

    const active = !isPromotionVisible(item.data);
    const user = getAdminAuth().currentUser;
    try {
        await getAdminDb().collection('promotions').doc(id).update({
            active,
            visible: active,
            status: active ? 'active' : 'hidden',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user && user.email ? user.email : 'unknown'
        });
        if (editingPromotionId === id) {
            document.getElementById('promotion-active').checked = active;
        }
    } catch (error) {
        console.error('Failed to toggle promotion:', error);
        alert(`Could not update visibility: ${error.message}`);
    }
}

async function deletePromotion(id) {
    const item = promotionsCache.find(entry => entry.id === id);
    const title = item && item.data && item.data.title ? item.data.title : 'this offer';
    if (!confirm(`Delete "${title}"? This removes it from admin and customer views.`)) return;

    try {
        await getAdminDb().collection('promotions').doc(id).delete();
        if (editingPromotionId === id) resetPromotionForm();
    } catch (error) {
        console.error('Failed to delete promotion:', error);
        alert(`Could not delete offer: ${error.message}`);
    }
}

// Promotion search filter
function filterPromotionsTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll('#promotions-table tr');
    rows.forEach(row => {
        if (!q) { row.style.display = ''; return; }
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

// Bind promotion form events (deferred to after DOM ready)
setTimeout(() => {
    document.getElementById('promotion-form').addEventListener('submit', savePromotion);
    document.getElementById('promotion-reset-btn').addEventListener('click', resetPromotionForm);
    document.getElementById('promotion-sort').addEventListener('change', renderPromotionsTable);
    document.getElementById('promotion-description').addEventListener('input', updatePromotionDescriptionCount);
    document.getElementById('promotion-discount-type').addEventListener('change', renderPromotionDishSelector);
    document.getElementById('promotion-discount-percent').addEventListener('input', renderPromotionDishSelector);
    renderPromotionDishSelector();
}, 0);

window.listenToPromotions = listenToPromotions;
window.renderPromotionsTable = renderPromotionsTable;
window.filterPromotionsTable = filterPromotionsTable;
