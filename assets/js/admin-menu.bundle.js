(() => {
  // data/menu-catalog.json
  var menu_catalog_default = [
    { id: "SP1", category: "soups", name: "Chicken & Sweet Corn Soup", nameZh: "\u9E21\u8089\u7389\u7C73\u7FB9", price: 40 },
    { id: "SP2", category: "soups", name: "Hot & Sour Soup", nameZh: "\u9178\u8FA3\u6C64", price: 40 },
    { id: "S1", category: "starters", name: "Beef Spring Rolls (3 pcs)", nameZh: "\u725B\u8089\u6625\u5377 (3\u4EF6)", price: 30 },
    { id: "S2", category: "starters", name: "Vegetable Spring Rolls (3 pcs)", nameZh: "\u852C\u83DC\u6625\u5377 (3\u4EF6)", price: 25 },
    { id: "S3", category: "starters", name: "Beef Samosa (5 pcs)", nameZh: "\u725B\u8089\u4E09\u89D2\u9165 (5\u4EF6)", price: 30 },
    { id: "S4", category: "starters", name: "Fish Samosa (5 pcs)", nameZh: "\u9C7C\u8089\u4E09\u89D2\u9165 (5\u4EF6)", price: 30 },
    { id: "S5", category: "starters", name: "Fried Chicken Pieces (6 pcs)", nameZh: "\u70B8\u9E21\u5757 (6\u4EF6)", price: 65 },
    { id: "S6", category: "starters", name: "Special Chicken Wings", nameZh: "\u7279\u8272\u9E21\u7FC5", price: 65 },
    { id: "S7", category: "starters", name: "Golden Fried Prawns", nameZh: "\u9EC4\u91D1\u70B8\u867E", price: 90 },
    { id: "S8", category: "starters", name: "Fried Squid in Spicy Salt", nameZh: "\u6912\u76D0\u9C7F\u9C7C", price: 85 },
    { id: "B1", category: "beef-lamb", name: "Shredded Beef with Green Pepper & Onion", nameZh: "\u9752\u6912\u6D0B\u8471\u7092\u725B\u8089\u4E1D", price: 110 },
    { id: "B2", category: "beef-lamb", name: "Beef in Sichuan Sauce", nameZh: "\u56DB\u5DDD\u8FA3\u6C41\u725B\u8089", price: 110 },
    { id: "B3", category: "beef-lamb", name: "Sliced Beef in Curry Sauce", nameZh: "\u5496\u55B1\u725B\u8089\u7247", price: 110 },
    { id: "B4", category: "beef-lamb", name: "Beef in Oyster Sauce", nameZh: "\u869D\u6CB9\u725B\u8089", price: 110 },
    { id: "B5", category: "beef-lamb", name: "Crispy Chilli Beef", nameZh: "\u9999\u8FA3\u8106\u725B\u8089", price: 85 },
    { id: "B6", category: "beef-lamb", name: "Mongolian Shallot Lamb", nameZh: "\u8499\u53E4\u8471\u7206\u7F8A\u8089", price: 115 },
    { id: "B7", category: "beef-lamb", name: "Lamb Chops", nameZh: "\u7F8A\u6392", price: 85 },
    { id: "P1", category: "pork", name: "Sweet & Sour Pork", nameZh: "\u7CD6\u918B\u91CC\u810A", price: 90 },
    { id: "P2", category: "pork", name: "Pork Sichuan Style", nameZh: "\u56DB\u5DDD\u98CE\u5473\u732A\u8089", price: 90 },
    { id: "P3", category: "pork", name: "Pork in Chilli Sauce", nameZh: "\u8FA3\u6C41\u732A\u8089", price: 90 },
    { id: "P4", category: "pork", name: "Pork in Oyster Sauce", nameZh: "\u869D\u6CB9\u732A\u8089", price: 90 },
    { id: "P5", category: "pork", name: "Fried Pork Ribs", nameZh: "\u70B8\u732A\u6392\u9AA8", price: 75 },
    { id: "K1", category: "chicken", name: "Sweet & Sour Chicken", nameZh: "\u7CD6\u918B\u9E21", price: 100 },
    { id: "K2", category: "chicken", name: "Chicken Sichuan Sauce", nameZh: "\u56DB\u5DDD\u8FA3\u6C41\u9E21", price: 100 },
    { id: "K3", category: "chicken", name: "Chicken in Curry Sauce", nameZh: "\u5496\u55B1\u9E21", price: 100 },
    { id: "K4", category: "chicken", name: "Chicken in Oyster Sauce", nameZh: "\u869D\u6CB9\u9E21", price: 100 },
    { id: "Q1", category: "seafood", name: "Squid in Luban Chilli Sauce", nameZh: "\u9C81\u73ED\u8FA3\u6C41\u9C7F\u9C7C", price: 120 },
    { id: "Q2", category: "seafood", name: "Squid in Sichuan Sauce", nameZh: "\u56DB\u5DDD\u8FA3\u6C41\u9C7F\u9C7C", price: 120 },
    { id: "Q3", category: "seafood", name: "Squid in Garlic Sauce", nameZh: "\u849C\u6C41\u9C7F\u9C7C", price: 120 },
    { id: "F1", category: "seafood", name: "Fish Fillet in Chilli Sauce", nameZh: "\u8FA3\u6C41\u9C7C\u7247", price: 115 },
    { id: "F2", category: "seafood", name: "Fish Fillet in Vegetable Sauce", nameZh: "\u852C\u83DC\u6C41\u9C7C\u7247", price: 115 },
    { id: "F3", category: "seafood", name: "Fish Fillet in Sichuan Sauce", nameZh: "\u56DB\u5DDD\u8FA3\u6C41\u9C7C\u7247", price: 115 },
    { id: "F4", category: "seafood", name: "Sweet & Sour Fish Fillet", nameZh: "\u7CD6\u918B\u9C7C\u7247", price: 115 },
    { id: "PR1", category: "seafood", name: "Prawns in Chilli Sauce", nameZh: "\u8FA3\u6C41\u5927\u867E", price: 155 },
    { id: "PR2", category: "seafood", name: "Prawns in Curry Sauce", nameZh: "\u5496\u55B1\u5927\u867E", price: 155 },
    { id: "PR3", category: "seafood", name: "Prawns in Sichuan Sauce", nameZh: "\u56DB\u5DDD\u8FA3\u6C41\u5927\u867E", price: 155 },
    { id: "SF1", category: "seafood", name: "Special Seafood in Sichuan Sauce", nameZh: "\u56DB\u5DDD\u8FA3\u6C41\u7279\u8272\u6D77\u9C9C", price: 170 },
    { id: "R1", category: "rice", name: "Steamed Rice", nameZh: "\u767D\u996D", price: 29 },
    { id: "R2", category: "rice", name: "Special Jollof Rice", nameZh: "\u7279\u8272\u756A\u8304\u7092\u996D", price: 50 },
    { id: "R3", category: "rice", name: "Combo Fried Rice", nameZh: "\u62DB\u724C\u7092\u996D", price: 50 },
    { id: "R4", category: "rice", name: "Shrimp Fried Rice", nameZh: "\u867E\u4EC1\u7092\u996D", price: 50 },
    { id: "R5", category: "rice", name: "Egg Fried Rice", nameZh: "\u86CB\u7092\u996D", price: 40 },
    { id: "R6", category: "rice", name: "Beef Fried Rice", nameZh: "\u725B\u8089\u7092\u996D", price: 45 },
    { id: "R7", category: "rice", name: "Chicken Fried Rice", nameZh: "\u9E21\u8089\u7092\u996D", price: 45 },
    { id: "R8", category: "rice", name: "Seafood Fried Rice", nameZh: "\u6D77\u9C9C\u7092\u996D", price: 85 },
    { id: "R9", category: "rice", name: "Pork Fried Rice", nameZh: "\u732A\u8089\u7092\u996D", price: 45 },
    { id: "N1", category: "noodles", name: "Vegetable Noodles", nameZh: "\u852C\u83DC\u7092\u9762", price: 45 },
    { id: "N2", category: "noodles", name: "Special Noodles", nameZh: "\u7279\u8272\u7092\u9762", price: 80 },
    { id: "N4", category: "noodles", name: "Singapore Noodles", nameZh: "\u661F\u6D32\u7092\u7C73", price: 80 },
    { id: "N5", category: "noodles", name: "Seafood Noodles", nameZh: "\u6D77\u9C9C\u9762", price: 100 },
    { id: "N6", category: "noodles", name: "Chicken Noodles", nameZh: "\u9E21\u8089\u7092\u9762", price: 60 },
    { id: "D1", category: "dumplings", name: "Steamed Pork Dumpling", nameZh: "\u84B8\u732A\u8089\u997A", price: 30 },
    { id: "D2", category: "dumplings", name: "Fried Pork Dumpling", nameZh: "\u714E\u732A\u8089\u997A", price: 30 },
    { id: "D3", category: "dumplings", name: "Steamed Beef Dumpling", nameZh: "\u84B8\u725B\u8089\u997A", price: 30 },
    { id: "D4", category: "dumplings", name: "Fried Beef Dumpling", nameZh: "\u714E\u725B\u8089\u997A", price: 30 },
    { id: "V1", category: "veg", name: "Mixed Vegetable Sauce", nameZh: "\u4EC0\u9526\u852C\u83DC", price: 40 },
    { id: "DR1", category: "drinks", name: "Coca-Cola 300ml", nameZh: "\u53EF\u53E3\u53EF\u4E50 (300\u6BEB\u5347)", price: 15 },
    { id: "DR2", category: "drinks", name: "Fanta 300ml", nameZh: "\u82AC\u8FBE (300\u6BEB\u5347)", price: 15 },
    { id: "DR3", category: "drinks", name: "Sprite 300ml", nameZh: "\u96EA\u78A7 (300\u6BEB\u5347)", price: 15 },
    { id: "DR4", category: "drinks", name: "Water 300ml", nameZh: "\u74F6\u88C5\u6C34 (300\u6BEB\u5347)", price: 5 }
  ];

  // src/admin-menu.js
  var HARDCODED_MENU = menu_catalog_default.map(({ id, name, category, price }) => ({ id, name, category, price }));
  var menuHiddenIds = /* @__PURE__ */ new Set();
  var menuPriceOverrides = {};
  var menuImageOverrides = {};
  function getAdminDb() {
    if (!window.db) throw new Error("Admin database is not initialized yet.");
    return window.db;
  }
  function getDishCurrentPrice(dish) {
    return menuPriceOverrides[dish.id] !== void 0 ? Number(menuPriceOverrides[dish.id]) : Number(dish.price || 0);
  }
  function getDishImagePath(dish) {
    const drinkImages = {
      DR1: "assets/drinks/coca-cola-300ml.webp",
      DR2: "assets/drinks/fanta-300ml.webp",
      DR3: "assets/drinks/sprite-300ml.webp",
      DR4: "assets/drinks/water-300ml.webp"
    };
    return drinkImages[dish.id] || `assets/menu-items-pictures/${dish.id}.webp`;
  }
  function renderMenuTable() {
    const tableBody = document.getElementById("menu-items-table");
    tableBody.innerHTML = "";
    HARDCODED_MENU.forEach((dish) => {
      const isHidden = menuHiddenIds.has(dish.id);
      const currentPrice = getDishCurrentPrice(dish);
      const hasImageOverride = menuImageOverrides[dish.id] !== void 0;
      const statusBadge = isHidden ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Hidden</span>' : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Visible</span>';
      const toggleIcon = isHidden ? "eye" : "eye-off";
      const toggleTitle = isHidden ? "Show on website" : "Hide from website";
      const priceLabel = menuPriceOverrides[dish.id] !== void 0 ? `<span class="font-mono text-red-700">\u20B5${currentPrice}</span> <span class="text-xs text-stone-600">(edited)</span>` : `<span class="font-mono">\u20B5${currentPrice}</span>`;
      const revertBtn = menuPriceOverrides[dish.id] !== void 0 ? `<button onclick="revertPrice('${dish.id}')" aria-label="Revert ${dish.name} price" class="text-stone-600 hover:text-amber-600 transition-colors mr-3" title="Revert to original price (\u20B5${dish.price})"><i data-lucide="rotate-ccw" class="h-4 w-4"></i></button>` : "";
      const imageIndicator = hasImageOverride ? `<span class="ml-1 text-xs text-blue-600" title="Custom image active">(custom)</span>` : "";
      const row = `
                    <tr class="hover:bg-stone-50 transition-colors${isHidden ? " opacity-60" : ""}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">${dish.name}${imageIndicator}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">${dish.category}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500">${priceLabel}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">${statusBadge}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onclick="openImageModal('${dish.id}', ${JSON.stringify(dish.name).replace(/"/g, "&quot;")})" aria-label="Edit image for ${dish.name}" class="text-stone-600 hover:text-purple-600 transition-colors mr-3" title="Edit dish image"><i data-lucide="image" class="h-4 w-4"></i></button>
                            <button onclick="openPriceModal('${dish.id}', ${JSON.stringify(dish.name).replace(/"/g, "&quot;")}, ${currentPrice})" aria-label="Edit price for ${dish.name}" class="text-stone-600 hover:text-blue-600 transition-colors mr-3" title="Edit price"><i data-lucide="pencil" class="h-4 w-4"></i></button>
                            ${revertBtn}<button onclick="toggleDishVisibility('${dish.id}', ${isHidden})" aria-label="${toggleTitle} for ${dish.name}" class="text-stone-600 hover:text-red-700 transition-colors" title="${toggleTitle}"><i data-lucide="${toggleIcon}" class="h-4 w-4"></i></button>
                        </td>
                    </tr>
                `;
      tableBody.innerHTML += row;
    });
    lucide.createIcons();
  }
  function listenToMenu() {
    getAdminDb().collection("dishAvailability").onSnapshot((snapshot) => {
      menuHiddenIds = /* @__PURE__ */ new Set();
      snapshot.forEach((doc) => {
        if (doc.data().hidden === true) menuHiddenIds.add(doc.id);
      });
      renderMenuTable();
    });
    getAdminDb().collection("menuPrices").onSnapshot((snapshot) => {
      menuPriceOverrides = {};
      snapshot.forEach((doc) => {
        menuPriceOverrides[doc.id] = doc.data().price;
      });
      renderMenuTable();
    });
    getAdminDb().collection("menuImages").onSnapshot((snapshot) => {
      menuImageOverrides = {};
      snapshot.forEach((doc) => {
        menuImageOverrides[doc.id] = doc.data().imageUrl;
      });
      renderMenuTable();
    });
  }
  var editingDishId = null;
  function openPriceModal(dishId, dishName, currentPrice) {
    editingDishId = dishId;
    document.getElementById("price-edit-dish-name").textContent = dishName;
    document.getElementById("price-edit-input").value = currentPrice;
    document.getElementById("price-edit-modal").classList.remove("hidden");
    setTimeout(() => document.getElementById("price-edit-input").focus(), 50);
  }
  function closePriceModal() {
    editingDishId = null;
    document.getElementById("price-edit-modal").classList.add("hidden");
  }
  async function savePriceEdit() {
    if (!editingDishId) return;
    const newPrice = parseFloat(document.getElementById("price-edit-input").value);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Please enter a valid price.");
      return;
    }
    try {
      await getAdminDb().collection("menuPrices").doc(editingDishId).set({ price: newPrice });
      closePriceModal();
    } catch (error) {
      console.error("Error saving price:", error);
      alert("Failed to save price. Please try again.");
    }
  }
  async function revertPrice(dishId) {
    const dish = HARDCODED_MENU.find((d) => d.id === dishId);
    if (!dish) {
      console.error("Cannot revert: dish not found for id", dishId);
      return;
    }
    if (!confirm(`Revert price for "${dish.name}" back to the original (\u20B5${dish.price})?`)) return;
    try {
      await getAdminDb().collection("menuPrices").doc(dishId).delete();
    } catch (error) {
      console.error("Error reverting price:", error);
      alert("Failed to revert price. Please try again.");
    }
  }
  var editingImageDishId = null;
  function openImageModal(dishId, dishName) {
    editingImageDishId = dishId;
    document.getElementById("image-edit-dish-name").textContent = dishName;
    document.getElementById("image-url-input").value = menuImageOverrides[dishId] || "";
    document.getElementById("image-file-input").value = "";
    document.getElementById("image-edit-feedback").textContent = "";
    document.getElementById("image-edit-feedback").className = "hidden text-sm mt-2";
    const dish = HARDCODED_MENU.find((d) => d.id === dishId);
    const currentSrc = menuImageOverrides[dishId] || (dish ? getDishImagePath(dish) : "");
    const PLACEHOLDER = "https://placehold.co/400x300/e5e5e5/a3a3a3?text=No+Image";
    const preview = document.getElementById("image-edit-preview");
    preview.onerror = () => {
      if (preview.src !== PLACEHOLDER) preview.src = PLACEHOLDER;
    };
    preview.src = currentSrc;
    const revertBtn = document.getElementById("image-revert-btn");
    revertBtn.dataset.dishId = dishId;
    revertBtn.classList.toggle("hidden", !menuImageOverrides[dishId]);
    document.getElementById("image-edit-modal").classList.remove("hidden");
    setTimeout(() => document.getElementById("image-url-input").focus(), 50);
  }
  function closeImageModal() {
    editingImageDishId = null;
    document.getElementById("image-edit-modal").classList.add("hidden");
  }
  function showImageFeedback(msg, isError) {
    const el = document.getElementById("image-edit-feedback");
    el.textContent = msg;
    el.className = `text-sm mt-2 ${isError ? "text-red-600" : "text-green-600"}`;
  }
  async function saveImageEdit() {
    if (!editingImageDishId) return;
    const urlInput = document.getElementById("image-url-input").value.trim();
    const fileInput = document.getElementById("image-file-input");
    const saveBtn = document.getElementById("image-save-btn");
    if (!urlInput && (!fileInput.files || fileInput.files.length === 0)) {
      showImageFeedback("Please provide an image URL or upload a file.", true);
      return;
    }
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    try {
      let imageUrl = urlInput;
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 700 * 1024) {
          showImageFeedback("File is too large. Please use an image under 700 KB.", true);
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Image";
          return;
        }
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }
      await getAdminDb().collection("menuImages").doc(editingImageDishId).set({ imageUrl });
      closeImageModal();
    } catch (error) {
      console.error("Error saving image:", error);
      showImageFeedback("Failed to save image. Please try again.", true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Image";
    }
  }
  async function revertImage(dishId) {
    if (!confirm("Remove the custom image and revert to the original?")) return;
    try {
      await getAdminDb().collection("menuImages").doc(dishId).delete();
      closeImageModal();
    } catch (error) {
      console.error("Error reverting image:", error);
      alert("Failed to revert image. Please try again.");
    }
  }
  function onImageUrlInput() {
    const val = document.getElementById("image-url-input").value.trim();
    const preview = document.getElementById("image-edit-preview");
    const PLACEHOLDER = "https://placehold.co/400x300/e5e5e5/a3a3a3?text=Invalid+URL";
    if (val) {
      preview.onerror = () => {
        if (preview.src !== PLACEHOLDER) preview.src = PLACEHOLDER;
      };
      preview.src = val;
    }
  }
  function onImageFileChange() {
    const fileInput = document.getElementById("image-file-input");
    if (fileInput.files && fileInput.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById("image-edit-preview");
        preview.src = e.target.result;
      };
      reader.readAsDataURL(fileInput.files[0]);
      document.getElementById("image-url-input").value = "";
    }
  }
  async function toggleDishVisibility(id, currentlyHidden) {
    try {
      await getAdminDb().collection("dishAvailability").doc(id).set({ hidden: !currentlyHidden });
    } catch (error) {
      console.error("Error toggling dish visibility:", error);
      alert("Failed to update dish visibility. Please try again.");
    }
  }
  function filterMenuTable(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll("#menu-items-table tr");
    rows.forEach((row) => {
      if (!q) {
        row.style.display = "";
        return;
      }
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
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
  Object.defineProperty(window, "menuHiddenIds", {
    configurable: true,
    get: () => menuHiddenIds
  });
  Object.defineProperty(window, "menuPriceOverrides", {
    configurable: true,
    get: () => menuPriceOverrides
  });
  Object.defineProperty(window, "menuImageOverrides", {
    configurable: true,
    get: () => menuImageOverrides
  });
})();
