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
    { id: 'DR1', name: 'Coca-Cola 300ml', category: 'drinks', price: 15 },
    { id: 'DR2', name: 'Fanta 300ml', category: 'drinks', price: 15 },
    { id: 'DR3', name: 'Sprite 300ml', category: 'drinks', price: 15 },
    { id: 'DR4', name: 'Water 300ml', category: 'drinks', price: 5 },
];

let menuHiddenIds = new Set();
let menuPriceOverrides = {};
let menuImageOverrides = {};

function getAdminDb() {
    if (!window.db) throw new Error('Admin database is not initialized yet.');
    return window.db;
}

function getDishCurrentPrice(dish) {
    return menuPriceOverrides[dish.id] !== undefined ? Number(menuPriceOverrides[dish.id]) : Number(dish.price || 0);
}

function getDishImagePath(dish) {
    const drinkImages = {
        DR1: 'assets/drinks/coca-cola-300ml.webp',
        DR2: 'assets/drinks/fanta-300ml.webp',
        DR3: 'assets/drinks/sprite-300ml.webp',
        DR4: 'assets/drinks/water-300ml.webp'
    };
    return drinkImages[dish.id] || `assets/menu-items-pictures/${dish.id}.webp`;
}

function renderMenuTable() {
    const tableBody = document.getElementById('menu-items-table');
    tableBody.innerHTML = '';

    HARDCODED_MENU.forEach(dish => {
        const isHidden = menuHiddenIds.has(dish.id);
        const currentPrice = getDishCurrentPrice(dish);
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
    getAdminDb().collection('dishAvailability').onSnapshot(snapshot => {
        menuHiddenIds = new Set();
        snapshot.forEach(doc => {
            if (doc.data().hidden === true) menuHiddenIds.add(doc.id);
        });
        renderMenuTable();
    });

    getAdminDb().collection('menuPrices').onSnapshot(snapshot => {
        menuPriceOverrides = {};
        snapshot.forEach(doc => {
            menuPriceOverrides[doc.id] = doc.data().price;
        });
        renderMenuTable();
    });

    getAdminDb().collection('menuImages').onSnapshot(snapshot => {
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
        await getAdminDb().collection('menuPrices').doc(editingDishId).set({ price: newPrice });
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
        await getAdminDb().collection('menuPrices').doc(dishId).delete();
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

    const dish = HARDCODED_MENU.find(d => d.id === dishId);
    const currentSrc = menuImageOverrides[dishId] || (dish ? getDishImagePath(dish) : '');
    const PLACEHOLDER = 'https://placehold.co/400x300/e5e5e5/a3a3a3?text=No+Image';
    const preview = document.getElementById('image-edit-preview');
    preview.onerror = () => { if (preview.src !== PLACEHOLDER) preview.src = PLACEHOLDER; };
    preview.src = currentSrc;

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

        await getAdminDb().collection('menuImages').doc(editingImageDishId).set({ imageUrl });
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
        await getAdminDb().collection('menuImages').doc(dishId).delete();
        closeImageModal();
    } catch (error) {
        console.error('Error reverting image:', error);
        alert('Failed to revert image. Please try again.');
    }
}

function onImageUrlInput() {
    const val = document.getElementById('image-url-input').value.trim();
    const preview = document.getElementById('image-edit-preview');
    const PLACEHOLDER = 'https://placehold.co/400x300/e5e5e5/a3a3a3?text=Invalid+URL';
    if (val) {
        preview.onerror = () => { if (preview.src !== PLACEHOLDER) preview.src = PLACEHOLDER; };
        preview.src = val;
    }
}

function onImageFileChange() {
    const fileInput = document.getElementById('image-file-input');
    if (fileInput.files && fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById('image-edit-preview');
            preview.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
        document.getElementById('image-url-input').value = '';
    }
}

async function toggleDishVisibility(id, currentlyHidden) {
    try {
        await getAdminDb().collection('dishAvailability').doc(id).set({ hidden: !currentlyHidden });
    } catch (error) {
        console.error('Error toggling dish visibility:', error);
        alert('Failed to update dish visibility. Please try again.');
    }
}

// Menu search filter
function filterMenuTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll('#menu-items-table tr');
    rows.forEach(row => {
        if (!q) { row.style.display = ''; return; }
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

window.HARDCODED_MENU = HARDCODED_MENU;
window.getDishCurrentPrice = getDishCurrentPrice;
window.getDishImagePath = getDishImagePath;
window.renderMenuTable = renderMenuTable;
window.listenToMenu = listenToMenu;
window.openPriceModal = openPriceModal;
window.closePriceModal = closePriceModal;
window.savePriceEdit = savePriceEdit;
window.revertPrice = revertPrice;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.saveImageEdit = saveImageEdit;
window.revertImage = revertImage;
window.onImageUrlInput = onImageUrlInput;
window.onImageFileChange = onImageFileChange;
window.toggleDishVisibility = toggleDishVisibility;
window.filterMenuTable = filterMenuTable;

Object.defineProperty(window, 'menuHiddenIds', {
    configurable: true,
    get: () => menuHiddenIds
});
Object.defineProperty(window, 'menuPriceOverrides', {
    configurable: true,
    get: () => menuPriceOverrides
});
Object.defineProperty(window, 'menuImageOverrides', {
    configurable: true,
    get: () => menuImageOverrides
});
