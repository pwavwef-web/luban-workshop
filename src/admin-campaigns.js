let smsCampaignState = {
    initialized: false,
    loading: false,
    scheduleMode: 'now',
    counts: {
        verifiedUsers: 0,
        usersWithPhone: 0,
        totalProfiles: 0
    },
    campaigns: [],
    limits: {
        maxRecipients: 500,
        messageMaxLength: 612
    }
};

function getSmsCampaignElement(id) {
    return document.getElementById(id);
}

function setSmsText(id, value) {
    const el = getSmsCampaignElement(id);
    if (el) el.textContent = value;
}

function getManualSmsNumbers() {
    const input = getSmsCampaignElement('sms-campaign-manual');
    const raw = input ? input.value : '';
    const numbers = raw
        .split(/[,\n;]+/)
        .map(value => formatGhanaPhone(value.trim()))
        .filter(Boolean);
    return [...new Set(numbers)];
}

function getSelectedSmsAudienceCount() {
    const audience = getSmsCampaignElement('sms-campaign-audience').value;
    if (audience === 'manual') return getManualSmsNumbers().length;
    if (audience === 'all_users') return Number(smsCampaignState.counts.usersWithPhone || 0);
    return Number(smsCampaignState.counts.verifiedUsers || 0);
}

function getSelectedSmsAudienceLabel() {
    const audience = getSmsCampaignElement('sms-campaign-audience').value;
    if (audience === 'manual') return 'manual recipients';
    if (audience === 'all_users') return 'users with phones';
    return 'verified users';
}

function updateSmsCampaignMessageCount() {
    const input = getSmsCampaignElement('sms-campaign-message');
    const limit = Number(smsCampaignState.limits.messageMaxLength || 612);
    const length = input ? input.value.length : 0;
    setSmsText('sms-campaign-message-count', `${length} / ${limit}`);
}

function updateSmsCampaignSummary() {
    const manualCount = getManualSmsNumbers().length;
    const count = getSelectedSmsAudienceCount();
    const label = getSelectedSmsAudienceLabel();
    const limit = Number(smsCampaignState.limits.maxRecipients || 500);
    const tooMany = count > limit;
    const submitBtn = getSmsCampaignElement('sms-campaign-submit-btn');
    const submitLabel = submitBtn ? submitBtn.querySelector('span') : null;

    setSmsText('sms-count-verified', String(smsCampaignState.counts.verifiedUsers || 0));
    setSmsText('sms-count-all', String(smsCampaignState.counts.usersWithPhone || 0));
    setSmsText('sms-count-manual', String(manualCount));
    setSmsText('sms-campaign-limit', `Limit: ${limit} recipients`);
    setSmsText('sms-campaign-send-summary', `${count} ${label}`);
    setSmsText('sms-campaign-audience-summary', `${smsCampaignState.counts.usersWithPhone || 0} users have valid phone numbers. ${smsCampaignState.counts.verifiedUsers || 0} are phone verified.`);

    if (submitLabel) submitLabel.textContent = smsCampaignState.scheduleMode === 'scheduled' ? 'Schedule Campaign' : 'Send Campaign';
    if (submitBtn) submitBtn.disabled = smsCampaignState.loading || tooMany;
}

function updateSmsAudienceControls() {
    const audience = getSmsCampaignElement('sms-campaign-audience').value;
    getSmsCampaignElement('sms-campaign-manual-wrap').classList.toggle('hidden', audience !== 'manual');
    updateSmsCampaignSummary();
}

function setSmsScheduleMode(mode) {
    smsCampaignState.scheduleMode = mode === 'scheduled' ? 'scheduled' : 'now';
    document.querySelectorAll('[data-sms-schedule-mode]').forEach(button => {
        const active = button.dataset.smsScheduleMode === smsCampaignState.scheduleMode;
        button.classList.toggle('admin-segmented-active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    getSmsCampaignElement('sms-campaign-schedule-wrap').classList.toggle('hidden', smsCampaignState.scheduleMode !== 'scheduled');
    const pill = getSmsCampaignElement('sms-campaign-mode-pill');
    pill.textContent = smsCampaignState.scheduleMode === 'scheduled' ? 'Scheduled' : 'Now';
    pill.className = smsCampaignState.scheduleMode === 'scheduled'
        ? 'px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100'
        : 'px-2 py-1 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-100';
    updateSmsCampaignSummary();
}

function showSmsCampaignFeedback(message, isError) {
    const feedback = getSmsCampaignElement('sms-campaign-feedback');
    feedback.textContent = message;
    feedback.className = `text-sm p-3 rounded-md ${isError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`;
    feedback.classList.remove('hidden');
}

function clearSmsCampaignFeedback() {
    getSmsCampaignElement('sms-campaign-feedback').classList.add('hidden');
}

function getSmsStatusBadge(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'sent' || normalized === 'scheduled') {
        return '<span class="px-2 py-0.5 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-100">OK</span>';
    }
    if (normalized === 'partial_failed') {
        return '<span class="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100">Partial</span>';
    }
    if (normalized === 'sending' || normalized === 'scheduling') {
        return '<span class="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">Running</span>';
    }
    return '<span class="px-2 py-0.5 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-100">Failed</span>';
}

function formatSmsCampaignDate(value) {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function renderSmsCampaignHistory() {
    const container = getSmsCampaignElement('sms-campaign-history');
    const campaigns = Array.isArray(smsCampaignState.campaigns) ? smsCampaignState.campaigns : [];
    setSmsText('sms-campaign-history-count', `${campaigns.length} recent campaign${campaigns.length === 1 ? '' : 's'}`);

    if (!campaigns.length) {
        container.innerHTML = '<p class="p-6 text-sm text-stone-500 italic">No SMS campaigns yet.</p>';
        return;
    }

    container.innerHTML = campaigns.map(campaign => {
        const scheduledLine = campaign.scheduled
            ? `<p class="text-xs text-blue-700 mt-1">Scheduled: ${escapeHtml(campaign.scheduleLocal || campaign.providerSchedule || campaign.scheduleAt || '')}</p>`
            : '';
        const contactLine = campaign.contactSyncCount || campaign.contactSyncFailedCount
            ? `<p class="text-xs text-stone-500 mt-1">Contacts: ${Number(campaign.contactSyncCount || 0)} synced, ${Number(campaign.contactSyncFailedCount || 0)} failed</p>`
            : '';
        return `
            <article class="p-4 hover:bg-stone-50 transition-colors">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <h4 class="text-sm font-bold text-stone-900">${escapeHtml(campaign.title || 'SMS campaign')}</h4>
                            ${getSmsStatusBadge(campaign.status)}
                        </div>
                        <p class="text-xs text-stone-500 mt-1">${escapeHtml(formatSmsCampaignDate(campaign.createdAt))} by ${escapeHtml(campaign.createdBy || 'admin')}</p>
                        <p class="text-sm text-stone-600 mt-2" style="overflow-wrap:anywhere;">${escapeHtml(campaign.messagePreview || '')}</p>
                        ${scheduledLine}
                        ${contactLine}
                    </div>
                    <div class="text-sm text-stone-600 sm:text-right shrink-0">
                        <p><span class="font-bold text-stone-900">${Number(campaign.successCount || 0)}</span> sent</p>
                        <p><span class="font-bold text-stone-900">${Number(campaign.failedCount || 0)}</span> failed</p>
                        <p class="text-xs text-stone-500">${Number(campaign.recipientCount || 0)} recipients</p>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function renderSmsCampaignMeta(data) {
    smsCampaignState.counts = Object.assign({}, smsCampaignState.counts, data.counts || {});
    smsCampaignState.campaigns = Array.isArray(data.campaigns) ? data.campaigns : [];
    smsCampaignState.limits = Object.assign({}, smsCampaignState.limits, data.limits || {});

    const messageInput = getSmsCampaignElement('sms-campaign-message');
    if (messageInput) messageInput.setAttribute('maxlength', String(smsCampaignState.limits.messageMaxLength || 612));

    updateSmsCampaignMessageCount();
    updateSmsCampaignSummary();
    renderSmsCampaignHistory();
}

async function refreshSmsCampaigns() {
    if (smsCampaignState.loading) return;
    smsCampaignState.loading = true;
    updateSmsCampaignSummary();
    try {
        const data = await fetchAdminApi('/api/admin/sms/audience');
        renderSmsCampaignMeta(data);
    } catch (error) {
        console.error('Failed to load SMS campaigns:', error);
        setSmsText('sms-campaign-audience-summary', error.message || 'Could not load SMS audience.');
        getSmsCampaignElement('sms-campaign-history').innerHTML =
            `<p class="p-6 text-sm text-red-600">${escapeHtml(error.message || 'Could not load SMS campaigns.')}</p>`;
    } finally {
        smsCampaignState.loading = false;
        updateSmsCampaignSummary();
        lucide.createIcons();
    }
}

function resetSmsCampaignForm() {
    getSmsCampaignElement('sms-campaign-form').reset();
    getSmsCampaignElement('sms-campaign-phonebook-wrap').classList.add('hidden');
    setSmsScheduleMode('now');
    updateSmsAudienceControls();
    updateSmsCampaignMessageCount();
    clearSmsCampaignFeedback();
}

function buildSmsCampaignPayload() {
    const scheduleInput = getSmsCampaignElement('sms-campaign-schedule-at');
    const scheduleAt = scheduleInput ? scheduleInput.value : '';
    const syncContacts = getSmsCampaignElement('sms-campaign-sync-contacts').checked;
    return {
        title: getSmsCampaignElement('sms-campaign-title').value.trim(),
        audience: getSmsCampaignElement('sms-campaign-audience').value,
        message: getSmsCampaignElement('sms-campaign-message').value.trim(),
        manualRecipients: getSmsCampaignElement('sms-campaign-audience').value === 'manual'
            ? getSmsCampaignElement('sms-campaign-manual').value
            : '',
        scheduleMode: smsCampaignState.scheduleMode,
        scheduleAt: smsCampaignState.scheduleMode === 'scheduled' ? scheduleAt : '',
        scheduleTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        scheduleTimezoneOffsetMinutes: new Date().getTimezoneOffset(),
        syncContacts,
        phoneBookName: syncContacts ? getSmsCampaignElement('sms-campaign-phonebook').value.trim() : ''
    };
}

async function submitSmsCampaign(event) {
    event.preventDefault();
    clearSmsCampaignFeedback();

    const payload = buildSmsCampaignPayload();
    const count = getSelectedSmsAudienceCount();
    const limit = Number(smsCampaignState.limits.maxRecipients || 500);
    if (!payload.title || !payload.message) {
        showSmsCampaignFeedback('Add a campaign name and message.', true);
        return;
    }
    if (count < 1) {
        showSmsCampaignFeedback('Choose at least one valid recipient.', true);
        return;
    }
    if (count > limit) {
        showSmsCampaignFeedback(`This campaign has ${count} recipients. The limit is ${limit}.`, true);
        return;
    }
    if (payload.scheduleMode === 'scheduled' && !payload.scheduleAt) {
        showSmsCampaignFeedback('Choose a schedule time.', true);
        return;
    }
    if (payload.syncContacts && !payload.phoneBookName) {
        showSmsCampaignFeedback('Add a phone book name.', true);
        return;
    }

    const verb = payload.scheduleMode === 'scheduled' ? 'Schedule' : 'Send';
    const timing = payload.scheduleMode === 'scheduled' ? ` for ${payload.scheduleAt}` : '';
    if (!confirm(`${verb} this SMS campaign to about ${count} ${getSelectedSmsAudienceLabel()}${timing}?`)) return;

    const submitBtn = getSmsCampaignElement('sms-campaign-submit-btn');
    const submitLabel = submitBtn.querySelector('span');
    submitBtn.disabled = true;
    submitLabel.textContent = payload.scheduleMode === 'scheduled' ? 'Scheduling...' : 'Sending...';

    try {
        const result = await fetchAdminApi('/api/admin/sms/send', {
            method: 'POST',
            body: payload
        });
        const isError = Number(result.failedCount || 0) > 0;
        showSmsCampaignFeedback(
            `${result.status || 'submitted'}: ${Number(result.successCount || 0)} of ${Number(result.recipientCount || 0)} accepted${Number(result.failedCount || 0) ? `, ${Number(result.failedCount || 0)} failed` : ''}.`,
            isError
        );
        await refreshSmsCampaigns();
    } catch (error) {
        console.error('Failed to submit SMS campaign:', error);
        showSmsCampaignFeedback(error.message || 'Could not submit SMS campaign.', true);
    } finally {
        submitBtn.disabled = false;
        updateSmsCampaignSummary();
    }
}

function bindSmsCampaignEvents() {
    getSmsCampaignElement('sms-campaign-form').addEventListener('submit', submitSmsCampaign);
    getSmsCampaignElement('sms-campaign-reset-btn').addEventListener('click', resetSmsCampaignForm);
    getSmsCampaignElement('sms-campaign-refresh-btn').addEventListener('click', refreshSmsCampaigns);
    getSmsCampaignElement('sms-campaign-audience').addEventListener('change', updateSmsAudienceControls);
    getSmsCampaignElement('sms-campaign-message').addEventListener('input', updateSmsCampaignMessageCount);
    getSmsCampaignElement('sms-campaign-manual').addEventListener('input', updateSmsCampaignSummary);
    getSmsCampaignElement('sms-campaign-sync-contacts').addEventListener('change', event => {
        getSmsCampaignElement('sms-campaign-phonebook-wrap').classList.toggle('hidden', !event.target.checked);
    });
    document.querySelectorAll('[data-sms-schedule-mode]').forEach(button => {
        button.addEventListener('click', () => setSmsScheduleMode(button.dataset.smsScheduleMode));
    });
}

function initSmsCampaigns() {
    if (smsCampaignState.initialized) return;
    smsCampaignState.initialized = true;
    bindSmsCampaignEvents();
    setSmsScheduleMode('now');
    updateSmsAudienceControls();
    refreshSmsCampaigns();
}

window.initSmsCampaigns = initSmsCampaigns;
window.refreshSmsCampaigns = refreshSmsCampaigns;
