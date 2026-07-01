(() => {
  // src/admin-core.js
  initLubanFirebase(firebase);
  (function() {
    function tryInit() {
      try {
        if (window.cookieConsent && window.cookieConsent.get().analytics && typeof firebase.analytics === "function") firebase.analytics();
      } catch (e) {
      }
    }
    tryInit();
    window.addEventListener("cookieConsentChanged", function(e) {
      if (e.detail && e.detail.analytics) tryInit();
    });
  })();
  var auth = firebase.auth();
  var db = firebase.firestore();
  window.auth = auth;
  window.db = db;
  var adminDateEl = document.getElementById("admin-date");
  if (adminDateEl) {
    adminDateEl.textContent = (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }
  function setMetricValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const numeric = Number(value || 0);
    el.textContent = Number.isFinite(numeric) ? String(numeric) : String(value || "0");
  }
  function setMetricText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function getFirestoreDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  function truncateText(value, maxLength) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1).trim() + "...";
  }
  var adminPhoneUser = null;
  function openAdminPhoneModal(user) {
    adminPhoneUser = user || null;
    const modal = document.getElementById("admin-phone-modal");
    if (!modal) return;
    const input = document.getElementById("admin-phone-input");
    const error = document.getElementById("admin-phone-error");
    if (error) {
      error.textContent = "";
      error.classList.add("hidden");
    }
    if (input) input.value = "";
    modal.classList.remove("hidden");
    setTimeout(() => {
      if (input) input.focus();
    }, 50);
  }
  function closeAdminPhoneModal() {
    adminPhoneUser = null;
    const modal = document.getElementById("admin-phone-modal");
    if (modal) modal.classList.add("hidden");
  }
  async function submitAdminPhone() {
    const input = document.getElementById("admin-phone-input");
    const error = document.getElementById("admin-phone-error");
    const saveBtn = document.getElementById("admin-phone-save");
    const showError = (msg) => {
      if (!error) return;
      error.textContent = msg;
      error.classList.remove("hidden");
    };
    if (!adminPhoneUser) {
      closeAdminPhoneModal();
      return;
    }
    const phone = formatGhanaPhone(input ? input.value : "");
    if (!phone) {
      showError("Please enter a valid Ghana number (+233 and 9 digits, e.g., +233501234567).");
      if (input) input.focus();
      return;
    }
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }
    try {
      await db.collection("users").doc(adminPhoneUser.uid).set(
        { phone, name: adminPhoneUser.displayName || "", email: adminPhoneUser.email || "" },
        { merge: true }
      );
      closeAdminPhoneModal();
    } catch (e) {
      console.error("Failed to save admin phone number:", e);
      showError("Could not save your number. Please try again.");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save number";
      }
    }
  }
  window.openAdminPhoneModal = openAdminPhoneModal;
  window.closeAdminPhoneModal = closeAdminPhoneModal;
  window.submitAdminPhone = submitAdminPhone;
  function formatCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "";
    return `GHS ${amount.toFixed(2).replace(/\.00$/, "")}`;
  }
  async function fetchAdminApi(path, options = {}) {
    const user = auth.currentUser;
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
  function formatGhanaPhone(phone) {
    let cleaned = phone.replace(/[^\d+]/g, "");
    let hasPlus = cleaned.startsWith("+");
    if (hasPlus) cleaned = cleaned.substring(1);
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
    if (cleaned.startsWith("233")) cleaned = cleaned.substring(3);
    if (!/^\d{9}$/.test(cleaned)) return null;
    return "+233" + cleaned;
  }
  var notificationsEnabled = false;
  async function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    try {
      const perm = await Notification.requestPermission();
      notificationsEnabled = perm === "granted";
    } catch (e) {
    }
  }
  function showAdminNotification(title, body) {
    if (Notification.permission !== "granted") return;
    try {
      const n = new Notification(title, {
        body,
        icon: "logo.png",
        badge: "logo.png",
        requireInteraction: true
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
    }
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("admin-sw.js").catch(() => {
    });
  }
  var SPLASH_MIN_MS = 700;
  var splashStartedAt = Date.now();
  var splashDismissed = false;
  function hideSplash() {
    if (splashDismissed) return;
    splashDismissed = true;
    const splash = document.getElementById("splash-screen");
    if (!splash) return;
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - splashStartedAt));
    setTimeout(() => {
      splash.classList.add("admin-splash--hide");
      setTimeout(() => {
        splash.style.display = "none";
      }, 600);
    }, wait);
  }
  setTimeout(hideSplash, 9e3);
  function setOverviewGreeting() {
    const el = document.getElementById("overview-greeting");
    if (!el) return;
    const hour = (/* @__PURE__ */ new Date()).getHours();
    el.textContent = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  }
  function publishBaoAdminContext(user, verified) {
    const context = {
      isAdmin: verified === true,
      uid: verified && user ? user.uid || "" : "",
      email: verified && user ? user.email || "" : "",
      displayName: verified && user ? user.displayName || "" : "",
      panel: "admin",
      verifiedAt: verified ? (/* @__PURE__ */ new Date()).toISOString() : ""
    };
    window.LUBAN_BAO_ADMIN_CONTEXT = context;
    window.dispatchEvent(new CustomEvent("luban:bao-admin-context", { detail: context }));
  }
  var MOBILE_BREAKPOINT = 768;
  var isMobileSidebarOpen = false;
  var mobileSidebarEventsBound = false;
  var ADMIN_MODULE_ENTRYPOINTS = [
    "listenToMenu",
    "listenToReservations",
    "listenToOrders",
    "listenToPromotions",
    "listenToSpecialMenus",
    "listenToAdminUsers",
    "initSmsCampaigns",
    "listenToMessages",
    "loadFraudReview",
    "listenToChatbotKnowledge",
    "startTour"
  ];
  async function waitForAdminModules() {
    const deadline = Date.now() + 5e3;
    let missing = ADMIN_MODULE_ENTRYPOINTS.filter((name) => typeof window[name] !== "function");
    while (missing.length && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      missing = ADMIN_MODULE_ENTRYPOINTS.filter((name) => typeof window[name] !== "function");
    }
    if (missing.length) {
      throw new Error(`Admin modules failed to load: ${missing.join(", ")}`);
    }
  }
  function handleOverlayKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMobileSidebar();
    }
  }
  function toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (isMobileSidebarOpen) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
      isMobileSidebarOpen = false;
    } else {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
      isMobileSidebarOpen = true;
    }
  }
  function bindMobileSidebarSwipe() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    let startX = 0;
    let startY = 0;
    let activePointer = null;
    function resetSwipe() {
      activePointer = null;
    }
    function handleSwipeStart(event) {
      if (window.innerWidth >= MOBILE_BREAKPOINT || !isMobileSidebarOpen) return;
      startX = event.clientX;
      startY = event.clientY;
      activePointer = event.pointerId || "mouse";
    }
    function handleSwipeEnd(event) {
      const pointerId = event.pointerId || "mouse";
      if (activePointer !== pointerId) return;
      const deltaX = event.clientX - startX;
      const deltaY = Math.abs(event.clientY - startY);
      resetSwipe();
      if (deltaX < -72 && Math.abs(deltaX) > deltaY * 1.25 && isMobileSidebarOpen) {
        toggleMobileSidebar();
      }
    }
    sidebar.addEventListener("pointerdown", handleSwipeStart);
    sidebar.addEventListener("pointerup", handleSwipeEnd);
    sidebar.addEventListener("pointercancel", resetSwipe);
    sidebar.addEventListener("mousedown", handleSwipeStart);
    sidebar.addEventListener("mouseup", handleSwipeEnd);
  }
  function switchTab(tabName) {
    if (window.innerWidth < MOBILE_BREAKPOINT && isMobileSidebarOpen) {
      toggleMobileSidebar();
    }
    ["overview", "menu", "reservations", "orders", "promotions", "special-menus", "admin-users", "messages", "fraud-review", "chatbot-knowledge", "account"].forEach((tab) => {
      document.getElementById("view-" + tab).classList.add("hidden");
      const btn = document.getElementById("tab-btn-" + tab);
      btn.classList.remove("bg-red-50", "text-red-700", "admin-nav-active");
      btn.classList.add("text-stone-600");
      btn.removeAttribute("aria-current");
    });
    document.getElementById("view-" + tabName).classList.remove("hidden");
    if (tabName === "account") {
      window.checkSmsBalance();
      window.refreshSmsCampaigns();
    }
    const activeBtn = document.getElementById("tab-btn-" + tabName);
    activeBtn.classList.add("bg-red-50", "text-red-700", "admin-nav-active");
    activeBtn.classList.remove("text-stone-600");
    activeBtn.setAttribute("aria-current", "page");
    if (tabName === "fraud-review") {
      window.loadFraudReview();
    }
  }
  async function checkSmsBalance() {
    const btn = document.getElementById("check-balance-btn");
    const loading = document.getElementById("balance-loading");
    const result = document.getElementById("balance-result");
    const error = document.getElementById("balance-error");
    const initial = document.getElementById("balance-initial");
    const errorMsg = document.getElementById("balance-error-message");
    loading.classList.add("hidden");
    result.classList.add("hidden");
    error.classList.add("hidden");
    initial.classList.add("hidden");
    loading.classList.remove("hidden");
    btn.disabled = true;
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Not authenticated");
      }
      const data = await fetchAdminApi("/api/admin/sms/balance");
      displaySmsBalance(data.balance);
      loading.classList.add("hidden");
      result.classList.remove("hidden");
    } catch (err) {
      console.error("Failed to check SMS balance:", err);
      loading.classList.add("hidden");
      error.classList.remove("hidden");
      errorMsg.textContent = err.message || "An error occurred while checking balance. Please try again.";
    } finally {
      btn.disabled = false;
    }
  }
  function displaySmsBalance(balanceData) {
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleString();
    const statusEl = document.getElementById("balance-status");
    const creditsEl = document.getElementById("balance-credits");
    const detailsEl = document.getElementById("balance-details");
    const timestampEl = document.getElementById("balance-timestamp");
    if (typeof balanceData === "object" && balanceData !== null) {
      if (typeof balanceData.balance === "number") {
        statusEl.textContent = "Active";
        creditsEl.textContent = balanceData.balance.toFixed(2) + " credits";
      } else if (balanceData.balance && typeof balanceData.balance.balance === "number") {
        statusEl.textContent = "Active";
        creditsEl.textContent = balanceData.balance.balance.toFixed(2) + " credits";
      } else {
        statusEl.textContent = "Active";
        creditsEl.textContent = JSON.stringify(balanceData.balance);
      }
      const details = Object.entries(balanceData).filter(([key]) => key !== "balance").map(([key, value]) => `<strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value))}`).join("<br>");
      detailsEl.innerHTML = details || '<p class="text-stone-500 italic">No additional details available</p>';
    } else {
      statusEl.textContent = "Active";
      creditsEl.textContent = balanceData;
      detailsEl.innerHTML = '<p class="text-stone-500 italic">Balance successfully retrieved</p>';
    }
    timestampEl.textContent = `Last checked: ${timestamp}`;
  }
  async function initializeAdminDashboard(user) {
    await waitForAdminModules();
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("admin-dashboard").classList.remove("hidden");
    document.getElementById("user-email").textContent = user.email;
    window.listenToMenu();
    window.listenToReservations();
    window.listenToOrders();
    window.listenToPromotions();
    window.listenToSpecialMenus();
    window.listenToAdminUsers();
    window.initSmsCampaigns();
    window.listenToMessages();
    window.loadFraudReview();
    window.listenToChatbotKnowledge();
    requestNotificationPermission();
    setOverviewGreeting();
    switchTab("overview");
    if (!mobileSidebarEventsBound) {
      const menuToggle = document.getElementById("mobile-menu-toggle");
      const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
      const overlay = document.getElementById("sidebar-overlay");
      menuToggle.addEventListener("click", toggleMobileSidebar);
      sidebarCloseBtn.addEventListener("click", toggleMobileSidebar);
      overlay.addEventListener("click", toggleMobileSidebar);
      overlay.addEventListener("keydown", handleOverlayKeydown);
      bindMobileSidebarSwipe();
      mobileSidebarEventsBound = true;
    }
    lucide.createIcons();
    window.startTour();
  }
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      document.getElementById("login-error").classList.add("hidden");
    } catch (error) {
      const errDiv = document.getElementById("login-error");
      errDiv.textContent = error.message;
      errDiv.classList.remove("hidden");
    }
  });
  function logout() {
    auth.signOut();
  }
  document.getElementById("google-signin-btn").addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      document.getElementById("google-signin-error").classList.add("hidden");
    } catch (error) {
      const errDiv = document.getElementById("google-signin-error");
      errDiv.textContent = error.message;
      errDiv.classList.remove("hidden");
    }
  });
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      let adminVerified = false;
      const normalizedEmail = (user.email || "").trim().toLowerCase();
      try {
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.admin === true) adminVerified = true;
      } catch (e) {
      }
      if (!adminVerified && normalizedEmail) {
        try {
          const adminDoc = await db.collection("admins").doc(normalizedEmail).get();
          if (adminDoc.exists) adminVerified = true;
        } catch (e) {
        }
      }
      if (!adminVerified) {
        publishBaoAdminContext(user, false);
        await auth.signOut();
        const errDiv = document.getElementById("login-error");
        errDiv.textContent = "Access denied. You do not have admin privileges.";
        errDiv.classList.remove("hidden");
        hideSplash();
        return;
      }
      publishBaoAdminContext(user, true);
      try {
        const profileDoc = await db.collection("users").doc(user.uid).get();
        const profileData = profileDoc.exists ? profileDoc.data() : null;
        if (!profileData || !profileData.phone || typeof profileData.phone === "string" && profileData.phone.trim() === "") {
          openAdminPhoneModal(user);
        }
      } catch (e) {
        console.error("Failed to ensure admin phone number:", e);
      }
      try {
        await initializeAdminDashboard(user);
        hideSplash();
      } catch (error) {
        console.error("Failed to initialize admin dashboard:", error);
        const errDiv = document.getElementById("login-error");
        errDiv.textContent = "Admin dashboard failed to load. Please refresh and try again.";
        errDiv.classList.remove("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("admin-dashboard").classList.add("hidden");
        hideSplash();
      }
    } else {
      publishBaoAdminContext(null, false);
      document.getElementById("login-screen").classList.remove("hidden");
      document.getElementById("admin-dashboard").classList.add("hidden");
      hideSplash();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (typeof window.closePriceModal === "function") window.closePriceModal();
      if (typeof window.closeImageModal === "function") window.closeImageModal();
      if (typeof window.closeReservationRejectModal === "function") window.closeReservationRejectModal();
    }
  });
  window.db = db;
  window.auth = auth;
  window.setMetricValue = setMetricValue;
  window.setMetricText = setMetricText;
  window.escapeHtml = escapeHtml;
  window.getFirestoreDate = getFirestoreDate;
  window.truncateText = truncateText;
  window.formatCurrency = formatCurrency;
  window.fetchAdminApi = fetchAdminApi;
  window.formatGhanaPhone = formatGhanaPhone;
  window.showAdminNotification = showAdminNotification;
  window.toggleMobileSidebar = toggleMobileSidebar;
  window.switchTab = switchTab;
  window.logout = logout;
  window.checkSmsBalance = checkSmsBalance;
  window.displaySmsBalance = displaySmsBalance;
})();
