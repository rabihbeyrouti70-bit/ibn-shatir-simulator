import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sunMechanism, moonMechanism, mapMechanismToDiurnal } from '../js/ibnshatir-mechanism.js';

function normalize360(angle) {
    return (angle % 360 + 360) % 360;
}

function angleDiff(a, b) {
    let diff = (a - b) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return Math.abs(diff);
}

describe('آلية الشمس لابن الشاطر (Ibn al-Shatir Solar Mechanism)', () => {
    test('r1 direction == apogee direction A, r2 direction == A + 2c, and vector magnitudes', () => {
        const r1_expected = 4 + 37 / 60; // 4;37 = 4.6166667
        const r2_expected = 2.5;         // 2;30 = 2.5

        const apogees = [0, 102.9, 180, 275.5];
        const cs = [0, 30, 45, 90, 135, 180, 210, 270, 315];

        for (const A of apogees) {
            for (const c of cs) {
                const Lbar = normalize360(A + c);
                const res = sunMechanism(Lbar, A);

                // Magnitude check
                const v1_len = Math.hypot(res.v1.x, res.v1.y);
                const v2_len = Math.hypot(res.v2.x, res.v2.y);
                const p1_p0_dist = Math.hypot(res.p1.x - res.p0.x, res.p1.y - res.p0.y);
                const pFinal_p1_dist = Math.hypot(res.pFinal.x - res.p1.x, res.pFinal.y - res.p1.y);

                assert.ok(Math.abs(v1_len - r1_expected) < 1e-9, `v1 len failed at c=${c}, A=${A}`);
                assert.ok(Math.abs(v2_len - r2_expected) < 1e-9, `v2 len failed at c=${c}, A=${A}`);
                assert.ok(Math.abs(p1_p0_dist - r1_expected) < 1e-9, `p1-p0 dist failed at c=${c}, A=${A}`);
                assert.ok(Math.abs(pFinal_p1_dist - r2_expected) < 1e-9, `pFinal-p1 dist failed at c=${c}, A=${A}`);

                // Direction checks
                const dir1 = normalize360(Math.atan2(res.v1.y, res.v1.x) * 180 / Math.PI);
                assert.ok(angleDiff(dir1, A) < 1e-9, `r1 direction != apogee for A=${A}, c=${c}`);

                const dir2 = normalize360(Math.atan2(res.v2.y, res.v2.x) * 180 / Math.PI);
                const expected_dir2 = normalize360(A + 2 * c);
                assert.ok(angleDiff(dir2, expected_dir2) < 1e-9, `r2 direction != A+2c for A=${A}, c=${c}`);
            }
        }
    });

    test('max distance 67;07 and min distance 52;53', () => {
        const max_expected = 60 + 4 + 37 / 60 + 2.5; // 67;07 = 67.1166667
        const min_expected = 60 - (4 + 37 / 60) - 2.5; // 52;53 = 52.8833333

        let maxDist = -Infinity;
        let minDist = Infinity;

        const A = 102.9;
        for (let c = 0; c < 360; c += 0.1) {
            const Lbar = normalize360(A + c);
            const res = sunMechanism(Lbar, A);
            if (res.distance > maxDist) maxDist = res.distance;
            if (res.distance < minDist) minDist = res.distance;
        }

        assert.ok(Math.abs(maxDist - max_expected) < 1e-4, `Max dist ${maxDist} != ${max_expected}`);
        assert.ok(Math.abs(minDist - min_expected) < 1e-4, `Min dist ${minDist} != ${min_expected}`);
    });

    test('max |equation| = 2;02,06° ± 0.01° and equation sign true = mean - eq for 0 < c < 180°', () => {
        const expected_max_eq = 2 + 2 / 60 + 6 / 3600; // 2;02,06° = 2.035°
        let maxEq = 0;

        const A = 102.9;
        for (let c = 0.1; c < 360; c += 0.1) {
            const Lbar = normalize360(A + c);
            const res = sunMechanism(Lbar, A);

            const absEq = Math.abs(res.equation);
            if (absEq > maxEq) maxEq = absEq;

            if (c > 0 && c < 180) {
                // For 0 < c < 180°, true = mean - equation, with equation > 0
                assert.ok(res.equation > 0, `Equation sign failed at c=${c}: expected positive, got ${res.equation}`);
                const true_from_formula = normalize360(Lbar - res.equation);
                assert.ok(angleDiff(res.lambdaTrue, true_from_formula) < 1e-9, `true != mean - eq at c=${c}`);
            } else if (c > 180 && c < 360) {
                assert.ok(res.equation < 0, `Equation sign failed at c=${c}: expected negative, got ${res.equation}`);
            }
        }

        assert.ok(Math.abs(maxEq - expected_max_eq) < 0.01, `Max equation ${maxEq} != ${expected_max_eq}`);
    });

    test('vector result equals book formula (radial 60 + 7;07 cos c, tangential 2;07 sin c)', () => {
        const A = 102.9;
        const ARad = A * Math.PI / 180;

        const r1_plus_r2 = (4 + 37 / 60) + 2.5; // 7;07 = 7.1166667
        const r1_minus_r2 = (4 + 37 / 60) - 2.5; // 2;07 = 2.1166667

        for (let c = 0; c < 360; c += 15) {
            const Lbar = normalize360(A + c);
            const cRad = c * Math.PI / 180;
            const res = sunMechanism(Lbar, A);

            // Rotate pFinal into the local frame aligned with mean Sun line Lbar = A + c
            const p0_dir_rad = ARad + cRad;
            const cosL = Math.cos(p0_dir_rad);
            const sinL = Math.sin(p0_dir_rad);

            // Radial component along p0 direction
            const radial_actual = res.pFinal.x * cosL + res.pFinal.y * sinL;
            // Tangential component perpendicular to p0 direction (+tangential is in direction of increasing longitude)
            const tangential_actual = -res.pFinal.x * sinL + res.pFinal.y * cosL;

            const radial_expected = 60 + r1_plus_r2 * Math.cos(cRad);
            const tangential_expected = -r1_minus_r2 * Math.sin(cRad);

            assert.ok(Math.abs(radial_actual - radial_expected) < 1e-9, `Radial mismatch at c=${c}`);
            assert.ok(Math.abs(tangential_actual - tangential_expected) < 1e-9, `Tangential mismatch at c=${c}`);
        }
    });

    test('Sun accuracy: |lambda_mech - lambda_sun| < 0.3° over 2000 random dates 1900-2100', () => {
        let seed = 123456789;
        function random() {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        }

        const jd_1900 = 2415020.5; // 1 Jan 1900
        const jd_2100 = 2488070.5; // 1 Jan 2100

        for (let i = 0; i < 2000; i++) {
            const jd = jd_1900 + random() * (jd_2100 - jd_1900);
            const n = jd - 2451545.0;
            const year = 2000.0 + n / 365.25;

            const L_sun = normalize360(280.460 + 0.9856474 * n);
            const A_sun = 102.9 + (year - 2000.0) / 60.0;

            const res = sunMechanism(L_sun, A_sun);

            // Existing formula in app.js
            const g_sun = normalize360(357.528 + 0.9856003 * n) * Math.PI / 180;
            const lambda_sun_existing = normalize360(L_sun + 1.915 * Math.sin(g_sun) + 0.020 * Math.sin(2 * g_sun));

            const diff = angleDiff(res.lambdaTrue, lambda_sun_existing);
            assert.ok(diff < 0.3, `Sun accuracy error ${diff}° >= 0.3° at n=${n}`);
        }
    });
});

describe('آلية القمر لابن الشاطر (Ibn al-Shatir Lunar Mechanism)', () => {
    test('Moon distance range exactly 52.00 to 68.00 and max |beta| <= 5.0°', () => {
        let maxDist = -Infinity;
        let minDist = Infinity;
        let maxBeta = 0;

        // Grid search over M and D
        for (let M = 0; M < 360; M += 5) {
            for (let D = 0; D < 360; D += 5) {
                const Lmoon = 100;
                const Omega = 20;
                const res = moonMechanism(Lmoon, Omega, M, D, 5.0);

                if (res.distance > maxDist) maxDist = res.distance;
                if (res.distance < minDist) minDist = res.distance;

                const absBeta = Math.abs(res.beta);
                if (absBeta > maxBeta) maxBeta = absBeta;

                assert.ok(res.distance >= 52.0 - 1e-3 && res.distance <= 68.0 + 1e-3, `Distance ${res.distance} out of bounds 52-68`);
                assert.ok(absBeta <= 5.0001, `Beta ${absBeta} exceeds 5°`);
            }
        }

        // Test explicit alignment points
        // Max distance when r1 and r2 align with deferent vector: gamma = 180 (M = 0), 2D = 0 (D = 0)
        const maxRes = moonMechanism(100, 20, 0, 0, 5.0);
        // Min distance when r1 and r2 point opposite deferent vector: gamma = 0 (M = 180), 2D = 180 (D = 90)
        const minRes = moonMechanism(100, 20, 180, 90, 5.0);

        if (maxRes.distance > maxDist) maxDist = maxRes.distance;
        if (minRes.distance < minDist) minDist = minRes.distance;

        assert.ok(Math.abs(maxDist - 68.0) < 1e-3, `Max dist ${maxDist} != 68.00`);
        assert.ok(Math.abs(minDist - 52.0) < 1e-3, `Min dist ${minDist} != 52.00`);
        assert.ok(Math.abs(maxBeta - 5.0) < 0.01, `Max beta ${maxBeta} != 5.0°`);
    });

    test('RMS of (lambda_mech - L_moon) vs 4-term lunar series < 1.3° over 4000 random samples', () => {
        let seed = 456789123;
        function random() {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        }

        let sumSqErr = 0;
        const N = 4000;

        for (let i = 0; i < N; i++) {
            const Lmoon = random() * 360;
            const Omega = random() * 360;
            const M = random() * 360;
            const D = random() * 360;

            const res = moonMechanism(Lmoon, Omega, M, D, 5.0);

            // Mechanism longitude equation relative to mean Moon
            let eq_mech = (res.lambdaTrue - Lmoon) % 360;
            if (eq_mech > 180) eq_mech -= 360;
            if (eq_mech < -180) eq_mech += 360;

            // 4-term lunar series (in degrees)
            const MRad = M * Math.PI / 180;
            const DRad = D * Math.PI / 180;
            const eq_series = 6.289 * Math.sin(MRad) +
                              1.274 * Math.sin(2 * DRad - MRad) +
                              0.658 * Math.sin(2 * DRad) +
                              0.214 * Math.sin(2 * MRad);

            const err = eq_mech - eq_series;
            sumSqErr += err * err;
        }

        const rms = Math.sqrt(sumSqErr / N);
        assert.ok(rms < 1.3, `RMS ${rms}° >= 1.3°`);
    });
});

describe('تحويل الآليات لإحداثيات المستوي اليومي (mapMechanismToDiurnal)', () => {
    test('Sun mechanism diurnal mapping properties', () => {
        const A = 102.9;
        const Lbar = 150.0;
        const res = sunMechanism(Lbar, A);

        const Rd = 140.0 * Math.cos(0.2); // Example diurnal radius
        const kappa = Rd / 60.0;
        const phiTrue = res.lambdaTrue * Math.PI / 180.0;
        const Htrue = 0.75; // Radians

        const mapped = mapMechanismToDiurnal({
            p0: res.p0,
            p1: res.p1,
            pFinal: res.pFinal,
            v1: res.v1,
            v2: res.v2
        }, phiTrue, Htrue, kappa);

        // 1. D radius == Rd
        const distD = Math.hypot(mapped.p0.x, mapped.p0.y);
        assert.ok(Math.abs(distD - Rd) < 1e-9, `D radius ${distD} != Rd ${Rd}`);

        // 2. End ray angle == H_true
        const rayAngle = Math.atan2(mapped.pFinal.y, mapped.pFinal.x);
        assert.ok(angleDiff(rayAngle * 180 / Math.PI, Htrue * 180 / Math.PI) < 1e-9, `End ray angle ${rayAngle} != Htrue ${Htrue}`);

        // 3. r1 and r2 arm lengths == kappa * (4;37) and kappa * (2;30)
        const r1_expected = kappa * (4 + 37 / 60);
        const r2_expected = kappa * 2.5;
        const len1 = Math.hypot(mapped.p1.x - mapped.p0.x, mapped.p1.y - mapped.p0.y);
        const len2 = Math.hypot(mapped.pFinal.x - mapped.p1.x, mapped.pFinal.y - mapped.p1.y);
        assert.ok(Math.abs(len1 - r1_expected) < 1e-9, `Sun r1 len ${len1} != ${r1_expected}`);
        assert.ok(Math.abs(len2 - r2_expected) < 1e-9, `Sun r2 len ${len2} != ${r2_expected}`);

        // 4. Body on circle property (Body B has radius Rd at angle Htrue)
        const bodyB = { x: Rd * Math.cos(Htrue), y: Rd * Math.sin(Htrue) };
        const bodyDist = Math.hypot(bodyB.x, bodyB.y);
        assert.ok(Math.abs(bodyDist - Rd) < 1e-9, `Body distance ${bodyDist} != Rd ${Rd}`);
        const bodyAngle = Math.atan2(bodyB.y, bodyB.x);
        assert.ok(angleDiff(bodyAngle * 180 / Math.PI, rayAngle * 180 / Math.PI) < 1e-9, `Body and mechanism end not on same ray`);
    });

    test('Moon mechanism diurnal mapping properties', () => {
        const res = moonMechanism(218.3, 125.0, 134.9, 297.8, 5.0);

        const Rd = (140.0 - 2.0) * Math.cos(0.15); // Moon diurnal radius
        const kappa = Rd / 60.0;
        const uTrue = Math.atan2(res.pFinal.y, res.pFinal.x); // In-plane polar angle u
        const Htrue = -0.45; // Radians

        const mapped = mapMechanismToDiurnal({
            center: res.center,
            p1: res.p1,
            pFinal: res.pFinal,
            v1: res.planeVectors.v1,
            v2: res.planeVectors.v2
        }, uTrue, Htrue, kappa);

        // 1. D radius == Rd
        const distD = Math.hypot(mapped.center.x, mapped.center.y);
        assert.ok(Math.abs(distD - Rd) < 1e-9, `Moon D radius ${distD} != Rd ${Rd}`);

        // 2. End ray angle == H_true
        const rayAngle = Math.atan2(mapped.pFinal.y, mapped.pFinal.x);
        assert.ok(angleDiff(rayAngle * 180 / Math.PI, Htrue * 180 / Math.PI) < 1e-9, `Moon end ray angle ${rayAngle} != Htrue ${Htrue}`);

        // 3. r1 and r2 arm lengths == kappa * (6;35) and kappa * (1;25)
        const r1_expected = kappa * (6 + 35 / 60);
        const r2_expected = kappa * (1 + 25 / 60);
        const len1 = Math.hypot(mapped.p1.x - mapped.center.x, mapped.p1.y - mapped.center.y);
        const len2 = Math.hypot(mapped.pFinal.x - mapped.p1.x, mapped.pFinal.y - mapped.p1.y);
        assert.ok(Math.abs(len1 - r1_expected) < 1e-9, `Moon r1 len ${len1} != ${r1_expected}`);
        assert.ok(Math.abs(len2 - r2_expected) < 1e-9, `Moon r2 len ${len2} != ${r2_expected}`);

        // 4. Body on circle property
        const bodyB = { x: Rd * Math.cos(Htrue), y: Rd * Math.sin(Htrue) };
        const bodyDist = Math.hypot(bodyB.x, bodyB.y);
        assert.ok(Math.abs(bodyDist - Rd) < 1e-9, `Moon body distance ${bodyDist} != Rd ${Rd}`);
        const bodyAngle = Math.atan2(bodyB.y, bodyB.x);
        assert.ok(angleDiff(bodyAngle * 180 / Math.PI, rayAngle * 180 / Math.PI) < 1e-9, `Moon body and mechanism end not on same ray`);
    });
});
