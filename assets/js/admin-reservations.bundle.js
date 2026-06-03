(() => {
  // src/admin-reservations.js
  function getAdminDb() {
    if (!window.db) throw new Error("Admin database is not initialized yet.");
    return window.db;
  }
  function getAdminAuth() {
    if (!window.auth) throw new Error("Admin auth is not initialized yet.");
    return window.auth;
  }
  function normalizeReservationStatus(status) {
    const normalized = String(status || "pending").trim().toLowerCase();
    if (normalized === "completed") return "confirmed";
    if (normalized === "confirmed" || normalized === "rejected" || normalized === "pending") return normalized;
    return "pending";
  }
  function getReservationStatusMeta(status) {
    if (status === "confirmed") {
      return { label: "Confirmed", classes: "bg-green-100 text-green-800" };
    }
    if (status === "rejected") {
      return { label: "Rejected", classes: "bg-red-100 text-red-800" };
    }
    return { label: "Pending", classes: "bg-yellow-100 text-yellow-800" };
  }
  function listenToReservations() {
    let knownReservationIds = null;
    getAdminDb().collection("reservations").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
      const tableBody = document.getElementById("reservations-table");
      tableBody.innerHTML = "";
      let pendingCount = 0;
      if (knownReservationIds !== null) {
        snapshot.forEach((doc) => {
          const res = doc.data();
          if (!knownReservationIds.has(doc.id) && (res.status === "pending" || !res.status)) {
            showAdminNotification(
              "New Reservation \u{1F4C5}",
              `${res.name || "Guest"} \u2013 ${res.date || ""} at ${res.time || ""} for ${res.guests || "?"} people`
            );
          }
        });
      }
      knownReservationIds = new Set(snapshot.docs.map((d) => d.id));
      if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-stone-500 italic">No reservations yet.</td></tr>';
      }
      snapshot.forEach((doc) => {
        const res = doc.data();
        const id = doc.id;
        const status = normalizeReservationStatus(res.status);
        const statusMeta = getReservationStatusMeta(status);
        const specialRequests = res.notes ? `<div class="mt-1 text-xs text-stone-500">Requests: ${escapeHtml(truncateText(res.notes, 100))}</div>` : "";
        const rejectionReason = res.decisionReason && status === "rejected" ? `<div class="mt-1 text-xs text-red-700">Reason: ${escapeHtml(truncateText(res.decisionReason, 100))}</div>` : "";
        const decisionBy = res.decisionBy ? `<div class="mt-1 text-xs text-stone-400">Updated by ${escapeHtml(res.decisionBy)}</div>` : "";
        if (status === "pending") pendingCount++;
        let actionBtn = "";
        if (status === "pending") {
          actionBtn = `
                    <button onclick="updateReservationStatus('${id}', 'confirmed')" aria-label="Confirm reservation" class="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-green-700 hover:bg-green-100 transition-colors mr-2" title="Confirm Reservation">
                        <i data-lucide="check" class="h-4 w-4"></i>
                        <span class="text-xs font-semibold">Confirm</span>
                    </button>
                    <button onclick="openReservationRejectModal('${id}', ${JSON.stringify(res.name || "Guest").replace(/"/g, "&quot;")})" aria-label="Reject reservation" class="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100 transition-colors" title="Reject Reservation">
                        <i data-lucide="x" class="h-4 w-4"></i>
                        <span class="text-xs font-semibold">Reject</span>
                    </button>`;
        } else if (status === "confirmed") {
          actionBtn = `
                    <button onclick="updateReservationStatus('${id}', 'pending')" aria-label="Move reservation back to pending" class="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-stone-700 hover:bg-stone-200 transition-colors mr-2" title="Move Back to Pending">
                        <i data-lucide="rotate-ccw" class="h-4 w-4"></i>
                        <span class="text-xs font-semibold">Pending</span>
                    </button>
                    <button onclick="openReservationRejectModal('${id}', ${JSON.stringify(res.name || "Guest").replace(/"/g, "&quot;")})" aria-label="Reject reservation" class="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100 transition-colors" title="Reject Reservation">
                        <i data-lucide="x" class="h-4 w-4"></i>
                        <span class="text-xs font-semibold">Reject</span>
                    </button>`;
        } else {
          actionBtn = `
                    <button onclick="updateReservationStatus('${id}', 'confirmed')" aria-label="Confirm reservation" class="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-green-700 hover:bg-green-100 transition-colors mr-2" title="Confirm Reservation">
                        <i data-lucide="check" class="h-4 w-4"></i>
                        <span class="text-xs font-semibold">Confirm</span>
                    </button>
                    <button onclick="updateReservationStatus('${id}', 'pending')" aria-label="Move reservation back to pending" class="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-stone-700 hover:bg-stone-200 transition-colors" title="Move Back to Pending">
                        <i data-lucide="rotate-ccw" class="h-4 w-4"></i>
                        <span class="text-xs font-semibold">Pending</span>
                    </button>`;
        }
        const row = `
                <tr class="hover:bg-stone-50 transition-colors border-b border-stone-100">
                    <td class="px-6 py-4 text-sm font-medium text-stone-900">
                        <div>${escapeHtml(res.name || "Guest")}</div>
                        ${specialRequests}
                    </td>
                    <td class="px-6 py-4 text-sm text-stone-500">
                        <div>${escapeHtml(res.phone || "No phone")}</div>
                        <div class="text-xs text-stone-600">${escapeHtml(res.email || "No email provided")}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        <div class="font-medium">${escapeHtml(res.date || "No date")}</div>
                        <div class="text-xs">${escapeHtml(res.time || "No time")}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">${escapeHtml(res.guests || "?")} Ppl</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMeta.classes}">${statusMeta.label}</span>
                        ${rejectionReason}
                        ${decisionBy}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${actionBtn}
                    </td>
                </tr>
            `;
        tableBody.innerHTML += row;
      });
      const badge = document.getElementById("badge-reservations");
      if (pendingCount > 0) {
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
      setMetricValue("metric-pending-reservations", pendingCount);
      lucide.createIcons();
    });
  }
  async function updateReservationStatus(id, status, options = {}) {
    const normalizedStatus = normalizeReservationStatus(status);
    const user = getAdminAuth().currentUser;
    const deleteFieldValue = firebase.firestore.FieldValue.delete();
    const updates = {
      status: normalizedStatus
    };
    if (normalizedStatus === "confirmed") {
      updates.decisionAt = firebase.firestore.FieldValue.serverTimestamp();
      updates.decisionBy = user && user.email ? user.email : "unknown";
      updates.confirmedAt = firebase.firestore.FieldValue.serverTimestamp();
      updates.rejectedAt = deleteFieldValue;
      updates.decisionReason = deleteFieldValue;
    } else if (normalizedStatus === "rejected") {
      updates.decisionAt = firebase.firestore.FieldValue.serverTimestamp();
      updates.decisionBy = user && user.email ? user.email : "unknown";
      updates.rejectedAt = firebase.firestore.FieldValue.serverTimestamp();
      updates.confirmedAt = deleteFieldValue;
      updates.decisionReason = options.reason;
    } else {
      updates.decisionAt = deleteFieldValue;
      updates.decisionBy = deleteFieldValue;
      updates.confirmedAt = deleteFieldValue;
      updates.rejectedAt = deleteFieldValue;
      updates.decisionReason = deleteFieldValue;
    }
    try {
      await getAdminDb().collection("reservations").doc(id).update(updates);
      console.log(`Reservation ${id} updated to ${normalizedStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Check your internet connection.");
      throw error;
    }
  }
  function openReservationRejectModal(id, guestName) {
    const modal = document.getElementById("reservation-reject-modal");
    modal.dataset.reservationId = id;
    document.getElementById("reservation-reject-guest").textContent = guestName || "this guest";
    document.getElementById("reservation-reject-reason").value = "";
    document.getElementById("reservation-reject-error").classList.add("hidden");
    modal.classList.remove("hidden");
    setTimeout(() => document.getElementById("reservation-reject-reason").focus(), 40);
  }
  function closeReservationRejectModal() {
    const modal = document.getElementById("reservation-reject-modal");
    modal.classList.add("hidden");
    modal.dataset.reservationId = "";
    document.getElementById("reservation-reject-reason").value = "";
    document.getElementById("reservation-reject-error").classList.add("hidden");
  }
  async function submitReservationRejection() {
    const modal = document.getElementById("reservation-reject-modal");
    const reservationId = modal.dataset.reservationId;
    const reason = document.getElementById("reservation-reject-reason").value.trim();
    const errorDiv = document.getElementById("reservation-reject-error");
    if (!reason) {
      errorDiv.textContent = "Please add a clear reason before rejecting the reservation.";
      errorDiv.classList.remove("hidden");
      return;
    }
    try {
      await updateReservationStatus(reservationId, "rejected", { reason });
      closeReservationRejectModal();
    } catch (error) {
      errorDiv.textContent = "Could not reject this reservation right now.";
      errorDiv.classList.remove("hidden");
    }
  }
  function filterReservationsTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll("#reservations-table tr");
    rows.forEach((row) => {
      if (!q) {
        row.style.display = "";
        return;
      }
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  }
  window.listenToReservations = listenToReservations;
  window.updateReservationStatus = updateReservationStatus;
  window.openReservationRejectModal = openReservationRejectModal;
  window.closeReservationRejectModal = closeReservationRejectModal;
  window.submitReservationRejection = submitReservationRejection;
  window.filterReservationsTable = filterReservationsTable;
})();
