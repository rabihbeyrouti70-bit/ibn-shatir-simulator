import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getJD, toJulianDate, J2000 } from '../js/astronomy-core.js';

describe('التقويم الجولياني وحساب الأيام (Julian Date & Calendar Tests)', () => {
    it('حساب مبدأ عصر J2000.0 الفلكي بدقة (1 يناير 2000، 12:00 UTC = JD 2451545.0)', () => {
        const jd = getJD(2000, 1, 1.5);
        assert.strictEqual(jd, 2451545.0);
    });

    it('تحويل كائن التاريخ Date إلى اليوم الجولياني لظهيرة J2000.0', () => {
        const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
        const jd = toJulianDate(date);
        assert.strictEqual(jd, J2000);
    });

    it('حساب اليوم الجولياني للاعتدال الربيعي 20 مارس 2026', () => {
        const date = new Date(Date.UTC(2026, 2, 20, 12, 0, 0));
        const jd = toJulianDate(date);
        // JD لعام 2026 مارس 20 = 2461120.0
        assert.ok(jd > 2461000 && jd < 2462000, `Expected JD around 2461120, got ${jd}`);
    });

    it('معالجة الأشهر الأولى (يناير وفبراير) بالعودة للسنة السابقة حسابياً', () => {
        const jdJan = getJD(2024, 1, 15);
        const jdFeb = getJD(2024, 2, 15);
        const jdMar = getJD(2024, 3, 15);
        assert.ok(jdFeb > jdJan);
        assert.ok(jdMar > jdFeb);
    });
});
