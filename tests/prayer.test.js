import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computePrayersMujaib, getCityTimezoneHours } from '../js/prayer-core.js';

describe('مواقيت الصلاة وحسابات الربع المجيب (Rub al-Mujayyab Prayer Times Tests)', () => {
    const DAMASCUS = { lat: 33.5138, lon: 36.2924, tz: 3 };
    const MECCA = { lat: 21.4225, lon: 39.8262, tz: 3 };

    function parseTime(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m; // minutes from midnight
    }

    it('مواقيت الصلاة لمدينة دمشق عند الاعتدال الربيعي (21 مارس 2026)', () => {
        const date = new Date(Date.UTC(2026, 2, 21, 12, 0, 0));
        const res = computePrayersMujaib(DAMASCUS.lat, DAMASCUS.lon, date, DAMASCUS.tz);

        assert.ok(res.prayers, 'Prayers object must exist');
        assert.strictEqual(typeof res.prayers.fajr.civil, 'string');

        const fajrM = parseTime(res.prayers.fajr.civil);
        const sunriseM = parseTime(res.prayers.sunrise.civil);
        const dhuhaM = parseTime(res.prayers.dhuha.civil);
        const duhrM = parseTime(res.prayers.duhr.civil);
        const asrM = parseTime(res.prayers.asr.civil);
        const asrHanafiM = parseTime(res.prayers.asrHanafi.civil);
        const sunsetM = parseTime(res.prayers.sunset.civil);
        const ishaaM = parseTime(res.prayers.ishaa.civil);

        // التحقق من التسلسل الزمني المنطقي
        assert.ok(fajrM < sunriseM, 'الفجر قبل الشروق');
        assert.ok(sunriseM < dhuhaM, 'الشروق قبل الضحى');
        assert.ok(dhuhaM < duhrM, 'الضحى قبل الظهر');
        assert.ok(duhrM < asrM, 'الظهر قبل العصر الشافعي');
        assert.ok(asrM < asrHanafiM, 'العصر الشافعي قبل العصر الحنفي');
        assert.ok(asrHanafiM < sunsetM, 'العصر الحنفي قبل المغرب');
        assert.ok(sunsetM < ishaaM, 'المغرب قبل العشاء');

        // التحقق من دقة التوقيت مقارنة بالتقويم المرجعي لدمشق (±5 دقائق)
        // الفجر المعتمد ~ 05:14 (314 دقيقة)
        assert.ok(Math.abs(fajrM - 314) <= 5, `Fajr expected ~05:14, got ${res.prayers.fajr.civil}`);
        // الظهر المعتمد ~ 12:42 (762 دقيقة)
        assert.ok(Math.abs(duhrM - 762) <= 5, `Dhuhr expected ~12:42, got ${res.prayers.duhr.civil}`);
        // المغرب المعتمد ~ 18:47 (1127 دقيقة)
        assert.ok(Math.abs(sunsetM - 1127) <= 5, `Maghrib expected ~18:47, got ${res.prayers.sunset.civil}`);
    });

    it('حساب مواقيت الصلاة لمكة المكرمة بنجاح', () => {
        const date = new Date(Date.UTC(2026, 2, 21, 12, 0, 0));
        const res = computePrayersMujaib(MECCA.lat, MECCA.lon, date, MECCA.tz);
        assert.ok(res.prayers.duhr.civil !== '--:--');
        assert.ok(res.prayers.fajr.civil !== '--:--');
    });

    it('تحديد المنطقة الزمنية بناءً على الدولة أو خط الطول', () => {
        assert.strictEqual(getCityTimezoneHours(33.5, 36.2, 'سوريا'), 3);
        assert.strictEqual(getCityTimezoneHours(24.4, 54.3, 'الإمارات'), 4);
        assert.strictEqual(getCityTimezoneHours(30.0, 31.2, 'مصر'), 2);
        // خط طول 75° شرقاً بلا دولة = 75/15 = 5
        assert.strictEqual(getCityTimezoneHours(20.0, 75.0, null), 5);
    });

    it('فارق العشائين (16° للشافعي vs 18° للحنفي) يعطي فارقاً زمنياً منطقياً', () => {
        const date = new Date(Date.UTC(2026, 2, 21, 12, 0, 0));
        const res = computePrayersMujaib(DAMASCUS.lat, DAMASCUS.lon, date, DAMASCUS.tz);
        const isha18 = parseTime(res.prayers.ishaa.civil);
        const isha16 = parseTime(res.prayers.isha16.civil);
        // عشاء 16° يكون قبل عشاء 18° بفارق حوالي 8-15 دقيقة
        const diff = isha18 - isha16;
        assert.ok(diff >= 5 && diff <= 20, `Isha difference should be between 5 and 20 min, got ${diff} min`);
    });
});
