/**
 * Cart / Inquiry Bag System
 * Handles multi-product selection for WhatsApp inquiry
 */

export class InquiryCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('inquiry_cart')) || [];
        this.updateBadge();
    }

    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                category: product.category,
                quantity: quantity
            });
        }
        this.save();
        this.showNotification(`Added ${product.name} to inquiry bag`);
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.save();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.save();
        }
    }

    getItems() {
        return this.items;
    }

    clear() {
        this.items = [];
        this.save();
    }

    save() {
        localStorage.setItem('inquiry_cart', JSON.stringify(this.items));
        this.updateBadge();
        const event = new CustomEvent('cartUpdated', { detail: { items: this.items } });
        window.dispatchEvent(event);
    }

    updateBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    generateWhatsAppMessage(phoneNumber) {
        if (this.items.length === 0) return null;

        let message = `*Inquiry from Blueblood Exports Website*\n\n`;
        message += `Hello, I am interested in the following artefacts:\n\n`;

        this.items.forEach((item, index) => {
            message += `${index + 1}. *${item.name}* (${item.category})\n`;
            message += `   Quantity: ${item.quantity}\n\n`;
        });

        message += `Please provide a quote and estimated delivery timeline.`;

        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    }

    showNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="cart-notification-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${text}</span>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global instance
window.cart = new InquiryCart();
