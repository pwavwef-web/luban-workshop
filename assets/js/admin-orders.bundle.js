(() => {
  // src/admin-orders.js
  var ORDERS_PAGE_SIZE = 10;
  var ordersPageIndex = 0;
  var ordersCache = [];
  var knownOrderIds = null;
  var selectedOrderId = null;
  function getAdminDb() {
    if (!window.db) throw new Error("Admin database is not initialized yet.");
    return window.db;
  }
  function listenToOrders() {
    ordersPageIndex = 0;
    ordersCache = [];
    knownOrderIds = null;
    getAdminDb().collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
      if (knownOrderIds !== null) {
        snapshot.forEach((doc) => {
          const order = doc.data();
          if (!knownOrderIds.has(doc.id) && (order.status === "pending" || !order.status)) {
            showAdminNotification(
              "New Order Received! \u{1F6D2}",
              `Order #${doc.id.slice(-6).toUpperCase()} \u2013 \u20B5${(order.total || 0).toFixed(2)}`
            );
          }
        });
      }
      knownOrderIds = new Set(snapshot.docs.map((d) => d.id));
      ordersCache = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
      const maxPage = Math.max(0, Math.ceil(ordersCache.length / ORDERS_PAGE_SIZE) - 1);
      if (ordersPageIndex > maxPage) ordersPageIndex = maxPage;
      loadOrdersPage(ordersPageIndex);
    }, (err) => {
      console.error("Orders listener error:", err);
      const tableBody = document.getElementById("orders-table");
      tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-red-600 italic">Failed to load orders.</td></tr>';
    });
  }
  async function updateOrderStatus(id, status) {
    try {
      if (status === "cancelled" && !confirm("Are you sure you want to cancel this order?")) return;
      await getAdminDb().collection("orders").doc(id).update({
        status
      });
      console.log(`Order ${id} updated to ${status}`);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Could not update order.");
    }
  }
  function renderPaginationControls(hasNext) {
    const controlsRowId = "orders-pagination-row";
    const existing = document.getElementById(controlsRowId);
    if (existing) existing.remove();
    const tableBody = document.getElementById("orders-table");
    const prevDisabled = ordersPageIndex === 0;
    const nextDisabled = !hasNext;
    const controls = `
                <tr id="${controlsRowId}" class="bg-stone-50">
                        <td colspan="7" class="px-6 py-3 text-center">
                        <div class="flex items-center justify-center gap-3">
                            <button id="orders-prev" class="px-3 py-1 rounded border" ${prevDisabled ? "disabled" : ""}>Prev</button>
                            <span class="text-sm text-stone-600">Page ${ordersPageIndex + 1}</span>
                            <button id="orders-next" class="px-3 py-1 rounded border" ${nextDisabled ? "disabled" : ""}>Next</button>
                        </div>
                    </td>
                </tr>
            `;
    tableBody.insertAdjacentHTML("beforeend", controls);
    document.getElementById("orders-prev").addEventListener("click", () => {
      if (ordersPageIndex === 0) return;
      ordersPageIndex--;
      loadOrdersPage(ordersPageIndex);
    });
    document.getElementById("orders-next").addEventListener("click", () => {
      if (nextDisabled) return;
      ordersPageIndex++;
      loadOrdersPage(ordersPageIndex);
    });
  }
  function loadOrdersPage(pageIndex) {
    const tableBody = document.getElementById("orders-table");
    tableBody.innerHTML = "";
    if (!ordersCache.length) {
      tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-stone-500 italic">No orders received yet.</td></tr>';
      renderPaginationControls(false);
      const badge2 = document.getElementById("badge-orders");
      badge2.classList.add("hidden");
      setMetricValue("metric-active-orders", 0);
      setMetricText("metric-orders-subtext", "No open kitchen tickets");
      return;
    }
    const start = pageIndex * ORDERS_PAGE_SIZE;
    const pageOrders = ordersCache.slice(start, start + ORDERS_PAGE_SIZE);
    const hasNext = start + ORDERS_PAGE_SIZE < ordersCache.length;
    let pendingCount = 0;
    ordersCache.forEach((entry) => {
      const s = entry.data.status;
      if (s === "pending" || s === "preparing" || !s) pendingCount++;
    });
    setMetricValue("metric-active-orders", pendingCount);
    setMetricText("metric-orders-subtext", pendingCount === 1 ? "1 open kitchen ticket" : `${pendingCount} open kitchen tickets`);
    pageOrders.forEach((entry) => {
      const order = entry.data;
      const id = entry.id;
      let statusClass = "bg-stone-100 text-stone-800";
      if (order.status === "completed") statusClass = "bg-green-100 text-green-800";
      if (order.status === "pending") statusClass = "bg-yellow-100 text-yellow-800";
      if (order.status === "preparing") statusClass = "bg-blue-100 text-blue-800";
      if (order.status === "cancelled") statusClass = "bg-red-100 text-red-800";
      const itemsSummary = order.items ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") : "No items";
      const itemsDetail = order.items ? order.items.map((i) => `<div class="py-0.5"><span class="font-bold text-stone-600">${i.quantity}&times;</span> ${i.name}</div>`).join("") : '<div class="text-stone-600 italic">No items</div>';
      let actions = "";
      if (order.status === "pending" || !order.status) {
        actions = `
                            <button onclick="updateOrderStatus('${id}', 'preparing')" aria-label="Mark order as preparing" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-full mr-2 transition-colors" title="Mark as Preparing">
                                <i data-lucide="chef-hat" class="h-4 w-4"></i>
                            </button>
                            <button onclick="updateOrderStatus('${id}', 'cancelled')" aria-label="Cancel order" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Cancel Order">
                                <i data-lucide="x" class="h-4 w-4"></i>
                            </button>
                        `;
      } else if (order.status === "preparing") {
        actions = `
                            <button onclick="updateOrderStatus('${id}', 'completed')" aria-label="Mark order as completed" class="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-full mr-2 transition-colors" title="Mark Completed">
                                <i data-lucide="check" class="h-4 w-4"></i>
                            </button>
                            <button onclick="updateOrderStatus('${id}', 'cancelled')" aria-label="Cancel order" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Cancel Order">
                                <i data-lucide="x" class="h-4 w-4"></i>
                            </button>
                        `;
      } else {
        actions = `
                            <button onclick="updateOrderStatus('${id}', 'pending')" aria-label="Move order back to pending" class="text-stone-600 hover:text-stone-700 p-2 rounded-full transition-colors" title="Move back to Pending">
                                <i data-lucide="rotate-ccw" class="h-4 w-4"></i>
                            </button>
                        `;
      }
      const placedDate = order.createdAt && order.createdAt.toDate ? order.createdAt.toDate() : null;
      const placedDateStr = placedDate ? placedDate.toLocaleDateString() : "\u2014";
      const placedTimeStr = placedDate ? placedDate.toLocaleTimeString() : "\u2014";
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
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-stone-900">\u20B5${(order.total || 0).toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${order.status ? order.status.toUpperCase() : "PENDING"}</span>
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
    const badge = document.getElementById("badge-orders");
    if (pendingCount > 0) badge.classList.remove("hidden");
    else badge.classList.add("hidden");
    lucide.createIcons();
  }
  function toggleOrderDetails(id) {
    const row = document.getElementById(`order-details-${id}`);
    if (row) row.classList.toggle("hidden");
  }
  function selectOrder(id) {
    document.querySelectorAll("#orders-table tr[data-order-id]").forEach((row2) => {
      row2.classList.remove("bg-red-50");
    });
    selectedOrderId = id;
    const row = document.querySelector(`#orders-table tr[data-order-id="${id}"]`);
    if (row) row.classList.add("bg-red-50");
  }
  function filterOrdersTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll("#orders-table tr[data-order-id]");
    rows.forEach((row) => {
      if (!q) {
        row.style.display = "";
        return;
      }
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  }
  document.addEventListener("keydown", (e) => {
    const ordersView = document.getElementById("view-orders");
    if (!ordersView || ordersView.classList.contains("hidden")) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          if (selectedOrderId) {
            const entry = ordersCache.find((o) => o.id === selectedOrderId);
            if (entry && (entry.data.status === "pending" || !entry.data.status)) {
              updateOrderStatus(selectedOrderId, "preparing");
            }
          }
          break;
        case "d":
          e.preventDefault();
          if (selectedOrderId) {
            const entry = ordersCache.find((o) => o.id === selectedOrderId);
            if (entry && entry.data.status === "preparing") {
              updateOrderStatus(selectedOrderId, "completed");
            }
          }
          break;
        case "x":
          e.preventDefault();
          if (selectedOrderId) {
            updateOrderStatus(selectedOrderId, "cancelled");
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
})();
