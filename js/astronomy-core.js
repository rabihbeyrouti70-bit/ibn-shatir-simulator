/**
 * 🌌 astronomy-core.js
 * النواة الرياضية للحسابات الفلكية وتحويلات الإحداثيات السماوية
 * Core astronomical mathematics and coordinate transformations
 */

export const J2000 = 2451545.0;
export const OBLIQUITY_J2000 = 23.4392911; // degrees

/**
 * حساب اليوم الجولياني بناءً على السنة والشهر واليوم
 */
export function getJD(year, month, day) {
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/**
 * تحويل كائن تاريخ Date إلى اليوم الجولياني الكسري الدقيق
 */
export function toJulianDate(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000;
    return getJD(y, m, d) + h / 24.0;
}

/**
 * ميل دائرة البروج المتوسط
 */
export function calcMeanObliquityOfEcliptic(t) {
    const seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813));
    return 23.0 + (26.0 + seconds / 60.0) / 60.0;
}

/**
 * تصحيح ميل دائرة البروج
 */
export function calcObliquityCorrection(t) {
    const e0 = calcMeanObliquityOfEcliptic(t);
    const omega = 125.04 - 1934.136 * t;
    return e0 + 0.00256 * Math.cos(omega * Math.PI / 180.0);
}

/**
 * متوسط الشذوذ الهندسي للشمس (Mean Anomaly)
 */
export function calcGeomMeanAnomalySun(t) {
    return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

/**
 * متوسط الطول الهندسي للشمس (Mean Longitude)
 */
export function calcGeomMeanLongSun(t) {
    let L0 = 280.46646 + t * (36000.76983 + t * 0.0003032);
    while (L0 > 360.0) L0 -= 360.0;
    while (L0 < 0.0) L0 += 360.0;
    return L0;
}

/**
 * تعديل المركز الشمسي (Equation of Center)
 */
export function calcSunEqOfCenter(t) {
    const m = calcGeomMeanAnomalySun(t);
    const mrad = m * Math.PI / 180.0;
    return Math.sin(mrad) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
           Math.sin(2 * mrad) * (0.019993 - 0.000101 * t) +
           Math.sin(3 * mrad) * 0.000289;
}

/**
 * الطول الشمسي الحقيقي (True Longitude)
 */
export function calcSunTrueLong(t) {
    return calcGeomMeanLongSun(t) + calcSunEqOfCenter(t);
}

/**
 * الطول الشمسي الظاهري (Apparent Longitude)
 */
export function calcSunApparentLong(t) {
    const o = calcSunTrueLong(t);
    const omega = 125.04 - 1934.136 * t;
    return o - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180.0);
}

/**
 * ميل الشمس (Solar Declination) بالدرجات
 */
export function calcSunDeclination(t) {
    const e = calcObliquityCorrection(t) * Math.PI / 180.0;
    const lambda = calcSunApparentLong(t) * Math.PI / 180.0;
    const sint = Math.sin(e) * Math.sin(lambda);
    return Math.asin(Math.max(-1, Math.min(1, sint))) * 180.0 / Math.PI;
}

/**
 * معادلة الزمن (Equation of Time) بالدقائق
 */
export function calcEquationOfTime(t) {
    const epsilon = calcObliquityCorrection(t) * Math.PI / 180.0;
    const l0 = calcGeomMeanLongSun(t) * Math.PI / 180.0;
    const e = (0.016708634 - t * (0.000042037 + 0.0000001267 * t));
    const m = calcGeomMeanAnomalySun(t) * Math.PI / 180.0;

    const y = Math.pow(Math.tan(epsilon / 2.0), 2);
    const sin2l0 = Math.sin(2.0 * l0);
    const sinm = Math.sin(m);
    const cos2l0 = Math.cos(2.0 * l0);
    const sin4l0 = Math.sin(4.0 * l0);
    const sin2m = Math.sin(2.0 * m);

    const Etime = y * sin2l0 - 2.0 * e * sinm + 4.0 * e * y * sinm * cos2l0 -
                  0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
    return (Etime * 180.0 / Math.PI) * 4.0;
}

/**
 * حساب ميل الشمس مباشرة باليوم الجولياني
 */
export function solarDeclination(jd) {
    const t = (jd - J2000) / 36525.0;
    return calcSunDeclination(t);
}

/**
 * الطول المتوسط للشمس من اليوم الجولياني
 */
export function meanSolarLongitude(jd) {
    const t = (jd - J2000) / 36525.0;
    return calcGeomMeanLongSun(t);
}

/**
 * الطول المتوسط للقمر من اليوم الجولياني
 */
export function meanLunarLongitude(jd) {
    const daysSinceJ2000 = jd - J2000;
    return ((218.3164477 + 13.176396 * daysSinceJ2000) % 360 + 360) % 360;
}

/**
 * 🌐 دالة التحويل الفلكي من الإحداثيات الاستوائية إلى الأفقية (مع معالجة القطبين الشمالي والجنوبي)
 * @param {number} decl الميل الاستوائي (بالراديان)
 * @param {number} H زاوية الساعة (بالراديان)
 * @param {number} phi خط العرض الجغرافي للمرصد (بالراديان)
 * @returns {{alt: number, az: number}} الارتفاع والسمت (بالراديان)
 */
export function computeHorizontalCoords(decl, H, phi) {
    const sinA = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H);
    const alt = Math.asin(Math.max(-1.0, Math.min(1.0, sinA)));

    let az = 0.0;
    const cosPhi = Math.cos(phi);
    const cosAlt = Math.cos(alt);

    if (Math.abs(cosPhi) < 0.0005) {
        // عند القطبين الجغرافيين (الفلك الدائر): السمت يعادل زاوية الساعة H حول المحور الرأسي
        if (phi > 0) {
            az = ((Math.PI + H) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        } else {
            az = ((2 * Math.PI - H) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        }
    } else if (Math.abs(cosAlt) > 0.0001) {
        const cosAz = (Math.sin(decl) - Math.sin(phi) * sinA) / (cosPhi * cosAlt);
        az = Math.acos(Math.max(-1.0, Math.min(1.0, cosAz)));
        if (Math.sin(H) > 0) az = 2 * Math.PI - az;
    }

    return { alt, az };
}
