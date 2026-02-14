/**
 * Theme and Language Switcher (Unified)
 * Blueblood Exports
 */

// Global State
let translations = {};
let currentLang = 'en';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeLanguage();
});

/* ============================================
   THEME LOGIC (Exposed to window)
   ============================================ */
window.initializeTheme = function () {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

window.toggleTheme = function () {
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
    }
}

/* ============================================
   LANGUAGE LOGIC (Exposed to window)
   ============================================ */
window.initializeLanguage = async function () {
    try {
        const response = await fetch('/data/translations.json');
        translations = await response.json();

        // Auto-detect language if not set
        if (!localStorage.getItem('language')) {
            const browserLang = navigator.language.split('-')[0];
            if (['hi', 'ar'].includes(browserLang)) {
                currentLang = browserLang;
            } else {
                currentLang = 'en';
            }
        } else {
            currentLang = localStorage.getItem('language');
        }

        applyLanguageSettings(currentLang);
        applyTranslations();
        updateLanguageButton();
    } catch (error) {
        console.error('Failed to load translations:', error);
    }
}

window.switchLanguage = function (lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('language', lang);

    applyLanguageSettings(lang);
    applyTranslations();
    updateLanguageButton();

    // Close dropdown
    const dropdown = document.querySelector('.lang-dropdown');
    if (dropdown) dropdown.classList.remove('active');
}

function applyLanguageSettings(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}

function applyTranslations() {
    const t = translations[currentLang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = t;

        for (const k of keys) {
            value = value ? value[k] : null;
        }

        if (value) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = value;
            } else {
                element.textContent = value;
            }
        }
    });
}

function updateLanguageButton() {
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        const flagMap = { 'en': '🇬🇧', 'hi': '🇮🇳', 'ar': '🇦🇪' };
        const nameMap = { 'en': 'EN', 'hi': 'हिं', 'ar': 'عر' };

        const flag = langBtn.querySelector('.lang-flag');
        const name = langBtn.querySelector('.lang-name');

        if (flag) flag.textContent = flagMap[currentLang];
        if (name) name.textContent = nameMap[currentLang];
    }
}

window.toggleLanguageDropdown = function () {
    const dropdown = document.querySelector('.lang-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// Global click listener to close dropdowns
document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-selector')) {
        const dropdown = document.querySelector('.lang-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});
