import type { FrameDTO } from '../../animation-engine/types/animation.types';

export interface BarPosition {
  x: number;
  targetX: number;
}

export const COLOR_DEFAULT = '#38BDF8';
export const COLOR_COMPARE = '#FBBF24';
export const COLOR_SWAP = '#EF4444';
export const COLOR_SORTED = '#10B981';
export const COLOR_TEXT = '#FFFFFF';

export const GAP = 6;
export const MARGIN = 30;
export const MARGIN_BOTTOM = 30;
export const PADDING_TOP = 50;

export const easeOut = (t: number): number => 1 - (1 - t) ** 3;
export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

export const calculateColumnWidth = (n: number, canvasW: number): number => {
  return n <= 0 ? 0 : (canvasW - GAP * (n - 1) - MARGIN * 2) / n;
};

export const calculateColumnHeight = (value: number, maxValue: number, canvasH: number): number => {
  return maxValue <= 0 ? 0 : (value / maxValue) * (canvasH - PADDING_TOP - MARGIN_BOTTOM);
};

export const calculateX = (index: number, columnWidth: number): number => MARGIN + index * (columnWidth + GAP);

export const determineColor = (index: number, frame: FrameDTO | null): string => {
  if (!frame) return COLOR_DEFAULT;
  const h = frame.highlights;
  return h.sorted.includes(index) ? COLOR_SORTED : h.swap.includes(index) ? COLOR_SWAP : h.compare.includes(index) ? COLOR_COMPARE : COLOR_DEFAULT;
};

export function drawCompareCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dpr: number,
  currentFrame: FrameDTO | null,
  isTransitioning: boolean,
  animationProgress: number,
  barPositions: BarPosition[]
) {
  const rootStyle = typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement) : null;
  const colorBg = rootStyle?.getPropertyValue('--canvas-bg').trim() || '#080808';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = colorBg;
  ctx.fillRect(0, 0, w, h);

  if (!currentFrame) return;
  const n = currentFrame.dataState.length;
  if (n === 0) return;

  const columnWidth = calculateColumnWidth(n, w);
  const maxVal = Math.max(...currentFrame.dataState, 1);

  for (let i = 0; i < n; i++) {
    const colH = calculateColumnHeight(currentFrame.dataState[i], maxVal, h);
    const yPos = h - colH - MARGIN_BOTTOM;
    let xPos = calculateX(i, columnWidth);
    if (isTransitioning && barPositions[i]) {
      xPos = lerp(barPositions[i].x, barPositions[i].targetX, easeOut(animationProgress));
    }

    const color = determineColor(i, currentFrame);
    ctx.fillStyle = color;

    const radius = Math.min(3, columnWidth / 4);
    ctx.beginPath();
    ctx.moveTo(xPos + radius, yPos);
    ctx.lineTo(xPos + columnWidth - radius, yPos);
    ctx.quadraticCurveTo(xPos + columnWidth, yPos, xPos + columnWidth, yPos + radius);
    ctx.lineTo(xPos + columnWidth, yPos + colH);
    ctx.lineTo(xPos, yPos + colH);
    ctx.lineTo(xPos, yPos + radius);
    ctx.quadraticCurveTo(xPos, yPos, xPos + radius, yPos);
    ctx.closePath();
    ctx.fill();

    if (color === COLOR_SORTED) {
      ctx.shadowColor = COLOR_SORTED; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
    }

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = `bold ${Math.min(11, columnWidth * 0.55)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(currentFrame.dataState[i].toString(), xPos + columnWidth / 2, yPos - 4);

    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.min(9, columnWidth * 0.4)}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(i.toString(), xPos + columnWidth / 2, h - MARGIN_BOTTOM + 5);
  }
}
