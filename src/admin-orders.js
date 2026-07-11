const ORDERS_PAGE_SIZE = 10;
let ordersPageIndex = 0;
let ordersCache = [];
let knownOrderIds = null;
let selectedOrderId = null;

function getAdminDb() {
    if (!window.db) throw new Error('Admin database is not initialized yet.');
    return window.db;
}

function getOrderStatusMeta(status) {
    const normalized = String(status || 'pending').toLowerCase();
    if (normalized === 'requested') return { label: 'REQUESTED', className: 'bg-amber-100 text-amber-800' };
    if (normalized === 'accepted') return { label: 'ACCEPTED', className: 'bg-green-100 text-green-800' };
    if (normalized === 'rejected') return { label: 'REJECTED', className: 'bg-red-100 text-red-800' };
    if (normalized === 'completed') return { label: 'COMPLETED', className: 'bg-green-100 text-green-800' };
    if (normalized === 'pending') return { label: 'PENDING', className: 'bg-yellow-100 text-yellow-800' };
    if (normalized === 'preparing') return { label: 'PREPARING', className: 'bg-blue-100 text-blue-800' };
    if (normalized === 'cancelled') return { label: 'CANCELLED', className: 'bg-red-100 text-red-800' };
    return { label: normalized.toUpperCase(), className: 'bg-stone-100 text-stone-800' };
}

function normalizeOrderStatus(status) {
    return String(status || 'pending').toLowerCase() || 'pending';
}

function getAllowedOrderStatusTransitions(status) {
    const normalized = normalizeOrderStatus(status);
    const transitions = {
        requested: ['accepted', 'rejected'],
        accepted: ['preparing', 'cancelled'],
        pending: ['preparing', 'cancelled'],
        preparing: ['completed', 'cancelled'],
        completed: ['pending'],
        cancelled: ['pending'],
        rejected: []
    };
    return transitions[normalized] || [];
}

function canTransitionOrderStatus(fromStatus, toStatus) {
    return getAllowedOrderStatusTransitions(fromStatus).includes(normalizeOrderStatus(toStatus));
}

function getRequestedForText(order) {
    if (!order) return '';
    if (order.requestedForLabel) return order.requestedForLabel;
    if (order.requestedFor && order.requestedFor.toDate) {
        return order.requestedFor.toDate().toLocaleString('en-GH', {
            timeZone: 'Africa/Accra',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        });
    }
    return '';
}

function getAdminActor() {
    const user = window.auth && window.auth.currentUser;
    return user ? user.email || user.uid || 'admin' : 'admin';
}

function getServerTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

function buildOrderStatusUpdate(previousStatus, nextStatus) {
    const normalizedPrevious = normalizeOrderStatus(previousStatus);
    const normalizedNext = normalizeOrderStatus(nextStatus);
    const actor = getAdminActor();
    const update = {
        status: normalizedNext,
        updatedAt: getServerTimestamp(),
        updatedBy: actor
    };

    if (normalizedNext === 'accepted' && normalizedPrevious === 'requested') {
        update.acceptedAt = getServerTimestamp();
        update.acceptedBy = actor;
    }
    if (normalizedNext === 'rejected' && normalizedPrevious === 'requested') {
        update.rejectedAt = getServerTimestamp();
        update.rejectedBy = actor;
    }
    if (normalizedNext === 'preparing') {
        update.preparingAt = getServerTimestamp();
        update.preparingBy = actor;
    }
    if (normalizedNext === 'completed') {
        update.completedAt = getServerTimestamp();
        update.completedBy = actor;
    }
    if (normalizedNext === 'cancelled') {
        update.cancelledAt = getServerTimestamp();
        update.cancelledBy = actor;
    }
    if (normalizedNext === 'pending' && ['completed', 'cancelled'].includes(normalizedPrevious)) {
        update.reopenedAt = getServerTimestamp();
        update.reopenedBy = actor;
    }

    return update;
}

function listenToOrders() {
    ordersPageIndex = 0;
    ordersCache = [];
    knownOrderIds = null;

    getAdminDb().collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        if (knownOrderIds !== null) {
            snapshot.forEach(doc => {
                const order = doc.data();
                if (!knownOrderIds.has(doc.id) && (order.status === 'pending' || order.status === 'requested' || !order.status)) {
                    const isRequest = order.status === 'requested';
                    showAdminNotification(
                        isRequest ? 'New Pre-order Request' : 'New Order Received! \uD83D\uDED2',
                        `Order #${doc.id.slice(-6).toUpperCase()} \u2013 \u20b5${(order.total || 0).toFixed(2)}`
                    );
                }
            });
        }

        knownOrderIds = new Set(snapshot.docs.map(d => d.id));
        ordersCache = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        const maxPage = Math.max(0, Math.ceil(ordersCache.length / ORDERS_PAGE_SIZE) - 1);
        if (ordersPageIndex > maxPage) ordersPageIndex = maxPage;

        loadOrdersPage(ordersPageIndex);
    }, err => {
        console.error('Orders listener error:', err);
        const tableBody = document.getElementById('orders-table');
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-red-600 italic">Failed to load orders.</td></tr>';
    });
}

async function updateOrderStatus(id, status) {
    try {
        const nextStatus = normalizeOrderStatus(status);
        const entry = ordersCache.find(orderEntry => orderEntry.id === id);
        const previousStatus = entry ? normalizeOrderStatus(entry.data.status) : 'pending';
        if (!canTransitionOrderStatus(previousStatus, nextStatus)) {
            alert(`Cannot move an order from ${previousStatus.toUpperCase()} to ${nextStatus.toUpperCase()}. Refresh orders and try the current action.`);
            return;
        }
        if (nextStatus === 'cancelled' && !confirm("Are you sure you want to cancel this order?")) return;
        if (nextStatus === 'rejected' && !confirm("Reject this pre-order request? The customer will be notified.")) return;

        const orderRef = getAdminDb().collection('orders').doc(id);
        await getAdminDb().runTransaction(async transaction => {
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists) throw new Error('Order not found.');
            const latestStatus = normalizeOrderStatus((orderSnap.data() || {}).status);
            if (!canTransitionOrderStatus(latestStatus, nextStatus)) {
                throw new Error(`Order is now ${latestStatus.toUpperCase()} and cannot move to ${nextStatus.toUpperCase()}.`);
            }
            transaction.update(orderRef, buildOrderStatusUpdate(latestStatus, nextStatus));
        });
        console.log(`Order ${id} updated to ${nextStatus}`);
    } catch (error) {
        console.error("Error updating order:", error);
        alert(error.message || "Could not update order.");
    }
}

function renderPaginationControls(hasNext) {
    const controlsRowId = 'orders-pagination-row';
    const existing = document.getElementById(controlsRowId);
    if (existing) existing.remove();
    const tableBody = document.getElementById('orders-table');
    const prevDisabled = ordersPageIndex === 0;
    const nextDisabled = !hasNext;
    const controls = `
                <tr id="${controlsRowId}" class="bg-stone-50">
                        <td colspan="7" class="px-6 py-3 text-center">
                        <div class="flex items-center justify-center gap-3">
                            <button id="orders-prev" class="px-3 py-1 rounded border" ${prevDisabled? 'disabled':''}>Prev</button>
                            <span class="text-sm text-stone-600">Page ${ordersPageIndex + 1}</span>
                            <button id="orders-next" class="px-3 py-1 rounded border" ${nextDisabled? 'disabled':''}>Next</button>
                        </div>
                    </td>
                </tr>
            `;
    tableBody.insertAdjacentHTML('beforeend', controls);
    document.getElementById('orders-prev').addEventListener('click', () => {
        if (ordersPageIndex === 0) return;
        ordersPageIndex--;
        loadOrdersPage(ordersPageIndex);
    });
    document.getElementById('orders-next').addEventListener('click', () => {
        if (nextDisabled) return;
        ordersPageIndex++;
        loadOrdersPage(ordersPageIndex);
    });
}

function loadOrdersPage(pageIndex) {
    const tableBody = document.getElementById('orders-table');
    tableBody.innerHTML = '';

    if (!ordersCache.length) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-stone-500 italic">No orders received yet.</td></tr>';
        renderPaginationControls(false);
        const badge = document.getElementById('badge-orders');
        badge.classList.add('hidden');
        setMetricValue('metric-active-orders', 0);
        setMetricText('metric-orders-subtext', 'No open orders or requests');
        return;
    }

    const start = pageIndex * ORDERS_PAGE_SIZE;
    const pageOrders = ordersCache.slice(start, start + ORDERS_PAGE_SIZE);
    const hasNext = start + ORDERS_PAGE_SIZE < ordersCache.length;

    let pendingCount = 0;
    ordersCache.forEach(entry => {
        const s = normalizeOrderStatus(entry.data.status);
        if (s === 'requested' || s === 'accepted' || s === 'pending' || s === 'preparing' || !s) pendingCount++;
    });
    setMetricValue('metric-active-orders', pendingCount);
    setMetricText('metric-orders-subtext', pendingCount === 1 ? '1 open order or request' : `${pendingCount} open orders and requests`);

    pageOrders.forEach(entry => {
        const order = entry.data;
        const id = entry.id;
        const status = normalizeOrderStatus(order.status);
        const statusMeta = getOrderStatusMeta(status);
        const requestedForText = getRequestedForText(order);

            const itemsSummary = order.items ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'No items';
            const itemsDetail = order.items
                ? order.items.map(i => `<div class="py-0.5"><span class="font-bold text-stone-600">${i.quantity}&times;</span> ${i.name}</div>`).join('')
                : '<div class="text-stone-600 italic">No items</div>';

            let actions;
            if (status === 'requested') {
                actions = `
                            <button onclick="updateOrderStatus('${id}', 'accepted')" aria-label="Accept pre-order request" class="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-full mr-2 transition-colors" title="Accept Request">
                                <i data-lucide="check" class="h-4 w-4"></i>
                            </button>
                            <button onclick="updateOrderStatus('${id}', 'rejected')" aria-label="Reject pre-order request" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Reject Request">
                                <i data-lucide="x" class="h-4 w-4"></i>
                            </button>
                        `;
            } else if (status === 'accepted' || status === 'pending' || !status) {
                actions = `
                            <button onclick="updateOrderStatus('${id}', 'preparing')" aria-label="${status === 'accepted' ? 'Start accepted pre-order preparation' : 'Mark order as preparing'}" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-full mr-2 transition-colors" title="${status === 'accepted' ? 'Start Preparing' : 'Mark as Preparing'}">
                                <i data-lucide="chef-hat" class="h-4 w-4"></i>
                            </button>
                            <button onclick="updateOrderStatus('${id}', 'cancelled')" aria-label="Cancel order" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Cancel Order">
                                <i data-lucide="x" class="h-4 w-4"></i>
                            </button>
                        `;
            } else if (status === 'preparing') {
                actions = `
                            <button onclick="updateOrderStatus('${id}', 'completed')" aria-label="Mark order as completed" class="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-full mr-2 transition-colors" title="Mark Completed">
                                <i data-lucide="check" class="h-4 w-4"></i>
                            </button>
                            <button onclick="updateOrderStatus('${id}', 'cancelled')" aria-label="Cancel order" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Cancel Order">
                                <i data-lucide="x" class="h-4 w-4"></i>
                            </button>
                        `;
            } else if (status === 'completed' || status === 'cancelled') {
                actions = `
                            <button onclick="updateOrderStatus('${id}', 'pending')" aria-label="Move order back to pending" class="text-stone-600 hover:text-stone-700 p-2 rounded-full transition-colors" title="Move back to Pending">
                                <i data-lucide="rotate-ccw" class="h-4 w-4"></i>
                            </button>
                        `;
            } else {
                actions = '<span class="text-xs text-stone-400">No actions</span>';
            }

            const placedDate = order.createdAt && order.createdAt.toDate ? order.createdAt.toDate() : null;
            const placedDateStr = placedDate ? placedDate.toLocaleDateString() : '\u2014';
            const placedTimeStr = placedDate ? placedDate.toLocaleTimeString() : '\u2014';
            const timingTone = status === 'requested' ? 'text-amber-700' : status === 'rejected' ? 'text-red-700' : 'text-green-700';
            const timingNote = ['requested', 'accepted', 'rejected'].includes(status) && requestedForText
                ? `<div class="mt-1 text-xs font-semibold ${timingTone}">Requested for ${escapeHtml(requestedForText)}</div>`
                : '';

            const row = `
                        <tr class="hover:bg-stone-50 transition-colors border-b border-stone-100" data-order-id="${id}" onclick="selectOrder('${id}')">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-stone-500">#${id.slice(-6).toUpperCase()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                                <div class="font-medium">${order.customerName ? escapeHtml(order.customerName) : '<span class="text-stone-600 italic">\u2014</span>'}</div>
                                <div class="text-stone-500">${escapeHtml(order.customerPhone)}</div>
                            </td>
                            <td class="px-6 py-4 text-sm text-stone-900 max-w-xs">
                                <div class="truncate">${itemsSummary}</div>
                                <button onclick="event.stopPropagation(); toggleOrderDetails('${id}')" class="text-xs text-red-600 hover:text-red-800 hover:underline mt-0.5 block">view all items</button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                                <div class="font-medium">${placedDateStr}</div>
                                <div class="text-xs">${placedTimeStr}</div>
                                ${timingNote}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-stone-900">\u20b5${(order.total || 0).toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMeta.className}">${statusMeta.label}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                ${actions}
                            </td>
                        </tr>
                        <tr id="order-details-${id}" class="hidden bg-stone-50 border-b border-stone-100">
                            <td colspan="7" class="px-6 py-3">
                                <p class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Full Order</p>
                                <div class="text-sm text-stone-800">${itemsDetail}</div>
                            </td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
        });

        renderPaginationControls(hasNext);
        const badge = document.getElementById('badge-orders');
        if (pendingCount > 0) badge.classList.remove('hidden'); else badge.classList.add('hidden');
        lucide.createIcons();
}

function toggleOrderDetails(id) {
    const row = document.getElementById(`order-details-${id}`);
    if (row) row.classList.toggle('hidden');
}

function selectOrder(id) {
    document.querySelectorAll('#orders-table tr[data-order-id]').forEach(row => {
        row.classList.remove('bg-red-50');
    });
    selectedOrderId = id;
    const row = document.querySelector(`#orders-table tr[data-order-id="${id}"]`);
    if (row) row.classList.add('bg-red-50');
}

// Order search filter
function filterOrdersTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll('#orders-table tr[data-order-id]');
    rows.forEach(row => {
        if (!q) { row.style.display = ''; return; }
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

// Keyboard shortcuts for orders
document.addEventListener('keydown', e => {
    const ordersView = document.getElementById('view-orders');
    if (!ordersView || ordersView.classList.contains('hidden')) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'a':
                e.preventDefault();
                if (selectedOrderId) {
                    const entry = ordersCache.find(o => o.id === selectedOrderId);
                    const status = entry ? normalizeOrderStatus(entry.data.status) : '';
                    if (entry && status === 'requested') {
                        updateOrderStatus(selectedOrderId, 'accepted');
                    } else if (entry && (status === 'accepted' || status === 'pending' || !status)) {
                        updateOrderStatus(selectedOrderId, 'preparing');
                    }
                }
                break;
            case 'd':
                e.preventDefault();
                if (selectedOrderId) {
                    const entry = ordersCache.find(o => o.id === selectedOrderId);
                    if (entry && normalizeOrderStatus(entry.data.status) === 'preparing') {
                        updateOrderStatus(selectedOrderId, 'completed');
                    }
                }
                break;
            case 'x':
                e.preventDefault();
                if (selectedOrderId) {
                    const entry = ordersCache.find(o => o.id === selectedOrderId);
                    const status = entry ? normalizeOrderStatus(entry.data.status) : '';
                    updateOrderStatus(selectedOrderId, status === 'requested' ? 'rejected' : 'cancelled');
                }
                break;
        }
    }
});

window.listenToOrders = listenToOrders;
window.updateOrderStatus = updateOrderStatus;
window.loadOrdersPage = loadOrdersPage;
window.toggleOrderDetails = toggleOrderDetails;
window.selectOrder = selectOrder;
window.filterOrdersTable = filterOrdersTable;
