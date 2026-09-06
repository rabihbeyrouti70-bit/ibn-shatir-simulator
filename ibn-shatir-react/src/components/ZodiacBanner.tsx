import React from 'react';
import { AstroTelemetry } from '../types/astronomy';
import { ZODIAC_SIGNS, LUNAR_MANSIONS } from '../constants/zodiacData';

interface ZodiacBannerProps {
  telemetry: AstroTelemetry;
}

export const ZodiacBanner: React.FC<ZodiacBannerProps> = ({ telemetry }) => {
  const currentSign = ZODIAC_SIGNS[telemetry.signIndex] || ZODIAC_SIGNS[0];
  const siderealSign = ZODIAC_SIGNS[telemetry.siderealSignIndex] || ZODIAC_SIGNS[0];
  const mansion = LUNAR_MANSIONS[telemetry.lunarMansionIndex - 1] || LUNAR_MANSIONS[0];

  return (
    <div className="zodiac-banner">
      {/* البرج الفصلي الاصطلاحي */}
      <div className="zodiac-item card-tropical" style={{ flex: '1 1 210px' }}>
        <div className="z-label" style={{ color: 'var(--gold)' }}>☀️ البرج الفصلي الاصطلاحي (Tropical)</div>
        <div className="z-badge" style={{ color: '#FBBF24' }}>
          ☀️ برج {currentSign.name} ({currentSign.symbol})
        </div>
        <div style={{ color: '#FDE047', fontSize: '0.92em', fontWeight: 'bold', marginTop: '2px' }}>
          {telemetry.degInSign.toString().padStart(2, '0')}° {telemetry.minInSign.toString().padStart(2, '0')}' {telemetry.secInSign.toString().padStart(2, '0')}" (بالبرج)
        </div>
        <div style={{ color: '#94A3B8', fontSize: '0.82em' }}>
          الطول الاستوائي λ = {telemetry.solarLong.toFixed(2)}°
        </div>
        <div style={{ color: '#CBD5E1', fontSize: '0.8em', marginTop: '2px' }}>
          {currentSign.season}
        </div>
      </div>

      {/* الكوكبة النجمية الفعلية */}
      <div className="zodiac-item card-sidereal" style={{ flex: '1 1 210px' }}>
        <div className="z-label" style={{ color: 'var(--purple)' }}>✨ البرج الفلكي الفعلي (Sidereal Constellation)</div>
        <div className="z-badge" style={{ color: '#C084FC' }}>
          ✨ كوكبة {siderealSign.name} ({siderealSign.symbol})
        </div>
        <div style={{ color: '#E9D5FF', fontSize: '0.92em', fontWeight: 'bold', marginTop: '2px' }}>
          {telemetry.degInSidereal}° (في نجوم الكوكبة)
        </div>
        <div style={{ color: '#94A3B8', fontSize: '0.82em' }}>
          الطول النجمي λ* = {telemetry.siderealLong.toFixed(2)}°
        </div>
        <div style={{ color: '#A7F3D0', fontSize: '0.8em', marginTop: '2px' }}>
          الشمس أمام نجوم هذه الكوكبة فعلياً!
        </div>
      </div>

      {/* حركة المبادرة التراكمية */}
      <div className="zodiac-item" style={{ flex: '1 1 140px' }}>
        <div className="z-label">حركة المبادرة التراكمية (ψ)</div>
        <div className="z-val" style={{ color: '#38BDF8', fontSize: '1.1em' }}>
          {telemetry.precessionDeg.toFixed(2)}°
        </div>
        <div style={{ color: '#FBBF24', fontSize: '0.82em', fontWeight: 'bold' }}>
          انزياح ~برج كامل!
        </div>
        <div style={{ color: '#94A3B8', fontSize: '0.75em' }}>
          معدل: 1° كل 70 سنة
        </div>
      </div>

      {/* المنزلة القمرية للشمس */}
      <div className="zodiac-item" style={{ flex: '1 1 140px' }}>
        <div className="z-label">المنزلة القمرية للشمس</div>
        <div className="z-val" style={{ color: 'var(--blue)', fontSize: '1.05em' }}>
          منزلة {mansion.name} ({mansion.index})
        </div>
        <div style={{ color: '#94A3B8', fontSize: '0.78em' }}>من منازل القمر الـ 28</div>
      </div>

      {/* طول واستطالة القمر */}
      <div className="zodiac-item" style={{ flex: '1 1 140px' }}>
        <div className="z-label">طول واستطالة القمر</div>
        <div className="z-val" style={{ color: '#34D399' }}>
          λ☽ = {telemetry.lunarLong.toFixed(1)}°
        </div>
        <div style={{ color: '#C084FC', fontSize: '0.88em' }}>
          الاستطالة D = {telemetry.moonElongation.toFixed(1)}°
        </div>
      </div>

      {/* اليوم اليولياني */}
      <div className="zodiac-item" style={{ flex: '1 1 110px' }}>
        <div className="z-label">اليوم اليولياني (JD)</div>
        <div className="z-val" style={{ color: '#94A3B8', fontSize: '0.98em' }}>
          {telemetry.julianDay.toFixed(1)}
        </div>
      </div>
    </div>
  );
};
