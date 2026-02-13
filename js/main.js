/**
 * Main JavaScript - Common functionality
 * Blueblood Exports
 */

// Import styles for Vite bundling
import '../css/index.css';
import '../css/components.css';
import '../css/dark-theme.css';
import '../css/theme-toggle.css';

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
  // Page Loader Logic - Show only once per session
  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    // Check if we've already shown the loader in this session
    if (sessionStorage.getItem('blueblood_loaded')) {
      // If already visited, hide immediately
      pageLoader.style.display = 'none';
      pageLoader.remove();
    } else {
      // First visit - show loader
      const minDisplayTime = 800; // 800ms
      const startTime = Date.now();

      window.addEventListener('load', () => {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);

        setTimeout(() => {
          pageLoader.classList.add('loaded');
          // Mark as visited
          sessionStorage.setItem('blueblood_loaded', 'true');

          setTimeout(() => {
            pageLoader.remove();
          }, 600);
        }, remainingTime);
      });
    }
  }

  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navbar = document.getElementById('navbar');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
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

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Intersection Observer for animations
  const animateOnScroll = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  };

  animateOnScroll();
});

// Utility: Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Utility: Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
