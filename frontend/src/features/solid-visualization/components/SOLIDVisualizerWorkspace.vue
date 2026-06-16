<template>
  <div class="solid-workspace-panel">
    <!-- Header -->
    <div class="sandbox-header">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="icon-warning">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">
          SOLID Principles Visualizer — Phase 2
        </span>
      </div>
      <div class="flex gap-1.5">
        <span class="sprint-badge srp">Thermal SRP</span>
        <span class="sprint-badge lsp">Laser LSP</span>
        <span class="sprint-badge dip">Neon DIP</span>
      </div>
    </div>

    <!-- Backend Scenario Picker -->
    <ConceptScenarioPicker
      :scenarios="solidScenarios"
      :loading="store.isVcrLoading"
      label="Backend Scenarios (VCR)"
      @select="store.loadVcrScenario($event)"
    />

    <!-- VCR Explanation Banner -->
    <VcrExplanationBanner
      v-if="store.isVcrMode && store.vcrCurrentFrame"
      :action-type="store.vcrCurrentFrame.actionType"
      :explanation="store.vcrCurrentFrame.explanation"
      :frame-key="vcrCurrentIndex"
    />

    <!-- VCR Loading / Error -->
    <div v-if="store.isVcrLoading" class="api-status loading">Loading from backend...</div>
    <div v-if="store.vcrError" class="api-status error">{{ store.vcrError }}</div>

    <!-- VCR Playback Controls -->
    <VcrControls
      v-if="store.isVcrMode"
      :current-index="vcrCurrentIndex"
      :total-frames="store.vcrTotalFrames"
      @prev="store.vcrPrev()"
      @next="store.vcrNext()"
      @reset="store.vcrReset()"
      @exit="store.exitVcrMode()"
    />

    <!-- Lesson Selector Tabs (hidden in VCR mode) -->
    <div v-if="!store.isVcrMode" class="flex gap-2">
      <button
        v-for="lesson in lessons"
        :key="lesson.id"
        class="lesson-tab-btn"
        :class="{ 'active': store.activeLesson === lesson.id }"
        @click="store.setLesson(lesson.id)"
      >
        {{ lesson.label }}
      </button>
    </div>

    <!-- VCR Frame Visualizer (shown in VCR mode) -->
    <SOLIDVcrFrameVisualizer
      v-if="store.isVcrMode && store.vcrCurrentFrame"
      :frame="store.vcrCurrentFrame"
    />

    <!-- Active Lesson Panel (hidden in VCR mode) -->
    <div v-if="!store.isVcrMode" class="flex-1">
      <!-- SRP Lesson -->
      <SRPLessonPanel
        v-if="store.activeLesson === 'SRP'"
        :class-nodes="store.classNodes"
        :has-overheated="store.hasOverheatedNodes"
        :is-split="store.isSRPSplit"
        :diagnostic-result="store.lastDiagnosticResult"
        @split="onSRPSplit"
      />

      <!-- LSP Lesson -->
      <LSPLessonPanel
        v-else-if="store.activeLesson === 'LSP'"
        :lsp-phase="store.lspPhase"
        :diagnostic-result="store.lastDiagnosticResult"
        @run-violation="store.executeLSPSubstitution(true)"
        @run-valid="store.executeLSPSubstitution(false)"
      />

      <!-- DIP Lesson -->
      <DIPLessonPanel
        v-else-if="store.activeLesson === 'DIP'"
        :is-violating="store.dipState.isViolatingDIP"
        :has-interface="store.dipState.hasInterfaceInserted"
        :diagnostic-result="store.lastDiagnosticResult"
        @insert-interface="store.insertDIPInterface()"
        @reset-d-i-p="store.resetDIP()"
      />

      <!-- OCP Lesson -->
      <OCPLessonPanel
        v-else-if="store.activeLesson === 'OCP'"
      />

      <!-- ISP Lesson -->
      <ISPLessonPanel
        v-else-if="store.activeLesson === 'ISP'"
      />

      <!-- Fallback for any unmapped lesson -->
      <div
        v-else
        class="placeholder-panel"
      >
        <span class="text-xs text-text-disabled font-bold uppercase tracking-wider">
          {{ store.activeLessonLabel }} — Coming Soon
        </span>
      </div>
    </div>

    <!-- Footer Controls -->
    <div class="footer-controls">
      <div class="flex items-center gap-2">
        <span class="status-dot" />
        <span class="text-[10px] text-text-muted font-medium">
          Bài học: {{ store.activeLessonLabel }}
        </span>
        <span class="text-[10px] text-text-disabled">|</span>
        <span class="text-[10px] text-text-muted font-medium">
          Nodes: {{ store.totalNodes }}
        </span>
      </div>
      <button
        class="reset-btn"
        @click="store.resetAll()"
      >
        Reset All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useSOLIDVisualizerStore } from '../store/useSOLIDVisualizerStore';
import type { SOLIDPrinciple } from '../types/solid-visualization.types';
import SRPLessonPanel from './SRPLessonPanel.vue';
import LSPLessonPanel from './LSPLessonPanel.vue';
import DIPLessonPanel from './DIPLessonPanel.vue';
import OCPLessonPanel from './OCPLessonPanel.vue';
import ISPLessonPanel from './ISPLessonPanel.vue';
import SOLIDVcrFrameVisualizer from './SOLIDVcrFrameVisualizer.vue';
import VcrControls from '../../../components/VcrControls.vue';
import VcrExplanationBanner from '../../../components/VcrExplanationBanner.vue';
import ConceptScenarioPicker from '../../../components/ConceptScenarioPicker.vue';

const store = useSOLIDVisualizerStore();
const vcrCurrentIndex = computed(() => store.vcrCurrentIndex);

const solidScenarios = [
  { id: 'srp', label: 'SRP — God Class' },
  { id: 'ocp', label: 'OCP — Open/Closed' },
  { id: 'lsp', label: 'LSP — Substitution' },
];

interface LessonTab {
  id: SOLIDPrinciple;
  label: string;
}

const lessons: LessonTab[] = [
  { id: 'SRP', label: 'SRP' },
  { id: 'OCP', label: 'OCP' },
  { id: 'LSP', label: 'LSP' },
  { id: 'ISP', label: 'ISP' },
  { id: 'DIP', label: 'DIP' },
];

onMounted(() => {
  store.initializeDemoData();
});

onUnmounted(() => {
  store.destroyStore();
});

function onSRPSplit(nodeId: string): void {
  store.triggerSRPSplit(nodeId);
}
</script>

<style scoped>
.solid-workspace-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: color-mix(in srgb, var(--vis-panel-bg) 70%, transparent);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 80%, transparent);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  position: relative;
}

.sandbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 16px;
}

.icon-warning {
  color: var(--color-accent-yellow);
}

.sprint-badge {
  font-size: 10px;
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.sprint-badge.srp {
  background-color: var(--color-accent-red-dim);
  color: var(--color-accent-red);
  border-color: color-mix(in srgb, var(--color-accent-red) 40%, transparent);
}

.sprint-badge.lsp {
  background-color: var(--color-accent-yellow-dim);
  color: var(--color-accent-yellow);
  border-color: color-mix(in srgb, var(--color-accent-yellow) 40%, transparent);
}

.sprint-badge.dip {
  background-color: var(--color-accent-green-dim);
  color: var(--color-accent-green);
  border-color: color-mix(in srgb, var(--color-accent-green) 40%, transparent);
}

.lesson-tab-btn {
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: var(--transition-smooth);
  background-color: color-mix(in srgb, var(--color-bg-secondary) 40%, transparent);
  color: var(--color-text-muted);
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 40%, transparent);
}

.lesson-tab-btn:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-border-default);
}

.lesson-tab-btn.active {
  background-color: var(--color-bg-active);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  background-color: color-mix(in srgb, var(--color-bg-secondary) 30%, transparent);
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 40%, transparent);
}

.footer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 16px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-primary);
}

.reset-btn {
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: color-mix(in srgb, var(--color-bg-surface) 40%, transparent);
  color: var(--color-text-secondary);
  border: 1px solid color-mix(in srgb, var(--color-border-default) 40%, transparent);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.reset-btn:hover {
  background-color: color-mix(in srgb, var(--color-bg-active) 60%, transparent);
  color: var(--color-text-primary);
}

/* === API Status === */
.api-status { text-align: center; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600; }
.api-status.loading { color: #06b6d4; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); }
.api-status.error { color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }
</style>
