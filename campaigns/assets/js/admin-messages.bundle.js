(() => {
  // src/admin-messages.js
  var messagesCache = [];
  var messageFilter = "all";
  function getAdminDb() {
    if (!window.db) throw new Error("Admin database is not initialized yet.");
    return window.db;
  }
  function isAssistantMessage(message) {
    return String(message.source || "").toLowerCase() === "assistant";
  }
  function getMessageCounts(items) {
    return items.reduce((counts, item) => {
      const message = item.data || {};
      counts.all += 1;
      if (!message.read) counts.unread += 1;
      if (isAssistantMessage(message)) counts.assistant += 1;
      return counts;
    }, { all: 0, unread: 0, assistant: 0 });
  }
  function updateMessageFilterControls(counts) {
    setMetricValue("message-count-all", counts.all);
    setMetricValue("message-count-unread", counts.unread);
    setMetricValue("message-count-assistant", counts.assistant);
    document.querySelectorAll("[data-message-filter]").forEach((button) => {
      const active = button.dataset.messageFilter === messageFilter;
      button.classList.toggle("admin-segmented-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function setMessageFilter(nextFilter) {
    messageFilter = ["all", "unread", "assistant"].includes(nextFilter) ? nextFilter : "all";
    renderMessages();
  }
  function getFilteredMessages() {
    if (messageFilter === "unread") return messagesCache.filter((item) => !(item.data || {}).read);
    if (messageFilter === "assistant") return messagesCache.filter((item) => isAssistantMessage(item.data || {}));
    return messagesCache;
  }
  function renderMessageCard(item) {
    const m = item.data || {};
    const date = m.createdAt ? new Date(m.createdAt.toDate()).toLocaleString() : "N/A";
    const replyHref = buildReplyMailto(m.email, m.subject);
    const isAssistantReport = isAssistantMessage(m);
    const sourceLabel = isAssistantReport ? "AI report" : "Contact form";
    const modeLabel = isAssistantReport ? m.preserveOriginal ? "Original kept" : m.reportDescriptionMode === "structured_fallback" ? "Structured draft" : "AI drafted" : "";
    const urgencyTone = String(m.reportUrgency || "").toLowerCase() === "high" ? "border-red-200 bg-red-50 text-red-700" : String(m.reportUrgency || "").toLowerCase() === "medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-stone-200 bg-stone-50 text-stone-600";
    const metaParts = [
      m.reportCategory ? `Category: ${m.reportCategory}` : "",
      m.reportUrgency ? `Urgency: ${m.reportUrgency}` : "",
      modeLabel,
      m.phoneMasked || m.phone ? `Phone: ${m.phoneMasked || m.phone}` : "",
      m.preferredContact ? `Preferred: ${m.preferredContact}` : "",
      m.verificationStatus ? `Status: ${m.verificationStatus}` : "",
      m.emailVerified === true ? "Email verified" : "",
      m.phoneVerified === true ? "Phone verified" : "",
      m.userId ? `User: ${m.userId}` : ""
    ].filter(Boolean);
    const sourcePill = `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${isAssistantReport ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-stone-100 text-stone-600 border border-stone-200"}">${escapeHtml(sourceLabel)}</span>`;
    const metadataLine = metaParts.length ? `<p class="mt-2 flex flex-wrap gap-1.5 text-xs text-stone-500">${sourcePill}${metaParts.map((part) => `<span class="rounded-full border ${part.toLowerCase().startsWith("urgency") ? urgencyTone : "border-stone-200 bg-stone-50 text-stone-600"} px-2 py-0.5">${escapeHtml(part)}</span>`).join("")}</p>` : `<p class="mt-2">${sourcePill}</p>`;
    const pageLine = m.pageUrl ? `<p class="mt-2 text-xs text-stone-500" style="overflow-wrap:anywhere;">Page: ${escapeHtml(m.pageUrl)}</p>` : "";
    const notesLine = m.customerNotes ? `<p class="mt-2 text-xs text-stone-500" style="overflow-wrap:anywhere;">Profile notes: ${escapeHtml(m.customerNotes)}</p>` : "";
    const originalMessage = String(m.originalMessage || "").trim();
    const finalMessage = String(m.message || "").trim();
    const originalLine = isAssistantReport && originalMessage && originalMessage !== finalMessage ? `<details class="admin-message-original mt-3 text-xs text-stone-600">
                    <summary class="cursor-pointer font-bold text-stone-700">Original guest wording</summary>
                    <p class="mt-2 whitespace-pre-wrap" style="overflow-wrap:anywhere;">${escapeHtml(originalMessage)}</p>
                </details>` : "";
    const replyAction = replyHref ? `<a href="${escapeHtml(replyHref)}" aria-label="Reply to ${escapeHtml(m.name || "message sender")}" title="Reply by email"
                    class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors whitespace-nowrap">
                    <i data-lucide="mail" class="h-3.5 w-3.5"></i>
                    <span>Reply</span>
                </a>` : `<button type="button" disabled title="No sender email"
                    class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-stone-200 text-stone-400 bg-stone-50 disabled:cursor-not-allowed whitespace-nowrap">
                    <i data-lucide="mail-x" class="h-3.5 w-3.5"></i>
                    <span>No email</span>
                </button>`;
    const unreadDot = !m.read ? '<span class="h-2 w-2 bg-red-600 rounded-full inline-block mr-2"></span>' : "";
    const descriptionLabel = isAssistantReport ? "Issue description" : "Message";
    const cardClass = isAssistantReport ? "admin-message-card--assistant" : "";
    return `
                <div class="admin-panel ${cardClass} bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div class="min-w-0">
                            <p class="font-semibold text-stone-900 flex items-center">
                                ${unreadDot}${escapeHtml(m.name || "Unknown")}
                            </p>
                            <p class="text-xs text-stone-500 mt-0.5" style="overflow-wrap: anywhere;">${escapeHtml(m.email || "")} &middot; ${date}</p>
                            ${metadataLine}
                        </div>
                        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            ${replyAction}
                            <button data-message-id="${escapeHtml(item.id)}" onclick="markMessageRead(this)"
                                class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors whitespace-nowrap ${m.read ? "opacity-40 cursor-default" : ""}"
                                ${m.read ? "disabled" : ""}>
                                <i data-lucide="check" class="h-3.5 w-3.5"></i>
                                <span>${m.read ? "Read" : "Mark as read"}</span>
                            </button>
                        </div>
                    </div>
                    <p class="text-sm font-medium text-stone-700 mb-1" style="overflow-wrap: anywhere;">Subject: ${escapeHtml(m.subject || "")}</p>
                    <p class="text-sm font-semibold text-stone-800 mb-1">${descriptionLabel}</p>
                    <p class="text-sm text-stone-600 whitespace-pre-wrap" style="overflow-wrap: anywhere;">${escapeHtml(finalMessage)}</p>
                    ${originalLine}
                    ${notesLine}
                    ${pageLine}
                </div>
            `;
  }
  function renderMessages() {
    const container = document.getElementById("messages-container");
    const counts = getMessageCounts(messagesCache);
    updateMessageFilterControls(counts);
    if (!messagesCache.length) {
      container.innerHTML = '<p class="text-stone-500 italic text-sm">No messages yet.</p>';
      return;
    }
    const visibleMessages = getFilteredMessages();
    if (!visibleMessages.length) {
      const label = messageFilter === "assistant" ? "AI reports" : messageFilter;
      container.innerHTML = `<p class="text-stone-500 italic text-sm">No ${escapeHtml(label)} messages right now.</p>`;
      return;
    }
    container.innerHTML = visibleMessages.map(renderMessageCard).join("");
    lucide.createIcons();
  }
  function listenToMessages() {
    let knownMessageIds = null;
    getAdminDb().collection("contact_messages").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
      const badge = document.getElementById("badge-messages");
      messagesCache = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() || {} }));
      const counts = getMessageCounts(messagesCache);
      badge.classList.toggle("hidden", counts.unread === 0);
      setMetricValue("metric-unread-messages", counts.unread);
      setMetricValue("metric-ai-reports", counts.assistant);
      if (knownMessageIds !== null) {
        snapshot.forEach((doc) => {
          const m = doc.data() || {};
          if (!knownMessageIds.has(doc.id) && !m.read) {
            showAdminNotification(
              isAssistantMessage(m) ? "New AI report" : "New message",
              `From: ${m.name || "Unknown"} - ${m.subject || ""}`
            );
          }
        });
      }
      knownMessageIds = new Set(snapshot.docs.map((d) => d.id));
      renderMessages();
    }, (err) => {
      console.error("Messages listener error:", err);
      document.getElementById("messages-container").innerHTML = '<p class="text-red-600 text-sm">Failed to load messages.</p>';
    });
  }
  function buildReplyMailto(email, subject) {
    const recipient = String(email || "").trim();
    if (!recipient) return "";
    const baseSubject = String(subject || "").trim() || "Contact message";
    const replySubject = /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
    const encodedRecipient = encodeURIComponent(recipient).replace(/%40/g, "@");
    return `mailto:${encodedRecipient}?subject=${encodeURIComponent(replySubject)}`;
  }
  async function markMessageRead(btn) {
    if (btn.disabled) return;
    const messageId = btn.dataset.messageId;
    try {
      await getAdminDb().collection("contact_messages").doc(messageId).update({ read: true });
    } catch (err) {
      console.error("Failed to mark message as read:", err);
    }
  }
  setTimeout(() => {
    document.querySelectorAll("[data-message-filter]").forEach((button) => {
      button.addEventListener("click", () => setMessageFilter(button.dataset.messageFilter));
    });
  }, 0);
  window.listenToMessages = listenToMessages;
  window.renderMessages = renderMessages;
  window.markMessageRead = markMessageRead;
})();
