/**
 * Product Detail Page JavaScript
 * Handles product data loading and WhatsApp integration
 */

// WhatsApp Configuration - Update this number for production
const WHATSAPP_NUMBER = '91XXXXXXXXXX';

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

        // Main content
        mainImage.src = currentProduct.images[0];
        mainImage.alt = currentProduct.name;
        productName.textContent = currentProduct.name;
        productCategory.textContent = currentProduct.category;
        productOrigin.textContent = currentProduct.origin;
        productDesc.textContent = currentProduct.description;
        productMaterial.textContent = currentProduct.material;
        productDimensions.textContent = currentProduct.dimensions;
        productWeight.textContent = currentProduct.weight;
        productCat2.textContent = currentProduct.category;
        productMOQ.textContent = `${currentProduct.moq} units`;
        breadcrumbName.textContent = currentProduct.name;
        quantityInput.value = currentProduct.moq;
        quantityInput.min = 1;

        // Render thumbnails
        thumbnails.innerHTML = currentProduct.images.map((img, idx) => `
      <div class="product-thumbnail ${idx === 0 ? 'active' : ''}" data-image="${img}">
        <img src="${img}" alt="${currentProduct.name} - Image ${idx + 1}">
      </div>
    `).join('');

        // Thumbnail click handlers
        thumbnails.querySelectorAll('.product-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                thumbnails.querySelectorAll('.product-thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                mainImage.src = thumb.dataset.image;
            });
        });

        updateWhatsAppLink();
    }

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
});
