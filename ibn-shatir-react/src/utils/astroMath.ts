import { AstroTelemetry } from '../types/astronomy';

// حساب اليوم اليولياني بدقة
export function dateToJulianDay(d: Date): number {
  let Y = d.getUTCFullYear();
  let M = d.getUTCMonth() + 1;
  const D = d.getUTCDate() + (d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600) / 24;

  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

// تحويل اليوم اليولياني إلى كائن تاريخ Date
export function julianDayToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let alpha = Math.floor((z - 1867216.25) / 36524.25);
  let a = z + 1 + alpha - Math.floor(alpha / 4);
  let b = a + 1524;
  let c = Math.floor((b - 122.1) / 365.25);
  let d = Math.floor(365.25 * c);
  let e = Math.floor((b - d) / 30.6001);

  let day = b - d - Math.floor(30.6001 * e) + f;
  let month = e < 14 ? e - 1 : e - 13;
  let year = month > 2 ? c - 4716 : c - 4715;

  let dayInt = Math.floor(day);
  let dayFrac = day - dayInt;
  let totalHours = dayFrac * 24;
  let hours = Math.floor(totalHours);
  let totalMins = (totalHours - hours) * 60;
  let mins = Math.floor(totalMins);
  let secs = Math.floor((totalMins - mins) * 60);

  const res = new Date(Date.UTC(year, month - 1, dayInt, hours, mins, secs));
  return res;
}

// حساب قياسات الطول الشمسي والبروج والمبادرة اللحظية
export function computeTelemetry(simDate: Date): AstroTelemetry {
  const jd = dateToJulianDay(simDate);
  const n = jd - 2451545.0; // الأيام من J2000.0

  // وسط طول الشمس
  let L0 = 280.46646 + 0.9856474 * n;
  L0 = ((L0 % 360) + 360) % 360;

  // خاصة الشمس
  let M = 357.52911 + 0.9856003 * n;
  M = ((M % 360) + 360) % 360;
  const Mrad = (M * Math.PI) / 180;

  // تعديل مركز الشمس
  const C = 1.914602 * Math.sin(Mrad) + 0.019993 * Math.sin(2 * Mrad);
  let solarLong = ((L0 + C) % 360 + 360) % 360;

  // البرج الفصلي الاصطلاحي
  const signIndex = Math.floor(solarLong / 30);
  const degFloat = solarLong % 30;
  const degInSign = Math.floor(degFloat);
  const minFloat = (degFloat - degInSign) * 60;
  const minInSign = Math.floor(minFloat);
  const secInSign = Math.floor((minFloat - minInSign) * 60);

  // حساب انزياح المبادرة منذ عصر بطلميوس 150م (1° كل 70 سنة)
  const currentYear = simDate.getUTCFullYear() + simDate.getUTCMonth() / 12 + simDate.getUTCDate() / 365.25;
  const yearsSincePtolemy = currentYear - 150;
  const precessionDeg = ((yearsSincePtolemy / 70.0) % 360 + 360) % 360;

  // خط طول أوج الشمس التاريخي بمعدل مبادرة 61.9 ثانية قوسية/سنة (102.9° في J2000، و~89° في عصر ابن الشاطر)
  const solarApogeeLong = 102.9 - (2000.0 - currentYear) * (61.9 / 3600.0);
  const historicalAnomaly = ((solarLong - solarApogeeLong) % 360 + 360) % 360;

  // الطول النجمي الفعلي والكوكبة
  let siderealLong = ((solarLong - precessionDeg) % 360 + 360) % 360;
  const siderealSignIndex = Math.floor(siderealLong / 30);
  const degInSidereal = Math.floor(siderealLong % 30);

  // المنزلة القمرية للشمس (28 منزلة)
  const lunarMansionIndex = Math.floor(solarLong / (360 / 28)) + 1;

  // وسط طول القمر
  let Lm = 218.3165 + 13.176396 * n;
  Lm = ((Lm % 360) + 360) % 360;
  const D = ((Lm - L0) % 360 + 360) % 360; // الاستطالة

  // خاصة القمر
  let Mm = 134.963 + 13.064993 * n;
  Mm = ((Mm % 360) + 360) % 360;

  return {
    julianDay: jd,
    solarLong,
    solarAnomaly: historicalAnomaly,
    signIndex,
    degInSign,
    minInSign,
    secInSign,
    siderealLong,
    siderealSignIndex,
    degInSidereal,
    precessionDeg,
    lunarMansionIndex,
    lunarLong: Lm,
    moonElongation: D,
    moonAnomaly: Mm,
  };
}
