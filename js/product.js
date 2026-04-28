/**
 * Product Detail Page JavaScript
 * Handles product data loading and WhatsApp integration
 */

// WhatsApp Configuration - Update this number for production
const WHATSAPP_NUMBER = '917812028686';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'catalogue.html';
        return;
    }

    // Variables
    let currentProduct = null;
    let currentCurrency = localStorage.getItem('blueblood_currency') || 'INR';

    const exchangeRates = {
        'INR': { rate: 1, symbol: '₹' },
        'USD': { rate: 0.012, symbol: '$' },
        'EUR': { rate: 0.011, symbol: '€' },
        'GBP': { rate: 0.0094, symbol: '£' },
        'AED': { rate: 0.044, symbol: 'د.إ ' }
    };

    function formatPrice(priceInINR) {
        if (!priceInINR && priceInINR !== 0) return 'Contact for Price';
        const currency = exchangeRates[currentCurrency] || exchangeRates['INR'];
        
        if (typeof priceInINR === 'string' && priceInINR.includes('-')) {
            return priceInINR.split('-').map(p => {
                const converted = (parseFloat(p.replace(/,/g, '')) * currency.rate).toFixed(currentCurrency === 'INR' ? 0 : 2);
                return `${currency.symbol}${converted}`;
            }).join(' - ');
        }
        
        const converted = (parseFloat(priceInINR.toString().replace(/,/g, '')) * currency.rate).toFixed(currentCurrency === 'INR' ? 0 : 2);
        return `${currency.symbol}${converted}`;
    }

    document.addEventListener('currencyChanged', (e) => {
        currentCurrency = e.detail;
        if (currentProduct) renderProduct();
    });

    // Load product data
    async function loadProduct() {
        try {
            const response = await fetch('public/data/products.json');
            if(!response.ok) throw new Error("Could not load products");
            const products = await response.json();
            currentProduct = products.find(p => p.id === productId);

            if (!currentProduct) {
                // Try searching in grouped variants
                currentProduct = products.find(p => p.variants && p.variants.find(v => v.id === productId));
                if (currentProduct) {
                    const variant = currentProduct.variants.find(v => v.id === productId);
                    // Merge variant data into a flat object for simpler rendering
                    currentProduct = { ...currentProduct, ...variant, id: variant.id }; 
                }
            }

            if (!currentProduct) {
                window.location.href = 'catalogue.html';
                return;
            }

            renderProduct();
            await loadRelatedProducts();
        } catch (error) {
            console.error('Error loading product:', error);
            // Fallback for relative paths
            try {
                const response = await fetch('data/products.json');
                const products = await response.json();
                currentProduct = products.find(p => p.id === productId);
                if (currentProduct) renderProduct();
            } catch(e2) {}
        }
    }

    // Render product details
    function renderProduct() {
        if (!currentProduct) return;
        document.title = `${currentProduct.name} - Handcrafted Indian ${currentProduct.category || 'Artefact'} | Blueblood Exports`;

        // Text Content
        document.getElementById('breadcrumbName').textContent = currentProduct.name;
        document.getElementById('productName').textContent = currentProduct.name;
        document.getElementById('productOrigin').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px; vertical-align:middle;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg> ${currentProduct.origin || 'India'}`;
        document.getElementById('productDesc').textContent = currentProduct.description || currentProduct.short_desc || 'Authentic handcrafted product from India.';

        // Specs Table
        document.getElementById('productMaterial').textContent = currentProduct.material || 'Premium Brass/Wood';
        document.getElementById('productHsCode').textContent = currentProduct.hs_code || 'N/A';
        document.getElementById('productDimensions').textContent = currentProduct.dimensions || 'Standard Export Size';
        document.getElementById('productWeight').textContent = currentProduct.weight || 'Contact for Weight';
        document.getElementById('productCat2').textContent = currentProduct.category || 'Handicrafts';
        
        // Price
        const priceEl = document.getElementById('productPrice');
        if (priceEl) {
            priceEl.textContent = currentProduct.price ? formatPrice(currentProduct.price) : (currentProduct.price_range ? formatPrice(currentProduct.price_range) : 'Contact for Price');
        }
        
        const weightNum = currentProduct.weight ? parseFloat(currentProduct.weight.toString().replace(/[^0-9.]/g, '')) : 0;
        const calculatedCBM = weightNum > 0 ? (weightNum * 0.002).toFixed(3) : '0.050';
        document.getElementById('productCBM').textContent = `${calculatedCBM} CBM (Est.)`;
        document.getElementById('productMOQ').textContent = `${currentProduct.moq || 1} units`;

        // Images
        const mImg = document.getElementById('mainImage');
        const firstImg = currentProduct.images ? currentProduct.images[0] : (currentProduct.image || '');
        mImg.src = firstImg;
        mImg.alt = `${currentProduct.name} - Handcrafted ${currentProduct.material || 'Indian'} ${currentProduct.category || 'Artefact'} for Wholesale Export | Blueblood Exports India`;
        mImg.title = `${currentProduct.name} - Buy Premium Indian ${currentProduct.category || 'Handicraft'} from Blueblood Exports`;
        mImg.onclick = () => showLightbox(mImg.src);

        const thumbs = document.getElementById('thumbnails');
        if (currentProduct.images && currentProduct.images.length > 1) {
            thumbs.innerHTML = currentProduct.images.map((img, index) => `
                <div class="product-thumbnail ${index === 0 ? 'active' : ''}" onclick="updateMainImage('${img}', this)">
                    <img src="${img}" alt="${currentProduct.name} - View ${index + 1} - Indian ${currentProduct.material || currentProduct.category} Handcrafted Artefact" title="${currentProduct.name} Image ${index + 1}">
                </div>
            `).join('');
        } else {
            thumbs.innerHTML = '';
        }

        // Actions
        const actionsDiv = document.getElementById('productActions');
        if (actionsDiv) {
            const moq = currentProduct.moq || 1;
            actionsDiv.innerHTML = `
                <div class="quantity-selector" style="display: flex; align-items: center; justify-content: space-between; background: var(--color-white); border: 1px solid var(--color-gray-200); padding: 10px 15px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); margin-bottom: var(--space-2);">
                    <label style="font-family: var(--font-heading); font-size: 0.9rem; font-weight: 700; color: var(--color-gray-700); text-transform: uppercase; letter-spacing: 0.5px;">Quantity:</label>
                    <div class="quantity-input-group" style="display: flex; align-items: center; gap: 8px;">
                        <button class="qty-btn" onclick="updateDetailedQty(-1)" style="width: 32px; height: 32px; border: 1px solid var(--color-gray-300); background: var(--color-ivory); color: var(--color-maroon); border-radius: 6px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">−</button>
                        <input type="number" id="detailQtyInput" value="${moq}" min="${moq}" style="width: 60px; text-align: center; border: none; background: transparent; font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: var(--color-maroon);">
                        <button class="qty-btn" onclick="updateDetailedQty(1)" style="width: 32px; height: 32px; border: 1px solid var(--color-gray-300); background: var(--color-ivory); color: var(--color-maroon); border-radius: 6px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                </div>
                <button class="btn btn-whatsapp btn-lg" onclick="inquiryNowDetailed()" style="width: 100%; justify-content: center; gap: 10px; font-weight: 600; padding: 14px; border-radius: 12px; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2);">
                    INQUIRE NOW
                </button>
                <button class="btn btn-secondary btn-lg" onclick="addToBagDetailed()" style="width: 100%; background: var(--color-white); border: 2px solid var(--color-maroon); color: var(--color-maroon); font-weight: 700; padding: 14px; border-radius: 12px;">
                    ADD TO INQUIRY BAG
                </button>
            `;
        }

        // Detailed Page specific functions
        window.updateDetailedQty = (val) => {
            const input = document.getElementById('detailQtyInput');
            const moq = currentProduct.moq || 1;
            input.value = Math.max(moq, parseInt(input.value) + val);
        };

        window.inquiryNowDetailed = () => {
            const qty = document.getElementById('detailQtyInput').value;
            const msg = `Hello, I'm interested in ${qty} units of ${currentProduct.name} (ID: ${currentProduct.id}).`;
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
        };

        window.addToBagDetailed = () => {
            const qty = parseInt(document.getElementById('detailQtyInput').value);
            if (window.cart) {
                window.cart.addItem({
                    id: currentProduct.id,
                    name: currentProduct.name,
                    category: currentProduct.category
                }, qty);
            }
        };
    }

    window.updateMainImage = (src, thumb) => {
        document.getElementById('mainImage').src = src;
        document.querySelectorAll('.product-thumbnail').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
    };

    function showLightbox(src) {
        let lb = document.getElementById('lightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'lightbox';
            lb.className = 'lightbox';
            lb.innerHTML = `<div class="lightbox-content"><img class="lightbox-image" src="${src}"></div>`;
            document.body.appendChild(lb);
            lb.onclick = () => lb.classList.remove('active');
        } else {
            lb.querySelector('.lightbox-image').src = src;
        }
        lb.classList.add('active');
    }

    window.updateMainImage = (src, thumb) => {
        document.getElementById('mainImage').src = src;
        document.querySelectorAll('.product-thumbnail').forEach(t => t.classList.remove('active')); // Changed from .thumbnail to .product-thumbnail
        thumb.classList.add('active');
    };

    // Start loading
    await loadProduct();

    // Load Related Products
    async function loadRelatedProducts() {
        try {
            if (!currentProduct) return;
            // Try both paths
            let allProducts = [];
            try {
                const r = await fetch('public/data/products.json');
                allProducts = await r.json();
            } catch(e) {
                const r = await fetch('data/products.json');
                allProducts = await r.json();
            }

            // Filter by same category, exclude current, limit to 4
            const related = allProducts
                .filter(p => (p.category === currentProduct.category || p.mainCategory === currentProduct.category) && p.id !== currentProduct.id)
                .slice(0, 4);

            const grid = document.getElementById('relatedProductsGrid');
            if (grid && related.length > 0) {
                grid.innerHTML = related.map(prod => `
                    <div class="product-card" style="border: 1px solid var(--color-gray-200); border-radius: 12px; overflow: hidden; background: var(--color-white); transition: all 0.3s; height: 100%; display: flex; flex-direction: column;">
                        <div class="product-card-image" style="position: relative; height: 200px; overflow: hidden;">
                            <img src="${prod.images ? prod.images[0] : prod.image}" alt="${prod.name} - Handcrafted Indian ${prod.category || 'Artefact'} for Export | Blueblood Exports" title="${prod.name} - Indian Handicraft" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                        </div>
                        <div class="product-card-content" style="padding: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                            <h3 style="font-family: var(--font-heading); font-size: 0.9rem; color: var(--color-gray-800); margin-bottom: 10px;">${prod.name}</h3>
                            <a href="product.html?id=${prod.id}" class="btn btn-secondary" style="width:100%; font-size: 0.8rem; padding: 10px;">Details</a>
                        </div>
                    </div>
                `).join('');
            } else if (grid) {
                grid.closest('section').style.display = 'none';
            }

        } catch (e) {
            console.error("Error loading related products", e);
        }
    }

    await loadRelatedProducts();
});
