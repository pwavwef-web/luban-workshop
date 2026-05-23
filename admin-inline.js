
        // --- Firebase Config ---
        const firebaseConfig = {
            apiKey: "AIzaSyDxgdwU84vFNoCOUTl-HRdGYonLIcDaXFw",
            authDomain: "luban-workshop-restaurant.firebaseapp.com",
            projectId: "luban-workshop-restaurant",
            storageBucket: "luban-workshop-restaurant.firebasestorage.app",
            messagingSenderId: "360623290287",
                        appId: "1:360623290287:web:89fae5ebbb342e5e13e15a"
        };

                firebase.initializeApp(firebaseConfig);
                // Analytics: initialize only after consent (prevents auto-start)
                (function(){
                    function tryInit(){
                        try{ if (window.cookieConsent && window.cookieConsent.get().analytics && typeof firebase.analytics === 'function') firebase.analytics(); }catch(e){}
                    }
                    tryInit();
                    window.addEventListener('cookieConsentChanged', function(e){ if (e.detail && e.detail.analytics) tryInit(); });
                })();
        const auth = firebase.auth();
        const db = firebase.firestore();

        // --- Phone Validation Utility (Ghana: +233 + 9 digits) ---
        function formatGhanaPhone(phone) {
            // Remove all non-digit characters except +
            let cleaned = phone.replace(/[^\d+]/g, '');
            // If it starts with +, remove it temporarily
            let hasPlus = cleaned.startsWith('+');
            if (hasPlus) cleaned = cleaned.substring(1);
            // Remove leading 0 if present (for local Ghana format)
            if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
            // Remove leading 233 if present (convert to +233 format)
            if (cleaned.startsWith('233')) cleaned = cleaned.substring(3);
            // Should have exactly 9 digits now
            if (!/^\d{9}$/.test(cleaned)) return null;
            return '+233' + cleaned;
        }

        // --- Push Notification helpers ---
        let notificationsEnabled = false;

        async function requestNotificationPermission() {
            if (!('Notification' in window)) return;
            try {
                const perm = await Notification.requestPermission();
                notificationsEnabled = perm === 'granted';
            } catch (e) { /* ignored */ }
        }

        function showAdminNotification(title, body) {
            if (Notification.permission !== 'granted') return;
            try {
                const n = new Notification(title, {
                    body: body,
                    icon: 'logo.png',
                    badge: 'logo.png',
                    requireInteraction: true
                });
                n.onclick = () => { window.focus(); n.close(); };
            } catch (e) { /* ignored */ }
        }

        // --- PWA Service Worker Registration ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('admin-sw.js').catch(() => {});
        }

        // --- Auth State ---
        auth.onAuthStateChanged(async user => {
            if (user) {
                // Check if the logged-in user has admin privileges
                let adminVerified = false;
                const normalizedEmail = (user.email || '').trim().toLowerCase();

                // 1. Check Firebase Custom Claims
                try {
                    const tokenResult = await user.getIdTokenResult();
                    if (tokenResult.claims.admin === true) adminVerified = true;
                } catch (e) { /* token fetch failed, fall through */ }

                // 2. Check Firestore admins collection
                if (!adminVerified && normalizedEmail) {
                    try {
                        const adminDoc = await db.collection('admins').doc(normalizedEmail).get();
                        if (adminDoc.exists) adminVerified = true;
                    } catch (e) { /* no permission or network error */ }
                }

                if (!adminVerified) {
                    await auth.signOut();
                    const errDiv = document.getElementById('login-error');
                    errDiv.textContent = 'Access denied. You do not have admin privileges.';
                    errDiv.classList.remove('hidden');
                    return;
                }

                // Ensure admin user has a phone number on their profile; prompt if missing
                try {
                    const profileDoc = await db.collection('users').doc(user.uid).get();
                    const profileData = profileDoc.exists ? profileDoc.data() : null;
                    if (!profileData || !profileData.phone || (typeof profileData.phone === 'string' && profileData.phone.trim() === '')) {
                        let phone = null;
                        let valid = false;
                        while (!valid) {
                            const rawPhone = window.prompt('Please enter your Ghana phone number (+233 and 9 digits, e.g., +233501234567):', '');
                            if (!rawPhone) break; // User cancelled
                            phone = formatGhanaPhone(rawPhone);
                            if (phone) {
                                valid = true;
                                await db.collection('users').doc(user.uid).set({ phone, name: user.displayName || '', email: user.email || '' }, { merge: true });
                            } else {
                                alert('Invalid phone number. Please enter a valid Ghana number.');
                            }
                        }
                    }
                } catch (e) { console.error('Failed to ensure admin phone number:', e); }

                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('admin-dashboard').classList.remove('hidden');
                document.getElementById('user-email').textContent = user.email;

                // Initialize Listeners
                listenToMenu();
                listenToReservations();
                listenToOrders();
                listenToAdminUsers();
                listenToMessages();

                // Request notification permission
                requestNotificationPermission();

                // Set default tab
                switchTab('menu');
                
                // Setup mobile sidebar event listeners
                const menuToggle = document.getElementById('mobile-menu-toggle');
                const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
                const overlay = document.getElementById('sidebar-overlay');
                
                menuToggle.addEventListener('click', toggleMobileSidebar);
                sidebarCloseBtn.addEventListener('click', toggleMobileSidebar);
                overlay.addEventListener('click', toggleMobileSidebar);
                overlay.addEventListener('keydown', handleOverlayKeydown);
                
                lucide.createIcons();

                // Start tour for new admins (skipped if already completed)
                startTour();
            } else {
                document.getElementById('login-screen').classList.remove('hidden');
                document.getElementById('admin-dashboard').classList.add('hidden');
            }
        });

        // --- Navigation Logic ---
        const MOBILE_BREAKPOINT = 768; // Tailwind 'md:' breakpoint
        let isMobileSidebarOpen = false; // Track sidebar state

        function handleOverlayKeydown(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Prevent page scroll on Space
                toggleMobileSidebar();
            }
        }

        function toggleMobileSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            
            if (isMobileSidebarOpen) {
                // Close sidebar
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
                isMobileSidebarOpen = false;
            } else {
                // Open sidebar
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
                isMobileSidebarOpen = true;
            }
        }

        function switchTab(tabName) {
            // Close mobile sidebar when switching tabs (only if it's open)
            if (window.innerWidth < MOBILE_BREAKPOINT && isMobileSidebarOpen) {
                toggleMobileSidebar();
            }
            
            // Hide all views
            ['menu', 'reservations', 'orders', 'admin-users', 'messages'].forEach(tab => {
                document.getElementById('view-' + tab).classList.add('hidden');

                // Reset Tab Styles
                const btn = document.getElementById('tab-btn-' + tab);
                btn.classList.remove('bg-red-50', 'text-red-700');
                btn.classList.add('text-stone-600');
            });

            // Show active view
            document.getElementById('view-' + tabName).classList.remove('hidden');

            // Set Active Tab Style
            const activeBtn = document.getElementById('tab-btn-' + tabName);
            activeBtn.classList.add('bg-red-50', 'text-red-700');
            activeBtn.classList.remove('text-stone-600');
        }

        // --- Hardcoded Menu ---
        const HARDCODED_MENU = [
            { id: 'SP1', name: 'Chicken & Sweet Corn Soup', category: 'soups', price: 40 },
            { id: 'SP2', name: 'Hot & Sour Soup', category: 'soups', price: 40 },
            { id: 'S1', name: 'Beef Spring Rolls (3 pcs)', category: 'starters', price: 30 },
            { id: 'S2', name: 'Vegetable Spring Rolls (3 pcs)', category: 'starters', price: 25 },
            { id: 'S3', name: 'Beef Samosa (5 pcs)', category: 'starters', price: 30 },
            { id: 'S4', name: 'Fish Samosa (5 pcs)', category: 'starters', price: 30 },
            { id: 'S5', name: 'Fried Chicken Pieces (6 pcs)', category: 'starters', price: 65 },
            { id: 'S6', name: 'Special Chicken Wings', category: 'starters', price: 65 },
            { id: 'S7', name: 'Golden Fried Prawns', category: 'starters', price: 90 },
            { id: 'S8', name: 'Fried Squid in Spicy Salt', category: 'starters', price: 85 },
            { id: 'B1', name: 'Shredded Beef with Green Pepper & Onion', category: 'beef-lamb', price: 110 },
            { id: 'B2', name: 'Beef in Sichuan Sauce', category: 'beef-lamb', price: 110 },
            { id: 'B3', name: 'Sliced Beef in Curry Sauce', category: 'beef-lamb', price: 110 },
            { id: 'B4', name: 'Beef in Oyster Sauce', category: 'beef-lamb', price: 110 },
            { id: 'B5', name: 'Crispy Chilli Beef', category: 'beef-lamb', price: 85 },
            { id: 'B6', name: 'Mongolian Shallot Lamb', category: 'beef-lamb', price: 115 },
            { id: 'B7', name: 'Lamb Chops', category: 'beef-lamb', price: 85 },
            { id: 'P1', name: 'Sweet & Sour Pork', category: 'pork', price: 90 },
            { id: 'P2', name: 'Pork Sichuan Style', category: 'pork', price: 90 },
            { id: 'P3', name: 'Pork in Chilli Sauce', category: 'pork', price: 90 },
            { id: 'P4', name: 'Pork in Oyster Sauce', category: 'pork', price: 90 },
            { id: 'P5', name: 'Fried Pork Ribs', category: 'pork', price: 75 },
            { id: 'K1', name: 'Sweet & Sour Chicken', category: 'chicken', price: 100 },
            { id: 'K2', name: 'Chicken Sichuan Sauce', category: 'chicken', price: 100 },
            { id: 'K3', name: 'Chicken in Curry Sauce', category: 'chicken', price: 100 },
            { id: 'K4', name: 'Chicken in Oyster Sauce', category: 'chicken', price: 100 },
            { id: 'Q1', name: 'Squid in Luban Chilli Sauce', category: 'seafood', price: 120 },
            { id: 'Q2', name: 'Squid in Sichuan Sauce', category: 'seafood', price: 120 },
            { id: 'Q3', name: 'Squid in Garlic Sauce', category: 'seafood', price: 120 },
            { id: 'F1', name: 'Fish Fillet in Chilli Sauce', category: 'seafood', price: 115 },
            { id: 'F2', name: 'Fish Fillet in Vegetable Sauce', category: 'seafood', price: 115 },
            { id: 'F3', name: 'Fish Fillet in Sichuan Sauce', category: 'seafood', price: 115 },
            { id: 'F4', name: 'Sweet & Sour Fish Fillet', category: 'seafood', price: 115 },
            { id: 'PR1', name: 'Prawns in Chilli Sauce', category: 'seafood', price: 155 },
            { id: 'PR2', name: 'Prawns in Curry Sauce', category: 'seafood', price: 155 },
            { id: 'PR3', name: 'Prawns in Sichuan Sauce', category: 'seafood', price: 155 },
            { id: 'SF1', name: 'Special Seafood in Sichuan Sauce', category: 'seafood', price: 170 },
            { id: 'R1', name: 'Steamed Rice', category: 'rice', price: 29 },
            { id: 'R2', name: 'Special Jollof Rice', category: 'rice', price: 50 },
            { id: 'R3', name: 'Combo Fried Rice', category: 'rice', price: 50 },
            { id: 'R4', name: 'Shrimp Fried Rice', category: 'rice', price: 50 },
            { id: 'R5', name: 'Egg Fried Rice', category: 'rice', price: 40 },
            { id: 'R6', name: 'Beef Fried Rice', category: 'rice', price: 45 },
            { id: 'R7', name: 'Chicken Fried Rice', category: 'rice', price: 45 },
            { id: 'R8', name: 'Seafood Fried Rice', category: 'rice', price: 85 },
            { id: 'R9', name: 'Pork Fried Rice', category: 'rice', price: 45 },
            { id: 'N1', name: 'Vegetable Noodles', category: 'noodles', price: 45 },
            { id: 'N2', name: 'Special Noodles', category: 'noodles', price: 80 },
            { id: 'N4', name: 'Singapore Noodles', category: 'noodles', price: 80 },
            { id: 'N5', name: 'Seafood Noodles', category: 'noodles', price: 100 },
            { id: 'N6', name: 'Chicken Noodles', category: 'noodles', price: 60 },
            { id: 'D1', name: 'Steamed Pork Dumpling', category: 'dumplings', price: 30 },
            { id: 'D2', name: 'Fried Pork Dumpling', category: 'dumplings', price: 30 },
            { id: 'D3', name: 'Steamed Beef Dumpling', category: 'dumplings', price: 30 },
            { id: 'D4', name: 'Fried Beef Dumpling', category: 'dumplings', price: 30 },
            { id: 'V1', name: 'Mixed Vegetable Sauce', category: 'veg', price: 40 },
        ];

        // --- Real-time Listeners (Red Dot Logic) ---

        let menuHiddenIds = new Set();
        let menuPriceOverrides = {};
        let menuImageOverrides = {};

        function renderMenuTable() {
            const tableBody = document.getElementById('menu-items-table');
            tableBody.innerHTML = '';

            HARDCODED_MENU.forEach(dish => {
                const isHidden = menuHiddenIds.has(dish.id);
                const currentPrice = menuPriceOverrides[dish.id] !== undefined ? menuPriceOverrides[dish.id] : dish.price;
                const hasImageOverride = menuImageOverrides[dish.id] !== undefined;
                const statusBadge = isHidden
                    ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Hidden</span>'
                    : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Visible</span>';
                const toggleIcon = isHidden ? 'eye' : 'eye-off';
                const toggleTitle = isHidden ? 'Show on website' : 'Hide from website';
                const priceLabel = menuPriceOverrides[dish.id] !== undefined
                    ? `<span class="font-mono text-red-700">\u20b5${currentPrice}</span> <span class="text-xs text-stone-600">(edited)</span>`
                    : `<span class="font-mono">\u20b5${currentPrice}</span>`;
                const revertBtn = menuPriceOverrides[dish.id] !== undefined
                    ? `<button onclick="revertPrice('${dish.id}')" aria-label="Revert ${dish.name} price" class="text-stone-600 hover:text-amber-600 transition-colors mr-3" title="Revert to original price (\u20b5${dish.price})"><i data-lucide="rotate-ccw" class="h-4 w-4"></i></button>`
                    : '';
                const imageIndicator = hasImageOverride
                    ? `<span class="ml-1 text-xs text-blue-600" title="Custom image active">(custom)</span>`
                    : '';
                const row = `
                    <tr class="hover:bg-stone-50 transition-colors${isHidden ? ' opacity-60' : ''}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">${dish.name}${imageIndicator}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">${dish.category}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">${priceLabel}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">${statusBadge}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onclick="openImageModal('${dish.id}', ${JSON.stringify(dish.name).replace(/"/g, '&quot;')})" aria-label="Edit image for ${dish.name}" class="text-stone-600 hover:text-purple-600 transition-colors mr-3" title="Edit dish image"><i data-lucide="image" class="h-4 w-4"></i></button>
                            <button onclick="openPriceModal('${dish.id}', ${JSON.stringify(dish.name).replace(/"/g, '&quot;')}, ${currentPrice})" aria-label="Edit price for ${dish.name}" class="text-stone-600 hover:text-blue-600 transition-colors mr-3" title="Edit price"><i data-lucide="pencil" class="h-4 w-4"></i></button>
                            ${revertBtn}<button onclick="toggleDishVisibility('${dish.id}', ${isHidden})" aria-label="${toggleTitle} for ${dish.name}" class="text-stone-600 hover:text-red-700 transition-colors" title="${toggleTitle}"><i data-lucide="${toggleIcon}" class="h-4 w-4"></i></button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
            lucide.createIcons();
        }

        function listenToMenu() {
            db.collection('dishAvailability').onSnapshot(snapshot => {
                menuHiddenIds = new Set();
                snapshot.forEach(doc => {
                    if (doc.data().hidden === true) menuHiddenIds.add(doc.id);
                });
                renderMenuTable();
            });

            db.collection('menuPrices').onSnapshot(snapshot => {
                menuPriceOverrides = {};
                snapshot.forEach(doc => {
                    menuPriceOverrides[doc.id] = doc.data().price;
                });
                renderMenuTable();
            });

            db.collection('menuImages').onSnapshot(snapshot => {
                menuImageOverrides = {};
                snapshot.forEach(doc => {
                    menuImageOverrides[doc.id] = doc.data().imageUrl;
                });
                renderMenuTable();
            });
        }

        // --- Price Edit Modal ---
        let editingDishId = null;

        function openPriceModal(dishId, dishName, currentPrice) {
            editingDishId = dishId;
            document.getElementById('price-edit-dish-name').textContent = dishName;
            document.getElementById('price-edit-input').value = currentPrice;
            document.getElementById('price-edit-modal').classList.remove('hidden');
            setTimeout(() => document.getElementById('price-edit-input').focus(), 50);
        }

        function closePriceModal() {
            editingDishId = null;
            document.getElementById('price-edit-modal').classList.add('hidden');
        }

        async function savePriceEdit() {
            if (!editingDishId) return;
            const newPrice = parseFloat(document.getElementById('price-edit-input').value);
            if (isNaN(newPrice) || newPrice < 0) {
                alert('Please enter a valid price.');
                return;
            }
            try {
                await db.collection('menuPrices').doc(editingDishId).set({ price: newPrice });
                closePriceModal();
            } catch (error) {
                console.error('Error saving price:', error);
                alert('Failed to save price. Please try again.');
            }
        }

        async function revertPrice(dishId) {
            const dish = HARDCODED_MENU.find(d => d.id === dishId);
            if (!dish) {
                console.error('Cannot revert: dish not found for id', dishId);
                return;
            }
            if (!confirm(`Revert price for "${dish.name}" back to the original (\u20b5${dish.price})?`)) return;
            try {
                await db.collection('menuPrices').doc(dishId).delete();
            } catch (error) {
                console.error('Error reverting price:', error);
                alert('Failed to revert price. Please try again.');
            }
        }

        // --- Image Edit Modal ---
        let editingImageDishId = null;

        function openImageModal(dishId, dishName) {
            editingImageDishId = dishId;
            document.getElementById('image-edit-dish-name').textContent = dishName;
            document.getElementById('image-url-input').value = menuImageOverrides[dishId] || '';
            document.getElementById('image-file-input').value = '';
            document.getElementById('image-edit-feedback').textContent = '';
            document.getElementById('image-edit-feedback').className = 'hidden text-sm mt-2';

            // Show current image preview
            const dish = HARDCODED_MENU.find(d => d.id === dishId);
            const currentSrc = menuImageOverrides[dishId] || (dish ? `assets/menu-items-pictures/${dishId}.webp` : '');
            const PLACEHOLDER = 'https://placehold.co/400x300/e5e5e5/a3a3a3?text=No+Image';
            const preview = document.getElementById('image-edit-preview');
            preview.onerror = () => { if (preview.src !== PLACEHOLDER) preview.src = PLACEHOLDER; };
            preview.src = currentSrc;

            // Store dish ID on the revert button for safe access
            const revertBtn = document.getElementById('image-revert-btn');
            revertBtn.dataset.dishId = dishId;
            revertBtn.classList.toggle('hidden', !menuImageOverrides[dishId]);

            document.getElementById('image-edit-modal').classList.remove('hidden');
            setTimeout(() => document.getElementById('image-url-input').focus(), 50);
        }

        function closeImageModal() {
            editingImageDishId = null;
            document.getElementById('image-edit-modal').classList.add('hidden');
        }

        function showImageFeedback(msg, isError) {
            const el = document.getElementById('image-edit-feedback');
            el.textContent = msg;
            el.className = `text-sm mt-2 ${isError ? 'text-red-600' : 'text-green-600'}`;
        }

        async function saveImageEdit() {
            if (!editingImageDishId) return;
            const urlInput = document.getElementById('image-url-input').value.trim();
            const fileInput = document.getElementById('image-file-input');
            const saveBtn = document.getElementById('image-save-btn');

            if (!urlInput && (!fileInput.files || fileInput.files.length === 0)) {
                showImageFeedback('Please provide an image URL or upload a file.', true);
                return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                let imageUrl = urlInput;

                // If a file is uploaded, convert to base64 data URL
                if (fileInput.files && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    if (file.size > 700 * 1024) {
                        showImageFeedback('File is too large. Please use an image under 700 KB.', true);
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Save Image';
                        return;
                    }
                    imageUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = e => resolve(e.target.result);
                        reader.onerror = () => reject(new Error('Failed to read file'));
                        reader.readAsDataURL(file);
                    });
                }

                await db.collection('menuImages').doc(editingImageDishId).set({ imageUrl });
                closeImageModal();
            } catch (error) {
                console.error('Error saving image:', error);
                showImageFeedback('Failed to save image. Please try again.', true);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Image';
            }
        }

        async function revertImage(dishId) {
            if (!confirm('Remove the custom image and revert to the original?')) return;
            try {
                await db.collection('menuImages').doc(dishId).delete();
                closeImageModal();
            } catch (error) {
                console.error('Error reverting image:', error);
                alert('Failed to revert image. Please try again.');
            }
        }

        // Live URL preview in image modal
        function onImageUrlInput() {
            const val = document.getElementById('image-url-input').value.trim();
            const preview = document.getElementById('image-edit-preview');
            const PLACEHOLDER = 'https://placehold.co/400x300/e5e5e5/a3a3a3?text=Invalid+URL';
            if (val) {
                preview.onerror = () => { if (preview.src !== PLACEHOLDER) preview.src = PLACEHOLDER; };
                preview.src = val;
            }
        }

        // Live file preview in image modal
        function onImageFileChange() {
            const fileInput = document.getElementById('image-file-input');
            if (fileInput.files && fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = e => {
                    const preview = document.getElementById('image-edit-preview');
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(fileInput.files[0]);
                // Clear URL input when file is chosen
                document.getElementById('image-url-input').value = '';
            }
        }

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') { closePriceModal(); closeImageModal(); }
        });

        async function toggleDishVisibility(id, currentlyHidden) {
            try {
                await db.collection('dishAvailability').doc(id).set({ hidden: !currentlyHidden });
            } catch (error) {
                console.error('Error toggling dish visibility:', error);
                alert('Failed to update dish visibility. Please try again.');
            }
        }

        function listenToReservations() {
            let knownReservationIds = null;

            db.collection('reservations').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
                const tableBody = document.getElementById('reservations-table');
                tableBody.innerHTML = '';

                let pendingCount = 0;

                // Detect new pending reservations for notifications
                if (knownReservationIds !== null) {
                    snapshot.forEach(doc => {
                        const res = doc.data();
                        if (!knownReservationIds.has(doc.id) && (res.status === 'pending' || !res.status)) {
                            showAdminNotification(
                                'New Reservation \uD83D\uDCC5',
                                `${res.name || 'Guest'} \u2013 ${res.date || ''} at ${res.time || ''} for ${res.guests || '?'} people`
                            );
                        }
                    });
                }
                knownReservationIds = new Set(snapshot.docs.map(d => d.id));

                if (snapshot.empty) {
                    tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-stone-500 italic">No reservations yet.</td></tr>';
                }

                snapshot.forEach(doc => {
                    const res = doc.data();
                    const id = doc.id; // We need the ID to update it

                    if (res.status === 'pending') pendingCount++;

                    const statusColor = res.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                    const displayStatus = res.status ? res.status.charAt(0).toUpperCase() + res.status.slice(1) : 'Pending';

                    // Logic: If pending, show "Check" button. If completed, show "Undo" button.
                    let actionBtn = '';
                    if (res.status !== 'completed') {
                        actionBtn = `
                    <button onclick="updateReservationStatus('${id}', 'completed')" aria-label="Mark reservation as completed" class="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-2 rounded-full transition-colors" title="Mark Completed">
                        <i data-lucide="check" class="h-4 w-4"></i>
                    </button>`;
                    } else {
                        actionBtn = `
                    <button onclick="updateReservationStatus('${id}', 'pending')" aria-label="Mark reservation as pending" class="text-stone-600 hover:text-stone-700 p-2 rounded-full transition-colors" title="Mark Pending">
                        <i data-lucide="rotate-ccw" class="h-4 w-4"></i>
                    </button>`;
                    }

                    const row = `
                <tr class="hover:bg-stone-50 transition-colors border-b border-stone-100">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">${res.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        <div>${res.phone}</div>
                        <div class="text-xs text-stone-600">${res.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                        <div class="font-medium">${res.date}</div>
                        <div class="text-xs">${res.time}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">${res.guests} Ppl</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${displayStatus}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${actionBtn}
                    </td>
                </tr>
            `;
                    tableBody.innerHTML += row;
                });

                // Toggle Red Dot
                const badge = document.getElementById('badge-reservations');
                if (pendingCount > 0) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }

                // Re-initialize icons for the new buttons
                lucide.createIcons();
            });
        }

        async function updateReservationStatus(id, status) {
            try {
                await db.collection('reservations').doc(id).update({
                    status: status
                });
                // No need to reload page; onSnapshot will automatically update the UI!
                console.log(`Reservation ${id} updated to ${status}`);
            } catch (error) {
                console.error("Error updating status:", error);
                alert("Failed to update status. Check your internet connection.");
            }
        }

        // Pagination state for orders
        const ORDERS_PAGE_SIZE = 10;
        let ordersPageIndex = 0;
        let ordersCache = [];
        let knownOrderIds = null;

        function listenToOrders() {
            ordersPageIndex = 0;
            ordersCache = [];
            knownOrderIds = null;

            db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
                // Detect newly created pending orders for notifications
                if (knownOrderIds !== null) {
                    snapshot.forEach(doc => {
                        const order = doc.data();
                        if (!knownOrderIds.has(doc.id) && (order.status === 'pending' || !order.status)) {
                            showAdminNotification(
                                'New Order Received! \uD83D\uDED2',
                                `Order #${doc.id.slice(-6).toUpperCase()} \u2013 \u20b5${(order.total || 0).toFixed(2)}`
                            );
                        }
                    });
                }

                knownOrderIds = new Set(snapshot.docs.map(d => d.id));
                ordersCache = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

                // If current page no longer exists after updates, move back one page.
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
                if (status === 'cancelled' && !confirm("Are you sure you want to cancel this order?")) return;
                
                await db.collection('orders').doc(id).update({
                    status: status
                });
                console.log(`Order ${id} updated to ${status}`);
            } catch (error) {
                console.error("Error updating order:", error);
                alert("Could not update order.");
            }
        }

        // Render pagination controls (global so loadOrdersPage can call it)
        function renderPaginationControls(hasNext) {
            const controlsRowId = 'orders-pagination-row';
            // remove existing controls
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

        // Load a specific page of orders (paginated from client cache)
        function loadOrdersPage(pageIndex) {
            const tableBody = document.getElementById('orders-table');
            tableBody.innerHTML = '';

            if (!ordersCache.length) {
                tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-stone-500 italic">No orders received yet.</td></tr>';
                renderPaginationControls(false);
                const badge = document.getElementById('badge-orders');
                badge.classList.add('hidden');
                return;
            }

            const start = pageIndex * ORDERS_PAGE_SIZE;
            const pageOrders = ordersCache.slice(start, start + ORDERS_PAGE_SIZE);
            const hasNext = start + ORDERS_PAGE_SIZE < ordersCache.length;

            let pendingCount = 0;
            ordersCache.forEach(entry => {
                const s = entry.data.status;
                if (s === 'pending' || s === 'preparing' || !s) pendingCount++;
            });

            pageOrders.forEach(entry => {
                const order = entry.data;
                const id = entry.id;

                    if (order.status === 'pending' || order.status === 'preparing' || !order.status) pendingCount++;

                    let statusClass = 'bg-stone-100 text-stone-800';
                    if (order.status === 'completed') statusClass = 'bg-green-100 text-green-800';
                    if (order.status === 'pending') statusClass = 'bg-yellow-100 text-yellow-800';
                    if (order.status === 'preparing') statusClass = 'bg-blue-100 text-blue-800';
                    if (order.status === 'cancelled') statusClass = 'bg-red-100 text-red-800';

                    const itemsSummary = order.items ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'No items';
                    const itemsDetail = order.items
                        ? order.items.map(i => `<div class="py-0.5"><span class="font-bold text-stone-600">${i.quantity}&times;</span> ${i.name}</div>`).join('')
                        : '<div class="text-stone-600 italic">No items</div>';

                    let actions = '';
                    if (order.status === 'pending' || !order.status) {
                        actions = `
                            <button onclick="updateOrderStatus('${id}', 'preparing')" aria-label="Mark order as preparing" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-full mr-2 transition-colors" title="Mark as Preparing">
                                <i data-lucide="chef-hat" class="h-4 w-4"></i>
                            </button>
                            <button onclick="updateOrderStatus('${id}', 'cancelled')" aria-label="Cancel order" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors" title="Cancel Order">
                                <i data-lucide="x" class="h-4 w-4"></i>
                            </button>
                        `;
                    } else if (order.status === 'preparing') {
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
                    const placedDateStr = placedDate ? placedDate.toLocaleDateString() : '\u2014';
                    const placedTimeStr = placedDate ? placedDate.toLocaleTimeString() : '\u2014';

                    const row = `
                        <tr class="hover:bg-stone-50 transition-colors border-b border-stone-100">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-stone-500">#${id.slice(-6).toUpperCase()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                                <div class="font-medium">${order.customerName ? escapeHtml(order.customerName) : '<span class="text-stone-600 italic">\u2014</span>'}</div>
                                <div class="text-stone-500">${escapeHtml(order.customerPhone)}</div>
                            </td>
                            <td class="px-6 py-4 text-sm text-stone-900 max-w-xs">
                                <div class="truncate">${itemsSummary}</div>
                                <button onclick="toggleOrderDetails('${id}')" class="text-xs text-red-600 hover:text-red-800 hover:underline mt-0.5 block">view all items</button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                                <div class="font-medium">${placedDateStr}</div>
                                <div class="text-xs">${placedTimeStr}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-stone-900">\u20b5${(order.total || 0).toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${order.status ? order.status.toUpperCase() : 'PENDING'}</span>
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
            // Update badge
            const badge = document.getElementById('badge-orders');
            if (pendingCount > 0) badge.classList.remove('hidden'); else badge.classList.add('hidden');
            lucide.createIcons();
        }

        function toggleOrderDetails(id) {
            const row = document.getElementById(`order-details-${id}`);
            if (row) row.classList.toggle('hidden');
        }

        // --- Admin Users Management ---

        function listenToAdminUsers() {
            db.collection('admins').orderBy('addedAt', 'desc').onSnapshot(snapshot => {
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

        document.getElementById('promote-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('promote-email').value.trim().toLowerCase();
            const feedbackDiv = document.getElementById('promote-feedback');
            const currentUser = auth.currentUser;

            if (!email) return;

            try {
                await db.collection('admins').doc(email).set({
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

        async function revokeAdmin(email) {
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
                alert('You cannot revoke your own admin access.');
                return;
            }
            if (!confirm(`Remove admin access for ${email}?`)) return;
            try {
                await db.collection('admins').doc(email).delete();
            } catch (error) {
                alert(`Failed to revoke access: ${error.message}`);
            }
        }

        // --- Auth Functions ---
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                document.getElementById('login-error').classList.add('hidden');
            } catch (error) {
                const errDiv = document.getElementById('login-error');
                errDiv.textContent = error.message;
                errDiv.classList.remove('hidden');
            }
        });

        // --- SMS Balance Checker ---
        async function checkSmsBalance() {
            const btn = document.getElementById('check-balance-btn');
            const loading = document.getElementById('balance-loading');
            const result = document.getElementById('balance-result');
            const error = document.getElementById('balance-error');
            const initial = document.getElementById('balance-initial');
            const errorMsg = document.getElementById('balance-error-message');

            // Hide all states
            loading.classList.add('hidden');
            result.classList.add('hidden');
            error.classList.add('hidden');
            initial.classList.add('hidden');
            
            // Show loading
            loading.classList.remove('hidden');
            btn.disabled = true;

            try {
                const user = auth.currentUser;
                if (!user) {
                    throw new Error('Not authenticated');
                }

                // Get ID token with Bearer format
                const idToken = await user.getIdToken();
                
                // Call checkSmsBalance endpoint
                const response = await fetch('https://checksmsbalance-s5psnepkqq-uc.a.run.app', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || `HTTP ${response.status}`);
                }

                const data = await response.json();
                
                // Populate balance result
                displaySmsBalance(data.balance);
                
                // Show result
                loading.classList.add('hidden');
                result.classList.remove('hidden');
                
            } catch (err) {
                console.error('Failed to check SMS balance:', err);
                loading.classList.add('hidden');
                error.classList.remove('hidden');
                errorMsg.textContent = err.message || 'An error occurred while checking balance. Please try again.';
            } finally {
                btn.disabled = false;
            }
        }

        function displaySmsBalance(balanceData) {
            const timestamp = new Date().toLocaleString();
            
            // Display status and credits
            const statusEl = document.getElementById('balance-status');
            const creditsEl = document.getElementById('balance-credits');
            const detailsEl = document.getElementById('balance-details');
            const timestampEl = document.getElementById('balance-timestamp');
            
            // Handle different response formats from Arkesel API
            if (typeof balanceData === 'object') {
                // If balance is a number
                if (typeof balanceData.balance === 'number') {
                    statusEl.textContent = 'Active';
                    creditsEl.textContent = balanceData.balance.toFixed(2) + ' credits';
                } else if (balanceData.balance && typeof balanceData.balance.balance === 'number') {
                    statusEl.textContent = 'Active';
                    creditsEl.textContent = balanceData.balance.balance.toFixed(2) + ' credits';
                } else {
                    statusEl.textContent = 'Active';
                    creditsEl.textContent = JSON.stringify(balanceData.balance);
                }
                
                // Display full response as details
                const details = Object.entries(balanceData)
                    .filter(([key]) => key !== 'balance')
                    .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                    .join('<br>');
                
                if (details) {
                    detailsEl.innerHTML = details;
                } else {
                    detailsEl.innerHTML = '<p class="text-stone-500 italic">No additional details available</p>';
                }
            } else {
                statusEl.textContent = 'Active';
                creditsEl.textContent = balanceData;
                detailsEl.innerHTML = '<p class="text-stone-500 italic">Balance successfully retrieved</p>';
            }
            
            timestampEl.textContent = `Last checked: ${timestamp}`;
        }

        function logout() { auth.signOut(); }

        // --- Google Sign-In ---
        document.getElementById('google-signin-btn').addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                await auth.signInWithPopup(provider);
                document.getElementById('google-signin-error').classList.add('hidden');
            } catch (error) {
                const errDiv = document.getElementById('google-signin-error');
                errDiv.textContent = error.message;
                errDiv.classList.remove('hidden');
            }
        });

        // --- Messages (Contact Us) ---
        function listenToMessages() {
            let knownMessageIds = null;

            db.collection('contact_messages')
                .orderBy('createdAt', 'desc')
                .onSnapshot(snapshot => {
                    const container = document.getElementById('messages-container');
                    const badge = document.getElementById('badge-messages');
                    const unread = snapshot.docs.filter(d => !d.data().read).length;

                    badge.classList.toggle('hidden', unread === 0);

                    // Detect new unread messages for notifications
                    if (knownMessageIds !== null) {
                        snapshot.forEach(doc => {
                            const m = doc.data();
                            if (!knownMessageIds.has(doc.id) && !m.read) {
                                showAdminNotification(
                                    'New Message \uD83D\uDCAC',
                                    `From: ${m.name || 'Unknown'} \u2013 ${m.subject || ''}`
                                );
                            }
                        });
                    }
                    knownMessageIds = new Set(snapshot.docs.map(d => d.id));

                    if (snapshot.empty) {
                        container.innerHTML = '<p class="text-stone-500 italic text-sm">No messages yet.</p>';
                        return;
                    }

                    container.innerHTML = snapshot.docs.map(doc => {
                        const m = doc.data();
                        const date = m.createdAt ? new Date(m.createdAt.toDate()).toLocaleString() : 'N/A';
                        const replyHref = buildReplyMailto(m.email, m.subject);
                        const isAssistantReport = String(m.source || '').toLowerCase() === 'assistant';
                        const sourceLabel = isAssistantReport ? 'Assistant report' : 'Contact form';
                        const metaParts = [
                            m.phoneMasked || m.phone ? `Phone: ${m.phoneMasked || m.phone}` : '',
                            m.preferredContact ? `Preferred: ${m.preferredContact}` : '',
                            m.verificationStatus ? `Status: ${m.verificationStatus}` : '',
                            m.userId ? `User: ${m.userId}` : ''
                        ].filter(Boolean);
                        const sourcePill = `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${isAssistantReport ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-stone-100 text-stone-600 border border-stone-200'}">${escapeHtml(sourceLabel)}</span>`;
                        const metadataLine = metaParts.length
                            ? `<p class="mt-2 flex flex-wrap gap-1.5 text-xs text-stone-500">${sourcePill}${metaParts.map(part => `<span class="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5">${escapeHtml(part)}</span>`).join('')}</p>`
                            : `<p class="mt-2">${sourcePill}</p>`;
                        const pageLine = m.pageUrl
                            ? `<p class="mt-2 text-xs text-stone-500" style="overflow-wrap:anywhere;">Page: ${escapeHtml(m.pageUrl)}</p>`
                            : '';
                        const notesLine = m.customerNotes
                            ? `<p class="mt-2 text-xs text-stone-500" style="overflow-wrap:anywhere;">Profile notes: ${escapeHtml(m.customerNotes)}</p>`
                            : '';
                        const replyAction = replyHref
                            ? `<a href="${escapeHtml(replyHref)}" aria-label="Reply to ${escapeHtml(m.name || 'message sender')}" title="Reply by email"
                                class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors whitespace-nowrap">
                                <i data-lucide="mail" class="h-3.5 w-3.5"></i>
                                <span>Reply</span>
                            </a>`
                            : `<button type="button" disabled title="No sender email"
                                class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-stone-200 text-stone-400 bg-stone-50 disabled:cursor-not-allowed whitespace-nowrap">
                                <i data-lucide="mail-x" class="h-3.5 w-3.5"></i>
                                <span>No email</span>
                            </button>`;
                        const unreadDot = !m.read
                            ? '<span class="h-2 w-2 bg-red-600 rounded-full inline-block mr-2"></span>'
                            : '';
                        return `
                            <div class="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                    <div class="min-w-0">
                                        <p class="font-semibold text-stone-900 flex items-center">
                                            ${unreadDot}${escapeHtml(m.name || 'Unknown')}
                                        </p>
                                        <p class="text-xs text-stone-500 mt-0.5" style="overflow-wrap: anywhere;">${escapeHtml(m.email || '')} &middot; ${date}</p>
                                        ${metadataLine}
                                    </div>
                                    <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                        ${replyAction}
                                        <button data-message-id="${escapeHtml(doc.id)}" onclick="markMessageRead(this)"
                                            class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors whitespace-nowrap ${m.read ? 'opacity-40 cursor-default' : ''}"
                                            ${m.read ? 'disabled' : ''}>
                                            <i data-lucide="check" class="h-3.5 w-3.5"></i>
                                            <span>${m.read ? 'Read' : 'Mark as read'}</span>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-sm font-medium text-stone-700 mb-1" style="overflow-wrap: anywhere;">Subject: ${escapeHtml(m.subject || '')}</p>
                                <p class="text-sm text-stone-600 whitespace-pre-wrap" style="overflow-wrap: anywhere;">${escapeHtml(m.message || '')}</p>
                                ${notesLine}
                                ${pageLine}
                            </div>
                        `;
                    }).join('');
                    lucide.createIcons();
                }, err => {
                    console.error('Messages listener error:', err);
                    document.getElementById('messages-container').innerHTML =
                        '<p class="text-red-600 text-sm">Failed to load messages.</p>';
                });
        }

        function buildReplyMailto(email, subject) {
            const recipient = String(email || '').trim();
            if (!recipient) return '';

            const baseSubject = String(subject || '').trim() || 'Contact message';
            const replySubject = /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
            const encodedRecipient = encodeURIComponent(recipient).replace(/%40/g, '@');
            return `mailto:${encodedRecipient}?subject=${encodeURIComponent(replySubject)}`;
        }

        async function markMessageRead(btn) {
            if (btn.disabled) return;
            const messageId = btn.dataset.messageId;
            try {
                await db.collection('contact_messages').doc(messageId).update({ read: true });
            } catch (err) {
                console.error('Failed to mark message as read:', err);
            }
        }

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // --- Admin Tour ---
        const TOUR_STORAGE_KEY = 'luban_admin_tour_completed';

        const TOUR_STEPS = [
            {
                title: 'Welcome to the Admin Dashboard \uD83D\uDC4B',
                description: 'This quick tour will walk you through every section of your admin panel. You can skip at any time or click Next to continue.',
                target: null
            },
            {
                title: 'Menu Manager',
                description: 'Toggle the visibility of individual dishes on the main website. Turn items on or off so customers only see what is available today.',
                target: 'tab-btn-menu'
            },
            {
                title: 'Reservations',
                description: 'View all table reservation requests from customers. Approve or decline reservations and keep track of upcoming bookings.',
                target: 'tab-btn-reservations'
            },
            {
                title: 'Orders',
                description: 'Monitor incoming online orders in real time. See order details, totals, and update order statuses as they are prepared.',
                target: 'tab-btn-orders'
            },
            {
                title: 'Admin Users',
                description: 'Grant or revoke admin dashboard access for other staff members. Use this section to manage who can log into this panel.',
                target: 'tab-btn-admin-users'
            },
            {
                title: 'Messages',
                description: 'Read messages submitted by customers via Contact Us or the website assistant. Mark messages as read once you have reviewed them.',
                target: 'tab-btn-messages'
            }
        ];

        let tourCurrentStep = 0;
        let tourPreviousFocus = null;

        function startTour() {
            if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
            tourCurrentStep = 0;
            tourPreviousFocus = document.activeElement;
            renderTourStep();
            const overlay = document.getElementById('tour-overlay');
            overlay.classList.remove('hidden');
            document.getElementById('tour-next-btn').focus();
        }

        function renderTourStep() {
            const step = TOUR_STEPS[tourCurrentStep];
            const total = TOUR_STEPS.length;

            // Remove any previous highlight
            document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));

            // Highlight target element in sidebar
            if (step.target) {
                const targetEl = document.getElementById(step.target);
                if (targetEl) targetEl.classList.add('tour-highlight');
            }

            document.getElementById('tour-title').textContent = step.title;
            document.getElementById('tour-description').textContent = step.description;
            document.getElementById('tour-step-counter').textContent = (tourCurrentStep + 1) + ' of ' + total;

            // Progress dots
            const dotsEl = document.getElementById('tour-dots');
            dotsEl.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('span');
                dot.className = 'inline-block w-2 h-2 rounded-full ' + (i === tourCurrentStep ? 'bg-red-700' : 'bg-stone-300');
                dotsEl.appendChild(dot);
            }

            // Update Next button label on last step
            const nextBtn = document.getElementById('tour-next-btn');
            nextBtn.textContent = tourCurrentStep === total - 1 ? 'Get Started' : 'Next \u2192';
            nextBtn.focus();
        }

        function tourNext() {
            // Remove highlight from current
            const current = TOUR_STEPS[tourCurrentStep];
            if (current.target) {
                const el = document.getElementById(current.target);
                if (el) el.classList.remove('tour-highlight');
            }

            if (tourCurrentStep < TOUR_STEPS.length - 1) {
                tourCurrentStep++;
                renderTourStep();
            } else {
                closeTour();
            }
        }

        function closeTour() {
            document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
            document.getElementById('tour-overlay').classList.add('hidden');
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
            // Return focus to previous element or dashboard toggle
            if (tourPreviousFocus && tourPreviousFocus.focus) {
                tourPreviousFocus.focus();
            }
        }

    
