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
}>();

const BOX_SIZE = 50;
const GAP = 4;
const MARGIN = 40;
const POINTER_AREA = 40;

const COLOR_BG = '#0F172A';
const COLOR_DEFAULT = '#1E293B';
const COLOR_BORDER = '#475569';
const COLOR_COMPARE = '#FBBF24';
const COLOR_FOUND = '#10B981';
const COLOR_DIMMED = '#1E293B44';
const COLOR_TEXT = '#FFFFFF';
const COLOR_DIMMED_TEXT = '#FFFFFF55';
// pointer arrow color used inline below
const _COLOR_POINTER = '#38BDF8';

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
  if (!frame || frame.dataState.length === 0) return;

  const n = frame.dataState.length;
  const totalW = n * BOX_SIZE + (n - 1) * GAP;
  const startX = Math.max(MARGIN, (w - totalW) / 2);
  const y = (h - BOX_SIZE - POINTER_AREA) / 2;

  for (let i = 0; i < n; i++) {
    const x = startX + i * (BOX_SIZE + GAP);
    const isDimmed = frame.highlights.dimmed.includes(i);
    const isCompare = frame.highlights.compare.includes(i);
    const isFound = frame.highlights.found === i;

    ctx.fillStyle = isFound ? COLOR_FOUND : isCompare ? COLOR_COMPARE : isDimmed ? COLOR_DIMMED : COLOR_DEFAULT;
    ctx.strokeStyle = isFound ? COLOR_FOUND : isCompare ? COLOR_COMPARE : COLOR_BORDER;
    ctx.lineWidth = isFound || isCompare ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, BOX_SIZE, BOX_SIZE, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDimmed ? COLOR_DIMMED_TEXT : COLOR_TEXT;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(frame.dataState[i]), x + BOX_SIZE / 2, y + BOX_SIZE / 2);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText(String(i), x + BOX_SIZE / 2, y + BOX_SIZE + 14);
  }

  const pointerY = y + BOX_SIZE + 28;
  const pointers: { idx: number; label: string; color: string }[] = [];
  if (frame.highlights.low != null) pointers.push({ idx: frame.highlights.low, label: 'Low', color: '#3B82F6' });
  if (frame.highlights.mid != null) pointers.push({ idx: frame.highlights.mid, label: 'Mid', color: COLOR_COMPARE });
  if (frame.highlights.high != null) pointers.push({ idx: frame.highlights.high, label: 'High', color: '#EF4444' });

  for (const ptr of pointers) {
    const px = startX + ptr.idx * (BOX_SIZE + GAP) + BOX_SIZE / 2;
    ctx.fillStyle = ptr.color;
    ctx.beginPath();
    ctx.moveTo(px, pointerY - 6);
    ctx.lineTo(px - 5, pointerY);
    ctx.lineTo(px + 5, pointerY);
    ctx.fill();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ptr.label, px, pointerY + 12);
  }
}

watch(() => props.frame, renderCanvas, { deep: true });

onMounted(() => {
  resizeObserver = new ResizeObserver(resizeCanvas);
  if (containerRef.value) resizeObserver.observe(containerRef.value);
  resizeCanvas();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>
