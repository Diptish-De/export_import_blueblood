/**
 * Catalogue Page JavaScript
 * Handles product loading and category filtering
 */

document.addEventListener('DOMContentLoaded', async () => {
  const productGrid = document.getElementById('productGrid');
  const categoryFilter = document.getElementById('categoryFilter');
  const emptyState = document.getElementById('emptyState');

  let allProducts = [];
  let currentMainCategory = 'all';
  let currentSubCategory = 'all';
  let searchQuery = '';
  let currentMaterial = 'all';
  let currentSort = 'default';
  let minPrice = 0;
  let maxPrice = 1000000; // Large default
  let currentRegion = 'all';
  let selectedMOQRanges = [];
  let selectedAvailabilities = ['ready']; // Default to ready

  const mainCategoryFilter = document.getElementById('mainCategoryFilter');
  const subCategoryFilter = document.getElementById('subCategoryFilter');

  // Check URL for params
  const urlParams = new URLSearchParams(window.location.search);
  const mainParam = urlParams.get('category'); // Backward compatibility: treat 'category' as main
  const subParam = urlParams.get('subcategory');

  if (mainParam) currentMainCategory = mainParam;
  if (subParam) currentSubCategory = subParam;

  // Fetch products from JSON
  async function loadProducts() {
    try {
      const response = await fetch('data/products.json');
      allProducts = await response.json();
      updateSubCategoryButtons();
      renderProducts();
      updateActiveFilters();
      updateActiveFilterBadges();
    } catch (error) {
      console.error('Error loading products:', error);
      productGrid.innerHTML = '<p style="text-align:center;color:var(--color-gray-500);grid-column:1/-1;">Unable to load products. Please try again later.</p>';
    }
  }

  let filteredProducts = [];
  let visibleCount = 24;

  function applyFilters() {
    filteredProducts = allProducts;

    // Filter by Main Category
    if (currentMainCategory !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === currentMainCategory);
    }

    // Filter by Sub-Category
    if (currentSubCategory !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.subcategory === currentSubCategory);
    }

    // Filter by Material
    if (currentMaterial !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.material && p.material.toLowerCase().includes(currentMaterial.toLowerCase()));
    }

    // Filter by Price Range
    filteredProducts = filteredProducts.filter(p => {
        let price = 0;
        if (p.price_range) {
            // Take the average or just the lower bound for simple filtering
            const parts = p.price_range.split('-').map(s => parseFloat(s.replace(/,/g, '')));
            price = parts[0] || 0;
        }
        return price >= minPrice && price <= maxPrice;
    });

    // Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(lowerQuery)) ||
        (p.material && p.material.toLowerCase().includes(lowerQuery)) ||
        (p.origin && p.origin.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter by Region
    if (currentRegion !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.region === currentRegion || (currentRegion === 'Jaipur' && p.origin === 'India')); // Mocking Jaime for India for now
    }

    // Filter by MOQ
    if (selectedMOQRanges.length > 0) {
        filteredProducts = filteredProducts.filter(p => {
            const moq = p.moq || 1;
            return selectedMOQRanges.some(range => {
                if (range === '1-5') return moq >= 1 && moq <= 5;
                if (range === '6-20') return moq >= 6 && moq <= 20;
                if (range === '21-above') return moq >= 21;
                return false;
            });
        });
    }

    // Filter by Availability
    if (selectedAvailabilities.length > 0) {
        filteredProducts = filteredProducts.filter(p => {
            // Mocking availability: even IDs are ready, odd are custom for demo
            const isReady = (parseInt(p.id.split('-').pop()) % 2 === 0);
            return (selectedAvailabilities.includes('ready') && isReady) || 
                   (selectedAvailabilities.includes('custom') && !isReady);
        });
    }

    // Sort Logic
    if (currentSort === 'price-low') {
        filteredProducts.sort((a, b) => {
            let priceA = parseFloat(a.price_range.split('-')[0]) || 0;
            let priceB = parseFloat(b.price_range.split('-')[0]) || 0;
            return priceA - priceB;
        });
    } else if (currentSort === 'price-high') {
        filteredProducts.sort((a, b) => {
            let priceA = parseFloat(a.price_range.split('-')[0]) || 0;
            let priceB = parseFloat(b.price_range.split('-')[0]) || 0;
            return priceB - priceA;
        });
    } else {
        filteredProducts.sort((a, b) => a.id.localeCompare(b.id));
    }
  }

  function renderProducts(resetCount = false) {
    if (resetCount) visibleCount = 24;

    applyFilters();

    const productCountEl = document.getElementById('productCount');

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      if (productCountEl) productCountEl.textContent = `Showing 0 of 0 products`;
      return;
    }

    emptyState.classList.add('hidden');

    const productsToShow = filteredProducts.slice(0, visibleCount);
    const countText = `Showing <span style="color: var(--color-maroon); font-weight: 700;">1 - ${productsToShow.length}</span> of <strong>${filteredProducts.length}</strong> Products`;

    if (productCountEl) {
      productCountEl.innerHTML = countText;
    }

    const floatingPill = document.getElementById('floatingCountPill');
    if (floatingPill) {
        floatingPill.innerHTML = `Showing 1 - ${productsToShow.length} of ${filteredProducts.length} Products`;
        if (window.scrollY > 150) {
            floatingPill.style.opacity = '1';
            floatingPill.style.pointerEvents = 'auto';
            floatingPill.style.bottom = '30px';
        } else {
            floatingPill.style.opacity = '0';
            floatingPill.style.pointerEvents = 'none';
            floatingPill.style.bottom = '10px';
        }
    }

    productGrid.innerHTML = productsToShow.map(product => `
      <div class="product-card group" id="card-${product.id}" data-category="${product.category}" data-current-index="0">
        <div class="product-card-image" style="position: relative; cursor: pointer;" onclick="openQuickView('${product.id}')">
          <span class="product-card-category">${product.category}</span>
          <img id="img-${product.id}" src="${product.images[0] || 'https://placehold.co/500x500/f5ecd9/5c1515?text=No+Image'}" alt="${product.name} - Handcrafted ${product.material || product.category} Indian Artefact for Export | Blueblood Exports" title="${product.name} - Buy Wholesale Indian ${product.category} from Blueblood Exports" loading="lazy" onerror="this.src='https://placehold.co/500x500/f5ecd9/5c1515?text=No+Image'">
          
          ${product.variants && product.variants.length > 1 ? `
          <div class="variant-nav" style="position: absolute; top: 50%; left: 0; width: 100%; display: flex; justify-content: space-between; transform: translateY(-50%); padding: 0 8px; pointer-events: none; opacity: 0; transition: opacity 0.3s; box-sizing: border-box; z-index: 2;">
            <button onclick="event.stopPropagation(); slideVariant('${product.id}', -1);" aria-label="Previous Variant" style="pointer-events: auto; width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(212, 168, 75, 0.4); background: rgba(255,255,255,0.95); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md); color: var(--color-maroon);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onclick="event.stopPropagation(); slideVariant('${product.id}', 1);" aria-label="Next Variant" style="pointer-events: auto; width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(212, 168, 75, 0.4); background: rgba(255,255,255,0.95); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md); color: var(--color-maroon);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <style> .product-card:hover .variant-nav { opacity: 1 !important; visibility: visible !important; } </style>
          ` : ''}

          <button class="wishlist-toggle" data-product-id="${product.id}" aria-label="Add to Wishlist" onclick="event.stopPropagation();">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
          </button>
          <button class="quick-view-btn" onclick="openQuickView('${product.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px">
               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
               <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Quick View
          </button>
        </div>
        <div class="product-card-content">
          <h3 class="product-card-name" style="cursor: pointer;" onclick="openQuickView('${product.id}')">${product.name}</h3>
          <p id="price-${product.id}" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: bold; color: var(--color-maroon); margin-bottom: 5px;">${product.variants && product.variants[0].price ? '₹' + product.variants[0].price : (product.price_range ? '₹' + product.price_range : 'Contact for Price')}</p>
          <div class="product-card-meta">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${product.origin || 'India'}
            </span>
          </div>

          ${product.variants && product.variants.length > 1 ? `
          <div class="product-variants" style="display: flex; gap: 8px; margin-top: 10px;">
             ${product.variants.map((v, i) => `
                <button aria-label="Variant ${v.color}" onclick="changeVariant('${product.id}', ${i})" title="${v.color}" style="width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid ${i===0?'var(--color-maroon)':'#ddd'}; background: var(--color-gray-200); background-image: url('${v.image}'); background-size: cover; background-position: center; cursor: pointer; transition: transform 0.2s;"></button>
             `).join('')}
          </div>
          ` : '<div style="height: 30px;"></div>'}

          <p class="product-card-moq">MOQ: ${product.moq || 1} UNITS</p>
          <hr class="product-card-divider">
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <button class="btn btn-secondary" style="width: 100%; padding: 8px; font-size: 0.75rem; background: var(--color-ivory); border-color: var(--color-maroon); color: var(--color-maroon);" onclick="openQuickView('${product.id}')">VIEW MORE DETAILS</button>
            <button class="btn product-card-btn" style="width: 100%;" onclick="event.preventDefault(); event.stopPropagation(); window.cart.addItem({id: '${product.id}', name: '${product.name.replace(/'/g, "\\'")}', category: '${product.category}'})">
                ADD TO INQUIRY BAG
            </button>
          </div>
        </div>
      </div>
    `).join('');

    updateActiveFilterBadges();
  }

  // Infinite Scroll Hook
  window.addEventListener('scroll', () => {
    // Update Floating Pill Visibility & Row-Based Count
    const floatingPill = document.getElementById('floatingCountPill');
    const productCountEl = document.getElementById('productCount');
    const cards = document.querySelectorAll('.product-card');
    
    let lastVisibleIndex = 0;
    cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        // If the top of the card has entered the viewport
        if (rect.top < window.innerHeight - 100) { 
            lastVisibleIndex = index + 1;
        }
    });

    if (lastVisibleIndex > 0) {
        const currentBatchMax = Math.max(lastVisibleIndex, visibleCount / visibleCount); // Default to at least visibleCount if wanted, but user asked for "per row"
        const countDisplay = `Showing 1 - ${lastVisibleIndex} of ${filteredProducts.length} Products`;
        const htmlDisplay = `Showing <span style="color: var(--color-maroon); font-weight: 700;">1 - ${lastVisibleIndex}</span> of <strong>${filteredProducts.length}</strong> Products`;
        
        if (floatingPill) floatingPill.innerHTML = countDisplay;
        if (productCountEl) productCountEl.innerHTML = htmlDisplay;
    }

    if (floatingPill) {
        if (window.scrollY > 150) {
            floatingPill.style.opacity = '1';
            floatingPill.style.pointerEvents = 'auto';
            floatingPill.style.bottom = '30px';
        } else {
            floatingPill.style.opacity = '0';
            floatingPill.style.pointerEvents = 'none';
            floatingPill.style.bottom = '10px';
        }
    }

    if (visibleCount < filteredProducts.length) {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        visibleCount += 24;
        renderProducts(false);
      }
    }
  });

  // Update active filter button
  function updateActiveFilters() {
    mainCategoryFilter.querySelectorAll('.filter-btn').forEach(btn => {
      const btnCat = btn.dataset.mainCategory;
      if (btnCat === currentMainCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    subCategoryFilter.querySelectorAll('.filter-btn').forEach(btn => {
      const btnSub = btn.dataset.subcategory;
      if (btnSub === currentSubCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateSubCategoryButtons() {
    if (currentMainCategory === 'all') {
      subCategoryFilter.classList.add('hidden');
      subCategoryFilter.innerHTML = '';
      currentSubCategory = 'all';
      return;
    }

    // Get unique subcategories for this main category
    const subcats = [...new Set(allProducts
      .filter(p => p.category === currentMainCategory)
      .map(p => p.subcategory))]
      .filter(Boolean);

    if (subcats.length > 0) {
      subCategoryFilter.classList.remove('hidden');
      subCategoryFilter.innerHTML = `
        <button class="filter-btn ${currentSubCategory === 'all' ? 'active' : ''}" data-subcategory="all" style="text-align: left;">All ${currentMainCategory}</button>
        ${subcats.map(sub => `
          <button class="filter-btn ${currentSubCategory === sub ? 'active' : ''}" data-subcategory="${sub}" style="text-align: left;">${sub}</button>
        `).join('')}
      `;
    } else {
      subCategoryFilter.classList.add('hidden');
      subCategoryFilter.innerHTML = '';
      currentSubCategory = 'all';
    }
  }

  // Handle main Category Selection
  mainCategoryFilter.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      currentMainCategory = e.target.dataset.mainCategory;
      currentSubCategory = 'all'; // Reset sub when main changes
      updateSubCategoryButtons();
      updateActiveFilters();
      
      // Update URL
      const params = new URLSearchParams();
      if (currentMainCategory !== 'all') params.set('category', currentMainCategory);
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.pushState({}, '', newUrl);

      renderProducts(true);
    }
  });

  // Handle sub Category Selection
  subCategoryFilter.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      currentSubCategory = e.target.dataset.subcategory;
      updateActiveFilters();

      // Update URL
      const params = new URLSearchParams();
      if (currentMainCategory !== 'all') params.set('category', currentMainCategory);
      if (currentSubCategory !== 'all') params.set('subcategory', currentSubCategory);
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.pushState({}, '', newUrl);

      renderProducts(true);
    }
  });

  // Handle Material Filter Dropdown
  const materialSelect = document.getElementById('materialSelect');
  if (materialSelect) {
    materialSelect.addEventListener('change', (e) => {
      currentMaterial = e.target.value;
      renderProducts(true);
    });
  }

  // Handle Search Input
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (searchClear) {
        searchClear.style.display = searchQuery ? 'block' : 'none';
      }
      renderProducts(true);
    });

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            searchClear.style.display = 'none';
            renderProducts(true);
        });
    }
  }

  // Variant Click Handler
  window.changeVariant = (productId, index) => {
     const product = allProducts.find(p => p.id === productId);
     if (!product || !product.variants) return;
     const variant = product.variants[index];
     if (!variant) return;

     const card = document.getElementById(`card-${productId}`);
     if (card) card.dataset.currentIndex = index;

     const img = document.getElementById(`img-${productId}`);
     if (img && variant.image) img.src = variant.image;

     const priceEl = document.getElementById(`price-${productId}`);
     if (priceEl) priceEl.textContent = variant.price ? `₹${variant.price}` : 'Contact for Price';

     // Update variant button styles
     const variantBtns = card.querySelectorAll('.product-variants button');
     variantBtns.forEach((btn, i) => {
         btn.style.borderColor = (i === index) ? 'var(--color-maroon)' : '#ddd';
     });
  };

  // Slider Navigation
  window.slideVariant = (productId, direction) => {
      const product = allProducts.find(p => p.id === productId);
      if (!product || !product.variants) return;
      
      const card = document.getElementById(`card-${productId}`);
      let currentIndex = parseInt(card.dataset.currentIndex || 0);
      let newIndex = currentIndex + direction;

      if (newIndex < 0) newIndex = product.variants.length - 1;
      if (newIndex >= product.variants.length) newIndex = 0;

      window.changeVariant(productId, newIndex);
  };

  // View Toggles
  const viewGrid3 = document.getElementById('viewGrid3');
  const viewGrid4 = document.getElementById('viewGrid4');
  if (viewGrid3 && viewGrid4) {
      viewGrid3.addEventListener('click', () => {
          productGrid.className = 'grid gap-6 grid-cols-3';
          viewGrid3.classList.add('active');
          viewGrid4.classList.remove('active');
          viewGrid3.style.color = 'var(--color-gray-700)';
          viewGrid4.style.color = 'var(--color-gray-400)';
          viewGrid3.style.borderColor = 'var(--color-gray-300)';
          viewGrid4.style.borderColor = 'transparent';
      });
      viewGrid4.addEventListener('click', () => {
          productGrid.className = 'grid gap-6 grid-cols-4';
          viewGrid4.classList.add('active');
          viewGrid3.classList.remove('active');
          viewGrid4.style.color = 'var(--color-gray-700)';
          viewGrid3.style.color = 'var(--color-gray-400)';
          viewGrid4.style.borderColor = 'var(--color-gray-300)';
          viewGrid3.style.borderColor = 'transparent';
      });
  }

  // Sort Filter
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
          currentSort = e.target.value;
          renderProducts(true);
      });
  }

  // Price Filtering Init
  const priceRange = document.getElementById('priceRange');
  const priceValueLabel = document.getElementById('priceValue');
  const pricePresets = document.getElementsByName('price_preset');
  const regionSelect = document.getElementById('regionSelect');
  const moqCheckboxes = document.querySelectorAll('input[name="moq_range"]');
  const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');

  if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
          currentRegion = e.target.value;
          renderProducts(true);
      });
  }

  moqCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
          selectedMOQRanges = Array.from(moqCheckboxes).filter(i => i.checked).map(i => i.value);
          renderProducts(true);
      });
  });

  availabilityCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
          selectedAvailabilities = Array.from(availabilityCheckboxes).filter(i => i.checked).map(i => i.value);
          renderProducts(true);
      });
  });

  if (priceRange) {
      priceRange.addEventListener('input', (e) => {
          maxPrice = parseInt(e.target.value);
          if (maxPrice === 100000) {
              maxPrice = 1000000; // All if maxed
              priceValueLabel.textContent = "Up to ₹1,00,000+";
          } else {
              priceValueLabel.textContent = `Up to ₹${maxPrice.toLocaleString()}`;
          }
          renderProducts(true);

          // Uncheck presets if slider moved
          pricePresets.forEach(p => p.checked = false);
      });
  }

  pricePresets.forEach(preset => {
      preset.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val === 'all') {
              minPrice = 0;
              maxPrice = 1000000;
          } else if (val === '0-10000') {
              minPrice = 0;
              maxPrice = 10000;
          } else if (val === '10000-30000') {
              minPrice = 10000;
              maxPrice = 30000;
          } else if (val === '30000-over') {
              minPrice = 30000;
              maxPrice = 1000000;
          }
          renderProducts(true);
      });
  });

  // Mobile Filter Drawer Toggle
  const mobileToggle = document.getElementById('mobileFilterToggle');
  const sidebar = document.querySelector('.catalogue-sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (mobileToggle && sidebar && overlay) {
      mobileToggle.addEventListener('click', () => {
          sidebar.classList.add('active');
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
      });

      overlay.addEventListener('click', () => {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
      });
  }

  // Quick View Logic
  // Expose to global scope for inline onclick handler
  window.openQuickView = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Create Modal Elements if not exist
    let modal = document.getElementById('quickViewModal');
    if (!modal) {
      // Build modal DOM
      const modalHtml = `
        <div id="quickViewModal" class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close" onclick="closeQuickView()">&times;</button>
                <div class="quick-view-grid">
                    <div class="quick-view-image">
                        <img id="qvImage" src="" alt="Indian Handcrafted Artefact - Premium Export Quality Product" title="Handcrafted Indian Art - Blueblood Exports">
                    </div>
                    <div class="quick-view-details">
                        <span id="qvCategory" class="text-terracotta" style="font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;"></span>
                        <h2 id="qvName" style="margin-top:var(--space-2); margin-bottom:var(--space-4);"></h2>
                        <p id="qvPrice" style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: bold; color: var(--color-maroon); margin-bottom: 5px;"></p>
                        <p id="qvDesc" style="color:var(--color-gray-600); font-size:0.95rem; line-height:1.6;"></p>
                        
                        <div id="qvVariantsContainer" style="margin-top: var(--space-4);"></div>

                        <div style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--color-gray-100); border-radius: var(--radius-md);">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <strong>ID:</strong> <span id="qvId"></span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <strong>HS Code:</strong> <span id="qvHs"></span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <strong>Material:</strong> <span id="qvMaterial"></span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <strong>Origin:</strong> <span id="qvOrigin"></span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <strong>MOQ:</strong> <span id="qvMoq"></span>
                            </div>
                        </div>

                        <div style="display:flex; gap:10px;">
                             <a id="qvLink" href="#" class="btn btn-primary" style="flex:1; text-align:center;">View Full Details</a>
                             <button id="qvAdd" class="btn btn-secondary" style="flex:1;">Add to Bag</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      modal = document.getElementById('quickViewModal');

      // Add overlay click close
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeQuickView();
      });
    }

    // Populate Data
    document.getElementById('qvImage').src = product.images[0] || 'https://placehold.co/500x500/f5ecd9/5c1515?text=No+Image';
    document.getElementById('qvImage').alt = `${product.name} - Handcrafted ${product.material || product.category} Indian Artefact for Wholesale Export | Blueblood Exports`;
    document.getElementById('qvImage').title = `${product.name} - Premium Indian ${product.category} by Blueblood Exports`;
    document.getElementById('qvCategory').textContent = product.category;
    document.getElementById('qvName').textContent = product.name;
    document.getElementById('qvPrice').textContent = product.price_range ? '₹' + product.price_range : 'Contact for Price';
    document.getElementById('qvDesc').textContent = product.description;
    document.getElementById('qvId').textContent = product.id;
    document.getElementById('qvHs').textContent = product.hs_code || 'N/A';
    document.getElementById('qvMaterial').textContent = product.material;
    document.getElementById('qvOrigin').textContent = product.origin;
    document.getElementById('qvMoq').textContent = product.moq + ' units';
    document.getElementById('qvLink').href = `product.html?id=${product.id}`;
    
    const variantsContainer = document.getElementById('qvVariantsContainer');
    if (product.variants && product.variants.length > 1) {
        variantsContainer.innerHTML = `
            <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 5px;">Available Variants:</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${product.variants.map((v, i) => `
                    <button class="qv-variant-btn" onclick="document.getElementById('qvImage').src='${v.image}'; document.getElementById('qvPrice').textContent='${v.price ? "₹"+v.price : "Contact for Price"}'; document.getElementById('qvId').textContent='${v.id}'; document.getElementById('qvHs').textContent='${v.hs_code || "N/A"}'; document.querySelectorAll('.qv-variant-btn').forEach(b => b.style.borderColor='#ccc'); this.style.borderColor='var(--color-maroon)';" title="${v.color}" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${i===0?'var(--color-maroon)':'#ccc'}; background: var(--color-gray-200); background-image: url('${v.image}'); background-size: cover; background-position: center; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></button>
                `).join('')}
            </div>
        `;
        variantsContainer.style.display = 'block';
    } else {
        variantsContainer.style.display = 'none';
        variantsContainer.innerHTML = '';
    }

    // Update Add to Cart Button
    const addBtn = document.getElementById('qvAdd');
    addBtn.onclick = () => {
      window.cart.addItem({
        id: product.id,
        name: product.name,
        category: product.category
      });
      closeQuickView(); // Optional: close or keep open
    };

    // Show Modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  };

  window.closeQuickView = () => {
    const modal = document.getElementById('quickViewModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Collapsible Sidebar Blocks
  document.querySelectorAll('.sidebar-block-header').forEach(header => {
      header.addEventListener('click', () => {
          header.parentElement.classList.toggle('collapsed');
      });
  });

  // Reset All Filters
  function resetAllFilters() {
      currentMainCategory = 'all';
      currentSubCategory = 'all';
      currentMaterial = 'all';
      searchQuery = '';
      minPrice = 0;
      maxPrice = 1000000;
      currentSort = 'default';

      // Reset UI Elements
      if (searchInput) {
          searchInput.value = '';
          if (searchClear) searchClear.style.display = 'none';
      }
      if (materialSelect) materialSelect.value = 'all';
      if (priceRange) {
          priceRange.value = 100000;
          const priceVal = document.getElementById('priceValue');
          if (priceVal) priceVal.textContent = "Up to ₹1,00,000+";
      }
      pricePresets.forEach(p => {
          p.checked = (p.value === 'all');
      });
      if (sortSelect) sortSelect.value = 'default';
      if (regionSelect) regionSelect.value = 'all';
      moqCheckboxes.forEach(cb => cb.checked = false);
      availabilityCheckboxes.forEach(cb => cb.checked = (cb.value === 'ready'));
      selectedMOQRanges = [];
      selectedAvailabilities = ['ready'];
      currentRegion = 'all';

      updateSubCategoryButtons();
      updateActiveFilters();
      
      // Clear URL
      window.history.pushState({}, '', window.location.pathname);
      
      renderProducts(true);
  }

  const clearAllBtn = document.getElementById('clearAllFilters');
  if (clearAllBtn) {
      clearAllBtn.addEventListener('click', resetAllFilters);
  }

  // Active Filter Badges Logic
  function updateActiveFilterBadges() {
      const container = document.getElementById('activeFilters');
      if (!container) return;

      let badges = [];

      if (currentMainCategory !== 'all') {
          badges.push({ type: 'category', label: `Category: ${currentMainCategory}`, value: currentMainCategory });
      }
      if (currentSubCategory !== 'all') {
          badges.push({ type: 'subcategory', label: `Sub: ${currentSubCategory}`, value: currentSubCategory });
      }
      if (currentMaterial !== 'all') {
          badges.push({ type: 'material', label: `Material: ${currentMaterial}`, value: currentMaterial });
      }
      if (currentRegion !== 'all') {
          badges.push({ type: 'region', label: `Region: ${currentRegion}`, value: currentRegion });
      }
      if (selectedMOQRanges.length > 0) {
          badges.push({ type: 'moq', label: `MOQ: ${selectedMOQRanges.join(', ')}`, value: 'moq' });
      }
      if (selectedAvailabilities.length > 0) {
          badges.push({ type: 'availability', label: `Status: ${selectedAvailabilities.join(', ')}`, value: 'availability' });
      }
      if (searchQuery) {
          badges.push({ type: 'search', label: `Search: "${searchQuery}"`, value: searchQuery });
      }
      if (maxPrice < 1000000 || minPrice > 0) {
          let label = `Price: `;
          if (minPrice === 0) label += `Up to ₹${maxPrice.toLocaleString()}`;
          else if (maxPrice >= 1000000) label += `Above ₹${minPrice.toLocaleString()}`;
          else label += `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`;
          badges.push({ type: 'price', label: label, value: 'price' });
      }

      if (badges.length === 0) {
          container.innerHTML = '';
          return;
      }

      container.innerHTML = badges.map(badge => `
          <div class="filter-badge">
              <span>${badge.label}</span>
              <span class="filter-badge-remove" onclick="removeFilter('${badge.type}', '${badge.value}')">&times;</span>
          </div>
      `).join('');
  }

  window.removeFilter = (type, value) => {
      if (type === 'category') {
          currentMainCategory = 'all';
          currentSubCategory = 'all';
          updateSubCategoryButtons();
          updateActiveFilters();
      } else if (type === 'subcategory') {
          currentSubCategory = 'all';
          updateActiveFilters();
      } else if (type === 'material') {
          currentMaterial = 'all';
          if (materialSelect) materialSelect.value = 'all';
      } else if (type === 'region') {
          currentRegion = 'all';
          if (regionSelect) regionSelect.value = 'all';
      } else if (type === 'moq') {
          selectedMOQRanges = [];
          moqCheckboxes.forEach(cb => cb.checked = false);
      } else if (type === 'availability') {
          selectedAvailabilities = ['ready'];
          availabilityCheckboxes.forEach(cb => cb.checked = (cb.value === 'ready'));
      } else if (type === 'search') {
          searchQuery = '';
          if (searchInput) {
              searchInput.value = '';
              if (searchClear) searchClear.style.display = 'none';
          }
      } else if (type === 'price') {
          minPrice = 0;
          maxPrice = 1000000;
          if (priceRange) {
              priceRange.value = 100000;
              const label = document.getElementById('priceValue');
              if (label) label.textContent = "Up to ₹1,00,000+";
          }
          pricePresets.forEach(p => p.checked = (p.value === 'all'));
      }

      renderProducts(true);
  };

  // Load products on page load
  await loadProducts();
});
