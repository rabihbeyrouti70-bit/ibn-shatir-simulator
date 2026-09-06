import React, { useRef, useEffect } from 'react';
import { AstroTelemetry } from '../../types/astronomy';
import { HISTORICAL_QUOTES } from '../../constants/historicalData';
import { drawCircleArrow } from '../../utils/canvasDrawers';

interface SunComparisonViewProps {
  telemetry: AstroTelemetry;
}

export const SunComparisonView: React.FC<SunComparisonViewProps> = ({ telemetry }) => {
  const ptolCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ibsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const sunAlphaRad = (telemetry.solarAnomaly * Math.PI) / 180;
  const sScale = 2.85;

  // 1. رسم نموذج بطلميوس للشمس (الفلك الخارج)
  useEffect(() => {
    const canvas = ptolCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 480, h = 480;
    const scx = 240, scy = 240;
    ctx.clearRect(0, 0, w, h);

    const R = 60.0;
    const e = 2.5; // الانحراف

    // مركز الأرض O
    const ox = scx;
    const oy = scy;

    // مركز الفلك الخارج E
    const ex = scx;
    const ey = scy + e * sScale;

    // الفلك الخارج المركز
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, ey, R * sScale, 0, Math.PI * 2);
    ctx.stroke();

    // خط الأوج والحضيض
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ex, ey - (R + 12) * sScale);
    ctx.lineTo(ex, ey + (R + 12) * sScale);
    ctx.stroke();
    ctx.setLineDash([]);

    // الشمس عند بطلميوس
    const sx = ex + R * sScale * Math.sin(sunAlphaRad);
    const sy = ey - R * sScale * Math.cos(sunAlphaRad);

    // شعاع الرؤية من الأرض
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // رسم الأرض O
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('الأرض O (مزاحة!)', ox - 10, oy + 4);

    // رسم مركز الخارج E
    ctx.fillStyle = '#F87171';
    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('مركز الفلك E', ex + 10, ey + 4);

    // رسم الشمس
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('الشمس ☉', sx + 12, sy + 4);
  }, [sunAlphaRad]);

  // 2. رسم نموذج ابن الشاطر للشمس (مركزية تامة للأرض + حامل ومدير)
  useEffect(() => {
    const canvas = ibsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 480, h = 480;
    const scx = 240, scy = 240;
    ctx.clearRect(0, 0, w, h);

    const R = 60.0;
    const r1 = 4.6167;
    const r2 = 2.5000;

    // الفلك الممثل (مركزه الأرض تماماً)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(scx, scy, R * sScale, 0, Math.PI * 2);
    ctx.stroke();

    // مركز الحامل p1
    const p1x = scx + R * sScale * Math.sin(sunAlphaRad);
    const p1y = scy - R * sScale * Math.cos(sunAlphaRad);

    // دائرة الحامل وسهم دورانه (+α)
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(p1x, p1y, r1 * sScale, 0, Math.PI * 2);
    ctx.stroke();
    drawCircleArrow(ctx, p1x, p1y, r1 * sScale, -sunAlphaRad, -sunAlphaRad - 1.2, true, '#60A5FA');

    // مركز المدير p2
    const p2x = p1x + r1 * sScale * Math.sin(sunAlphaRad);
    const p2y = p1y - r1 * sScale * Math.cos(sunAlphaRad);

    // دائرة المدير وسهم دورانه المعاكس (-2α)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(p2x, p2y, r2 * sScale, 0, Math.PI * 2);
    ctx.stroke();
    drawCircleArrow(ctx, p2x, p2y, r2 * sScale, 2 * sunAlphaRad, 2 * sunAlphaRad + 1.2, false, '#F59E0B');

    // موضع الشمس النهائي
    const sx = p2x - r2 * sScale * Math.sin(2 * sunAlphaRad);
    const sy = p2y + r2 * sScale * Math.cos(2 * sunAlphaRad);

    // شعاع من الأرض للشمس
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scx, scy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // رسم الأرض O
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(scx, scy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الأرض O (المركز التام)', scx, scy + 18);

    // رسم الشمس
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('الشمس ☉', sx + 12, sy + 4);
  }, [sunAlphaRad]);

  // حساب المسافات الآنية
  const ibsDist = (60.0 + 4.6167 * Math.cos(sunAlphaRad) - 2.5 * Math.cos(2 * sunAlphaRad)).toFixed(1);
  const ptDist = Math.sqrt(Math.pow(2.5 + 60.0 * Math.cos(sunAlphaRad), 2) + Math.pow(60.0 * Math.sin(sunAlphaRad), 2)).toFixed(1);

  return (
    <div className="view-panel">
      {/* شبكة المقارنة جنباً إلى جنب */}
      <div className="compare-row">
        {/* نموذج بطلميوس */}
        <div className="canvas-wrap compare-col ptolemy-card">
          <div className="model-badge ptol-badge">🔴 نموذج بطلميوس (المجسطي 150م) — إشكالية الفلك الخارج</div>
          <canvas ref={ptolCanvasRef} width={480} height={480} />
          <div className="legend">
            <div className="legend-item"><span className="dot" style={{ background: '#FF6B6B' }}></span> الفلك الخارج المركز (E)</div>
            <div className="legend-item"><span className="dot" style={{ background: '#38BDF8' }}></span> الأرض O مزاحة عن المركز!</div>
          </div>
        </div>

        {/* نموذج ابن الشاطر */}
        <div className="canvas-wrap compare-col ibs-card">
          <div className="model-badge ibs-badge">🟢 نموذج ابن الشاطر (نهاية السول 1363م) — مركزية تامة للأرض</div>
          <canvas ref={ibsCanvasRef} width={480} height={480} />
          <div className="legend">
            <div className="legend-item"><span className="dot" style={{ background: '#38BDF8' }}></span> الفلك الممثل (R=60) متصل بمركز الأرض</div>
            <div className="legend-item"><span className="dot" style={{ background: '#60A5FA' }}></span> الحامل + المدير (مزدوجة التدوير)</div>
          </div>
        </div>
      </div>

      {/* لوحة المقارنة الحسابية */}
      <div className="dashboard" style={{ width: '100%' }}>
        <h3>📊 مقارنة نموذجَي الشمس — القيم الآنية المتزامنة</h3>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="label">خاصة الشمس (ᾱ)</div>
            <div className="value">{telemetry.solarAnomaly.toFixed(1)}°</div>
          </div>
          <div className="stat-box">
            <div className="label">بعد الشمس — ابن الشاطر</div>
            <div className="value ibs">{ibsDist} جزءاً</div>
          </div>
          <div className="stat-box">
            <div className="label">بعد الشمس — بطلميوس</div>
            <div className="value ptolemy">{ptDist} جزءاً</div>
          </div>
          <div className="stat-box">
            <div className="label">مركز العالم</div>
            <div className="value ibs">الأرض O حصراً</div>
          </div>
        </div>

        <table className="compare-table" style={{ marginTop: '12px' }}>
          <thead>
            <tr>
              <th>العنصر</th>
              <th style={{ color: 'var(--ptolemy)' }}>بطلميوس (المجسطي)</th>
              <th style={{ color: 'var(--ibs)' }}>ابن الشاطر (نهاية السول)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-cell">مركز الدائرة الكبرى</td>
              <td style={{ color: 'var(--ptolemy)' }}>E (خارج الأرض بـ 2;30)</td>
              <td style={{ color: 'var(--ibs)' }}>O (مركز الأرض دائماً)</td>
            </tr>
            <tr>
              <td className="text-cell">نوع الفلك</td>
              <td>خارج المركز (Eccentric)</td>
              <td>ممثل + حامل + مدير (متحدة المركز)</td>
            </tr>
            <tr>
              <td className="text-cell">أقصى تعديل للمركز</td>
              <td>2° 23' (موروث عن هيبارخوس)</td>
              <td style={{ color: 'var(--ibs)', fontWeight: 'bold' }}>2° 02' (مطابق للرصد الدقيق)</td>
            </tr>
          </tbody>
        </table>

        <div className="quote-box ibs" style={{ marginTop: '12px' }}>
          <strong>📜 {HISTORICAL_QUOTES.sunIbs.source}:</strong><br />
          «{HISTORICAL_QUOTES.sunIbs.text}»
        </div>
      </div>
    </div>
  );
};
