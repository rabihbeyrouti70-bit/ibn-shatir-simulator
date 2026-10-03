import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computePrayersMujaib, getCityTimezoneHours, calculateQiblaDirection } from '../js/prayer-core.js';

describe('مواقيت الصلاة وحسابات الربع المجيب (Rub al-Mujayyab Prayer Times Tests)', () => {
    const DAMASCUS = { lat: 33.5138, lon: 36.2924, tz: 3 };
    const MECCA = { lat: 21.4225, lon: 39.8262, tz: 3 };
    const MEDINA = { lat: 24.4672, lon: 39.6111, tz: 3 };

    function parseTime(timeStr) {
        if (!timeStr || timeStr === '--:--') return NaN;
        const isPM = /PM|م/i.test(timeStr);
        const isAM = /AM|ص/i.test(timeStr);
        const cleanStr = timeStr.replace(/[^0-9:]/g, '');
        let [h, m] = cleanStr.split(':').map(Number);
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 60 + m; // minutes from midnight
    }

    it('مواقيت الصلاة لمدينة دمشق عند الاعتدال الربيعي (21 مارس 2026)', () => {
        const date = new Date(Date.UTC(2026, 2, 21, 12, 0, 0));
        const res = computePrayersMujaib(DAMASCUS.lat, DAMASCUS.lon, date, DAMASCUS.tz, 'سوريا');

        assert.ok(res.prayers, 'Prayers object must exist');
        assert.strictEqual(typeof res.prayers.fajr.civil, 'string');

        // التحقق من ظهور التوقيت بصيغة 12 AM / PM
        assert.ok(/AM/i.test(res.prayers.fajr.civil), 'الفجر يظهر بصيغة 12 AM');
        assert.ok(/PM/i.test(res.prayers.duhr.civil), 'الظهر يظهر بصيغة 12 PM');
        assert.ok(/PM/i.test(res.prayers.sunset.civil), 'المغرب يظهر بصيغة 12 PM');

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

        // التحقق من دقة التوقيت المطابق لروزنامة برنامج الربع المجيب المرجعي (±5 دقائق)
        // الفجر المعتمد ~ 05:14 AM (314 دقيقة)
        assert.ok(Math.abs(fajrM - 314) <= 5, `Fajr expected ~05:14, got ${res.prayers.fajr.civil}`);
        // الظهر المعتمد مع دقائق الاحتياط (+5د) ~ 12:46 PM (766 دقيقة)
        assert.ok(Math.abs(duhrM - 766) <= 5, `Dhuhr expected ~12:46, got ${res.prayers.duhr.civil}`);
        // المغرب المعتمد مع دقائق الاحتياط (+5د) ~ 06:52 PM (1132 دقيقة)
        assert.ok(Math.abs(sunsetM - 1132) <= 5, `Maghrib expected ~06:52, got ${res.prayers.sunset.civil}`);
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

    it('حساب اتجاه القبلة المشرفة بدقة مطابقة 100% لمعادلة برنامج المواقيت المرجعي', () => {
        // دمشق (Damascus): زاوية القبلة 165.50°
        const qiblaDamascus = calculateQiblaDirection(DAMASCUS.lat, DAMASCUS.lon);
        assert.ok(Math.abs(qiblaDamascus - 165.50) < 0.1, `Damascus Qibla expected ~165.50°, got ${qiblaDamascus.toFixed(2)}°`);

        // المدينة المنورة (Medina): زاوية القبلة 176.46° (شبه جنوبية تماماً)
        const qiblaMedina = calculateQiblaDirection(MEDINA.lat, MEDINA.lon);
        assert.ok(Math.abs(qiblaMedina - 176.46) < 0.2, `Medina Qibla expected ~176.46°, got ${qiblaMedina.toFixed(2)}°`);

        // فحص الأمان عند القطبين
        const qiblaNorthPole = calculateQiblaDirection(89.9, 0);
        assert.ok(!isNaN(qiblaNorthPole) && qiblaNorthPole >= 0 && qiblaNorthPole < 360);
        const qiblaSouthPole = calculateQiblaDirection(-89.9, 0);
        assert.ok(!isNaN(qiblaSouthPole) && qiblaSouthPole >= 0 && qiblaSouthPole < 360);
    });

    it('التحقق الصارم من أن العصر الشافعي والحنفي والمغرب والعشائين تظهر جميعها بنظام 12 ساعة (AM/PM) وليس 24', () => {
        const date = new Date(Date.UTC(2026, 2, 21, 12, 0, 0));
        const res = computePrayersMujaib(DAMASCUS.lat, DAMASCUS.lon, date, DAMASCUS.tz, 'سوريا');

        const targets = [
            { key: 'asr', name: 'العصر الشافعي' },
            { key: 'asrHanafi', name: 'العصر الحنفي' },
            { key: 'sunset', name: 'المغرب' },
            { key: 'ishaa', name: 'العشاء الحنفي (18°)' },
            { key: 'isha16', name: 'العشاء الشافعي (16°)' }
        ];

        const time12Regex = /^(0[1-9]|1[0-2]):[0-5][0-9]\s+(AM|PM)$/;

        targets.forEach(t => {
            const timeVal = res.prayers[t.key].civil;
            assert.ok(
                time12Regex.test(timeVal),
                `${t.name} (${t.key}) يجب أن يطابق صيغة 12 ساعة AM/PM، القيمة المستلمة: ${timeVal}`
            );
            // التأكد من أن الساعة لا تتجاوز 12 (نظام 24 مرفوض تماماً)
            const hourPart = parseInt(timeVal.split(':')[0], 10);
            assert.ok(hourPart >= 1 && hourPart <= 12, `الساعة في ${t.name} يجب أن تكون بين 1 و 12 وليس أكثر، القيمة: ${hourPart}`);
            assert.ok(/PM/i.test(timeVal), `${t.name} في فترة بعد الظهر والمساء يجب أن يحمل لاحقة PM`);
        });
    });

    it('تأثير الارتفاع عن سطح البحر على انحطاط الأفق للشروق والغروب (Horizon Dip)', () => {
        const date = new Date(Date.UTC(2026, 2, 21, 12, 0, 0));
        // حساب بدون ارتفاع (مستوى البحر: 0م)
        const seaLevel = computePrayersMujaib(33.5138, 36.2924, date, 3, null, 0);
        // حساب بارتفاع دمشق (690م)
        const damascusAlt = computePrayersMujaib(33.5138, 36.2924, date, 3, 'سوريا', 690);

        const seaRise = parseTime(seaLevel.prayers.sunrise.civil);
        const seaSet = parseTime(seaLevel.prayers.sunset.civil);
        const damRise = parseTime(damascusAlt.prayers.sunrise.civil);
        const damSet = parseTime(damascusAlt.prayers.sunset.civil);

        // على ارتفاع 690م يتقدم الشروق بحوالي 3-4 دقائق ويتأخر الغروب بحوالي 3-4 دقائق
        assert.ok(damRise <= seaRise, 'الشروق على ارتفاع 690م أسبق من أو يساوي مستوى البحر');
        assert.ok(damSet >= seaSet, 'الغروب على ارتفاع 690م متأخر عن أو يساوي مستوى البحر');
        assert.ok(damSet - seaSet >= 2 && damSet - seaSet <= 6, `فارق الغروب بالارتفاع يجب أن يكون بين 2 و 6 دقائق، الناتج: ${damSet - seaSet}`);
    });
});

