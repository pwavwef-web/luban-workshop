function getAdminDb() {
    if (!window.db) throw new Error('Admin database is not initialized yet.');
    return window.db;
}

function getAdminAuth() {
    if (!window.auth) throw new Error('Admin auth is not initialized yet.');
    return window.auth;
}

function listenToAdminUsers() {
    getAdminDb().collection('admins').orderBy('addedAt', 'desc').onSnapshot(snapshot => {
        const tableBody = document.getElementById('admin-users-table');
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-stone-500 italic">No additional admins configured.</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const addedAt = data.addedAt ? new Date(data.addedAt.toDate()).toLocaleDateString() : '\u2014';
            const addedBy = data.addedBy || '\u2014';
            const row = `
                        <tr class="hover:bg-stone-50 transition-colors border-b border-stone-100">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">${doc.id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">${addedAt}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">${addedBy}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick="revokeAdmin('${doc.id}')" class="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">Revoke</button>
                            </td>
                        </tr>
                    `;
            tableBody.innerHTML += row;
        });
        lucide.createIcons();
    }, error => {
        console.error('Error loading admins:', error);
    });
}

function revokeAdmin(email) {
    const currentUser = getAdminAuth().currentUser;
    if (currentUser && currentUser.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
        alert('You cannot revoke your own admin access.');
        return;
    }
    if (!confirm(`Remove admin access for ${email}?`)) return;
    getAdminDb().collection('admins').doc(email).delete().catch(error => {
        alert(`Failed to revoke access: ${error.message}`);
    });
}

// Admin user search filter
function filterAdminUsersTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll('#admin-users-table tr');
    rows.forEach(row => {
        if (!q) { row.style.display = ''; return; }
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

// Bind admin user form events (deferred to after DOM ready)
setTimeout(() => {
    document.getElementById('promote-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('promote-email').value.trim().toLowerCase();
        const feedbackDiv = document.getElementById('promote-feedback');
        const currentUser = getAdminAuth().currentUser;

        if (!email) return;

        try {
            await getAdminDb().collection('admins').doc(email).set({
                email: email,
                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                addedBy: currentUser ? currentUser.email : 'unknown'
            });
            feedbackDiv.textContent = `\u2713 ${email} has been granted admin access.`;
            feedbackDiv.className = 'mt-3 text-sm p-3 rounded-md bg-green-50 text-green-800';
            feedbackDiv.classList.remove('hidden');
            document.getElementById('promote-email').value = '';
        } catch (error) {
            feedbackDiv.textContent = `Error: ${error.message}`;
            feedbackDiv.className = 'mt-3 text-sm p-3 rounded-md bg-red-50 text-red-800';
            feedbackDiv.classList.remove('hidden');
        }

        setTimeout(() => feedbackDiv.classList.add('hidden'), 5000);
    });
}, 0);

window.listenToAdminUsers = listenToAdminUsers;
window.revokeAdmin = revokeAdmin;
window.filterAdminUsersTable = filterAdminUsersTable;
