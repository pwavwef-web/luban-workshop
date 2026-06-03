(() => {
  // src/admin-fraud.js
  function getAdminAuth() {
    if (!window.auth) throw new Error("Admin auth is not initialized yet.");
    return window.auth;
  }
  async function fetchAdminApi(path, options = {}) {
    const user = getAdminAuth().currentUser;
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken();
    const response = await fetch(path, {
      method: options.method || "GET",
      headers: Object.assign({
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }, options.headers || {}),
      body: options.body ? JSON.stringify(options.body) : void 0
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
  }
  function renderFraudReview(data) {
    const container = document.getElementById("fraud-review-container");
    const duplicatePhones = Array.isArray(data.duplicatePhones) ? data.duplicatePhones : [];
    const repeatedOtpSends = Array.isArray(data.repeatedOtpSends) ? data.repeatedOtpSends : [];
    const repeatedOtpFailures = Array.isArray(data.repeatedOtpFailures) ? data.repeatedOtpFailures : [];
    const repeatedCancellations = Array.isArray(data.repeatedCancellations) ? data.repeatedCancellations : [];
    const priceMismatches = Array.isArray(data.priceMismatches) ? data.priceMismatches : [];
    const suspiciousBursts = Array.isArray(data.suspiciousBursts) ? data.suspiciousBursts : [];
    const recentEvents = Array.isArray(data.recentEvents) ? data.recentEvents : [];
    container.innerHTML = `
                <div class="grid gap-4 lg:grid-cols-2">
                    <article class="admin-panel bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                        <h3 class="text-base font-bold text-stone-900">Duplicate Verified Phones</h3>
                        <p class="mt-1 text-xs text-stone-500">${duplicatePhones.length} phone numbers shared across multiple accounts.</p>
                        <div class="mt-4 space-y-3 text-sm">
                            ${duplicatePhones.length ? duplicatePhones.map((entry) => `
                                <div class="rounded-lg border border-stone-200 p-3">
                                    <p class="font-semibold text-stone-900">${escapeHtml(entry.phoneMasked || "")}</p>
                                    <p class="mt-1 text-stone-600">${entry.users.map((user) => escapeHtml(user.email || user.uid || "unknown")).join(" | ")}</p>
                                </div>
                            `).join("") : '<p class="text-stone-500 italic">No duplicate verified phone numbers found.</p>'}
                        </div>
                    </article>
                    <article class="admin-panel bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                        <h3 class="text-base font-bold text-stone-900">Repeated OTP Sends</h3>
                        <p class="mt-1 text-xs text-stone-500">${repeatedOtpSends.length} hashed subjects crossed the send review threshold.</p>
                        <div class="mt-4 space-y-3 text-sm">
                            ${repeatedOtpSends.length ? repeatedOtpSends.map((entry) => `
                                <div class="rounded-lg border border-stone-200 p-3">
                                    <p class="font-semibold text-stone-900">${escapeHtml(entry.subjectHash || "")}</p>
                                    <p class="mt-1 text-stone-600">${entry.count} OTP sends</p>
                                </div>
                            `).join("") : '<p class="text-stone-500 italic">No repeated OTP send patterns found.</p>'}
                        </div>
                    </article>
                    <article class="admin-panel bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                        <h3 class="text-base font-bold text-stone-900">Repeated OTP Failures</h3>
                        <p class="mt-1 text-xs text-stone-500">${repeatedOtpFailures.length} hashed subjects crossed the review threshold.</p>
                        <div class="mt-4 space-y-3 text-sm">
                            ${repeatedOtpFailures.length ? repeatedOtpFailures.map((entry) => `
                                <div class="rounded-lg border border-stone-200 p-3">
                                    <p class="font-semibold text-stone-900">${escapeHtml(entry.subjectHash || "")}</p>
                                    <p class="mt-1 text-stone-600">${entry.count} failed verifications</p>
                                </div>
                            `).join("") : '<p class="text-stone-500 italic">No repeated OTP failures found.</p>'}
                        </div>
                    </article>
                    <article class="admin-panel bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                        <h3 class="text-base font-bold text-stone-900">Repeated Customer Cancellations</h3>
                        <p class="mt-1 text-xs text-stone-500">${repeatedCancellations.length} customers cancelled multiple recent orders.</p>
                        <div class="mt-4 space-y-3 text-sm">
                            ${repeatedCancellations.length ? repeatedCancellations.map((entry) => `
                                <div class="rounded-lg border border-stone-200 p-3">
                                    <p class="font-semibold text-stone-900">${escapeHtml(entry.customerName || entry.userId || "Unknown customer")}</p>
                                    <p class="mt-1 text-stone-600">${entry.count} cancellations ${entry.customerPhone ? `\u2022 ${escapeHtml(entry.customerPhone)}` : ""}</p>
                                </div>
                            `).join("") : '<p class="text-stone-500 italic">No repeated cancellation patterns found.</p>'}
                        </div>
                    </article>
                    <article class="admin-panel bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                        <h3 class="text-base font-bold text-stone-900">Price Mismatch Attempts</h3>
                        <p class="mt-1 text-xs text-stone-500">${priceMismatches.length} recent orders had client totals that did not match server pricing.</p>
                        <div class="mt-4 space-y-3 text-sm">
                            ${priceMismatches.length ? priceMismatches.map((entry) => `
                                <div class="rounded-lg border border-stone-200 p-3">
                                    <p class="font-semibold text-stone-900">${escapeHtml(entry.userId || "Unknown user")}</p>
                                    <p class="mt-1 text-stone-600">Client ${escapeHtml(String(entry.suppliedTotal))} vs server ${escapeHtml(String(entry.authoritativeTotal))}</p>
                                </div>
                            `).join("") : '<p class="text-stone-500 italic">No recent pricing mismatch attempts found.</p>'}
                        </div>
                    </article>
                </div>
                <article class="admin-panel bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                    <h3 class="text-base font-bold text-stone-900">Rate-Limit Bursts</h3>
                    <p class="mt-1 text-xs text-stone-500">${suspiciousBursts.length} recent server-side burst events.</p>
                    <div class="mt-4 space-y-3 text-sm">
                        ${suspiciousBursts.length ? suspiciousBursts.map((entry) => `
                            <div class="rounded-lg border border-stone-200 p-3">
                                <p class="font-semibold text-stone-900">${escapeHtml(entry.scope || "Unknown scope")}</p>
                                <p class="mt-1 text-stone-600">${escapeHtml(entry.subjectHash || "")}</p>
                                <p class="mt-1 text-xs text-stone-500">${escapeHtml(entry.createdAt || "")}</p>
                            </div>
                        `).join("") : '<p class="text-stone-500 italic">No rate-limit bursts recorded.</p>'}
                    </div>
                </article>
                <article class="admin-panel bg-white rounded-xl shadow-sm border border-stone-200 p-5">
                    <h3 class="text-base font-bold text-stone-900">Recent Security Events</h3>
                    <div class="mt-4 space-y-3 text-sm">
                        ${recentEvents.length ? recentEvents.map((entry) => `
                            <div class="rounded-lg border border-stone-200 p-3">
                                <p class="font-semibold text-stone-900">${escapeHtml(entry.kind || "event")}</p>
                                <p class="mt-1 text-stone-600">${escapeHtml(entry.createdAt || "")}</p>
                                <p class="mt-1 text-xs text-stone-500">${escapeHtml(entry.orderId || entry.reservationId || entry.userId || "")}</p>
                            </div>
                        `).join("") : '<p class="text-stone-500 italic">No recent events available.</p>'}
                    </div>
                </article>
            `;
  }
  async function loadFraudReview() {
    const container = document.getElementById("fraud-review-container");
    container.innerHTML = '<p class="text-stone-500 italic text-sm">Loading fraud signals...</p>';
    try {
      const data = await fetchAdminApi("/api/admin/fraud-review");
      renderFraudReview(data);
      lucide.createIcons();
    } catch (error) {
      console.error("Failed to load fraud review:", error);
      container.innerHTML = `<p class="text-red-600 text-sm">${escapeHtml(error.message || "Failed to load fraud review.")}</p>`;
    }
  }
  setTimeout(() => {
    document.getElementById("fraud-review-refresh-btn").addEventListener("click", loadFraudReview);
  }, 0);
  window.fetchAdminApi = fetchAdminApi;
  window.loadFraudReview = loadFraudReview;
})();
