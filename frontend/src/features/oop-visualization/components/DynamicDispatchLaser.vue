<template>
  <svg
    v-if="isActive"
    class="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Seeking phase: source → VTable pivot -->
    <path
      v-if="showSeekingPath"
      :d="seekingPathD"
      class="fill-none stroke-[3] stroke-linecap-round [stroke-dasharray:8_12]"
      :class="[
        seekingPhaseClass,
        phase === 'seeking' 
          ? 'stroke-accent-green [filter:drop-shadow(0_0_6px_rgba(16,185,129,0.7))] laser-seeking' 
          : 'stroke-accent-green/50 [filter:drop-shadow(0_0_4px_rgba(16,185,129,0.4))] [stroke-dasharray:none]'
      ]"
    />

    <!-- Dispatch phase: VTable pivot → target method -->
    <path
      v-if="showDispatchPath"
      :d="dispatchPathD"
      class="fill-none stroke-[3] stroke-linecap-round [stroke-dasharray:8_12] laser-dispatch"
      :class="[
        isOverridden 
          ? 'stroke-accent-green [filter:drop-shadow(0_0_8px_rgba(16,185,129,0.8))] laser-override' 
          : 'stroke-accent-yellow [filter:drop-shadow(0_0_8px_rgba(245,158,11,0.8))] laser-inherited'
      ]"
    />

    <!-- Glow dot at VTable pivot -->
    <circle
      v-if="showSeekingPath"
      :cx="vTablePivot.x"
      :cy="vTablePivot.y"
      r="5"
      class="fill-accent-cyan [filter:drop-shadow(0_0_6px_rgba(6,182,212,0.8))] laser-dot"
    />

    <!-- Glow dot at target -->
    <circle
      v-if="showDispatchPath"
      :cx="target.x"
      :cy="target.y"
      r="6"
      class="laser-dot"
      :class="isOverridden 
        ? 'fill-accent-green [filter:drop-shadow(0_0_8px_rgba(16,185,129,0.8))]' 
        : 'fill-accent-yellow [filter:drop-shadow(0_0_8px_rgba(245,158,11,0.8))]'"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SVGLaserBatchRenderer } from '../engine/SVGLaserBatchRenderer';
import type { CoordinatePoint } from '../types/oop-visualization.types';

const props = defineProps<{
  isActive: boolean;
  source: CoordinatePoint;
  vTablePivot: CoordinatePoint;
  target: CoordinatePoint;
  phase: 'seeking' | 'resolved';
  isOverridden?: boolean;
}>();

const showSeekingPath = computed(() => props.isActive);
const showDispatchPath = computed(() => props.isActive && props.phase === 'resolved');

const seekingPathD = computed(() =>
  SVGLaserBatchRenderer.calculateLaserPath(props.source, props.vTablePivot)
);
const dispatchPathD = computed(() =>
  SVGLaserBatchRenderer.calculateLaserPath(props.vTablePivot, props.target)
);
const seekingPhaseClass = computed(() =>
  props.phase === 'seeking' ? 'laser-seeking' : 'laser-seeked'
);
</script>

<style scoped>
.laser-seeking {
  animation: laser-flow 1.2s infinite linear;
}
.laser-override {
  animation: laser-flow 0.8s infinite linear;
}
.laser-inherited {
  animation: laser-flow 0.8s infinite linear;
}
.laser-dot {
  animation: dot-pulse 1s infinite ease-in-out;
}
@keyframes laser-flow {
  to { stroke-dashoffset: -30; }
}
@keyframes dot-pulse {
  0%, 100% { r: 5; opacity: 1; }
  50% { r: 8; opacity: 0.6; }
}
</style>
