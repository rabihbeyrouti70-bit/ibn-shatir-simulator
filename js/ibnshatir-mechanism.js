/**
 * js/ibnshatir-mechanism.js
 *
 * Pure, testable mathematical module for Ibn al-Shatir's astronomical orbital mechanisms.
 * Reconstructs the exact concentric deferent, first epicycle (Hamil r1), and second epicycle (Mudir r2)
 * vector summation models for the Sun and Moon according to Ibn al-Shatir's treatise "Nihayat al-Sul".
 *
 * Free of Three.js or DOM dependencies.
 */

export const SUN_MODEL = {
    R: 60.0,
    r1: 4 + 37 / 60, // 4;37 = 4.616666666666667
    r2: 2.5          // 2;30 = 2.500000000000000
};

export const MOON_MODEL = {
    R: 60.0,
    r1: 6 + 35 / 60, // 6;35 = 6.583333333333333
    r2: 1 + 25 / 60  // 1;25 = 1.416666666666667
};

/**
 * Calculates Ibn al-Shatir's Solar Mechanism vectors and positions.
 *
 * @param {number} lambdaSun - Mean solar longitude (or deferent angle) in radians
 * @param {number} alpha - Mean anomaly (angle from solar apogee) in radians
 * @param {number} [R=60.0] - Deferent radius scale (defaults to 60.0)
 * @returns {Object} Calculated 2D vector positions, component lengths, and equation of center
 */
export function calculateSunMechanism(lambdaSun, alpha, R = SUN_MODEL.R) {
    const scale = R / SUN_MODEL.R;
    const r1 = SUN_MODEL.r1 * scale;
    const r2 = SUN_MODEL.r2 * scale;

    // Deferent point p0 (Center of Epicycle 1 / Hamil)
    const p0 = {
        x: R * Math.cos(lambdaSun),
        y: R * Math.sin(lambdaSun)
    };

    // Vector v1: Epicycle 1 (Hamil r1) rotates by +alpha in zodiac direction
    const angleV1 = lambdaSun + alpha;
    const v1 = {
        x: r1 * Math.cos(angleV1),
        y: r1 * Math.sin(angleV1)
    };

    // Point p1: Center of Epicycle 2 (Mudir)
    const p1 = {
        x: p0.x + v1.x,
        y: p0.y + v1.y
    };

    // Vector v2: Epicycle 2 (Mudir r2) rotates inversely by -2*alpha relative to r1
    // angleV2 = (lambdaSun + alpha) - 2*alpha = lambdaSun - alpha
    const angleV2 = lambdaSun - alpha;
    const v2 = {
        x: r2 * Math.cos(angleV2),
        y: r2 * Math.sin(angleV2)
    };

    // Final position pFinal (end of Mudir arm = true solar position)
    const pFinal = {
        x: p1.x + v2.x,
        y: p1.y + v2.y
    };

    const distance = Math.hypot(pFinal.x, pFinal.y);
    const trueLambda = Math.atan2(pFinal.y, pFinal.x);

    // Normalize equation of center to [-pi, pi]
    let equationOfCenter = trueLambda - lambdaSun;
    while (equationOfCenter > Math.PI) equationOfCenter -= Math.PI * 2;
    while (equationOfCenter < -Math.PI) equationOfCenter += Math.PI * 2;

    return {
        R,
        r1,
        r2,
        p0,
        p1,
        pFinal,
        v1,
        v2,
        distance,
        p0Distance: Math.hypot(p0.x, p0.y),
        r1Length: Math.hypot(v1.x, v1.y),
        r2Length: Math.hypot(v2.x, v2.y),
        trueLambda,
        equationOfCenter
    };
}

/**
 * Calculates Ibn al-Shatir's Lunar Mechanism vectors and positions.
 *
 * @param {number} lambdaMoon - Mean lunar longitude (or deferent angle) in radians
 * @param {number} lambdaSunOrEta - Mean solar longitude OR elongation (eta) in radians
 * @param {number} gamma - Lunar mean anomaly in radians
 * @param {number} [R=60.0] - Deferent radius scale (defaults to 60.0)
 * @param {boolean} [isSecondParamEta=false] - Whether second param is already elongation eta
 * @returns {Object} Calculated 2D vector positions and component lengths
 */
export function calculateMoonMechanism(lambdaMoon, lambdaSunOrEta, gamma, R = MOON_MODEL.R, isSecondParamEta = false) {
    const scale = R / MOON_MODEL.R;
    const r1 = MOON_MODEL.r1 * scale;
    const r2 = MOON_MODEL.r2 * scale;

    const eta = isSecondParamEta ? lambdaSunOrEta : (lambdaMoon - lambdaSunOrEta);

    // Deferent point p0 (Center of Epicycle 1 / Hamil)
    const p0 = {
        x: R * Math.cos(lambdaMoon),
        y: R * Math.sin(lambdaMoon)
    };

    // Vector v1: Epicycle 1 (Hamil r1) rotates by lunar mean anomaly gamma
    const angleV1 = lambdaMoon + gamma;
    const v1 = {
        x: r1 * Math.cos(angleV1),
        y: r1 * Math.sin(angleV1)
    };

    // Point p1: Center of Epicycle 2 (Mudir)
    const p1 = {
        x: p0.x + v1.x,
        y: p0.y + v1.y
    };

    // Vector v2: Epicycle 2 (Mudir r2) rotates by -2*eta relative to r1
    // angleV2 = (lambdaMoon + gamma) - 2*eta
    const angleV2 = lambdaMoon + gamma - 2 * eta;
    const v2 = {
        x: r2 * Math.cos(angleV2),
        y: r2 * Math.sin(angleV2)
    };

    // Final position pFinal (end of Mudir arm = true lunar position)
    const pFinal = {
        x: p1.x + v2.x,
        y: p1.y + v2.y
    };

    const distance = Math.hypot(pFinal.x, pFinal.y);
    const trueLambda = Math.atan2(pFinal.y, pFinal.x);

    let equationOfCenter = trueLambda - lambdaMoon;
    while (equationOfCenter > Math.PI) equationOfCenter -= Math.PI * 2;
    while (equationOfCenter < -Math.PI) equationOfCenter += Math.PI * 2;

    return {
        R,
        r1,
        r2,
        eta,
        gamma,
        p0,
        p1,
        pFinal,
        v1,
        v2,
        distance,
        p0Distance: Math.hypot(p0.x, p0.y),
        r1Length: Math.hypot(v1.x, v1.y),
        r2Length: Math.hypot(v2.x, v2.y),
        trueLambda,
        equationOfCenter
    };
}
