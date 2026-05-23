<template>
  <div
    ref="canvasContainer"
    class="design-patterns-canvas"
  >
    <!-- SVG layer for Bezier connection paths -->
    <svg class="svg-connections-layer" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`">
      <defs>
        <!-- Inheritance arrow marker (hollow triangle) -->
        <marker id="arrow-inheritance" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
          <polygon points="0 0, 12 4, 0 8" fill="none" stroke="#10B981" stroke-width="1.5" />
        </marker>
        <!-- Realization arrow marker (hollow triangle, dashed) -->
        <marker id="arrow-realization" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
          <polygon points="0 0, 12 4, 0 8" fill="none" stroke="#06B6D4" stroke-width="1.5" />
        </marker>
        <!-- Dependency arrow marker (solid, small) -->
        <marker id="arrow-dependency" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
        </marker>
        <!-- Association arrow marker -->
        <marker id="arrow-association" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#e2e8f0" />
        </marker>
      </defs>

      <path
        v-for="link in store.links"
        :key="link.id"
        :d="store.pathCache.get(link.id) || ''"
        :class="[
          'bezier-path',
          `relation-${link.type}`,
          { 'observer-pulse': store.isObserverNotifying && store.activePatternId === 'observer-pattern' && link.sourceId === 'Subject' },
          { 'dip-coupled-thick': store.activePatternId === 'solid-dip' && !store.isDIPEnabled },
          { 'dip-decoupled-thin': store.activePatternId === 'solid-dip' && store.isDIPEnabled },
        ]"
        :marker-end="getMarkerEnd(link.type)"
        fill="none"
      />
    </svg>

    <!-- HTML overlay for draggable class node cards -->
    <ClassNodeCard
      v-for="node in store.nodes"
      :key="node.id"
      :node="node"
      :is-active-strategy="isNodeActiveStrategy(node.id)"
      :is-observer-pulse="isNodeObserverPulse(node.id)"
      @drag="onNodeDrag"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDesignPatternsStore } from '../store/useDesignPatternsStore';
import ClassNodeCard from './ClassNodeCard.vue';

const store = useDesignPatternsStore();

const canvasContainer = ref<HTMLDivElement | null>(null);
const canvasWidth = 600;
const canvasHeight = 500;

function getMarkerEnd(type: string): string {
  switch (type) {
    case 'inheritance': return 'url(#arrow-inheritance)';
    case 'realization': return 'url(#arrow-realization)';
    case 'dependency': return 'url(#arrow-dependency)';
    case 'association': return 'url(#arrow-association)';
    default: return '';
  }
}

function isNodeActiveStrategy(nodeId: string): boolean {
  if (store.activePatternId !== 'strategy-pattern') return false;
  return nodeId === store.activeStrategyTargetId;
}

function isNodeObserverPulse(nodeId: string): boolean {
  if (store.activePatternId !== 'observer-pattern') return false;
  if (!store.isObserverNotifying) return false;
  return nodeId === 'ObsA' || nodeId === 'ObsB' || nodeId === 'ObsC';
}

function onNodeDrag(nodeId: string, x: number, y: number): void {
  if (!canvasContainer.value) return;
  const rect = canvasContainer.value.getBoundingClientRect();
  const relX = x - rect.left;
  const relY = y - rect.top;
  store.handleNodeDrag(nodeId, relX, relY, canvasWidth, canvasHeight);
}

onMounted(() => {
  store.recalculatePaths();
});
</script>

<style scoped>
.design-patterns-canvas {
  position: relative;
  width: 100%;
  height: 500px;
  background: rgba(7, 11, 19, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  overflow: hidden;
}

.svg-connections-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* Base bezier path */
.bezier-path {
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 2;
  transition: d 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease;
}

/* Inheritance — Emerald solid */
.relation-inheritance {
  stroke: #10B981;
  filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));
}

/* Realization — Cyan dashed */
.relation-realization {
  stroke: #06B6D4;
  stroke-dasharray: 6, 4;
  filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4));
}

/* Dependency — Amber dashed */
.relation-dependency {
  stroke: #F59E0B;
  stroke-dasharray: 4, 4;
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.4));
}

/* Association — white */
.relation-association {
  stroke: #e2e8f0;
  filter: drop-shadow(0 0 3px rgba(226, 232, 240, 0.3));
}

/* Observer notify pulse animation */
@keyframes stroke-pulse-flow {
  to {
    stroke-dashoffset: -30;
  }
}

.observer-pulse {
  stroke: #06B6D4 !important;
  stroke-dasharray: 8, 4 !important;
  stroke-width: 3 !important;
  animation: stroke-pulse-flow 1.2s infinite linear;
  filter: drop-shadow(0 0 6px #06B6D4) !important;
}

/* DIP: thick red coupling */
.dip-coupled-thick {
  stroke: #F43F5E !important;
  stroke-width: 4 !important;
  stroke-dasharray: none !important;
  filter: drop-shadow(0 0 8px rgba(244, 63, 94, 0.4)) !important;
}

/* DIP: thin cyan decoupled */
.dip-decoupled-thin {
  stroke: #06B6D4 !important;
  stroke-width: 2 !important;
  stroke-dasharray: 6, 4 !important;
  filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4)) !important;
}
</style>
