// Import styles for Vite bundling
import '../css/index.css';
import '../css/components.css';
import '../css/dark-theme.css';
import '../css/theme-toggle.css';
import '../css/extra-features.css';

// Cart instance is already global from cart.js
// Language instance is already global from i18n.js

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
  // Page Loader Logic - Show only once per session
  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    if (sessionStorage.getItem('blueblood_loaded')) {
      pageLoader.remove();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          pageLoader.classList.add('loaded');
          sessionStorage.setItem('blueblood_loaded', 'true');
          setTimeout(() => pageLoader.remove(), 600);
        }, 400); // Reduced delay for better UX
      });
    }
  }

  // Navbar Logic
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navbar = document.getElementById('navbar');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('.navbar-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // Navbar scroll effect
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Cart Drawer Logic
  const cartToggle = document.getElementById('cartToggle');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCart = document.getElementById('closeCart');
  const sendInquiry = document.getElementById('sendInquiry');

  if (cartToggle && cartDrawer) {
    cartToggle.addEventListener('click', () => {
      cartDrawer.classList.add('active');
      cartOverlay.classList.add('active');
      renderCartItems();
    });

    [closeCart, cartOverlay].forEach(el => {
      if (el) el.addEventListener('click', () => {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
      });
    });

    if (sendInquiry) {
      sendInquiry.addEventListener('click', () => {
        const whatsappUrl = window.cart.generateWhatsAppMessage('917812028686');
        if (whatsappUrl) {
          window.open(whatsappUrl, '_blank');
        } else {
          alert('Your inquiry bag is empty!');
        }
      });
    }
  }

  // Render Cart Items in Drawer
  function renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    const items = window.cart.getItems();
    if (items.length === 0) {
      container.innerHTML = '<div class="text-center" style="padding: 2rem; color: var(--color-gray-500);">Your inquiry bag is empty.</div>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">${item.category}</div>
        </div>
        <div class="cart-item-actions">
           <button class="cart-quantity-btn" onclick="updateCartItem('${item.id}', ${item.quantity - 1})">-</button>
           <span>${item.quantity}</span>
           <button class="cart-quantity-btn" onclick="updateCartItem('${item.id}', ${item.quantity + 1})">+</button>
           <button class="text-terracotta" style="margin-left: 10px;" onclick="window.cart.removeItem('${item.id}')">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polyline points="3 6 5 6 21 6"></polyline>
               <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
             </svg>
           </button>
        </div>
      </div>
    `).join('');
  }

  // Listener for cart updates
  window.addEventListener('cartUpdated', () => {
    renderCartItems();
  });

  // Animation on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

// Global helpers for cart
window.updateCartItem = (id, q) => window.cart.updateQuantity(id, q);

// Language Switcher Helpers
window.toggleLanguageDropdown = () => {
  document.querySelector('.lang-dropdown').classList.toggle('active');
};

window.switchLanguage = (lang) => {
  // Basic implementation for now
  localStorage.setItem('language', lang);
  location.reload(); // Refresh to apply for now, or use i18n logic if complex
};

// Utility: Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
