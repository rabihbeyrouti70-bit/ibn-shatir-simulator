import React, { useRef, useEffect, useState } from 'react';
import { AstroTelemetry } from '../../types/astronomy';
import { PLANET_MODELS } from '../../constants/astronomicalData';
import { HISTORICAL_QUOTES } from '../../constants/historicalData';
import { drawCircleArrow } from '../../utils/canvasDrawers';

interface PlanetsComparisonViewProps {
  telemetry: AstroTelemetry;
}

export const PlanetsComparisonView: React.FC<PlanetsComparisonViewProps> = ({ telemetry }) => {
  const [selectedPlanet, setSelectedPlanet] = useState<string>('mars');
  const ptolCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ibsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const planet = PLANET_MODELS[selectedPlanet] || PLANET_MODELS.mars;
  const alphaRad = (telemetry.solarAnomaly * Math.PI) / 180;
  const pScale = 480 / (2 * (planet.R + planet.e + planet.r_ep + 16));

  // 1. رسم نموذج بطلميوس (الفلك الخارج ونقطة المعادل)
  useEffect(() => {
    const canvas = ptolCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 480, h = 480;
    const pcx = 240, pcy = 240;
    ctx.clearRect(0, 0, w, h);

    const ox = pcx;
    const oy = pcy;
    const ex = pcx;
    const ey = pcy - planet.e * pScale;
    const qx = pcx;
    const qy = pcy - 2 * planet.e * pScale; // نقطة المعادل

    // الفلك الخارج
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, ey, planet.R * pScale, 0, Math.PI * 2);
    ctx.stroke();

    // مركز فلك التدوير
    const cx = ex + planet.R * pScale * Math.sin(alphaRad);
    const cy = ey - planet.R * pScale * Math.cos(alphaRad);

    // فلك التدوير
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, planet.r_ep * pScale, 0, Math.PI * 2);
    ctx.stroke();

    // موضع الكوكب
    const px = cx + planet.r_ep * pScale * Math.sin(alphaRad * 2);
    const py = cy - planet.r_ep * pScale * Math.cos(alphaRad * 2);

    // خط المعادل
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(cx, cy); ctx.stroke();
    ctx.setLineDash([]);

    // رسم الأرض O
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 9.5px "Cairo", sans-serif';
    ctx.fillText('الأرض O', ox, oy + 18);

    // رسم نقطة المعادل Q
    ctx.fillStyle = '#FACC15';
    ctx.beginPath(); ctx.arc(qx, qy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('المعادل Q (2e)', qx + 10, qy);

    // رسم الكوكب
    ctx.fillStyle = '#FB923C';
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(planet.name, px + 8, py);
  }, [selectedPlanet, alphaRad, pScale, planet]);

  // 2. رسم نموذج ابن الشاطر (إلغاء المعادل بمزدوجة التدوير)
  useEffect(() => {
    const canvas = ibsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 480, h = 480;
    const pcx = 240, pcy = 240;
    ctx.clearRect(0, 0, w, h);

    // الفلك الممثل (متحد المركز مع الأرض)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pcx, pcy, planet.R * pScale, 0, Math.PI * 2);
    ctx.stroke();

    // مركز الحامل الأول
    const c1x = pcx + planet.R * pScale * Math.sin(alphaRad);
    const c1y = pcy - planet.R * pScale * Math.cos(alphaRad);

    // الحامل الأول r1 وسهم دورانه (+α)
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
    ctx.beginPath();
    ctx.arc(c1x, c1y, planet.r1 * pScale, 0, Math.PI * 2);
    ctx.stroke();
    drawCircleArrow(ctx, c1x, c1y, planet.r1 * pScale, -alphaRad, -alphaRad - 1.2, true, '#60A5FA');

    // مركز المدير r2
    const c2x = c1x + planet.r1 * pScale * Math.sin(alphaRad);
    const c2y = c1y - planet.r1 * pScale * Math.cos(alphaRad);

    // المدير r2 وسهم دورانه المعاكس (-2α)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.beginPath();
    ctx.arc(c2x, c2y, planet.r2 * pScale, 0, Math.PI * 2);
    ctx.stroke();
    drawCircleArrow(ctx, c2x, c2y, planet.r2 * pScale, 2 * alphaRad, 2 * alphaRad + 1.2, false, '#C084FC');

    // مركز فلك التدوير الأصلي r3
    const c3x = c2x - planet.r2 * pScale * Math.sin(2 * alphaRad);
    const c3y = c2y + planet.r2 * pScale * Math.cos(2 * alphaRad);

    // فلك التدوير r3
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.beginPath();
    ctx.arc(c3x, c3y, planet.r3 * pScale, 0, Math.PI * 2);
    ctx.stroke();
    drawCircleArrow(ctx, c3x, c3y, planet.r3 * pScale, alphaRad, alphaRad + 1.2, false, '#F59E0B');

    // الكوكب
    const px = c3x + planet.r3 * pScale * Math.sin(alphaRad * 2);
    const py = c3y - planet.r3 * pScale * Math.cos(alphaRad * 2);

    // رسم الأرض O
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(pcx, pcy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 9.5px "Cairo", sans-serif';
    ctx.fillText('الأرض O (المركز التام)', pcx, pcy + 18);

    // رسم الكوكب
    ctx.fillStyle = '#34D399';
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(`${planet.name} (ابن الشاطر)`, px + 8, py);
  }, [selectedPlanet, alphaRad, pScale, planet]);

  return (
    <div className="view-panel">
      {/* أزرار اختيار الكوكب */}
      <div style={{ width: '100%', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {Object.keys(PLANET_MODELS).map((k) => (
          <button
            key={k}
            className={`planet-btn ${selectedPlanet === k ? 'active' : ''}`}
            onClick={() => setSelectedPlanet(k)}
          >
            {PLANET_MODELS[k].name}
          </button>
        ))}
      </div>

      {/* شبكة المقارنة جنباً إلى جنب */}
      <div className="compare-row">
        {/* نموذج بطلميوس */}
        <div className="canvas-wrap compare-col ptolemy-card">
          <div className="model-badge ptol-badge">🔴 نموذج بطلميوس — {planet.name} (نقطة المعادل)</div>
          <canvas ref={ptolCanvasRef} width={480} height={480} />
          <div className="legend">
            <div className="legend-item"><span className="dot" style={{ background: '#FF6B6B' }}></span> الفلك الخارج المركز (E)</div>
            <div className="legend-item"><span className="dot" style={{ background: '#FACC15' }}></span> نقطة المعادل Q (الحركة المنتظمة حول الفراغ)</div>
          </div>
        </div>

        {/* نموذج ابن الشاطر */}
        <div className="canvas-wrap compare-col ibs-card">
          <div className="model-badge ibs-badge">🟢 نموذج ابن الشاطر — {planet.name} (مزدوجة التدوير)</div>
          <canvas ref={ibsCanvasRef} width={480} height={480} />
          <div className="legend">
            <div className="legend-item"><span className="dot" style={{ background: '#38BDF8' }}></span> الفلك الممثل (R=60) مركزه الأرض</div>
            <div className="legend-item"><span className="dot" style={{ background: '#60A5FA' }}></span> الحامل + المدير (انتظام تام دون معادل)</div>
          </div>
        </div>
      </div>

      {/* لوحة القياسات */}
      <div className="dashboard" style={{ width: '100%' }}>
        <h3>🪐 تفاصيل نموذج {planet.name} — معالجة نقطة المعادل</h3>
        <p style={{ color: '#CBD5E1', fontSize: '0.92em', lineHeight: '1.7' }}>{planet.notes}</p>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="label">نصف قطر الممثل R</div>
            <div className="value">60.0</div>
          </div>
          <div className="stat-box">
            <div className="label">الحامل الأول r1</div>
            <div className="value ibs">{planet.r1}</div>
          </div>
          <div className="stat-box">
            <div className="label">المدير الثاني r2</div>
            <div className="value ibs">{planet.r2}</div>
          </div>
          <div className="stat-box">
            <div className="label">انحراف بطلميوس e</div>
            <div className="value ptolemy">{planet.e}</div>
          </div>
        </div>

        <div className="quote-box" style={{ marginTop: '12px' }}>
          <strong>📜 {HISTORICAL_QUOTES.equantCriticism.source}:</strong><br />
          «{HISTORICAL_QUOTES.equantCriticism.text}»
        </div>
      </div>
    </div>
  );
};
