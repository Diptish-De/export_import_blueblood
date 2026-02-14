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
            document.getElementById('productMaterial').textContent = product.material; // Changed from detailMaterial to productMaterial
            document.getElementById('productDimensions').textContent = product.dimensions; // Changed from detailDimensions to productDimensions
            document.getElementById('productWeight').textContent = product.weight; // Changed from detailWeight to productWeight
            document.getElementById('productCategory').textContent = product.category; // Changed from detailCategory to productCategory
            document.getElementById('productMOQ').textContent = `${product.moq} units`; // Changed from detailMOQ to productMOQ

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
            const inquiryActions = document.querySelector('.product-actions'); // Assuming a .product-actions container exists
            if (inquiryActions) {
                inquiryActions.innerHTML = `
                <div class="quantity-selector">
                    <button class="qty-btn" onclick="updateQty(-1)">-</button>
                    <input type="number" id="quantityInput" value="${product.moq}" min="${product.moq}">
                    <button class="qty-btn" onclick="updateQty(1)">+</button>
                </div>
                <button class="btn btn-whatsapp btn-lg" onclick="inquiryNow()">
                    Inquire Now
                </button>
                <button class="btn btn-secondary btn-lg" onclick="addToBag()">
                    Add to Inquiry Bag
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
