// واجهات الأنواع الفلكية لمشروع محاكي ابن الشاطر وبطلميوس

export type TabId = 'cosmos' | 'cosmos3d' | 'sunComp' | 'moonComp' | 'planets' | 'study';

export interface ZodiacSign {
  name: string;
  symbol: string;
  season: string;
  element: string;
  startDeg: number;
}

export interface LunarMansion {
  index: number;
  name: string;
  startDeg: number;
}

export interface PlanetDef {
  key: string;
  name: string;
  r: number;
  color: string;
  size: number;
  ep: number;
  periodDays: number;
  speedDegPerDay: number;
  ibsParams: string;
}

export interface PlanetaryModelParams {
  name: string;
  R: number;
  e: number;
  r_ep: number;
  r1: number;
  r2: number;
  r3: number;
  notes: string;
}

export interface AstroTelemetry {
  julianDay: number;
  solarLong: number;
  solarAnomaly: number;
  signIndex: number;
  degInSign: number;
  minInSign: number;
  secInSign: number;
  siderealLong: number;
  siderealSignIndex: number;
  degInSidereal: number;
  precessionDeg: number;
  lunarMansionIndex: number;
  lunarLong: number;
  moonElongation: number;
  moonAnomaly: number;
}
