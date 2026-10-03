/**
 * 🌐 i18n.js
 * نظام التدويل متعدد اللغات (عربي / إنجليزي) لمحاكي ابن الشاطر الفلكي
 * Lightweight internationalization engine with embedded offline dictionary fallback
 */

const AR_LOCALE = {
  "app.title": "المحاكي الفلكي المقارن: بطلميوس وابن الشاطر الدمشقي (ت 777هـ)",
  "app.subtitle": "مقارنة تفاعلية متزامنة زمنياً بين النماذج الفلكية البطلمية وإصلاحات ابن الشاطر",
  "tab.cosmos": "🪐 هيأة الأفلاك التسعة (Cosmos)",
  "tab.sun": "☀️ مقارنة نموذج الشمس (Sun)",
  "tab.moon": "🌙 مقارنة نموذج القمر (Moon)",
  "tab.planets": "🪐 نماذج الكواكب وإلغاء معدل المسير (Planets)",
  "tab.study": "📜 الدراسة المقارنة والتوثيق (Study)",
  "tab.revolution": "⚖️ ثورة كوبرنيكوس وكيبلر (Revolution)",
  "tab.3d": "🌌 المحاكي ثلاثي الأبعاد 3D (Cosmos 3D)",
  "btn.play": "▶️ تشغيل المحاكاة",
  "btn.pause": "⏸️ إيقاف مؤقت",
  "btn.now": "⏱️ الوقت الحالي",
  "label.speed": "سرعة المحاكاة:",
  "label.speed_real": "1 ث/ث (حقيقي)",
  "label.speed_hour": "ساعة/ث",
  "label.speed_day": "يوم/ث",
  "label.speed_week": "أسبوع/ث",
  "label.speed_month": "شهر/ث",
  "label.speed_year": "سنة/ث",
  "cam.perspective": "📐 منظور",
  "cam.horizon": "👁️ عين الراصد (الأفق)",
  "cam.polaris": "⭐ الجدي (القطب)",
  "cam.moon": "🌙 تتبع القمر",
  "cam.sun": "☀️ تتبع الشمس",
  "cam.orbit": "🌐 مداري موسع",
  "cam.polar": "🧭 مسقط قطبي",
  "prayer.fajr": "الفجر",
  "prayer.sunrise": "الشروق",
  "prayer.dhuha": "صلاة الضحى",
  "prayer.duhr": "الظهر",
  "prayer.asr": "العصر الشافعي",
  "prayer.asrHanafi": "العصر الحنفي",
  "prayer.sunset": "المغرب",
  "prayer.ishaa": "العشاء (18°)",
  "prayer.isha16": "العشاء الشافعي (16°)",
  "search.placeholder": "🔍 ابحث عن مدينة أو مرصد فلكي...",
  "search.btn": "بحث",
  "geo.lat": "خط العرض:",
  "geo.lon": "خط الطول:",
  "geo.city": "المدينة المختارة:",
  "season.spring": "الاعتدال الربيعي",
  "season.summer": "الانقلاب الصيفي",
  "season.autumn": "الاعتدال الخريفي",
  "season.winter": "الانقلاب الشتوي",
  "lang.switch": "English 🌐"
};

class I18nManager {
    constructor() {
        this.currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem('ibn_shatir_lang')) || 'ar';
        this.translations = { ar: AR_LOCALE };
        this.initialized = false;
    }

    async init() {
        // Arabic is pre-embedded. Only fetch if user explicitly chose English or another language
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
