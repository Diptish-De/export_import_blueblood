/**
 * Wishlist JS - Handles local wishlist storage and UI updates
 */

document.addEventListener('DOMContentLoaded', () => {
    initWishlist();
});

function initWishlist() {
    updateWishlistCount();

    // Single Product Page Button
    const singleWishlistBtn = document.getElementById('wishlistBtn');
    if (singleWishlistBtn) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (productId) {
            const wishlist = getWishlist();
            if (wishlist.includes(productId)) {
                singleWishlistBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-terracotta)" stroke="var(--color-terracotta)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>
                    In Wishlist
                `;
            }
            singleWishlistBtn.onclick = (e) => {
                e.preventDefault();
                toggleWishlist(productId);
                location.reload();
            };
        }
    }

    // delegated event listeners for dynamic content
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.wishlist-toggle');
        if (btn) {
            e.preventDefault();
            const productId = btn.dataset.productId;
            toggleWishlist(productId, btn);
        }

        const viewBtn = e.target.closest('#wishlistToggle');
        if (viewBtn) {
            e.preventDefault();
            showWishlistModal();
        }
    });

    setupNavbarWishlist();
}

function getWishlist() {
    const list = localStorage.getItem('blueblood_wishlist');
    return list ? JSON.parse(list) : [];
}

function toggleWishlist(productId, btn) {
    let wishlist = getWishlist();
    const index = wishlist.indexOf(productId);

    if (index === -1) {
        wishlist.push(productId);
        if (btn) btn.classList.add('active');
        showToast('Added to wishlist');
    } else {
        wishlist.splice(index, 1);
        if (btn) btn.classList.remove('active');
        showToast('Removed from wishlist');
    }

    localStorage.setItem('blueblood_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
}

function updateWishlistCount() {
    const wishlist = getWishlist();
    const badges = document.querySelectorAll('.wishlist-badge');
    badges.forEach(badge => {
        badge.textContent = wishlist.length;
        badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
    });
}

function setupNavbarWishlist() {
    const cartToggle = document.getElementById('cartToggle');
    if (cartToggle && !document.getElementById('wishlistToggle')) {
        const wishlistBtn = document.createElement('button');
        wishlistBtn.id = 'wishlistToggle';
        wishlistBtn.className = 'wishlist-toggle-nav';
        wishlistBtn.setAttribute('aria-label', 'View Wishlist');
        wishlistBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
            </svg>
            <span class="wishlist-badge">0</span>
        `;
        cartToggle.parentNode.insertBefore(wishlistBtn, cartToggle);
        updateWishlistCount();
    }
}

async function showWishlistModal() {
    const wishlist = getWishlist();
    let modal = document.getElementById('wishlist-modal');
    if (!modal) {
        modal = createWishlistModal();
        document.body.appendChild(modal);
    }
    modal.classList.add('active');
    const container = modal.querySelector('.wishlist-items');
    if (wishlist.length === 0) {
        container.innerHTML = `<div class="text-center" style="padding: 2rem; color: var(--color-gray-500);">Your wishlist is empty.</div>`;
    } else {
        container.innerHTML = `<div class="loader-small"></div>`;
        try {
            const response = await fetch('data/products.json');
            const products = await response.json();
            const wishlistProducts = products.filter(p => wishlist.includes(p.id.toString()));
            container.innerHTML = wishlistProducts.map(product => `
                <div class="wishlist-item" data-id="${product.id}">
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div class="wishlist-item-info">
                        <h4>${product.name}</h4>
                        <p>${product.category}</p>
                    </div>
                    <div class="wishlist-item-actions">
                        <a href="product.html?id=${product.id}" class="btn-view">View</a>
                        <button class="btn-remove" onclick="window.removeFromWishlist('${product.id}')">&times;</button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = `<p>Error loading wishlist items.</p>`;
        }
    }
    modal.querySelector('.modal-close').onclick = () => modal.classList.remove('active');
    modal.querySelector('.modal-overlay').onclick = () => modal.classList.remove('active');
}

function createWishlistModal() {
    const modal = document.createElement('div');
    modal.id = 'wishlist-modal';
    modal.className = 'modal-container';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content wishlist-content">
            <div class="modal-header">
                <h3>My Wishlist</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="wishlist-items scrollbar-custom"></div>
        </div>
    `;
    return modal;
}

window.removeFromWishlist = function (id) {
    toggleWishlist(id);
    showWishlistModal();
};

function showToast(message) {
    let toast = document.querySelector('.wishlist-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'wishlist-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2000);
}
