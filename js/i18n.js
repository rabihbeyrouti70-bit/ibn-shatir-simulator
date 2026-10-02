/**
 * 🌐 i18n.js
 * نظام التدويل متعدد اللغات (عربي / إنجليزي) لمحاكي ابن الشاطر الفلكي
 * Lightweight internationalization engine with embedded offline dictionary fallback
 */

const LOCALES = {
    ar: null,
    en: null
};

class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('ibn_shatir_lang') || 'ar';
        this.translations = {};
        this.initialized = false;
    }

    async init() {
        // Load default locale
        await this.loadLocale('ar');
        if (this.currentLang !== 'ar') {
            await this.loadLocale(this.currentLang);
        }
        this.applyLanguage(this.currentLang);
        this.initialized = true;
    }

    async loadLocale(lang) {
        if (this.translations[lang]) return;
        try {
            const resp = await fetch(`./locales/${lang}.json`);
            if (resp.ok) {
                this.translations[lang] = await resp.json();
            }
        } catch (e) {
            console.warn(`[i18n] Could not load ./locales/${lang}.json, using fallback`, e);
        }
    }

    t(key, fallback = '') {
        const dict = this.translations[this.currentLang] || this.translations['ar'] || {};
        return dict[key] !== undefined ? dict[key] : (fallback || key);
    }

    async setLanguage(lang) {
        if (lang !== 'ar' && lang !== 'en') return;
        await this.loadLocale(lang);
        this.currentLang = lang;
        localStorage.setItem('ibn_shatir_lang', lang);
        this.applyLanguage(lang);
    }

    toggleLanguage() {
        const next = this.currentLang === 'ar' ? 'en' : 'ar';
        return this.setLanguage(next);
    }

    applyLanguage(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (text) {
                // If element has icon or child element, update text nodes or innerText
                if (el.children.length === 0) {
                    el.textContent = text;
                } else {
                    // Try to preserve leading emoji/icon if present
                    el.innerHTML = text;
                }
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const ph = this.t(key);
            if (ph) el.setAttribute('placeholder', ph);
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const tt = this.t(key);
            if (tt) el.setAttribute('title', tt);
        });

        // Update language switcher button text
        const switchBtn = document.getElementById('btnLangToggle');
        if (switchBtn) {
            switchBtn.textContent = this.t('lang.switch');
        }

        // Dispatch language change event for 3D/2D canvas refresh
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
}

// Global instance
export const i18n = new I18nManager();
if (typeof window !== 'undefined') {
    window.i18n = i18n;
}
