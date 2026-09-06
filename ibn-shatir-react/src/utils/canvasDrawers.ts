// دوال رسم الكانفاس المشتركة لتوفير وضوح ودقة عالية دون أي اقتطاع

export function drawDirectionBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  textColor: string,
  bgColor: string,
  borderColor: string
) {
  ctx.font = 'bold 10px "Cairo", "Segoe UI", sans-serif';
  const textWidth = ctx.measureText(text).width;
  const bw = textWidth + 16;
  const bh = 22;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 6);
  } else {
    ctx.rect(x - bw / 2, y - bh / 2, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// دالة رسم أسهم اتجاهات الدوران على أفلاك التدوير (Vector Rotation Arrows)
export function drawCircleArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  counterClockwise: boolean,
  color: string
) {
  if (r <= 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle, counterClockwise);
  ctx.stroke();

  // رأس السهم عند نقطة النهاية
  const tipX = cx + r * Math.cos(endAngle);
  const tipY = cy + r * Math.sin(endAngle);
  const tangent = endAngle + (counterClockwise ? -Math.PI / 2 : Math.PI / 2);
  const arrowLen = 6.5;
  const arrowSpread = 0.45;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - arrowLen * Math.cos(tangent - arrowSpread), tipY - arrowLen * Math.sin(tangent - arrowSpread));
  ctx.lineTo(tipX - arrowLen * Math.cos(tangent + arrowSpread), tipY - arrowLen * Math.sin(tangent + arrowSpread));
  ctx.closePath();
  ctx.fill();
}

