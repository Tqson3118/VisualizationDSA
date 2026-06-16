<template>
  <div class="workspace-body vcr-mode-body">
    <!-- Left side: UML Canvas -->
    <div class="canvas-area">
      <div class="design-patterns-canvas vcr-canvas">
        <!-- SVG Connections Layer -->
        <svg class="svg-connections-layer" :viewBox="`0 0 ${canvasW} ${canvasH}`">
          <defs>
            <marker id="vcr-arrow-inheritance" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
              <polygon points="0 0, 12 4, 0 8" fill="none" stroke="#10B981" stroke-width="1.5" />
            </marker>
            <marker id="vcr-arrow-realization" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
              <polygon points="0 0, 12 4, 0 8" fill="none" stroke="#06B6D4" stroke-width="1.5" />
            </marker>
            <marker id="vcr-arrow-dependency" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
            </marker>
            <marker id="vcr-arrow-association" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#e2e8f0" />
            </marker>
          </defs>
          <path
            v-for="link in frame.links"
            :key="link.id"
            :d="pathCache.get(link.id) || ''"
            :class="[
              'bezier-path',
              `relation-${link.linkType}`,
              { 'link-active': link.isActive || link.id === frame.activeLinkId }
            ]"
            :marker-end="getMarkerEnd(link.linkType)"
            fill="none"
          />
        </svg>

        <!-- UML Class Nodes -->
        <div
          v-for="node in mappedNodes"
          :key="node.id"
          class="uml-class-node-card"
          :class="[
            `type-${node.type}`,
            { 'node-active': node.id === frame.activeNodeId }
          ]"
          :style="{ left: `${node.x}px`, top: `${node.y}px`, width: `${node.width}px` }"
        >
          <!-- Node Header -->
          <div class="uml-node-header" :class="`header-${node.type}`">
            <div v-if="node.type === 'interface'" class="uml-stereotype">&laquo;interface&raquo;</div>
            <div v-else-if="node.type === 'abstract'" class="uml-stereotype">&laquo;abstract&raquo;</div>
            <div class="uml-class-name">{{ node.name }}</div>
            <div v-if="node.statusLabel" class="node-status-badge">{{ node.statusLabel }}</div>
          </div>

          <!-- Attributes -->
          <div v-if="node.attributes && node.attributes.length > 0" class="uml-section">
            <div v-for="attr in node.attributes" :key="attr" class="uml-member">{{ attr }}</div>
          </div>
          <div v-else class="uml-section uml-section-empty" />

          <!-- Methods -->
          <div v-if="node.methods && node.methods.length > 0" class="uml-section uml-section-last">
            <div v-for="method in node.methods" :key="method" class="uml-member">{{ method }}</div>
          </div>
          <div v-else class="uml-section uml-section-last uml-section-empty" />
        </div>
      </div>
    </div>

    <!-- Right side: VCR Stats & Info Panel -->
    <div class="vcr-info-panel">
      <!-- Title & Scenario Name -->
      <div class="panel-header-vcr">
        <div class="flex items-center gap-1.5">
          <span class="vcr-playback-pill">VCR LIVE</span>
          <span class="vcr-pattern-title">{{ frame.patternName }}</span>
        </div>
        <div class="step-indicator">Bước {{ frame.stepIndex + 1 }}</div>
      </div>

      <!-- Action & Current State Detail -->
      <div class="action-card-vcr">
        <div class="action-type-label">Hành động hiện tại</div>
        <div class="action-value-vcr">{{ frame.actionType }}</div>
      </div>

      <!-- Coupling Metric Dashboard -->
      <div class="metric-section-vcr">
        <div class="section-title-vcr">Chỉ số phụ thuộc</div>
        <div class="coupling-dashboard">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-text-secondary">Độ kết hợp (Coupling Index)</span>
            <span class="coupling-badge" :class="couplingClass">{{ couplingLabel }}</span>
          </div>
          
          <!-- Bar Graph -->
          <div class="coupling-bar-bg">
            <div
              class="coupling-bar-fill"
              :class="couplingFillClass"
              :style="{ width: `${frame.couplingIndex}%` }"
            />
          </div>
          
          <div class="flex justify-between items-center mt-1 text-[10px] text-text-disabled font-mono">
            <span>LỎNG LẺO (0%)</span>
            <span class="text-text-primary font-bold">{{ frame.couplingIndex }}%</span>
            <span>CHẶT CHẼ (100%)</span>
          </div>
        </div>
      </div>

      <!-- Quick Explanation Summary -->
      <div class="explanation-box-vcr">
        <div class="box-title">Giải thích kỹ thuật</div>
        <div class="box-text">{{ frame.explanation }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DesignPatternFrameResponse } from '../services/designPatternsApi';
import type { UMLNode, UMLLinkType } from '../types/design-patterns.types';

const props = defineProps<{
  frame: DesignPatternFrameResponse;
}>();

const canvasW = 580;
const canvasH = 460;

// Map Backend response nodes to UMLNode format with sensible defaults
const mappedNodes = computed<(UMLNode & { statusLabel?: string | null })[]>(() => {
  return props.frame.nodes.map(node => {
    let type: 'class' | 'interface' | 'abstract' = 'class';
    if (node.nodeType === 'interface') type = 'interface';
    if (node.nodeType === 'abstract') type = 'abstract';

    // Set dynamic width based on name length or node ID
    let width = 160;
    if (node.id === 'HighModule' || node.id === 'LowModule' || node.name.length > 14) {
      width = 180;
    }

    return {
      id: node.id,
      name: node.name,
      type,
      x: Math.round(node.x),
      y: Math.round(node.y),
      width,
      height: 70,
      attributes: node.attributes,
      methods: node.methods,
      statusLabel: node.statusLabel,
    };
  });
});

// Calculate Bezier Paths for SVG rendering
const pathCache = computed(() => {
  const cache = new Map<string, string>();
  const nodesList = mappedNodes.value;

  for (const link of props.frame.links) {
    const source = nodesList.find(n => n.id === link.sourceId);
    const target = nodesList.find(n => n.id === link.targetId);
    if (!source || !target) continue;

    const startX = source.x + source.width / 2;
    const startY = source.y + source.height;

    const endX = target.x + target.width / 2;
    const endY = target.y;

    const deltaY = Math.abs(endY - startY);
    const controlOffset = Math.max(30, Math.min(100, deltaY * 0.5));

    const cp1X = startX;
    const cp1Y = startY + controlOffset;
    const cp2X = endX;
    const cp2Y = endY - controlOffset;

    const path = `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;
    cache.set(link.id, path);
  }
  return cache;
});

const couplingLabel = computed(() => {
  const index = props.frame.couplingIndex;
  if (index >= 70) return 'RẤT CHẶT';
  if (index >= 40) return 'TRUNG BÌNH';
  return 'LỎNG LẺO';
});

const couplingClass = computed(() => {
  const index = props.frame.couplingIndex;
  if (index >= 70) return 'coupling-high';
  if (index >= 40) return 'coupling-medium';
  return 'coupling-low';
});

const couplingFillClass = computed(() => {
  const index = props.frame.couplingIndex;
  if (index >= 70) return 'fill-high';
  if (index >= 40) return 'fill-medium';
  return 'fill-low';
});

function getMarkerEnd(linkType: string): string {
  const map: Record<string, string> = {
    inheritance: 'url(#vcr-arrow-inheritance)',
    realization: 'url(#vcr-arrow-realization)',
    dependency: 'url(#vcr-arrow-dependency)',
    association: 'url(#vcr-arrow-association)',
  };
  return map[linkType] ?? '';
}
</script>

<style scoped>
.vcr-mode-body {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  animation: fade-in-vcr 0.3s ease;
}

@keyframes fade-in-vcr {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.vcr-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  background: rgba(7, 11, 19, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
}

/* ─── SVG Layers ─── */
.svg-connections-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.bezier-path {
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 2;
  transition: d 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease;
}

.relation-inheritance {
  stroke: #10B981;
  filter: drop-shadow(0 0 3px rgba(16, 185, 129, 0.3));
}

.relation-realization {
  stroke: #06B6D4;
  stroke-dasharray: 6, 4;
  filter: drop-shadow(0 0 3px rgba(6, 182, 212, 0.3));
}

.relation-dependency {
  stroke: #F59E0B;
  stroke-dasharray: 4, 4;
  filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.3));
}

.relation-association {
  stroke: #e2e8f0;
  filter: drop-shadow(0 0 2px rgba(226, 232, 240, 0.2));
}

@keyframes connection-flow {
  to { stroke-dashoffset: -20; }
}

.link-active {
  stroke: #06B6D4 !important;
  stroke-width: 3.5 !important;
  stroke-dasharray: 8, 4 !important;
  animation: connection-flow 1.5s infinite linear;
  filter: drop-shadow(0 0 8px #06B6D4) !important;
}

/* ─── Class Cards ─── */
.uml-class-node-card {
  position: absolute;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.6);
  z-index: 10;
  overflow: hidden;
  transition: all 0.3s ease;
}

.node-active {
  border-color: rgba(6, 182, 212, 0.5) !important;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.35) !important;
  background: rgba(6, 182, 212, 0.08) !important;
  transform: scale(1.02);
}

.uml-node-header {
  padding: 8px 12px;
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  position: relative;
}

.uml-stereotype {
  font-size: 9px;
  font-weight: 400;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.uml-class-name {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
}

.header-interface .uml-class-name {
  color: #06b6d4;
}

.header-abstract .uml-class-name {
  color: #a78bfa;
}

.node-status-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 8px;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.uml-section {
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  min-height: 16px;
}

.uml-section-last {
  border-bottom: none;
}

.uml-section-empty {
  min-height: 8px;
  padding: 4px 12px;
}

.uml-member {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  color: #94a3b8;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── VCR Side Info Panel ─── */
.vcr-info-panel {
  width: 320px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.panel-header-vcr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
}

.vcr-playback-pill {
  font-size: 8px;
  font-weight: 800;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  animation: vcr-pulse 1.8s infinite;
}

@keyframes vcr-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.vcr-pattern-title {
  font-size: 13px;
  font-weight: 800;
  color: #f1f5f9;
}

.step-indicator {
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.action-card-vcr {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 10px 12px;
}

.action-type-label {
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 3px;
}

.action-value-vcr {
  font-size: 13px;
  font-weight: 800;
  color: #38bdf8;
  font-family: monospace;
}

/* Coupling metrics dashboard */
.metric-section-vcr {
  display: flex;
  flex-direction: column;
}

.section-title-vcr {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #475569;
  margin-bottom: 6px;
}

.coupling-dashboard {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 12px;
}

.coupling-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.coupling-high { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
.coupling-medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.coupling-low { background: rgba(16, 185, 129, 0.15); color: #10b981; }

.coupling-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.coupling-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.fill-high { background: #f43f5e; }
.fill-medium { background: #f59e0b; }
.fill-low { background: #10b981; }

.explanation-box-vcr {
  background: rgba(6, 182, 212, 0.03);
  border: 1px solid rgba(6, 182, 212, 0.1);
  border-radius: 10px;
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.box-title {
  font-size: 9px;
  font-weight: 800;
  color: #06b6d4;
  text-transform: uppercase;
}

.box-text {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.6;
}
</style>
