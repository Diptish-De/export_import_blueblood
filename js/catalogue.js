/**
 * Catalogue Page JavaScript
 * Handles product loading and category filtering
 */

document.addEventListener('DOMContentLoaded', async () => {
  const productGrid = document.getElementById('productGrid');
  const categoryFilter = document.getElementById('categoryFilter');
  const emptyState = document.getElementById('emptyState');

  let allProducts = [];
  let currentCategory = 'all';

  // Check URL for category parameter
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    currentCategory = categoryParam;
  }

  // Fetch products from JSON
  async function loadProducts() {
    try {
      const response = await fetch('data/products.json');
      allProducts = await response.json();
      renderProducts();
      updateActiveFilter();
    } catch (error) {
      console.error('Error loading products:', error);
      productGrid.innerHTML = '<p style="text-align:center;color:var(--color-gray-500);grid-column:1/-1;">Unable to load products. Please try again later.</p>';
    }
  }

  // Search and Filter Logic
  let searchQuery = '';
  let currentMaterial = 'all';

  function renderProducts() {
    let filtered = allProducts;

    // Filter by Category
    if (currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Filter by Material
    if (currentMaterial !== 'all') {
      filtered = filtered.filter(p => p.material && p.material.includes(currentMaterial));
    }

    // Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        (p.material && p.material.toLowerCase().includes(lowerQuery)) ||
        (p.origin && p.origin.toLowerCase().includes(lowerQuery))
      );
    }

    if (filtered.length === 0) {
      productGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    productGrid.innerHTML = filtered.map(product => `
      <div class="product-card group" data-category="${product.category}">
        <div class="product-card-image">
          <span class="product-card-category">${product.category}</span>
          <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
          <button class="wishlist-toggle" data-product-id="${product.id}" aria-label="Add to Wishlist">
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
          <h3 class="product-card-name">${product.name}</h3>
          <div class="product-card-meta">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              ${product.origin}
            </span>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm3-4H8v-2h7v2zm0-4H8V7h7v2z"/>
              </svg>
              ${product.material}
            </span>
          </div>
          <p class="product-card-moq">MOQ: ${product.moq} units</p>
          <div class="product-card-footer" style="flex-direction: column; gap: 10px;">
            <a href="product.html?id=${product.id}" class="product-card-link" style="width: 100%; justify-content: center;">
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="event.preventDefault(); window.cart.addItem({id: '${product.id}', name: '${product.name.replace(/'/g, "\\'")}', category: '${product.category}'})">
              Add to Inquiry Bag
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Update active filter button
  function updateActiveFilter() {
    categoryFilter.querySelectorAll('.filter-btn').forEach(btn => {
      const btnCategory = btn.dataset.category;
      if (btnCategory === currentCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Handle filter button clicks
  categoryFilter.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      currentCategory = e.target.dataset.category;
      searchQuery = ''; // Reset search logic if category changes? Or keep it? Let's keep filters independent for now, but usually clear search or refine.
      // Let's NOT clear search query to allow "Brass" + "Lamp". But UI might get confusing.
      // For this simple UI, let's keep them combined.
      // Update toggle state
      updateActiveFilter();

      // Update URL
      const newUrl = currentCategory === 'all'
        ? window.location.pathname
        : `${window.location.pathname}?category=${currentCategory}`;
      window.history.pushState({}, '', newUrl);

      renderProducts();
    }
  });

  // Handle Material Filter Dropdown
  const materialSelect = document.getElementById('materialSelect');
  if (materialSelect) {
    materialSelect.addEventListener('change', (e) => {
      currentMaterial = e.target.value;
      renderProducts();
    });
  }

  // Handle Search Input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderProducts();
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
                        <img id="qvImage" src="" alt="">
                    </div>
                    <div class="quick-view-details">
                        <span id="qvCategory" class="text-terracotta" style="font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;"></span>
                        <h2 id="qvName" style="margin-top:var(--space-2); margin-bottom:var(--space-4);"></h2>
                        <p id="qvDesc" style="color:var(--color-gray-600); font-size:0.95rem; line-height:1.6;"></p>
                        
                        <div style="margin: var(--space-6) 0; padding: var(--space-4); background: var(--color-gray-100); border-radius: var(--radius-md);">
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
    document.getElementById('qvImage').src = product.images[0];
    document.getElementById('qvCategory').textContent = product.category;
    document.getElementById('qvName').textContent = product.name;
    document.getElementById('qvDesc').textContent = product.description;
    document.getElementById('qvMaterial').textContent = product.material;
    document.getElementById('qvOrigin').textContent = product.origin;
    document.getElementById('qvMoq').textContent = product.moq + ' units';
    document.getElementById('qvLink').href = `product.html?id=${product.id}`;

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

  // Load products on page load
  await loadProducts();
});
