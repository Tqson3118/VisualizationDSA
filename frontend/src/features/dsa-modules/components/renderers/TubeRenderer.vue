<template>
  <div ref="containerRef" class="w-full h-full bg-[#0F172A] relative">
    <canvas ref="canvasRef" class="w-full h-full block" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { FrameDTO } from '../../types/algorithm.types';

const props = defineProps<{
  frame: FrameDTO | null;
  mode: 'stack' | 'queue';
}>();

const CELL_W = 70;
const CELL_H = 36;
const GAP = 4;
const MARGIN = 40;

const COLOR_BG = '#0F172A';
const COLOR_CELL = '#1E293B';
const COLOR_BORDER = '#475569';
const COLOR_ACTIVE = '#38BDF8';
const COLOR_REMOVE = '#EF4444';
const COLOR_TEXT = '#FFFFFF';

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

function resizeCanvas(): void {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  renderCanvas();
}

function renderCanvas(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, w, h);

  const frame = props.frame;
  if (!frame) return;

  const n = frame.dataState.length;
  if (n === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      props.mode === 'stack' ? 'Ngăn xếp rỗng' : 'Hàng đợi rỗng',
      w / 2, h / 2,
    );
    return;
  }

  if (props.mode === 'stack') {
    const totalH = n * (CELL_H + GAP) - GAP;
    const startY = Math.max(MARGIN, (h - totalH) / 2);
    const cx = w / 2;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - CELL_W / 2 - 10, startY - 10, CELL_W + 20, totalH + 20);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TOP', cx, startY - 16);

    for (let i = n - 1; i >= 0; i--) {
      const visualIdx = n - 1 - i;
      const y = startY + visualIdx * (CELL_H + GAP);
      const isActive = frame.highlights.active.includes(i);
      const isRemove = frame.highlights.swap.includes(i);

      ctx.fillStyle = isRemove ? COLOR_REMOVE : isActive ? COLOR_ACTIVE : COLOR_CELL;
      ctx.strokeStyle = isRemove ? COLOR_REMOVE : isActive ? COLOR_ACTIVE : COLOR_BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - CELL_W / 2, y, CELL_W, CELL_H, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLOR_TEXT;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(frame.dataState[i]), cx, y + CELL_H / 2);
    }
  } else {
    const totalW = n * (CELL_W + GAP) - GAP;
    const startX = Math.max(MARGIN, (w - totalW) / 2);
    const cy = h / 2;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX - 10, cy - CELL_H / 2 - 10, totalW + 20, CELL_H + 20);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FRONT', startX + CELL_W / 2, cy - CELL_H / 2 - 16);
    ctx.fillText('REAR', startX + totalW - CELL_W / 2, cy - CELL_H / 2 - 16);

    for (let i = 0; i < n; i++) {
      const x = startX + i * (CELL_W + GAP);
      const isActive = frame.highlights.active.includes(i);
      const isRemove = frame.highlights.swap.includes(i);

      ctx.fillStyle = isRemove ? COLOR_REMOVE : isActive ? COLOR_ACTIVE : COLOR_CELL;
      ctx.strokeStyle = isRemove ? COLOR_REMOVE : isActive ? COLOR_ACTIVE : COLOR_BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, cy - CELL_H / 2, CELL_W, CELL_H, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLOR_TEXT;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(frame.dataState[i]), x + CELL_W / 2, cy);
    }
  }
}

watch([() => props.frame, () => props.mode], renderCanvas, { deep: true });

onMounted(() => {
  resizeObserver = new ResizeObserver(resizeCanvas);
  if (containerRef.value) resizeObserver.observe(containerRef.value);
  resizeCanvas();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>
