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

    // Render products based on current filter
    function renderProducts() {
        const filtered = currentCategory === 'all'
            ? allProducts
            : allProducts.filter(p => p.category === currentCategory);

        if (filtered.length === 0) {
            productGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        productGrid.innerHTML = filtered.map(product => `
      <div class="product-card" data-category="${product.category}">
        <div class="product-card-image">
          <span class="product-card-category">${product.category}</span>
          <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
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
          <div class="product-card-footer">
            <a href="product.html?id=${product.id}" class="product-card-link">
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
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

            // Update URL without reload
            const newUrl = currentCategory === 'all'
                ? window.location.pathname
                : `${window.location.pathname}?category=${currentCategory}`;
            window.history.pushState({}, '', newUrl);

            updateActiveFilter();
            renderProducts();
        }
    });

    // Load products on page load
    await loadProducts();
});
