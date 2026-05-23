<template>
  <div ref="containerRef" class="relative w-full h-full bg-[#0F172A] overflow-hidden">
    <canvas
      ref="canvasRef"
      class="w-full h-full block"
    />

    <!-- HUD Step Description -->
    <div
      v-if="currentFrame"
      class="absolute top-3 left-4 max-w-[420px] pointer-events-none"
    >
      <span class="text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-400">
        Step {{ currentFrame.stepId }} / {{ totalSteps }}
      </span>
      <p class="text-[13px] font-semibold text-slate-100 leading-[1.4] mt-1 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
        {{ currentFrame.explanation }}
      </p>
    </div>

    <!-- Empty state -->
    <div
      v-if="!currentFrame"
      class="absolute inset-0 flex items-center justify-center"
    >
      <p class="text-sm text-slate-500 text-center px-8">
        Vui lòng nhập dữ liệu hoặc sinh mảng ngẫu nhiên để bắt đầu trực quan hóa.
      </p>
    </div>

    <!-- Progress bar -->
    <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-800/60">
      <div
        class="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-r-sm transition-[width] duration-100 ease-out shadow-[0_0_8px_rgba(6,182,212,0.6)]"
        :style="{ width: progressPercent + '%' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAnimationStore } from '../store/useAnimationStore';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MARGIN = 40;
const MARGIN_BOTTOM = 40;
const PADDING_TOP = 50;
const GAP = 8;

const COLOR_BG = '#0F172A';
const COLOR_DEFAULT = '#38BDF8';
const COLOR_COMPARE = '#FBBF24';
const COLOR_SWAP = '#EF4444';
const COLOR_SORTED = '#10B981';
const COLOR_TEXT = '#FFFFFF';

// ─── STORE & REFS ─────────────────────────────────────────────────────────────
const store = useAnimationStore();
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const currentFrame = computed(() => store.currentFrame);
const totalSteps = computed(() => store.totalSteps);
const progressPercent = computed(() => store.progressPercent);

// ─── BAR POSITIONS (Lerp source & target) ─────────────────────────────────────
interface BarPosition {
  x: number;
  targetX: number;
}
let barPositions: BarPosition[] = [];
let isTransitioning = false;
let animationProgress = 0;
let lastTimestamp = 0;
let rafId: number | null = null;

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// ─── COORDINATE CALCULATIONS ──────────────────────────────────────────────────
function calculateColumnWidth(n: number, canvasW: number): number {
  if (n <= 0) return 0;
  return (canvasW - GAP * (n - 1) - MARGIN * 2) / n;
}

function calculateColumnHeight(value: number, maxValue: number, canvasH: number): number {
  if (maxValue <= 0) return 0;
  return (value / maxValue) * (canvasH - PADDING_TOP - MARGIN_BOTTOM);
}

function calculateX(index: number, columnWidth: number): number {
  return MARGIN + index * (columnWidth + GAP);
}

// ─── DETERMINE BAR COLOR ──────────────────────────────────────────────────────
function determineColor(index: number): string {
  const frame = store.currentFrame;
  if (!frame) return COLOR_DEFAULT;

  if (frame.highlights.sorted.includes(index)) return COLOR_SORTED;
  if (frame.highlights.swap.includes(index)) return COLOR_SWAP;
  if (frame.highlights.compare.includes(index)) return COLOR_COMPARE;
  return COLOR_DEFAULT;
}

// ─── PREPARE TRANSITION (Lerp) ────────────────────────────────────────────────
function prepareTransition(): void {
  const frame = store.currentFrame;
  if (!frame || !canvasRef.value) return;

  const dpr = window.devicePixelRatio || 1;
  const canvasW = canvasRef.value.width / dpr;
  const n = frame.dataState.length;
  const columnWidth = calculateColumnWidth(n, canvasW);

  // Save current positions as source
  const newPositions: BarPosition[] = [];
  for (let i = 0; i < n; i++) {
    const targetX = calculateX(i, columnWidth);
    const currentX = barPositions[i]?.x ?? targetX;
    newPositions.push({ x: currentX, targetX });
  }
  barPositions = newPositions;
  animationProgress = 0;
  isTransitioning = true;
}

// ─── RENDER CANVAS ────────────────────────────────────────────────────────────
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

  const frame = store.currentFrame;
  if (!frame) return;

  const n = frame.dataState.length;
  if (n === 0) return;

  const columnWidth = calculateColumnWidth(n, w);
  const maxVal = Math.max(...frame.dataState, 1);

  for (let i = 0; i < n; i++) {
    const colH = calculateColumnHeight(frame.dataState[i], maxVal, h);
    const yPos = h - colH - MARGIN_BOTTOM;

    let xPos = calculateX(i, columnWidth);
    if (isTransitioning && barPositions[i]) {
      const t = easeOut(animationProgress);
      xPos = lerp(barPositions[i].x, barPositions[i].targetX, t);
    }

    // Draw bar
    const color = determineColor(i);
    ctx.fillStyle = color;

    const radius = Math.min(4, columnWidth / 4);
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

    // Neon glow for sorted bars
    if (color === COLOR_SORTED) {
      ctx.shadowColor = COLOR_SORTED;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw value label
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = `bold ${Math.min(12, columnWidth * 0.6)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      frame.dataState[i].toString(),
      xPos + columnWidth / 2,
      yPos - 5,
    );

    // Draw index label
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.min(10, columnWidth * 0.45)}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(
      i.toString(),
      xPos + columnWidth / 2,
      h - MARGIN_BOTTOM + 6,
    );
  }

  // Update bar positions after render
  if (!isTransitioning) {
    barPositions = frame.dataState.map((_, i) => {
      const x = calculateX(i, columnWidth);
      return { x, targetX: x };
    });
  }
}

// ─── ANIMATION LOOP ───────────────────────────────────────────────────────────
function tick(timestamp: number): void {
  if (isTransitioning) {
    const duration = 300 / store.playbackSpeed;
    const elapsed = timestamp - lastTimestamp;
    animationProgress += elapsed / duration;

    if (animationProgress >= 1) {
      animationProgress = 1;
      isTransitioning = false;
      // Snap positions
      barPositions.forEach(bp => { bp.x = bp.targetX; });
    }
  }

  renderCanvas();
  lastTimestamp = timestamp;
  rafId = requestAnimationFrame(tick);
}

// ─── RESIZE ───────────────────────────────────────────────────────────────────
function resizeCanvas(): void {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  renderCanvas();
}

let resizeObserver: ResizeObserver | null = null;

// ─── WATCHERS ─────────────────────────────────────────────────────────────────
watch(() => store.currentIndex, () => {
  prepareTransition();
});

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────
onMounted(() => {
  resizeCanvas();
  lastTimestamp = performance.now();
  rafId = requestAnimationFrame(tick);

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
});
</script>
