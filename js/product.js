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

    // DOM Elements
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.getElementById('thumbnails');
    const productName = document.getElementById('productName');
    const productCategory = document.getElementById('productCategory');
    const productOrigin = document.getElementById('productOrigin');
    const productDesc = document.getElementById('productDesc');
    const productMaterial = document.getElementById('productMaterial');
    const productDimensions = document.getElementById('productDimensions');
    const productWeight = document.getElementById('productWeight');
    const productCat2 = document.getElementById('productCat2');
    const productMOQ = document.getElementById('productMOQ');
    const breadcrumbName = document.getElementById('breadcrumbName');
    const quantityInput = document.getElementById('quantityInput');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const whatsappBtn = document.getElementById('whatsappBtn');

    let currentProduct = null;

    // Load product data
    async function loadProduct() {
        try {
            const response = await fetch('data/products.json');
            const products = await response.json();
            currentProduct = products.find(p => p.id === productId);

            if (!currentProduct) {
                window.location.href = 'catalogue.html';
                return;
            }

            renderProduct();
        } catch (error) {
            console.error('Error loading product:', error);
        }
    }

    // Render product details
    function renderProduct() {
        document.title = `${currentProduct.name} | Blueblood Exports`;

        function displayProduct(product) {
            // ... (breadcrumb and title logic)
            document.getElementById('breadcrumbName').textContent = product.name; // Changed from breadcrumbProduct to breadcrumbName
            document.getElementById('productName').textContent = product.name;
            document.getElementById('productOrigin').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg> ${product.origin}`;
            document.getElementById('productDesc').textContent = product.description; // Changed from productDescription to productDesc

            // Details
            document.getElementById('productMaterial').textContent = product.material || 'N/A';
            document.getElementById('productDimensions').textContent = product.dimensions || 'N/A';
            document.getElementById('productWeight').textContent = product.weight || 'N/A';
            document.getElementById('productCategory').textContent = product.category || 'N/A';
            document.getElementById('productCat2').textContent = product.category || 'N/A';
            document.getElementById('productMOQ').textContent = `${product.moq} units`;

            // Generate random/dummy CBM based on weight for effect if not present
            const weightNum = product.weight ? parseFloat(product.weight.toString().replace(/[^0-9.]/g, '')) : 0;
            const calculatedCBM = weightNum > 0 ? (weightNum * 0.002).toFixed(3) : '0.050';
            document.getElementById('productCBM').textContent = `${calculatedCBM} CBM (Est.)`;

            // Images
            const mainImage = document.getElementById('mainImage');
            mainImage.src = product.images[0];
            mainImage.alt = product.name;

            // Lightbox Trigger
            mainImage.style.cursor = 'zoom-in';
            mainImage.onclick = () => showLightbox(mainImage.src);

            const thumbnails = document.getElementById('thumbnails');
            thumbnails.innerHTML = product.images.map((img, index) => `
      <div class="product-thumbnail ${index === 0 ? 'active' : ''}" onclick="updateMainImage('${img}', this)">
        <img src="${img}" alt="${product.name} ${index + 1}">
      </div>
    `).join('');

            // Update WhatsApp Inquiry to include "Add to Bag"
            const inquiryActions = document.getElementById('productActions');
            if (inquiryActions) {
                inquiryActions.innerHTML = `
                <div class="quantity-selector" style="display: flex; align-items: center; justify-content: space-between; background: var(--color-white); border: 1px solid var(--color-gray-200); padding: 10px 15px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); margin-bottom: var(--space-2);">
                    <label style="font-family: var(--font-heading); font-size: 0.9rem; font-weight: 700; color: var(--color-gray-700); text-transform: uppercase; letter-spacing: 0.5px;">Quantity:</label>
                    <div class="quantity-input-group" style="display: flex; align-items: center; gap: 8px;">
                        <button class="qty-btn" onclick="updateQty(-1)" style="width: 32px; height: 32px; border: 1px solid var(--color-gray-300); background: var(--color-ivory); color: var(--color-maroon); border-radius: 6px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">−</button>
                        <input type="number" id="quantityInput" value="${product.moq}" min="${product.moq}" style="width: 60px; text-align: center; border: 1.5px solid var(--color-gray-100); background: var(--color-gray-50); font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: var(--color-maroon); border-radius: 4px; padding: 4px 0;">
                        <button class="qty-btn" onclick="updateQty(1)" style="width: 32px; height: 32px; border: 1px solid var(--color-gray-300); background: var(--color-ivory); color: var(--color-maroon); border-radius: 6px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">+</button>
                    </div>
                </div>
                <button class="btn btn-whatsapp btn-lg" onclick="inquiryNow()" style="width: 100%; justify-content: center; gap: 10px; font-weight: 600; padding: 14px; border-radius: 12px; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    INQUIRE NOW
                </button>
                <button class="btn btn-secondary btn-lg" onclick="addToBag()" style="width: 100%; background: var(--color-white); border: 2px solid var(--color-maroon); color: var(--color-maroon); font-weight: 700; padding: 14px; border-radius: 12px; transition: all 0.3s; letter-spacing: 0.5px;">
                    ADD TO INQUIRY BAG
                </button>
                <button class="btn btn-outline" onclick="window.wishlist.toggle('${product.id}')" style="width: 100%; border: 1px solid var(--color-gray-300); color: var(--color-gray-600); background: transparent; padding: 10px; border-radius: var(--radius-sm); font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    SAVE TO WISHLIST
                </button>
            `;
            } else {
                // Fallback if .product-actions is not found, update existing buttons
                quantityInput.value = product.moq;
                quantityInput.min = product.moq;
                // The whatsappBtn.href will be updated by updateWhatsAppLink()
            }


            // Scoped functions
            window.updateQty = (val) => {
                const input = document.getElementById('quantityInput'); // Changed from quantity to quantityInput
                input.value = Math.max(product.moq, parseInt(input.value) + val);
                updateWhatsAppLink(); // Call to update WhatsApp link after quantity change
            };

            window.inquiryNow = () => {
                const qty = document.getElementById('quantityInput').value; // Changed from quantity to quantityInput
                const message = `Hello, I'm interested in ${qty} units of ${product.name} (ID: ${product.id}).`;
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank'); // Used WHATSAPP_NUMBER
            };

            window.addToBag = () => {
                const qty = parseInt(document.getElementById('quantityInput').value); // Changed from quantity to quantityInput
                // Assuming window.cart is defined elsewhere for cart functionality
                if (window.cart && typeof window.cart.addItem === 'function') {
                    window.cart.addItem({
                        id: product.id,
                        name: product.name,
                        category: product.category
                    }, qty);
                    alert(`${qty} x ${product.name} added to inquiry bag!`); // Simple feedback
                } else {
                    console.warn("Cart functionality (window.cart.addItem) not available.");
                    alert("Inquiry bag feature is not fully implemented yet.");
                }
            };
        }

        displayProduct(currentProduct); // Call the new displayProduct function
        updateWhatsAppLink(); // Ensure the original WhatsApp link is updated if buttons are not replaced
    }

    function showLightbox(src) {
        let lb = document.getElementById('lightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'lightbox';
            lb.className = 'lightbox';
            lb.innerHTML = `
                <div class="lightbox-content">
                    <span class="lightbox-close">&times;</span>
                    <img class="lightbox-image" src="${src}">
                </div>
            `;
            document.body.appendChild(lb);
            lb.onclick = (e) => {
                if (e.target.className !== 'lightbox-image') lb.classList.remove('active');
            };
            // Add event listener for close button if it exists
            const closeBtn = lb.querySelector('.lightbox-close');
            if (closeBtn) {
                closeBtn.onclick = () => lb.classList.remove('active');
            }
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

    // Quantity controls
    decreaseBtn.addEventListener('click', () => {
        const current = parseInt(quantityInput.value) || currentProduct.moq;
        if (current > 1) {
            quantityInput.value = current - 1;
            updateWhatsAppLink();
        }
    });

    increaseBtn.addEventListener('click', () => {
        const current = parseInt(quantityInput.value) || currentProduct.moq;
        quantityInput.value = current + 1;
        updateWhatsAppLink();
    });

    quantityInput.addEventListener('change', () => {
        if (parseInt(quantityInput.value) < 1 || isNaN(parseInt(quantityInput.value))) {
            quantityInput.value = currentProduct.moq;
        }
        updateWhatsAppLink();
    });

    // Generate WhatsApp link with product details
    function updateWhatsAppLink() {
        if (!currentProduct) return;

        const quantity = quantityInput.value;
        const message = `Hello, I am interested in the following artefact:

Product Name: ${currentProduct.name}
Quantity: ${quantity}
Material: ${currentProduct.material}
Origin: ${currentProduct.origin}

Please share pricing, export details, and delivery timeline.`;

        const encodedMessage = encodeURIComponent(message);
        whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    }

    // Load product on page init
    await loadProduct();

    // Load Related Products
    async function loadRelatedProducts() {
        try {
            if (!currentProduct) return;

            const response = await fetch('data/products.json');
            const allProducts = await response.json();

            // Filter by same category, exclude current, limit to 4
            const related = allProducts
                .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
                .slice(0, 4);

            const grid = document.getElementById('relatedProductsGrid');
            if (grid && related.length > 0) {
                grid.innerHTML = related.map(product => `
                    <div class="product-card">
                        <div class="product-card-image">
                            <span class="product-card-category">${product.category}</span>
                            <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                        </div>
                        <div class="product-card-content">
                            <h3 class="product-card-name" style="font-size: 1rem;">${product.name}</h3>
                            <a href="product.html?id=${product.id}" class="btn btn-outline btn-sm" style="width:100%; margin-top:10px;">View Details</a>
                        </div>
                    </div>
                `).join('');
            } else if (grid) {
                grid.parentElement.style.display = 'none'; // Hide section if no related
            }

        } catch (e) {
            console.error("Error loading related products", e);
        }
    }

    await loadRelatedProducts();
});
