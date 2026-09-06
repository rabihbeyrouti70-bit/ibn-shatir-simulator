import React, { useRef, useEffect, useState } from 'react';
import { AstroTelemetry } from '../../types/astronomy';
import { COSMOS_BODIES } from '../../constants/astronomicalData';
import { ZODIAC_SIGNS } from '../../constants/zodiacData';
import { drawDirectionBadge } from '../../utils/canvasDrawers';

interface CosmosViewProps {
  telemetry: AstroTelemetry;
}

export const CosmosView: React.FC<CosmosViewProps> = ({ telemetry }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPolarStars, setShowPolarStars] = useState<boolean>(true);
  const [showCelestialAxis, setShowCelestialAxis] = useState<boolean>(true);
  const [showEastWestAxis, setShowEastWestAxis] = useState<boolean>(true);
  const [showSolarRay, setShowSolarRay] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasW = 660, canvasH = 660;
    const ccx = 330, ccy = 330;
    ctx.clearRect(0, 0, canvasW, canvasH);

    // زوايا الحركة
    const atlasAngle = (telemetry.julianDay * 2 * Math.PI) % (2 * Math.PI);
    const precRad = (telemetry.precessionDeg * Math.PI) / 180;

    // 1. محور القطبين السماويين (الشمال - الجنوب)
    if (showCelestialAxis) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(ccx, 44);
      ctx.lineTo(ccx, canvasH - 44);
      ctx.stroke();
      ctx.setLineDash([]);

      drawDirectionBadge(ctx, ccx, 22, '⬆ القطب الشمالي السماوي', '#38BDF8', 'rgba(15, 23, 42, 0.92)', '#0284C7');
      drawDirectionBadge(ctx, ccx, canvasH - 22, '⬇ القطب الجنوبي السماوي', '#38BDF8', 'rgba(15, 23, 42, 0.92)', '#0284C7');
    }

    // 2. خط الشرق والغرب
    if (showEastWestAxis) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(85, ccy);
      ctx.lineTo(canvasW - 85, ccy);
      ctx.stroke();
      ctx.setLineDash([]);

      drawDirectionBadge(ctx, canvasW - 55, ccy, 'المشرق ⮕', '#FBBF24', 'rgba(15, 23, 42, 0.92)', '#D97706');
      drawDirectionBadge(ctx, 55, ccy, '⬅ المغرب', '#FBBF24', 'rgba(15, 23, 42, 0.92)', '#D97706');
    }

    // 3. الفلك التاسع (الفلك الأطلس المحيط)
    const atlasR = 274;
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ccx, ccy, atlasR, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 8; k++) {
      const aAng = (k * Math.PI) / 4 + atlasAngle;
      ctx.fillStyle = '#C084FC';
      ctx.beginPath();
      ctx.arc(ccx + atlasR * Math.cos(aAng), ccy - atlasR * Math.sin(aAng), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. فلك البروج المزدوج
    // أ. البروج الاصطلاحية الفصلية
    const tropicalR = 246;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ccx, ccy, tropicalR, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const divAng = (-i * Math.PI) / 6;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ccx + (tropicalR - 8) * Math.cos(divAng), ccy + (tropicalR - 8) * Math.sin(divAng));
      ctx.lineTo(ccx + (tropicalR + 8) * Math.cos(divAng), ccy + (tropicalR + 8) * Math.sin(divAng));
      ctx.stroke();

      const ang = (-(i + 0.5) * Math.PI) / 6;
      const tx = ccx + tropicalR * Math.cos(ang);
      const ty = ccy + tropicalR * Math.sin(ang);
      const isActive = i === telemetry.signIndex;

      ctx.fillStyle = isActive ? '#F59E0B' : '#7DD3FC';
      ctx.font = isActive ? 'bold 11px "Cairo", sans-serif' : '9px "Cairo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ZODIAC_SIGNS[i].name, tx, ty);
    }

    // ب. الكوكبات النجمية الفعلية للثوابت
    const siderealR = 212;
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(ccx, ccy, siderealR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < 12; i++) {
      const sDivAng = -(i * Math.PI / 6 + precRad);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ccx + (siderealR - 7) * Math.cos(sDivAng), ccy + (siderealR - 7) * Math.sin(sDivAng));
      ctx.lineTo(ccx + (siderealR + 7) * Math.cos(sDivAng), ccy + (siderealR + 7) * Math.sin(sDivAng));
      ctx.stroke();

      const sAng = -((i + 0.5) * Math.PI / 6 + precRad);
      const sx = ccx + siderealR * Math.cos(sAng);
      const sy = ccy + siderealR * Math.sin(sAng);
      const isSidActive = i === telemetry.siderealSignIndex;

      ctx.fillStyle = isSidActive ? '#F43F5E' : '#C084FC';
      ctx.beginPath();
      ctx.arc(sx, sy, isSidActive ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isSidActive ? '#FDA4AF' : '#E9D5FF';
      ctx.font = isSidActive ? 'bold 10px "Cairo", sans-serif' : '8px "Cairo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('كوكبة ' + ZODIAC_SIGNS[i].name, sx, sy - 8);
    }

    // ج. شعاع محاذاة الشمس المزدوج
    if (showSolarRay) {
      const sunTheta = (telemetry.solarLong * Math.PI) / 180;
      const sunCos = Math.cos(sunTheta);
      const sunSin = Math.sin(sunTheta);

      const rayGrad = ctx.createLinearGradient(ccx, ccy, ccx + 265 * sunCos, ccy - 265 * sunSin);
      rayGrad.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
      rayGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.7)');
      rayGrad.addColorStop(1, 'rgba(251, 191, 36, 0.95)');

      ctx.strokeStyle = rayGrad;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(ccx, ccy);
      ctx.lineTo(ccx + 265 * sunCos, ccy - 265 * sunSin);
      ctx.stroke();
      ctx.setLineDash([]);

      let badgeX = ccx + 280 * sunCos;
      let badgeY = ccy - 280 * sunSin;
      const bw = 142, bh = 34;
      badgeX = Math.max(bw / 2 + 15, Math.min(canvasW - bw / 2 - 15, badgeX));
      badgeY = Math.max(bh / 2 + 35, Math.min(canvasH - bh / 2 - 35, badgeY));

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(badgeX - bw / 2, badgeY - bh / 2, bw, bh, 6);
      else ctx.rect(badgeX - bw / 2, badgeY - bh / 2, bw, bh);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 9.5px "Cairo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`☀️ اصطلاحاً: ${ZODIAC_SIGNS[telemetry.signIndex].name} (${telemetry.degInSign}°)`, badgeX, badgeY - 7);
      ctx.fillStyle = '#C084FC';
      ctx.fillText(`✨ فعلياً: كوكبة ${ZODIAC_SIGNS[telemetry.siderealSignIndex].name} (${telemetry.degInSidereal}°)`, badgeX, badgeY + 7);
    }

    // 5. النجم القطبي
    if (showPolarStars) {
      const polarisOrbitR = 14;
      const polCenterX = ccx;
      const polCenterY = ccy - 240;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(polCenterX, polCenterY, polarisOrbitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const polAng = atlasAngle + precRad;
      const polX = polCenterX + polarisOrbitR * Math.cos(polAng);
      const polY = polCenterY - polarisOrbitR * Math.sin(polAng); // متطابق مع حركة الشمس والكواكب من الشرق للغرب ⟲

      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath(); ctx.arc(polX, polY, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath(); ctx.arc(polX, polY, 3.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 9.5px "Cairo", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('★ النجم القطبي (Polaris - شمالاً)', polX + 10, polY);
    }

    // 6. دوائر الأفلاك السبعة والكواكب
    COSMOS_BODIES.forEach((b) => {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ccx, ccy, b.r, 0, Math.PI * 2);
      ctx.stroke();

      let centerTheta = 0;
      let epTheta = 0;

      if (b.key === 'moon') {
        centerTheta = (telemetry.lunarLong * Math.PI) / 180;
        epTheta = (telemetry.moonAnomaly * Math.PI) / 180;
      } else if (b.key === 'sun') {
        centerTheta = (telemetry.solarLong * Math.PI) / 180;
      } else {
        const speedRadPerDay = (b.speedDegPerDay * Math.PI) / 180;
        centerTheta = (telemetry.julianDay * speedRadPerDay) % (2 * Math.PI);
        epTheta = centerTheta * 2;
      }

      const bx = ccx + b.r * Math.cos(centerTheta);
      const by = ccy - b.r * Math.sin(centerTheta);

      if (b.key !== 'sun') {
        ctx.strokeStyle = b.color + '55';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(bx, by, b.ep, 0, Math.PI * 2);
        ctx.stroke();
      }

      const px = bx + (b.key === 'sun' ? 0 : b.ep * Math.cos(epTheta));
      const py = by - (b.key === 'sun' ? 0 : b.ep * Math.sin(epTheta));

      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(px, py, b.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 9px "Cairo", sans-serif';
      const alignL = bx > ccx;
      ctx.textAlign = alignL ? 'left' : 'right';
      ctx.fillText(b.name, bx + (alignL ? 8 : -8), by - 4);
    });

    // 7. مركز الأرض O
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(ccx, ccy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 9.5px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الأرض O', ccx, ccy + 17);
  }, [telemetry, showPolarStars, showCelestialAxis, showEastWestAxis, showSolarRay]);

  return (
    <div className="view-panel">
      <div className="canvas-wrap" style={{ flex: '1 1 600px' }}>
        <h4 style={{ color: 'var(--gold)' }}>🌌 هيأة الأفلاك التسعة — متزامن مع التاريخ والوقت</h4>
        <canvas ref={canvasRef} width={660} height={660} />
        
        <div className="legend">
          <div className="legend-item"><span className="dot" style={{ background: '#A855F7' }}></span> الفلك التاسع (الأطلس 24h) ⟲</div>
          <div className="legend-item"><span className="dot" style={{ background: '#38BDF8' }}></span> فلك الثوابت (الثامن - المبادرة 1°/70س)</div>
          <div className="legend-item"><span className="dot" style={{ background: '#FBBF24' }}></span> الشمس (الرابع)</div>
          <div className="legend-item"><span className="dot" style={{ background: '#F59E0B' }}></span> خط الشرق والغرب</div>
        </div>

        <div className="controls-row">
          <label style={{ color: 'var(--gold)', fontWeight: 'bold' }}>
            <input type="checkbox" checked={showPolarStars} onChange={(e) => setShowPolarStars(e.target.checked)} /> ★ النجم القطبي
          </label>
          <label style={{ color: 'var(--blue)' }}>
            <input type="checkbox" checked={showCelestialAxis} onChange={(e) => setShowCelestialAxis(e.target.checked)} /> محور القطبين (الشمال والجنوب)
          </label>
          <label style={{ color: '#F59E0B', fontWeight: 'bold' }}>
            <input type="checkbox" checked={showEastWestAxis} onChange={(e) => setShowEastWestAxis(e.target.checked)} /> خط الشرق والغرب
          </label>
          <label style={{ color: '#34D399', fontWeight: 'bold' }}>
            <input type="checkbox" checked={showSolarRay} onChange={(e) => setShowSolarRay(e.target.checked)} /> ☀️ شعاع محاذاة الشمس
          </label>
        </div>
      </div>

      <div className="dashboard" style={{ flex: '1 1 420px' }}>
        <h3>📐 نسب سرعات الأفلاك السبعة السيارة (الدورات الفلكية الفعلية)</h3>
        <table className="compare-table">
          <thead>
            <tr>
              <th>الفلك / الكوكب</th>
              <th>الدورة السيدريّة</th>
              <th>السرعة اليومية</th>
              <th>نسبة أبعاد ابن الشاطر</th>
            </tr>
          </thead>
          <tbody>
            {COSMOS_BODIES.map((b) => (
              <tr key={b.key}>
                <td className="text-cell">{b.name}</td>
                <td>{b.periodDays} يوماً</td>
                <td>{b.speedDegPerDay}°/ي</td>
                <td>{b.ibsParams}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="quote-box" style={{ marginTop: '12px' }}>
          <strong>📜 ابن الشاطر — نهاية السول في تصحيح الأصول (ص 64):</strong><br />
          «وجعلنا الحامل الأول يتحرك بحركة وسط الكوكب، والحامل الثاني بحركة مضاعفة عكسية ليُحدث
          ما يُحدثه الفلك الخارج المركز من غير أن يخرج المركز أو يُثبت نقطة المعدل خارج جرم الفلك.»
        </div>
      </div>
    </div>
  );
};
