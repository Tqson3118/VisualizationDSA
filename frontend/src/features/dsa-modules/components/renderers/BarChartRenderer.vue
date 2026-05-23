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

const MARGIN = 40;
const MARGIN_BOTTOM = 40;
const PADDING_TOP = 20;
const GAP = 6;

const COLOR_BG = '#0F172A';
const COLOR_DEFAULT = '#38BDF8';
const COLOR_COMPARE = '#FBBF24';
const COLOR_SWAP = '#EF4444';
const COLOR_SORTED = '#10B981';
const COLOR_PIVOT = '#8B5CF6';
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

function determineColor(index: number, frame: FrameDTO): string {
  if (frame.highlights.sorted.includes(index)) return COLOR_SORTED;
  if (frame.highlights.pivot === index) return COLOR_PIVOT;
  if (frame.highlights.swap.includes(index)) return COLOR_SWAP;
  if (frame.highlights.compare.includes(index)) return COLOR_COMPARE;
  return COLOR_DEFAULT;
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
  const maxVal = Math.max(...frame.dataState, 1);
  const colW = (w - GAP * (n - 1) - MARGIN * 2) / n;
  const drawableHeight = h - PADDING_TOP - MARGIN_BOTTOM;

  for (let i = 0; i < n; i++) {
    const val = frame.dataState[i];
    const barH = (val / maxVal) * drawableHeight;
    const x = MARGIN + i * (colW + GAP);
    const y = h - MARGIN_BOTTOM - barH;

    ctx.fillStyle = determineColor(i, frame);
    ctx.beginPath();
    ctx.roundRect(x, y, colW, barH, 3);
    ctx.fill();

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = `bold ${Math.min(12, colW * 0.5)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(String(val), x + colW / 2, h - MARGIN_BOTTOM + 14);

    ctx.fillStyle = '#94A3B8';
    ctx.font = `${Math.min(9, colW * 0.35)}px monospace`;
    ctx.fillText(String(i), x + colW / 2, h - MARGIN_BOTTOM + 24);
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
