import { PlanetDef, PlanetaryModelParams } from '../types/astronomy';

export const COSMOS_BODIES: PlanetDef[] = [
  { key: 'moon', name: 'القمر ☽', r: 34, color: '#E2E8F0', size: 3.5, ep: 4, periodDays: 27.32, speedDegPerDay: 13.18, ibsParams: 'R=60 | r1=6;35 | r2=1;25' },
  { key: 'mercury', name: 'عطارد ☿', r: 58, color: '#C084FC', size: 3.2, ep: 5.5, periodDays: 87.97, speedDegPerDay: 4.09, ibsParams: 'R=60 | r1=4;05 | r2=0;50' },
  { key: 'venus', name: 'الزهرة ♀', r: 82, color: '#F472B6', size: 4.2, ep: 6.5, periodDays: 224.70, speedDegPerDay: 1.60, ibsParams: 'R=60 | r1=1;41 | r2=0;26' },
  { key: 'sun', name: 'الشمس ☉', r: 110, color: '#FBBF24', size: 6.5, ep: 7.5, periodDays: 365.25, speedDegPerDay: 0.986, ibsParams: 'R=60 | r1=4;37 | r2=2;30' },
  { key: 'mars', name: 'المريخ ♂', r: 138, color: '#F87171', size: 4.0, ep: 8, periodDays: 686.97, speedDegPerDay: 0.524, ibsParams: 'R=60 | r1=9;00 | r2=3;00 | r3=39;30' },
  { key: 'jupiter', name: 'المشتري ♃', r: 164, color: '#FB923C', size: 5.5, ep: 9, periodDays: 4332.6, speedDegPerDay: 0.083, ibsParams: 'R=60 | r1=4;07 | r2=1;22 | r3=11;30' },
  { key: 'saturn', name: 'زحل ♄', r: 188, color: '#FACC15', size: 5.0, ep: 10, periodDays: 10759, speedDegPerDay: 0.033, ibsParams: 'R=60 | r1=5;07 | r2=1;42 | r3=6;30' },
];

export const PLANET_MODELS: Record<string, PlanetaryModelParams> = {
  mars: {
    name: 'المريخ',
    R: 60,
    e: 6.0,
    r_ep: 39.5,
    r1: 9.0,
    r2: 3.0,
    r3: 39.5,
    notes: 'أكبر كواكب بطلميوس إشكالاً بنقطة المعادل، استبدلها ابن الشاطر بحامل 9 ومدير 3',
  },
  jupiter: {
    name: 'المشتري',
    R: 60,
    e: 2.75,
    r_ep: 11.5,
    r1: 4.12,
    r2: 1.37,
    r3: 11.5,
    notes: 'تطابق مذهل مع حركة الكوكب بعد إلغاء الخارج والمعادل',
  },
  saturn: {
    name: 'زحل',
    R: 60,
    e: 3.42,
    r_ep: 6.5,
    r1: 5.12,
    r2: 1.7,
    r3: 6.5,
    notes: 'أبطأ الكواكب وأبعدها عن الأرض في منظومة بطلميوس وابن الشاطر',
  },
  venus: {
    name: 'الزهرة',
    R: 60,
    e: 1.25,
    r_ep: 43.17,
    r1: 1.68,
    r2: 0.43,
    r3: 43.17,
    notes: 'فلك تدوير الزهرة الضخم، يدور مركزه دائماً في خط واحد مع الشمس',
  },
  mercury: {
    name: 'عطارد',
    R: 60,
    e: 3.0,
    r_ep: 22.5,
    r1: 4.08,
    r2: 0.83,
    r3: 22.5,
    notes: 'أعقد كواكب المنظومة القديمة، أضاف له ابن الشاطر فلكين: الشامل والحافظ',
  },
};
