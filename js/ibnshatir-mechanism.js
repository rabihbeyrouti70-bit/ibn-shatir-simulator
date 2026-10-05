/**
 * 🌌 ibnshatir-mechanism.js
 * Pure mathematical module for Ibn al-Shatir's Sun and Moon mechanisms.
 * Concentric models operating in ecliptic and inclined planes.
 */

function degToRad(deg) {
    return deg * Math.PI / 180.0;
}

function radToDeg(rad) {
    return rad * 180.0 / Math.PI;
}

function normalizeAngle360(deg) {
    return (deg % 360.0 + 360.0) % 360.0;
}

function normalizeAngle180(deg) {
    let a = normalizeAngle360(deg);
    if (a > 180.0) a -= 360.0;
    return a;
}

/**
 * Ibn al-Shatir Solar Mechanism
 * @param {number} Lbar - Mean Sun longitude in degrees
 * @param {number} A - Solar apogee longitude in degrees
 * @returns {{ p0: {x:number, y:number}, p1: {x:number, y:number}, pFinal: {x:number, y:number}, v1: {x:number, y:number}, v2: {x:number, y:number}, distance: number, lambdaTrue: number, equation: number }}
 */
export function sunMechanism(Lbar, A) {
    const R = 60.0;
    const r1 = 4.0 + 37.0 / 60.0; // 4;37 = 4.6166667
    const r2 = 2.5;               // 2;30 = 2.5

    const c = normalizeAngle360(Lbar - A);
    const LbarRad = degToRad(Lbar);
    const ARad = degToRad(A);
    const cRad = degToRad(c);

    // Deferent point on parecliptic at mean Sun longitude Lbar
    const p0 = {
        x: R * Math.cos(LbarRad),
        y: R * Math.sin(LbarRad)
    };

    // Vector r1 (Hamil) keeps fixed direction toward apogee A
    const v1 = {
        x: r1 * Math.cos(ARad),
        y: r1 * Math.sin(ARad)
    };

    const p1 = {
        x: p0.x + v1.x,
        y: p0.y + v1.y
    };

    // Vector r2 (Mudir) rotates with the signs at direction A + 2c
    const dir2Rad = ARad + 2.0 * cRad;
    const v2 = {
        x: r2 * Math.cos(dir2Rad),
        y: r2 * Math.sin(dir2Rad)
    };

    const pFinal = {
        x: p1.x + v2.x,
        y: p1.y + v2.y
    };

    const distance = Math.hypot(pFinal.x, pFinal.y);
    const lambdaTrue = normalizeAngle360(radToDeg(Math.atan2(pFinal.y, pFinal.x)));
    const equation = normalizeAngle180(Lbar - lambdaTrue);

    return {
        p0,
        p1,
        pFinal,
        v1,
        v2,
        distance,
        lambdaTrue,
        equation
    };
}

/**
 * Ibn al-Shatir Lunar Mechanism
 * @param {number} Lmoon - Mean Moon longitude in degrees
 * @param {number} Omega - Ascending node longitude in degrees
 * @param {number} M - Mean anomaly in degrees (measured from perigee)
 * @param {number} D - Mean elongation (Moon - Sun) in degrees
 * @param {number} [inc=5.0] - Orbit inclination in degrees
 * @returns {{ center: {x:number, y:number}, p1: {x:number, y:number}, pFinal: {x:number, y:number}, planeVectors: { center: {x:number, y:number}, p1: {x:number, y:number}, pFinal: {x:number, y:number}, v1: {x:number, y:number}, v2: {x:number, y:number} }, distance: number, lambdaTrue: number, beta: number }}
 */
export function moonMechanism(Lmoon, Omega, M, D, inc = 5.0) {
    const R = 60.0;
    const r1 = 6.0 + 35.0 / 60.0; // 6;35 = 6.5833333
    const r2 = 1.0 + 25.0 / 60.0; // 1;25 = 1.4166667

    const F = Lmoon - Omega;
    const gamma = M + 180.0; // Mean anomaly measured from epicycle apogee

    const FRad = degToRad(F);
    const gammaRad = degToRad(gamma);
    const DRad = degToRad(D);
    const incRad = degToRad(inc);

    // Positions in 2D inclined plane (polar angle measured from ascending node Omega)
    const center = {
        x: R * Math.cos(FRad),
        y: R * Math.sin(FRad)
    };

    const v1 = {
        x: r1 * Math.cos(FRad - gammaRad),
        y: r1 * Math.sin(FRad - gammaRad)
    };

    const p1 = {
        x: center.x + v1.x,
        y: center.y + v1.y
    };

    const v2 = {
        x: r2 * Math.cos(FRad + 2.0 * DRad),
        y: r2 * Math.sin(FRad + 2.0 * DRad)
    };

    const pFinal = {
        x: p1.x + v2.x,
        y: p1.y + v2.y
    };

    const distance = Math.hypot(pFinal.x, pFinal.y);
    const uRad = Math.atan2(pFinal.y, pFinal.x);

    // Coordinate conversion to ecliptic longitude lambda and latitude beta
    const eclipticOffsetRad = Math.atan2(Math.cos(incRad) * Math.sin(uRad), Math.cos(uRad));
    const lambdaTrue = normalizeAngle360(Omega + radToDeg(eclipticOffsetRad));
    const beta = radToDeg(Math.asin(Math.sin(incRad) * Math.sin(uRad)));

    return {
        center,
        p1,
        pFinal,
        planeVectors: {
            center,
            p1,
            pFinal,
            v1,
            v2
        },
        distance,
        lambdaTrue,
        beta
    };
}

/**
 * Maps 2D mechanism vectors to diurnal plane coordinates.
 * @param {Object|Array|{x:number, y:number}} vectors2D - Single vector or object/array of vectors
 * @param {number} phiTrue - Reference mechanism polar angle in radians (lambdaTrue for Sun, u for Moon)
 * @param {number} Htrue - True hour angle in radians
 * @param {number} kappa - Scale factor (Rd / 60)
 * @returns {Object|Array|{x:number, y:number}} Plane coordinates (x = κρ cosψ, y = κρ sinψ)
 */
export function mapMechanismToDiurnal(vectors2D, phiTrue, Htrue, kappa) {
    const mapOne = (v) => {
        if (!v || typeof v.x !== 'number' || typeof v.y !== 'number') return v;
        const rho = Math.hypot(v.x, v.y);
        const phi = Math.atan2(v.y, v.x);
        const psi = Htrue - (phi - phiTrue);
        return {
            x: kappa * rho * Math.cos(psi),
            y: kappa * rho * Math.sin(psi)
        };
    };

    if (Array.isArray(vectors2D)) {
        return vectors2D.map(mapOne);
    } else if (vectors2D && typeof vectors2D === 'object') {
        if (typeof vectors2D.x === 'number' && typeof vectors2D.y === 'number') {
            return mapOne(vectors2D);
        }
        const res = {};
        for (const key of Object.keys(vectors2D)) {
            res[key] = mapOne(vectors2D[key]);
        }
        return res;
    }
    return vectors2D;
}
