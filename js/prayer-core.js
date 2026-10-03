/**
 * 🕌 prayer-core.js
 * حساب مواقيت الصلاة الإسلامية بالرُبع المُجَيَّب ومعادلات NOAA الفلكية
 * Historical Sine Quadrant (Rub' al-Mujayyab) & astronomical prayer algorithms
 */

import {
    getJD,
    calcSunDeclination,
    calcEquationOfTime
} from './astronomy-core.js';

export const COUNTRY_TIMEZONE_MAP = {
    'سورia': 3, 'سوريا': 3, 'لبنان': 3, 'فلسطين': 3, 'الأردن': 3,
    'السعودية': 3, 'الكويت': 3, 'قطر': 3, 'البحرين': 3, 'اليمن': 3, 'العراق': 3,
    'الإمارات': 4, 'عمان': 4, 'عُمان': 4, 'مصر': 2, 'السودان': 2, 'ليبيا': 2,
    'تركيا': 3, 'إيران': 3.5, 'تونس': 1, 'الجزائر': 1, 'المغرب': 1,
    'موريتانيا': 0, 'الصومال': 3, 'جيبوتي': 3, 'جزر القمر': 3,
    'أفغانستان': 4.5, 'باكستان': 5, 'الهند': 5.5, 'بنغلاديش': 6,
    'أوزبكستان': 5, 'تركمانستان': 5, 'كازاخستان': 5, 'أذربيجان': 4,
    'بريطانيا': 0, 'المملكة المتحدة': 0, 'فرنسا': 1, 'ألمانيا': 1, 'إيطاليا': 1, 'إسبانيا': 1,
    'إسبانيا / الأندلس': 1, 'البرتغال / الأندلس': 0,
    'روسيا': 3, 'اليابان': 9, 'الصين': 8, 'ماليزيا': 8, 'سنغافورة': 8, 'إندونيسيا': 7,
    'الولايات المتحدة': -5, 'كندا': -5, 'أستراليا': 10
};

export const COUNTRY_TIMEZONE_IANA = {
    'سوريا': 'Asia/Damascus', 'سورia': 'Asia/Damascus',
    'لبنان': 'Asia/Beirut',
    'فلسطين': 'Asia/Jerusalem',
    'الأردن': 'Asia/Amman',
    'السعودية': 'Asia/Riyadh',
    'الكويت': 'Asia/Kuwait',
    'قطر': 'Asia/Qatar',
    'البحرين': 'Asia/Bahrain',
    'اليمن': 'Asia/Aden',
    'العراق': 'Asia/Baghdad',
    'الإمارات': 'Asia/Dubai',
    'عمان': 'Asia/Muscat', 'عُمان': 'Asia/Muscat',
    'مصر': 'Africa/Cairo',
    'السودان': 'Africa/Khartoum',
    'ليبيا': 'Africa/Tripoli',
    'تونس': 'Africa/Tunis',
    'الجزائر': 'Africa/Algiers',
    'المغرب': 'Africa/Casablanca',
    'موريتانيا': 'Africa/Nouakchott',
    'الصومال': 'Africa/Mogadishu',
    'جيبوتي': 'Africa/Djibouti',
    'جزر القمر': 'Indian/Comoro',
    'تركيا': 'Europe/Istanbul',
    'إيران': 'Asia/Tehran',
    'أفغانستان': 'Asia/Kabul',
    'باكستان': 'Asia/Karachi',
    'الهند': 'Asia/Kolkata',
    'بنغلاديش': 'Asia/Dhaka',
    'سريلانكا': 'Asia/Colombo',
    'نيبال': 'Asia/Kathmandu',
    'أوزبكستان': 'Asia/Tashkent',
    'تركمانستان': 'Asia/Ashgabat',
    'كازاخستان': 'Asia/Almaty',
    'أذربيجان': 'Asia/Baku',
    'جورجيا': 'Asia/Tbilisi',
    'أرمينيا': 'Asia/Yerevan',
    'روسيا': 'Europe/Moscow',
    'اليابان': 'Asia/Tokyo',
    'الصين': 'Asia/Shanghai',
    'تايوان': 'Asia/Taipei',
    'كوريا الجنوبية': 'Asia/Seoul',
    'تايلاند': 'Asia/Bangkok',
    'ماليزيا': 'Asia/Kuala_Lumpur',
    'سنغافورة': 'Asia/Singapore',
    'إندونيسيا': 'Asia/Jakarta',
    'الفلبين': 'Asia/Manila',
    'فيتنام': 'Asia/Ho_Chi_Minh',
    'المملكة المتحدة': 'Europe/London', 'بريطانيا': 'Europe/London',
    'أيرلندا': 'Europe/Dublin',
    'فرنسا': 'Europe/Paris',
    'ألمانيا': 'Europe/Berlin',
    'إيطاليا': 'Europe/Rome',
    'إسبانيا': 'Europe/Madrid', 'إسبانيا / الأندلس': 'Europe/Madrid',
    'إسبانيا (جزر الكناري)': 'Atlantic/Canary',
    'البرتغال / الأندلس': 'Europe/Lisbon',
    'النمسا': 'Europe/Vienna',
    'التشيك': 'Europe/Prague',
    'هولندا': 'Europe/Amsterdam',
    'بلجيكا': 'Europe/Brussels',
    'سويسرا': 'Europe/Zurich',
    'اليونان': 'Europe/Athens',
    'الدنمارك': 'Europe/Copenhagen',
    'السويد': 'Europe/Stockholm',
    'النرويج': 'Europe/Oslo',
    'فنلندا': 'Europe/Helsinki',
    'آيسلندا': 'Atlantic/Reykjavik',
    'بولندا': 'Europe/Warsaw',
    'المجر': 'Europe/Budapest',
    'رومانيا': 'Europe/Bucharest',
    'بلغاريا': 'Europe/Sofia',
    'صربيا': 'Europe/Belgrade',
    'البوسنة والهرسك': 'Europe/Sarajevo',
    'جنوب إفريقيا': 'Africa/Johannesburg',
    'كينيا': 'Africa/Nairobi',
    'إثيوبيا': 'Africa/Addis_Ababa',
    'نيجيريا': 'Africa/Lagos',
    'غانا': 'Africa/Accra',
    'أوغندا': 'Africa/Kampala',
    'السنغال': 'Africa/Dakar',
    'تنزانيا': 'Africa/Dar_es_Salaam',
    'ناميبيا': 'Africa/Windhoek',
    'مالي': 'Africa/Bamako',
    'أستراليا': 'Australia/Sydney',
    'نيوزيلندا': 'Pacific/Auckland',
    'الولايات المتحدة': 'America/New_York',
    'كندا': 'America/Toronto',
    'المكسيك': 'America/Mexico_City',
    'البرازيل': 'America/Sao_Paulo',
    'الأرجنتين': 'America/Argentina/Buenos_Aires',
    'تشيلي': 'America/Santiago',
    'كولومبيا': 'America/Bogota',
    'بيرو': 'America/Lima',
    'فنزويلا': 'America/Caracas'
};

/**
 * تحديد المنطقة الزمنية بدقة بناءً على الدولة أو أقرب مدينة أو الإحداثيات مع دعم التوقيت الصيفي
 */
export function getCityTimezoneHours(lat, lon, country = null, dateObj = null) {
    // 1. حساب التوقيت الصيفي آلياً عبر معيار IANA إذا تم تمرير كائن تاريخ محدد
    if (country && dateObj && COUNTRY_TIMEZONE_IANA[country]) {
        try {
            const tzName = COUNTRY_TIMEZONE_IANA[country];
            const utcDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tzDate = new Date(dateObj.toLocaleString('en-US', { timeZone: tzName }));
            const offsetHours = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
            if (!isNaN(offsetHours)) return offsetHours;
        } catch (_) {}
    }

    // 2. خريطة الدول الثابتة (التوقيت القياسي الرسمي للدولة)
    if (country && COUNTRY_TIMEZONE_MAP[country] !== undefined) {
        return COUNTRY_TIMEZONE_MAP[country];
    }

    // 3. محاولة التعرف على الدولة من قاعدة بيانات المدن إن توفرت في النطاق العالمي
    if (typeof window !== 'undefined' && window.WORLD_CITIES_DB && Array.isArray(window.WORLD_CITIES_DB)) {
        const match = window.WORLD_CITIES_DB.find(c => Math.abs(c.lat - lat) < 0.35 && Math.abs(c.lon - lon) < 0.35);
        if (match && match.country) {
            return getCityTimezoneHours(lat, lon, match.country, dateObj);
        }
    }

    // 4. خريطة خطوط الطول المعيارية (15 درجة لكل ساعة)
    return Math.round(lon / 15.0);
}

/**
 * حساب مواقيت الصلاة بطريقة الربع المجيب التراثية المطابقة للبرنامج المرفق لمواقيت الصلاة
 * @param {number} lat خط العرض بالدرجات
 * @param {number} lon خط الطول بالدرجات
 * @param {Date} dateObj كائن التاريخ
 * @param {number|null} tzHours فارق المنطقة الزمنية بالساعات
 * @param {string|null} country اسم الدولة
 * @param {number|null} elevation الارتفاع عن سطح البحر بالأمتار (لحساب انحطاط الأفق الفلكي)
 */
export function computePrayersMujaib(lat, lon, dateObj, tzHours = null, country = null, elevation = null) {
    const date = dateObj || new Date();
    if (tzHours === null || isNaN(tzHours)) {
        tzHours = getCityTimezoneHours(lat, lon, country, date);
    }

    const jd = getJD(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    const total = jd + (12.0 - tzHours) / 24.0;
    const T = (total - 2451545.0) / 36525.0;

    const decl = calcSunDeclination(T);
    const eotMin = calcEquationOfTime(T);
    const lonOffsetMin = (15.0 * tzHours - lon) * 4.0;

    const latRad = lat * Math.PI / 180.0;
    const declRad = decl * Math.PI / 180.0;

    const north = lat >= 0 ? 1 : -1;
    const declNorth = decl >= 0 ? 1 : -1;

    // حسابات الرُبع المُجَيَّب الستينية الدقيقة
    const diameterDimension = Math.abs(60.0 * Math.sin(latRad) * Math.sin(declRad));
    const absoluteOrigin = Math.abs(60.0 * Math.cos(latRad) * Math.cos(declRad));
    const maxElevation = 90.0 - Math.abs(lat - decl);

    // 1. الفجر (انحطاط 18° تحت الأفق)
    const fajrElevPocket = Math.sin(18.0 * Math.PI / 180.0) * 60.0;
    const fajrModifiedOrigin = (north + declNorth === 0)
        ? (fajrElevPocket - diameterDimension)
        : (fajrElevPocket + diameterDimension);
    const fajrRatio = Math.max(-1.0, Math.min(1.0, fajrModifiedOrigin / Math.max(0.0001, absoluteOrigin)));
    const fajrFirstResult = 90.0 - Math.asin(fajrRatio) * 180.0 / Math.PI;
    const fajrSolarHours = 4.0 * fajrFirstResult / 60.0;
    const H_fajr_rad = Math.max(0.1, (12.0 - fajrSolarHours) * 15.0 * Math.PI / 180.0);

    // 2. الشروق والغروب (مع انكسار الأفق ونصف قطر الشمس: 0.833° بالإضافة لانحطاط الأفق بالارتفاع كما في برنامج المواقيت: (1.76 * sqrt(h)) / 60)
    let effElevation = elevation;
    if (effElevation === null || isNaN(effElevation)) {
        if (country === 'سوريا' || (Math.abs(lat - 33.5138) < 0.25 && Math.abs(lon - 36.2924) < 0.25)) {
            effElevation = 690; // ارتفاع دمشق عن مستوى سطح البحر (690م)
        } else {
            effElevation = 0;
        }
    }
    const horizonDip = effElevation > 0 ? (1.76 * Math.sqrt(effElevation)) / 60.0 : 0.0;
    const zenithDeg = 90.833 + horizonDip;
    const zenithRad = zenithDeg * Math.PI / 180.0;
    const cosH_val = (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(declRad)) /
                     Math.max(0.0001, Math.cos(latRad) * Math.cos(declRad));
    let H_sun_deg = 90.0;
    let polarDay = false, polarNight = false;
    if (cosH_val >= 1.0) { polarNight = true; H_sun_deg = 0.0; }
    else if (cosH_val <= -1.0) { polarDay = true; H_sun_deg = 180.0; }
    else { H_sun_deg = Math.acos(cosH_val) * 180.0 / Math.PI; }

    const sunriseSolarHours = 12.0 - H_sun_deg / 15.0;
    const sunsetSolarHours = 12.0 + H_sun_deg / 15.0;
    const H_sunrise_rad = Math.max(0.05, H_sun_deg * Math.PI / 180.0);
    const H_sunset_rad = Math.max(0.05, H_sun_deg * Math.PI / 180.0);

    // 2.5 صلاة الضحى: من ارتفاع الشمس 5 درجات فوق الأفق حتى وقت الظهر
    const dhuhaAltRad = 5.0 * Math.PI / 180.0;
    const cosH_dhuha = (Math.sin(dhuhaAltRad) - Math.sin(latRad) * Math.sin(declRad)) /
                       Math.max(0.0001, Math.cos(latRad) * Math.cos(declRad));
    let dhuhaSolarHours = sunriseSolarHours + 0.5;
    let H_dhuha_rad = Math.max(0.02, H_sunrise_rad - 0.12);

    if (cosH_dhuha >= 1.0) {
        dhuhaSolarHours = null;
        H_dhuha_rad = 0.01;
    } else if (cosH_dhuha <= -1.0) {
        dhuhaSolarHours = 0.0;
        H_dhuha_rad = Math.PI;
    } else {
        const H_dhuha_deg = Math.acos(cosH_dhuha) * 180.0 / Math.PI;
        dhuhaSolarHours = 12.0 - H_dhuha_deg / 15.0;
        H_dhuha_rad = Math.max(0.02, H_dhuha_deg * Math.PI / 180.0);
    }

    // 3. الظهر (الزوال الشمسي)
    const duhrSolarHours = 12.0;

    // 4. العصر الشافعي (الظل 1 مثله)
    const noonShadow = 12.0 * Math.tan((90.0 - maxElevation) * Math.PI / 180.0);
    const asrShadow = noonShadow + 12.0;
    const asrElevation = Math.atan(12.0 / Math.max(0.001, asrShadow)) * 180.0 / Math.PI;
    const asrElevPocket = Math.sin(asrElevation * Math.PI / 180.0) * 60.0;
    const asrModifiedOrigin = (north + declNorth === 0)
        ? (asrElevPocket + diameterDimension)
        : (asrElevPocket - diameterDimension);
    const asrRatio = Math.max(-1.0, Math.min(1.0, asrModifiedOrigin / Math.max(0.0001, absoluteOrigin)));
    const asrFirstResult = 90.0 - Math.asin(asrRatio) * 180.0 / Math.PI;
    const asrSolarHours = 12.0 + (4.0 * asrFirstResult / 60.0);
    const H_asr_rad = Math.max(0.05, (asrSolarHours - 12.0) * 15.0 * Math.PI / 180.0);

    // 4.5 العصر الحنفي (الظل 2 مثليه)
    const asrHanafiShadow = noonShadow + 24.0;
    const asrHanafiElevation = Math.atan(12.0 / Math.max(0.001, asrHanafiShadow)) * 180.0 / Math.PI;
    const asrHanafiElevPocket = Math.sin(asrHanafiElevation * Math.PI / 180.0) * 60.0;
    const asrHanafiModifiedOrigin = (north + declNorth === 0)
        ? (asrHanafiElevPocket + diameterDimension)
        : (asrHanafiElevPocket - diameterDimension);
    const asrHanafiRatio = Math.max(-1.0, Math.min(1.0, asrHanafiModifiedOrigin / Math.max(0.0001, absoluteOrigin)));
    const asrHanafiFirstResult = 90.0 - Math.asin(asrHanafiRatio) * 180.0 / Math.PI;
    const asrHanafiSolarHours = 12.0 + (4.0 * asrHanafiFirstResult / 60.0);
    const H_asrHanafi_rad = Math.max(H_asr_rad + 0.05, (asrHanafiSolarHours - 12.0) * 15.0 * Math.PI / 180.0);

    // 5. العشاء (انحطاط 18° تحت الأفق الغربي)
    const ishaaElevPocket = Math.sin(18.0 * Math.PI / 180.0) * 60.0;
    const ishaaModifiedOrigin = (north + declNorth === 0)
        ? (ishaaElevPocket - diameterDimension)
        : (ishaaElevPocket + diameterDimension);
    const ishaaRatio = Math.max(-1.0, Math.min(1.0, ishaaModifiedOrigin / Math.max(0.0001, absoluteOrigin)));
    const ishaaFirstResult = 90.0 - Math.acos(ishaaRatio) * 180.0 / Math.PI;
    const ishaaSolarHours = 18.0 + (4.0 * ishaaFirstResult / 60.0);
    const H_ishaa_rad = Math.max(H_sunset_rad + 0.05, (ishaaSolarHours - 12.0) * 15.0 * Math.PI / 180.0);

    // 6. العشاء الشافعي (انحطاط 16°)
    const isha16ElevPocket = Math.sin(16.0 * Math.PI / 180.0) * 60.0;
    const isha16ModifiedOrigin = (north + declNorth === 0)
        ? (isha16ElevPocket - diameterDimension)
        : (isha16ElevPocket + diameterDimension);
    const isha16Ratio = Math.max(-1.0, Math.min(1.0, isha16ModifiedOrigin / Math.max(0.0001, absoluteOrigin)));
    const isha16FirstResult = 90.0 - Math.acos(isha16Ratio) * 180.0 / Math.PI;
    const isha16SolarHours = 18.0 + (4.0 * isha16FirstResult / 60.0);
    const H_isha16_rad = (isha16SolarHours - 12.0) * 15.0 * Math.PI / 180.0;

    function toCivil(solH, reserveMin = 0) {
        if (solH === null || isNaN(solH)) {
            return {
                civil: '--:--',
                civil12: '--:--',
                civil12Ar: '--:--',
                civil24: '--:--',
                h: null,
                m: null,
                period: ''
            };
        }
        let civ = solH + (reserveMin / 60.0) + (lonOffsetMin - eotMin) / 60.0;
        while (civ < 0) civ += 24.0;
        while (civ >= 24.0) civ -= 24.0;
        const totalM = Math.round(civ * 60.0);
        const hh24 = Math.floor(totalM / 60.0) % 24;
        const mm = totalM % 60;
        const mmStr = String(mm).padStart(2, '0');
        const period = hh24 >= 12 ? 'PM' : 'AM';
        const periodAr = hh24 >= 12 ? 'م' : 'ص';
        const hh12 = hh24 % 12 || 12;
        const hh12Str = String(hh12).padStart(2, '0');
        const civil12 = `${hh12Str}:${mmStr} ${period}`;
        const civil12Ar = `${hh12Str}:${mmStr} ${periodAr}`;
        const civil24 = `${String(hh24).padStart(2, '0')}:${mmStr}`;

        return {
            civil: civil12,
            civil12,
            civil12Ar,
            civil24,
            h: hh24,
            m: mm,
            period
        };
    }

    // تطبيق دقائق الاحتياط الفقهية المعتمدة في برنامج مواقيت الصلاة (الربع المجيب)
    // Duhr: +5 min, Asr: +5 min, Sunset: +5 min, Fajr: 0, Sunrise: 0, Ishaa: 0
    const fajrCivil = toCivil(fajrSolarHours, 0);
    const sunriseCivil = toCivil(sunriseSolarHours, 0);
    const dhuhaCivil = toCivil(dhuhaSolarHours, 0);
    const duhrCivil = toCivil(duhrSolarHours, 5);
    const asrCivil = toCivil(asrSolarHours, 5);
    const asrHanafiCivil = toCivil(asrHanafiSolarHours, 5);
    const sunsetCivil = toCivil(sunsetSolarHours, 5);
    const ishaaCivil = toCivil(ishaaSolarHours, 0);
    const isha16Civil = toCivil(isha16SolarHours, 0);

    return {
        decl: decl,
        eotMin: eotMin,
        tzHours: tzHours,
        polarDay: polarDay,
        polarNight: polarNight,
        prayers: {
            fajr: { name: 'الفجر', civil: fajrCivil.civil, civil12: fajrCivil.civil12, civil12Ar: fajrCivil.civil12Ar, civil24: fajrCivil.civil24, solarH: fajrSolarHours, color: '#06B6D4' },
            sunrise: { name: 'الشروق', civil: sunriseCivil.civil, civil12: sunriseCivil.civil12, civil12Ar: sunriseCivil.civil12Ar, civil24: sunriseCivil.civil24, solarH: sunriseSolarHours, color: '#EAB308' },
            dhuha: { name: 'صلاة الضحى', civil: dhuhaCivil.civil, civil12: dhuhaCivil.civil12, civil12Ar: dhuhaCivil.civil12Ar, civil24: dhuhaCivil.civil24, solarH: dhuhaSolarHours, color: '#10B981' },
            duhr: { name: 'الظهر', civil: duhrCivil.civil, civil12: duhrCivil.civil12, civil12Ar: duhrCivil.civil12Ar, civil24: duhrCivil.civil24, solarH: duhrSolarHours + 5.0 / 60.0, color: '#FACC15' },
            asr: { name: 'العصر الشافعي', civil: asrCivil.civil, civil12: asrCivil.civil12, civil12Ar: asrCivil.civil12Ar, civil24: asrCivil.civil24, solarH: asrSolarHours + 5.0 / 60.0, color: '#F97316' },
            asrHanafi: { name: 'العصر الحنفي', civil: asrHanafiCivil.civil, civil12: asrHanafiCivil.civil12, civil12Ar: asrHanafiCivil.civil12Ar, civil24: asrHanafiCivil.civil24, solarH: asrHanafiSolarHours + 5.0 / 60.0, color: '#A855F7' },
            sunset: { name: 'المغرب', civil: sunsetCivil.civil, civil12: sunsetCivil.civil12, civil12Ar: sunsetCivil.civil12Ar, civil24: sunsetCivil.civil24, solarH: sunsetSolarHours + 5.0 / 60.0, color: '#E11D48' },
            ishaa: { name: 'العشاء', civil: ishaaCivil.civil, civil12: ishaaCivil.civil12, civil12Ar: ishaaCivil.civil12Ar, civil24: ishaaCivil.civil24, solarH: ishaaSolarHours, color: '#6366F1' },
            isha16: { name: 'العشاء الشافعي 16°', civil: isha16Civil.civil, civil12: isha16Civil.civil12, civil12Ar: isha16Civil.civil12Ar, civil24: isha16Civil.civil24, solarH: isha16SolarHours }
        },
        hourAngles: {
            H_fajr: H_fajr_rad,
            H_sunrise: H_sunrise_rad,
            H_dhuha: H_dhuha_rad,
            H_duhr: 0,
            H_asr: H_asr_rad,
            H_asrHanafi: H_asrHanafi_rad,
            H_sunset: H_sunset_rad,
            H_ishaa: H_ishaa_rad,
            H_isha16: H_isha16_rad
        }
    };
}

/**
 * حساب زاوية اتجاه القبلة المشرفة (بالدرجات من الشمال باتجاه عقارب الساعة [0, 360))
 * متطابق حرفياً مع الخوارزمية الفلكية المعتمدة في برنامج مواقيت الصلاة (calculation.js)
 * Formula:
 * x = ln(tan(radians(21.4224861111111)/2 + PI/4) / tan(radians(latitude)/2 + PI/4))
 * y = radians(39.8261638888889) - radians(longitude)
 * qibla = atan2(y, x) * 180 / PI; if (qibla < 0) qibla += 360;
 *
 * @param {number} lat - خط عرض الراصد بالدرجات (-90 إلى +90)
 * @param {number} lon - خط طول الراصد بالدرجات (-180 إلى +180)
 * @returns {number} اتجاه القبلة بالدرجات من الشمال باتجاه الشرق (Azimuth)
 */
export function calculateQiblaDirection(lat, lon) {
    const kaabaLat = 21.4224861111111;
    const kaabaLon = 39.8261638888889;

    // الوقاية من التقارب عند القطبين ±90 لمنع tan(pi/2) والقسمة على صفر
    const safeLat = Math.max(-89.9999, Math.min(89.9999, Number(lat) || 0));
    const safeLon = Number(lon) || 0;

    const radKaabaLat = kaabaLat * Math.PI / 180.0;
    const radKaabaLon = kaabaLon * Math.PI / 180.0;
    const radObsLat = safeLat * Math.PI / 180.0;
    const radObsLon = safeLon * Math.PI / 180.0;

    const x = Math.log(Math.tan(radKaabaLat / 2.0 + Math.PI / 4.0) / Math.tan(radObsLat / 2.0 + Math.PI / 4.0));
    const y = radKaabaLon - radObsLon;

    let qibla = Math.atan2(y, x) * 180.0 / Math.PI;
    if (qibla < 0) {
        qibla += 360.0;
    }
    return qibla;
}
