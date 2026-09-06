import React, { useRef, useEffect } from 'react';
import { AstroTelemetry } from '../../types/astronomy';
import { HISTORICAL_QUOTES } from '../../constants/historicalData';
import { drawCircleArrow } from '../../utils/canvasDrawers';

interface MoonComparisonViewProps {
  telemetry: AstroTelemetry;
}

export const MoonComparisonView: React.FC<MoonComparisonViewProps> = ({ telemetry }) => {
  const ptolCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ibsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const moonElongRad = (telemetry.moonElongation * Math.PI) / 180;
  const moonAnomRad = (telemetry.moonAnomaly * Math.PI) / 180;
  const mScale = 2.8;

  // 1. رسم نموذج بطلميوس للقمر (المرفاق)
  useEffect(() => {
    const canvas = ptolCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 480, h = 480;
    const mcx = 240, mcy = 240;
    ctx.clearRect(0, 0, w, h);

    const R = 49.69;
    const r_crank = 10.31;
    const r_ep = 5.25;

    // دائرة المرفاق
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(mcx, mcy, r_crank * mScale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // مركز الفلك الحامل اللامركزي D
    const Dx = mcx + r_crank * mScale * Math.cos(-moonElongRad);
    const Dy = mcy - r_crank * mScale * Math.sin(-moonElongRad);

    // الفلك الحامل
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(Dx, Dy, R * mScale, 0, Math.PI * 2);
    ctx.stroke();

    // مركز فلك التدوير E
    const epx = Dx + R * mScale * Math.cos(moonElongRad);
    const epy = Dy - R * mScale * Math.sin(moonElongRad);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(epx, epy, r_ep * mScale, 0, Math.PI * 2);
    ctx.stroke();
    drawCircleArrow(ctx, epx, epy, r_ep * mScale, -(moonElongRad + moonAnomRad), -(moonElongRad + moonAnomRad) - 1.2, true, '#FCD34D');

    // موضع قمر بطلميوس يدور على فلك التدوير بالخاصة
    const mx = epx + r_ep * mScale * Math.cos(moonElongRad + moonAnomRad);
    const my = epy - r_ep * mScale * Math.sin(moonElongRad + moonAnomRad);

    // أذرع الربط لبطلميوس
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(mcx, mcy); ctx.lineTo(Dx, Dy); ctx.stroke();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath(); ctx.moveTo(Dx, Dy); ctx.lineTo(epx, epy); ctx.stroke();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(epx, epy); ctx.lineTo(mx, my); ctx.stroke();

    // حساب المسافة الحقيقية لمعرفة التضاعف الظاهري
    const distPx = Math.sqrt(Math.pow(mx - mcx, 2) + Math.pow(my - mcy, 2));
    const distUnits = distPx / mScale;
    const moonRadius = Math.max(3.5, Math.min(15, 4.0 * (60.0 / distUnits)));

    // رسم شعاع الرؤية
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(mcx, mcy); ctx.lineTo(mx, my); ctx.stroke();
    ctx.setLineDash([]);

    // رسم الأرض O
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(mcx, mcy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الأرض O', mcx, mcy + 20);

    // رسم قمر بطلميوس (المتضاعف حجماً في التربيعين!)
    ctx.fillStyle = '#F87171';
    ctx.beginPath(); ctx.arc(mx, my, moonRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#FCA5A5';
    ctx.textAlign = mx > mcx ? 'left' : 'right';
    ctx.fillText(`قمر بطلميوس (${distUnits.toFixed(1)}جزء)`, mx + (mx > mcx ? 12 : -12), my - 8);
  }, [moonElongRad, moonAnomRad]);

  // 2. رسم نموذج ابن الشاطر للقمر (ثبات الحجم والمدار)
  useEffect(() => {
    const canvas = ibsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 480, h = 480;
    const mcx = 240, mcy = 240;
    ctx.clearRect(0, 0, w, h);

    const R = 60.0;
    const r1 = 6.5833;
    const r2 = 1.4167;

    // الفلك الممثل (مركزه الأرض دائماً)
    const R_vis = 142;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(mcx, mcy, R_vis, 0, Math.PI * 2);
    ctx.stroke();

    // مقياس بصري واضح للأفلاك التدويرية ليظهر دوران القمر حول المدير بجلاء تام
    const r1_vis = 36; // نصف قطر الحامل (قطره 72px)
    const r2_vis = 15; // نصف قطر المدير (قطره 30px) - واضح وكبير

    // مركز الحامل على الفلك الممثل بالاستطالة
    const c1x = mcx + R_vis * Math.cos(moonElongRad);
    const c1y = mcy - R_vis * Math.sin(moonElongRad);

    ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(c1x, c1y, r1_vis, 0, Math.PI * 2);
    ctx.stroke();
    drawCircleArrow(ctx, c1x, c1y, r1_vis, -(moonElongRad + moonAnomRad), -(moonElongRad + moonAnomRad) - 1.2, true, '#60A5FA');

    // مركز المدير يدور على محيط الحامل بخاصة القمر (+γ)
    const c2x = c1x + r1_vis * Math.cos(moonElongRad + moonAnomRad);
    const c2y = c1y - r1_vis * Math.sin(moonElongRad + moonAnomRad);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(c2x, c2y, r2_vis, 0, Math.PI * 2);
    ctx.stroke();

    // موضع قمر ابن الشاطر يدور على محيط المدير بضعف الاستطالة وفق نص نهاية السول
    const ang_m = moonElongRad + moonAnomRad + Math.PI - 2 * moonElongRad;
    const mx = c2x + r2_vis * Math.cos(ang_m);
    const my = c2y - r2_vis * Math.sin(ang_m);
    drawCircleArrow(ctx, c2x, c2y, r2_vis, -ang_m, -ang_m - 1.2, true, '#FDE047');

    // ذراع من الأرض إلى مركز الحامل
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mcx, mcy);
    ctx.lineTo(c1x, c1y);
    ctx.stroke();

    // ذراع الحامل الأول من c1 إلى مركز المدير c2
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c1x, c1y);
    ctx.lineTo(c2x, c2y);
    ctx.stroke();

    // ذراع المدير الثاني من c2 إلى جرم القمر mx (طولها 15px وتدور بوضوح تام)
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(c2x, c2y);
    ctx.lineTo(mx, my);
    ctx.stroke();

    // نقطة مركز الحامل c1
    ctx.fillStyle = '#60A5FA';
    ctx.beginPath(); ctx.arc(c1x, c1y, 3.5, 0, Math.PI * 2); ctx.fill();

    // نقطة مركز المدير c2
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath(); ctx.arc(c2x, c2y, 3.5, 0, Math.PI * 2); ctx.fill();

    // رسم الأرض O
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(mcx, mcy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الأرض O (المركز)', mcx, mcy + 20);

    // قمر ابن الشاطر بحجم مضبوط (3.5px) يدور بوضوح على محيط المدير
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#A7F3D0';
    ctx.textAlign = mx > mcx ? 'left' : 'right';
    const realDist = Math.hypot((R * Math.cos(moonElongRad) + r1 * Math.cos(moonElongRad + moonAnomRad) + r2 * Math.cos(3 * moonElongRad - moonAnomRad)),
                                (R * Math.sin(moonElongRad) + r1 * Math.sin(moonElongRad + moonAnomRad) + r2 * Math.sin(3 * moonElongRad - moonAnomRad)));
    ctx.fillText(`قمر ابن الشاطر (${realDist.toFixed(1)}جزء)`, mx + (mx > mcx ? 12 : -12), my - 8);
  }, [moonElongRad, moonAnomRad]);

  const isQuad = Math.abs(telemetry.moonElongation - 90) < 15 || Math.abs(telemetry.moonElongation - 270) < 15;

  return (
    <div className="view-panel">
      {/* شبكة المقارنة جنباً إلى جنب */}
      <div className="compare-row">
        {/* نموذج بطلميوس */}
        <div className="canvas-wrap compare-col ptolemy-card">
          <div className="model-badge ptol-badge">🔴 نموذج بطلميوس — معضلة المرفاق وتضاعف حجم القمر</div>
          <canvas ref={ptolCanvasRef} width={480} height={480} />
          <div className="legend">
            <div className="legend-item"><span className="dot" style={{ background: '#FF6B6B' }}></span> فلك المرفاق المتحرك</div>
            <div className="legend-item"><span className="dot" style={{ background: '#F87171' }}></span> قمر بطلميوس (يقترب إلى 34 جزءاً في التربيع!)</div>
          </div>
        </div>

        {/* نموذج ابن الشاطر */}
        <div className="canvas-wrap compare-col ibs-card">
          <div className="model-badge ibs-badge">🟢 نموذج ابن الشاطر — ثبات الحجم والبعد الحقيقي</div>
          <canvas ref={ibsCanvasRef} width={480} height={480} />
          <div className="legend">
            <div className="legend-item"><span className="dot" style={{ background: '#38BDF8' }}></span> الفلك الممثل (R=60) مركزه الأرض دائماً</div>
            <div className="legend-item"><span className="dot" style={{ background: '#34D399' }}></span> قمر ابن الشاطر المصحح (52 إلى 68 جزءاً)</div>
          </div>
        </div>
      </div>

      {/* لوحة المقارنة الحسابية */}
      <div className="dashboard" style={{ width: '100%' }}>
        <h3>🌙 مقارنة نموذجَي القمر — تحليل معضلة الحجم والمسافة</h3>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="label">استطالة القمر (D)</div>
            <div className="value">{telemetry.moonElongation.toFixed(1)}°</div>
          </div>
          <div className="stat-box">
            <div className="label">الحالة المدارية</div>
            <div className="value" style={{ color: isQuad ? 'var(--ptolemy)' : 'var(--ibs)' }}>
              {isQuad ? 'تربيع (أزمة بطلميوس)' : 'محاق / بدر'}
            </div>
          </div>
          <div className="stat-box">
            <div className="label">حجم القمر (ابن الشاطر)</div>
            <div className="value ibs">ثابت ≈ 100%</div>
          </div>
          <div className="stat-box">
            <div className="label">حجم القمر (بطلميوس)</div>
            <div className="value ptolemy">{isQuad ? 'يتضاعف 2× (خطأ!)' : 'طبيعي'}</div>
          </div>
        </div>

        <table className="compare-table" style={{ marginTop: '12px' }}>
          <thead>
            <tr>
              <th>الوضع الفلكي</th>
              <th style={{ color: 'var(--ptolemy)' }}>بطلميوس — بعد القمر</th>
              <th style={{ color: 'var(--ibs)' }}>ابن الشاطر — بعد القمر</th>
              <th>التقييم العلمي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-cell">المحاق والبدر (D = 0° أو 180°)</td>
              <td>64.2 جزءاً</td>
              <td style={{ color: 'var(--ibs)' }}>65.2 إلى 68 جزءاً</td>
              <td>متقارب رصدياً</td>
            </tr>
            <tr>
              <td className="text-cell">التربيعان (D = 90° أو 270°)</td>
              <td style={{ color: 'var(--ptolemy)', fontWeight: 'bold' }}>~34 جزءاً (قمر 2× أكبر!)</td>
              <td style={{ color: 'var(--ibs)', fontWeight: 'bold' }}>~52-55 جزءاً (حجم منطقي)</td>
              <td style={{ color: '#F59E0B', fontWeight: 'bold' }}>حل ابن الشاطر التاريخي العظيم</td>
            </tr>
          </tbody>
        </table>

        <div className="quote-box ptol" style={{ marginTop: '12px' }}>
          <strong>⚠️ {HISTORICAL_QUOTES.moonCriticism.source}:</strong><br />
          «{HISTORICAL_QUOTES.moonCriticism.text}»
        </div>

        <div className="quote-box ibs" style={{ marginTop: '8px' }}>
          <strong>✅ {HISTORICAL_QUOTES.moonFix.source}:</strong><br />
          «{HISTORICAL_QUOTES.moonFix.text}»
        </div>
      </div>
    </div>
  );
};
