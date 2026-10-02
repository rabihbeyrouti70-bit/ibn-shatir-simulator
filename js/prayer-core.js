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
    'الإمارات': 4, 'عمان': 4, 'مصر': 2, 'السودان': 2, 'ليبيا': 2,
    'تركيا': 3, 'إيران': 3.5, 'تونس': 1, 'الجزائر': 1, 'المغرب': 1,
    'بريطانيا': 0, 'فرنسا': 1, 'ألمانيا': 1, 'إيطاليا': 1, 'إسبانيا': 1,
    'روسيا': 3, 'الهند': 5.5, 'باكستان': 5, 'إندونيسيا': 7, 'ماليزيا': 8
};

/**
 * تحديد المنطقة الزمنية التقديرية بناءً على الإحداثيات والدولة
 */
export function getCityTimezoneHours(lat, lon, country = null) {
    if (country && COUNTRY_TIMEZONE_MAP[country] !== undefined) {
        return COUNTRY_TIMEZONE_MAP[country];
    }
    return Math.round(lon / 15.0);
}

/**
 * حساب مواقيت الصلاة بطريقة الربع المجيب التراثية
 * @param {number} lat خط العرض بالدرجات
 * @param {number} lon خط الطول بالدرجات
 * @param {Date} dateObj كائن التاريخ
 * @param {number|null} tzHours فارق المنطقة الزمنية بالساعات
 */
export function computePrayersMujaib(lat, lon, dateObj, tzHours = null) {
    const date = dateObj || new Date();
    if (tzHours === null || isNaN(tzHours)) {
        tzHours = getCityTimezoneHours(lat, lon);
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

    // 2. الشروق والغروب (مع انكسار الأفق ونصف قطر الشمس: 0.833°)
    const zenithRad = 90.833 * Math.PI / 180.0;
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

    function toCivil(solH) {
        if (solH === null || isNaN(solH)) return '--:--';
        let civ = solH + (lonOffsetMin - eotMin) / 60.0;
        while (civ < 0) civ += 24.0;
        while (civ >= 24.0) civ -= 24.0;
        const totalM = Math.round(civ * 60.0);
        const hh = Math.floor(totalM / 60.0) % 24;
        const mm = totalM % 60;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }

    return {
        decl: decl,
        eotMin: eotMin,
        polarDay: polarDay,
        polarNight: polarNight,
        prayers: {
            fajr: { name: 'الفجر', civil: toCivil(fajrSolarHours), solarH: fajrSolarHours, color: '#06B6D4' },
            sunrise: { name: 'الشروق', civil: toCivil(sunriseSolarHours), solarH: sunriseSolarHours, color: '#EAB308' },
            dhuha: { name: 'صلاة الضحى', civil: toCivil(dhuhaSolarHours), solarH: dhuhaSolarHours, color: '#10B981' },
            duhr: { name: 'الظهر', civil: toCivil(duhrSolarHours), solarH: duhrSolarHours, color: '#FACC15' },
            asr: { name: 'العصر الشافعي', civil: toCivil(asrSolarHours), solarH: asrSolarHours, color: '#F97316' },
            asrHanafi: { name: 'العصر الحنفي', civil: toCivil(asrHanafiSolarHours), solarH: asrHanafiSolarHours, color: '#A855F7' },
            sunset: { name: 'المغرب', civil: toCivil(sunsetSolarHours), solarH: sunsetSolarHours, color: '#E11D48' },
            ishaa: { name: 'العشاء', civil: toCivil(ishaaSolarHours), solarH: ishaaSolarHours, color: '#6366F1' },
            isha16: { name: 'العشاء الشافعي 16°', civil: toCivil(isha16SolarHours), solarH: isha16SolarHours }
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
