import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    J2000,
    meanSolarLongitude,
    meanLunarLongitude,
    solarDeclination,
    toJulianDate,
    computeHorizontalCoords
} from '../js/astronomy-core.js';

describe('الحسابات الفلكية وحركة الأجرام (Astronomical Calculations)', () => {
    it('طول الشمس المتوسط عند مبدأ J2000.0 يعادل تقريباً 280.46°', () => {
        const L = meanSolarLongitude(J2000);
        assert.ok(Math.abs(L - 280.466) < 0.05, `Expected ~280.466, got ${L}`);
    });

    it('ميل الشمس عند الاعتدال الربيعي يؤول للصفر (δ ≈ 0°)', () => {
        // الاعتدال الربيعي: 20 أو 21 مارس 2026
        const equinoxDate = new Date(Date.UTC(2026, 2, 20, 12, 0, 0));
        const jd = toJulianDate(equinoxDate);
        const decl = solarDeclination(jd);
        assert.ok(Math.abs(decl) < 0.5, `Declination should be near 0 at equinox, got ${decl}`);
    });

    it('ميل الشمس عند الانقلاب الصيفي يبلغ أقصى قيمة شمالية (δ ≈ +23.44°)', () => {
        // الانقلاب الصيفي: 21 يونيو 2026
        const summerDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
        const jd = toJulianDate(summerDate);
        const decl = solarDeclination(jd);
        assert.ok(Math.abs(decl - 23.44) < 0.3, `Summer solstice declination should be ~23.44°, got ${decl}`);
    });

    it('ميل الشمس عند الانقلاب الشتوي يبلغ أقصى قيمة جنوبية (δ ≈ -23.44°)', () => {
        // الانقلاب الشتوي: 21 ديسمبر 2026
        const winterDate = new Date(Date.UTC(2026, 11, 21, 12, 0, 0));
        const jd = toJulianDate(winterDate);
        const decl = solarDeclination(jd);
        assert.ok(Math.abs(decl - (-23.44)) < 0.3, `Winter solstice declination should be ~ -23.44°, got ${decl}`);
    });

    it('معدل حركة القمر اليومية الوسطية يعادل تقريباً 13.176°/يوم', () => {
        const jd1 = J2000;
        const jd2 = J2000 + 1.0;
        const lon1 = meanLunarLongitude(jd1);
        const lon2 = meanLunarLongitude(jd2);
        let diff = lon2 - lon1;
        if (diff < 0) diff += 360;
        assert.ok(Math.abs(diff - 13.176) < 0.05, `Expected daily lunar motion ~13.176°, got ${diff}`);
    });

    it('دالة التحويل للأفق لا تنهار عند القطب الشمالي (φ = 90.0°)', () => {
        const phi = 90.0 * Math.PI / 180.0;
        const decl = 15.0 * Math.PI / 180.0;
        const H = Math.PI / 4.0;
        const coords = computeHorizontalCoords(decl, H, phi);
        assert.ok(!isNaN(coords.alt), 'Altitude should not be NaN');
        assert.ok(!isNaN(coords.az), 'Azimuth should not be NaN');
        assert.ok(isFinite(coords.alt), 'Altitude should be finite');
        assert.ok(isFinite(coords.az), 'Azimuth should be finite');
    });

    it('دالة التحويل للأفق لا تنهار عند القطب الجنوبي (φ = -90.0°)', () => {
        const phi = -90.0 * Math.PI / 180.0;
        const decl = -15.0 * Math.PI / 180.0;
        const H = Math.PI / 3.0;
        const coords = computeHorizontalCoords(decl, H, phi);
        assert.ok(!isNaN(coords.alt), 'Altitude should not be NaN');
        assert.ok(!isNaN(coords.az), 'Azimuth should not be NaN');
    });
});
