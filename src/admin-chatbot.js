let chatbotKnowledgeCache = [];
let editingChatbotKnowledgeId = null;

function getAdminDb() {
    if (!window.db) throw new Error('Admin database is not initialized yet.');
    return window.db;
}

function getAdminAuth() {
    if (!window.auth) throw new Error('Admin auth is not initialized yet.');
    return window.auth;
}

function listenToChatbotKnowledge() {
    getAdminDb().collection('chatbotKnowledge').onSnapshot(snapshot => {
        chatbotKnowledgeCache = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data() || {}
        }));
        renderChatbotKnowledgeTable();
    }, err => {
        console.error('Chatbot knowledge listener error:', err);
        document.getElementById('chatbot-knowledge-table').innerHTML =
            '<tr><td colspan="4" class="px-6 py-8 text-center text-red-600 italic">Failed to load chatbot facts.</td></tr>';
        document.getElementById('chatbot-knowledge-count').textContent = 'Could not load facts.';
    });
}

function getChatbotKnowledgeStatus(data) {
    const status = String(data.status || '').toLowerCase();
    if (status === 'archived' || data.active === false || data.archived === true) return 'archived';
    return 'active';
}

function getChatbotKnowledgeTitle(id, data) {
    return data.title || data.name || data.question || id;
}

function getChatbotKnowledgeAnswer(data) {
    return data.answer || data.content || data.body || data.description || data.text || '';
}

function getKnowledgeTimestamp(data) {
    const date = getFirestoreDate(data.updatedAt || data.createdAt || data.archivedAt);
    return date ? date.getTime() : 0;
}

function formatKnowledgeDate(data) {
    const date = getFirestoreDate(data.updatedAt || data.createdAt || data.archivedAt);
    return date ? date.toLocaleString() : 'N/A';
}

function sortChatbotKnowledgeItems(items) {
    const sortMode = document.getElementById('chatbot-knowledge-sort').value;
    const statusRank = item => getChatbotKnowledgeStatus(item.data) === 'active' ? 0 : 1;
    const titleCompare = (a, b) => String(getChatbotKnowledgeTitle(a.id, a.data)).localeCompare(String(getChatbotKnowledgeTitle(b.id, b.data)));
    const newestCompare = (a, b) => getKnowledgeTimestamp(b.data) - getKnowledgeTimestamp(a.data) || titleCompare(a, b);

    return items.sort((a, b) => {
        if (sortMode === 'oldest') return getKnowledgeTimestamp(a.data) - getKnowledgeTimestamp(b.data) || titleCompare(a, b);
        if (sortMode === 'active') return statusRank(a) - statusRank(b) || newestCompare(a, b);
        if (sortMode === 'archived') return statusRank(b) - statusRank(a) || newestCompare(a, b);
        return newestCompare(a, b);
    });
}

function renderChatbotKnowledgeTable() {
    const tableBody = document.getElementById('chatbot-knowledge-table');
    const countEl = document.getElementById('chatbot-knowledge-count');

    if (!chatbotKnowledgeCache.length) {
        tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-stone-500 italic">No chatbot facts yet.</td></tr>';
        countEl.textContent = '0 facts';
        setMetricValue('metric-active-facts', 0);
        return;
    }

    const activeCount = chatbotKnowledgeCache.filter(item => getChatbotKnowledgeStatus(item.data) === 'active').length;
    const archivedCount = chatbotKnowledgeCache.length - activeCount;
    countEl.textContent = `${activeCount} active, ${archivedCount} archived`;
    setMetricValue('metric-active-facts', activeCount);

    const rows = sortChatbotKnowledgeItems([...chatbotKnowledgeCache]).map(item => {
        const data = item.data;
        const status = getChatbotKnowledgeStatus(data);
        const title = getChatbotKnowledgeTitle(item.id, data);
        const answer = getChatbotKnowledgeAnswer(data);
        const statusBadge = status === 'active'
            ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>'
            : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-700">Archived</span>';
        const archiveIcon = status === 'active' ? 'archive' : 'rotate-ccw';
        const archiveTitle = status === 'active' ? 'Archive fact' : 'Restore fact';
        const archivedClass = status === 'archived' ? ' opacity-60' : '';

        return `
                    <tr class="hover:bg-stone-50 transition-colors border-b border-stone-100${archivedClass}">
                        <td class="px-6 py-4 align-top">
                            <p class="text-sm font-semibold text-stone-900">${escapeHtml(title)}</p>
                            <p class="text-xs text-stone-500 mt-1 max-w-md">${escapeHtml(truncateText(answer, 150))}</p>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap align-top">${statusBadge}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500 align-top">${escapeHtml(formatKnowledgeDate(data))}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                            <button type="button" data-knowledge-action="edit" data-knowledge-id="${escapeHtml(item.id)}"
                                aria-label="Edit chatbot fact" class="text-stone-600 hover:text-blue-600 transition-colors mr-3" title="Edit fact">
                                <i data-lucide="pencil" class="h-4 w-4"></i>
                            </button>
                            <button type="button" data-knowledge-action="toggle" data-knowledge-id="${escapeHtml(item.id)}"
                                aria-label="${archiveTitle}" class="text-stone-600 hover:text-red-700 transition-colors" title="${archiveTitle}">
                                <i data-lucide="${archiveIcon}" class="h-4 w-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
    }).join('');

    tableBody.innerHTML = rows;
    tableBody.querySelectorAll('[data-knowledge-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => openChatbotKnowledgeEditor(btn.dataset.knowledgeId));
    });
    tableBody.querySelectorAll('[data-knowledge-action="toggle"]').forEach(btn => {
        btn.addEventListener('click', () => toggleChatbotKnowledgeStatus(btn.dataset.knowledgeId));
    });

    lucide.createIcons();
}

function showChatbotKnowledgeFeedback(message, isError) {
    const feedback = document.getElementById('chatbot-knowledge-feedback');
    feedback.textContent = message;
    feedback.className = `text-sm p-3 rounded-md ${isError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`;
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 5000);
}

function updateChatbotAnswerCount() {
    const answer = document.getElementById('chatbot-knowledge-answer').value;
    document.getElementById('chatbot-knowledge-answer-count').textContent = `${answer.length} / 2500`;
}

function resetChatbotKnowledgeForm() {
    editingChatbotKnowledgeId = null;
    document.getElementById('chatbot-knowledge-form').reset();
    document.getElementById('chatbot-knowledge-status').value = 'active';
    document.getElementById('chatbot-knowledge-form-title').textContent = 'New Fact';
    document.getElementById('chatbot-knowledge-editing-pill').classList.add('hidden');
    document.getElementById('chatbot-knowledge-save-btn').textContent = 'Save Fact';
    document.getElementById('chatbot-knowledge-reset-btn').textContent = 'Clear';
    updateChatbotAnswerCount();
}

function openChatbotKnowledgeEditor(id) {
    const item = chatbotKnowledgeCache.find(entry => entry.id === id);
    if (!item) return;

    editingChatbotKnowledgeId = id;
    document.getElementById('chatbot-knowledge-title').value = getChatbotKnowledgeTitle(id, item.data);
    document.getElementById('chatbot-knowledge-answer').value = getChatbotKnowledgeAnswer(item.data);
    document.getElementById('chatbot-knowledge-status').value = getChatbotKnowledgeStatus(item.data);
    document.getElementById('chatbot-knowledge-form-title').textContent = 'Edit Fact';
    document.getElementById('chatbot-knowledge-editing-pill').classList.remove('hidden');
    document.getElementById('chatbot-knowledge-save-btn').textContent = 'Update Fact';
    document.getElementById('chatbot-knowledge-reset-btn').textContent = 'Cancel';
    updateChatbotAnswerCount();
    document.getElementById('chatbot-knowledge-title').focus();
}

async function saveChatbotKnowledge(event) {
    event.preventDefault();
    const title = document.getElementById('chatbot-knowledge-title').value.trim();
    const answer = document.getElementById('chatbot-knowledge-answer').value.trim();
    const status = document.getElementById('chatbot-knowledge-status').value === 'archived' ? 'archived' : 'active';
    const user = getAdminAuth().currentUser;
    const saveBtn = document.getElementById('chatbot-knowledge-save-btn');

    if (!title || !answer) {
        showChatbotKnowledgeFeedback('Please add both a title and an answer.', true);
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = editingChatbotKnowledgeId ? 'Updating...' : 'Saving...';

    const payload = {
        title,
        answer,
        status,
        active: status === 'active',
        archived: status === 'archived',
        archivedAt: status === 'archived' ? firebase.firestore.FieldValue.serverTimestamp() : null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: user && user.email ? user.email : 'unknown'
    };

    try {
        if (editingChatbotKnowledgeId) {
            await getAdminDb().collection('chatbotKnowledge').doc(editingChatbotKnowledgeId).update(payload);
            showChatbotKnowledgeFeedback('Chatbot fact updated.', false);
        } else {
            await getAdminDb().collection('chatbotKnowledge').add({
                ...payload,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: user && user.email ? user.email : 'unknown'
            });
            showChatbotKnowledgeFeedback('Chatbot fact created.', false);
        }
        resetChatbotKnowledgeForm();
    } catch (error) {
        console.error('Failed to save chatbot fact:', error);
        showChatbotKnowledgeFeedback(`Could not save fact: ${error.message}`, true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = editingChatbotKnowledgeId ? 'Update Fact' : 'Save Fact';
    }
}

async function toggleChatbotKnowledgeStatus(id) {
    const item = chatbotKnowledgeCache.find(entry => entry.id === id);
    if (!item) return;

    const currentStatus = getChatbotKnowledgeStatus(item.data);
    const nextStatus = currentStatus === 'active' ? 'archived' : 'active';
    const action = nextStatus === 'archived' ? 'archive' : 'restore';
    const title = getChatbotKnowledgeTitle(id, item.data);

    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${title}"?`)) return;

    const user = getAdminAuth().currentUser;
    try {
        await getAdminDb().collection('chatbotKnowledge').doc(id).update({
            status: nextStatus,
            active: nextStatus === 'active',
            archived: nextStatus === 'archived',
            archivedAt: nextStatus === 'archived' ? firebase.firestore.FieldValue.serverTimestamp() : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user && user.email ? user.email : 'unknown'
        });

        if (editingChatbotKnowledgeId === id) resetChatbotKnowledgeForm();
    } catch (error) {
        console.error('Failed to update chatbot fact status:', error);
        alert(`Could not ${action} fact: ${error.message}`);
    }
}

async function seedSecureChatbotFacts() {
    const button = document.getElementById('seed-chatbot-facts-btn');
    button.disabled = true;
    try {
        const result = await fetchAdminApi('/api/admin/bootstrap-chatbot-knowledge', { method: 'POST' });
        showChatbotKnowledgeFeedback(`Seeded ${result.count || 0} secure chatbot facts.`, false);
    } catch (error) {
        console.error('Failed to seed chatbot facts:', error);
        showChatbotKnowledgeFeedback(error.message || 'Could not seed chatbot facts.', true);
    } finally {
        button.disabled = false;
    }
}

// Chatbot knowledge search filter
function filterChatbotKnowledgeTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll('#chatbot-knowledge-table tr');
    rows.forEach(row => {
        if (!q) { row.style.display = ''; return; }
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

// Bind chatbot knowledge form events (deferred to after DOM ready)
setTimeout(() => {
    document.getElementById('chatbot-knowledge-form').addEventListener('submit', saveChatbotKnowledge);
    document.getElementById('chatbot-knowledge-reset-btn').addEventListener('click', resetChatbotKnowledgeForm);
    document.getElementById('chatbot-knowledge-sort').addEventListener('change', renderChatbotKnowledgeTable);
    document.getElementById('chatbot-knowledge-answer').addEventListener('input', updateChatbotAnswerCount);
    document.getElementById('seed-chatbot-facts-btn').addEventListener('click', seedSecureChatbotFacts);
}, 0);

window.listenToChatbotKnowledge = listenToChatbotKnowledge;
window.renderChatbotKnowledgeTable = renderChatbotKnowledgeTable;
window.filterChatbotKnowledgeTable = filterChatbotKnowledgeTable;
