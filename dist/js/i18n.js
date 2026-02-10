/**
 * Theme and Language Switcher
 * Blueblood Exports
 */

// Initialize theme and language on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeLanguage();
});

/* ============================================
   THEME SWITCHER
   ============================================ */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const icon = themeBtn.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        themeBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
}

/* ============================================
   LANGUAGE SWITCHER
   ============================================ */
let translations = {};
let currentLang = 'en';

async function initializeLanguage() {
    // Load translations
    try {
        const response = await fetch('/data/translations.json');
        translations = await response.json();

        // Get saved language or default to English
        currentLang = localStorage.getItem('language') || 'en';

        // Set HTML dir for RTL languages
        if (currentLang === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', currentLang);
        }

        // Apply translations
        applyTranslations();
        updateLanguageButton();
    } catch (error) {
        console.error('Failed to load translations:', error);
    }
}

function switchLanguage(lang) {
    if (!translations[lang]) return;

    currentLang = lang;
    localStorage.setItem('language', lang);

    // Update HTML attributes
    document.documentElement.setAttribute('lang', lang);

    if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }

    applyTranslations();
    updateLanguageButton();

    // Close language dropdown
    const dropdown = document.querySelector('.lang-dropdown');
    if (dropdown) dropdown.classList.remove('active');
}

function applyTranslations() {
    const t = translations[currentLang];
    if (!t) return;

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = t;

        for (const k of keys) {
            value = value[k];
            if (!value) break;
        }

        if (value) {
            element.textContent = value;
        }
    });
}

function updateLanguageButton() {
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        const flagMap = {
            'en': '🇬🇧',
            'hi': '🇮🇳',
            'ar': '🇦🇪'
        };
        const nameMap = {
            'en': 'EN',
            'hi': 'हिं',
            'ar': 'عر'
        };

        const flag = langBtn.querySelector('.lang-flag');
        const name = langBtn.querySelector('.lang-name');

        if (flag) flag.textContent = flagMap[currentLang];
        if (name) name.textContent = nameMap[currentLang];
    }
}

// Toggle language dropdown
function toggleLanguageDropdown() {
    const dropdown = document.querySelector('.lang-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-selector')) {
        const dropdown = document.querySelector('.lang-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});
