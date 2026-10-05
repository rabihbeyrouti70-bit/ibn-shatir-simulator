import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    SUN_MODEL,
    MOON_MODEL,
    calculateSunMechanism,
    calculateMoonMechanism
} from '../js/ibnshatir-mechanism.js';

describe('نظام الحامل والمدير للشمس والقمر (Ibn al-Shatir Mechanism Tests)', () => {

    it('أنصاف الأقطار وطول r1 وطول r2 ثابتان دائماً للشمس والقمر على مدار 365 يوماً وساعاتها', () => {
        const EPSILON = 1e-9;
        const expectedSunR1 = 4 + 37 / 60; // 4.616666666666667
        const expectedSunR2 = 2.5;

        const expectedMoonR1 = 6 + 35 / 60; // 6.583333333333333
        const expectedMoonR2 = 1 + 25 / 60; // 1.416666666666667

        for (let day = 0; day < 365; day++) {
            for (let hour of [0, 6, 12, 18]) {
                const lambdaSun = (day * 0.9856 + hour * 0.041) * Math.PI / 180;
                const alpha = (day * 0.9856 + 10) * Math.PI / 180;

                const lambdaMoon = (day * 13.176 + hour * 0.54) * Math.PI / 180;
                const gamma = (day * 13.065) * Math.PI / 180;

                // Sun Mechanism Check
                const sunResult = calculateSunMechanism(lambdaSun, alpha, 60.0);
                assert.ok(Math.abs(sunResult.p0Distance - 60.0) < EPSILON, `Sun p0 distance should be 60, got ${sunResult.p0Distance}`);
                assert.ok(Math.abs(sunResult.r1Length - expectedSunR1) < EPSILON, `Sun r1 length should be ${expectedSunR1}, got ${sunResult.r1Length}`);
                assert.ok(Math.abs(sunResult.r2Length - expectedSunR2) < EPSILON, `Sun r2 length should be ${expectedSunR2}, got ${sunResult.r2Length}`);

                // Moon Mechanism Check
                const moonResult = calculateMoonMechanism(lambdaMoon, lambdaSun, gamma, 60.0);
                assert.ok(Math.abs(moonResult.p0Distance - 60.0) < EPSILON, `Moon p0 distance should be 60, got ${moonResult.p0Distance}`);
                assert.ok(Math.abs(moonResult.r1Length - expectedMoonR1) < EPSILON, `Moon r1 length should be ${expectedMoonR1}, got ${moonResult.r1Length}`);
                assert.ok(Math.abs(moonResult.r2Length - expectedMoonR2) < EPSILON, `Moon r2 length should be ${expectedMoonR2}, got ${moonResult.r2Length}`);
            }
        }
    });

    it('أقصى وأدنى بعد للقمر يساوي تقريباً 68 و 52 (بنسبة 1.31)', () => {
        let minMoonDist = Infinity;
        let maxMoonDist = -Infinity;

        // Scan across various elongation (eta) and anomaly (gamma) angles
        for (let etaDeg = 0; etaDeg < 360; etaDeg += 1) {
            for (let gammaDeg = 0; gammaDeg < 360; gammaDeg += 5) {
                const eta = etaDeg * Math.PI / 180;
                const gamma = gammaDeg * Math.PI / 180;
                const lambdaMoon = eta; // relative frame where lambdaSun = 0
                const result = calculateMoonMechanism(lambdaMoon, 0, gamma, 60.0);
                if (result.distance < minMoonDist) minMoonDist = result.distance;
                if (result.distance > maxMoonDist) maxMoonDist = result.distance;
            }
        }

        assert.ok(Math.abs(maxMoonDist - 68.0) < 1e-4, `Expected max moon distance ~68.0, got ${maxMoonDist}`);
        assert.ok(Math.abs(minMoonDist - 52.0) < 1e-4, `Expected min moon distance ~52.0, got ${minMoonDist}`);

        const ratio = maxMoonDist / minMoonDist;
        assert.ok(Math.abs(ratio - 68 / 52) < 1e-4, `Expected moon distance ratio ~1.3077, got ${ratio}`);
    });

    it('أقصى معادلة مركز للشمس تساوي تقريباً 2°02\'', () => {
        let maxEqDeg = 0;

        for (let alphaDeg = 0; alphaDeg < 360; alphaDeg += 0.5) {
            const alpha = alphaDeg * Math.PI / 180;
            const result = calculateSunMechanism(0, alpha, 60.0);
            const eqDeg = Math.abs(result.equationOfCenter * 180 / Math.PI);
            if (eqDeg > maxEqDeg) maxEqDeg = eqDeg;
        }

        // 2°02' = 2 + 2/60 = 2.033333° (or ~2.022° for arcsin((r1-r2)/60))
        assert.ok(Math.abs(maxEqDeg - 2.022) < 0.05, `Expected max solar equation of center ~2°02' (2.022°), got ${maxEqDeg.toFixed(3)}°`);
    });

    it('نهاية متجهات الآلية تطابق موضع الجرم بدقة', () => {
        const lambdaSun = 1.2;
        const alpha = 0.8;
        const sunRes = calculateSunMechanism(lambdaSun, alpha, 60.0);

        // Vector sum: p0 + v1 + v2
        const expectedSunX = sunRes.p0.x + sunRes.v1.x + sunRes.v2.x;
        const expectedSunY = sunRes.p0.y + sunRes.v1.y + sunRes.v2.y;

        assert.ok(Math.abs(sunRes.pFinal.x - expectedSunX) < 1e-9);
        assert.ok(Math.abs(sunRes.pFinal.y - expectedSunY) < 1e-9);

        const lambdaMoon = 2.1;
        const lambdaSun2 = 0.5;
        const gamma = 1.1;
        const moonRes = calculateMoonMechanism(lambdaMoon, lambdaSun2, gamma, 60.0);

        const expectedMoonX = moonRes.p0.x + moonRes.v1.x + moonRes.v2.x;
        const expectedMoonY = moonRes.p0.y + moonRes.v1.y + moonRes.v2.y;

        assert.ok(Math.abs(moonRes.pFinal.x - expectedMoonX) < 1e-9);
        assert.ok(Math.abs(moonRes.pFinal.y - expectedMoonY) < 1e-9);
    });
});

import { fitMechanismToTrueAngle } from '../js/ibnshatir-mechanism.js';

describe('مطابقة الآلية للزاوية الحقيقية على الدائرة اليومية', () => {
    it('الزاوية النهائية تساوي الزاوية الحقيقية والجرم على الدائرة اليومية (شمس وقمر)', () => {
        const R = 100;
        for (let i = 0; i < 400; i++) {
            const H = (i / 400) * Math.PI * 2 - Math.PI;
            const alpha = (i * 0.37) % (Math.PI * 2);
            const gamma = (i * 1.13) % (Math.PI * 2);
            const eta = (i * 0.71) % (Math.PI * 2);

            const cases = [
                fitMechanismToTrueAngle((th) => calculateSunMechanism(th, alpha), H, R),
                fitMechanismToTrueAngle((th) => calculateMoonMechanism(th, eta, gamma, 60.0, true), H, R)
            ];
            for (const f of cases) {
                const diff = Math.atan2(Math.sin(f.trueLambda - H), Math.cos(f.trueLambda - H));
                assert.ok(Math.abs(diff) < 1e-6, `final angle must equal true angle, diff=${diff}`);
                assert.ok(Math.abs(Math.hypot(f.pFinal.x, f.pFinal.y) - R) < 1e-9, 'body must lie on diurnal circle');
                assert.ok(Math.abs(Math.hypot(f.p0.x, f.p0.y) - f.R) < 1e-9, 'deferent radius consistent');
                const sum = { x: f.p0.x + f.v1.x + f.v2.x, y: f.p0.y + f.v1.y + f.v2.y };
                assert.ok(Math.hypot(sum.x - f.pFinal.x, sum.y - f.pFinal.y) < 1e-9, 'end = deferent + r1 + r2');
            }
        }
    });
});
