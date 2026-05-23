<template>
  <div class="design-patterns-workspace">
    <!-- Header -->
    <div class="workspace-header">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-cyan-400">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Design Patterns & SOLID Visualizer</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="header-badge badge-nodes">{{ store.nodeCount }} Nodes</span>
        <span class="header-badge badge-links">{{ store.linkCount }} Links</span>
      </div>
    </div>

    <!-- Scenario Tabs -->
    <div class="scenario-tabs">
      <button
        v-for="sid in scenarioIds"
        :key="sid"
        class="scenario-tab"
        :class="{ active: store.activePatternId === sid }"
        @click="store.initializeScenario(sid)"
      >
        {{ SCENARIO_LABELS[sid] }}
      </button>
    </div>

    <!-- Main Content: Canvas + Control Panel -->
    <div class="workspace-body">
      <!-- SVG Canvas -->
      <div class="canvas-area">
        <DesignPatternsCanvas />
      </div>

      <!-- Right Control Panel -->
      <div class="control-panel">
        <!-- Scenario info -->
        <div class="panel-section">
          <div class="panel-label">Kịch bản</div>
          <div class="panel-value text-cyan-400">{{ store.activeScenarioTitle }}</div>
        </div>

        <!-- Strategy controls -->
        <div v-if="store.activePatternId === 'strategy-pattern'" class="panel-section">
          <div class="panel-label">Hoán đổi Strategy Runtime</div>
          <div class="strategy-buttons">
            <button
              class="strategy-btn"
              :class="{ active: store.activeStrategyTargetId === 'Bubble' }"
              @click="store.switchStrategy('Bubble')"
            >
              BubbleSort
            </button>
            <button
              class="strategy-btn"
              :class="{ active: store.activeStrategyTargetId === 'Quick' }"
              @click="store.switchStrategy('Quick')"
            >
              QuickSort
            </button>
          </div>
          <div class="panel-hint">
            Liên kết phụ thuộc Amber sẽ snap sang Strategy được chọn.
          </div>
        </div>

        <!-- Observer controls -->
        <div v-if="store.activePatternId === 'observer-pattern'" class="panel-section">
          <div class="panel-label">Observer Notification</div>
          <button
            class="notify-btn"
            :disabled="store.isObserverNotifying"
            @click="store.triggerObserverNotify()"
          >
            {{ store.isObserverNotifying ? 'Đang gửi tín hiệu...' : 'Gửi Notify' }}
          </button>
          <div class="panel-hint">
            Nhấn để Subject gửi tín hiệu — tia sáng Neon lan tỏa tới các Observer.
          </div>
        </div>

        <!-- DIP controls -->
        <div v-if="store.activePatternId === 'solid-dip'" class="panel-section">
          <div class="panel-label">DIP Mode</div>
          <div class="dip-toggle-row">
            <button
              class="dip-toggle-btn"
              :class="{ enabled: store.isDIPEnabled, disabled: !store.isDIPEnabled }"
              @click="store.toggleDIP()"
            >
              {{ store.isDIPEnabled ? 'DIP BẬT' : 'DIP TẮT' }}
            </button>
          </div>

          <!-- Coupling Index -->
          <div class="coupling-widget" :class="{ coupled: !store.isDIPEnabled, decoupled: store.isDIPEnabled }">
            <div class="coupling-label">Coupling Index</div>
            <div class="coupling-value">{{ store.couplingIndexMetric }}%</div>
            <div class="coupling-status">{{ store.couplingLabel }}</div>
          </div>

          <div class="panel-hint">
            {{ store.isDIPEnabled
              ? 'Interface IDatabase tách rời khớp nối — Loosely Coupled.'
              : 'Liên kết trực tiếp thô sơ — Highly Coupled.'
            }}
          </div>
        </div>

        <!-- Legend -->
        <div class="panel-section">
          <div class="panel-label">Chú giải Liên kết</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-line legend-inheritance" />
              <span class="legend-text">Kế thừa (Inheritance)</span>
            </div>
            <div class="legend-item">
              <span class="legend-line legend-realization" />
              <span class="legend-text">Hiện thực (Realization)</span>
            </div>
            <div class="legend-item">
              <span class="legend-line legend-dependency" />
              <span class="legend-text">Phụ thuộc (Dependency)</span>
            </div>
            <div class="legend-item">
              <span class="legend-line legend-association" />
              <span class="legend-text">Liên kết (Association)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useDesignPatternsStore } from '../store/useDesignPatternsStore';
import { getAllScenarioIds, SCENARIO_LABELS } from '../scenarios/scenarioData';
import DesignPatternsCanvas from './DesignPatternsCanvas.vue';

const store = useDesignPatternsStore();
const scenarioIds = getAllScenarioIds();

onMounted(() => {
  store.initializeScenario('strategy-pattern');
});

onUnmounted(() => {
  store.cleanup();
});
</script>

<style scoped>
.design-patterns-workspace {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(14, 23, 38, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  height: 100%;
  overflow: hidden;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.header-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 6px;
}

.badge-nodes {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.badge-links {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.scenario-tabs {
  display: flex;
  gap: 6px;
  padding: 4px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 10px;
}

.scenario-tab {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #94a3b8;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scenario-tab:hover {
  color: #e2e8f0;
}

.scenario-tab.active {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border-color: rgba(6, 182, 212, 0.25);
}

.workspace-body {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  min-width: 0;
}

.control-panel {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.panel-section {
  padding: 12px;
  background: rgba(7, 11, 19, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.panel-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 8px;
}

.panel-value {
  font-size: 13px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.panel-hint {
  font-size: 10px;
  color: #475569;
  margin-top: 8px;
  line-height: 1.5;
}

.strategy-buttons {
  display: flex;
  gap: 6px;
}

.strategy-btn {
  flex: 1;
  padding: 8px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.strategy-btn:hover {
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.strategy-btn.active {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.4);
  color: #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
}

.notify-btn {
  width: 100%;
  padding: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.3);
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notify-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.2);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
}

.notify-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dip-toggle-row {
  display: flex;
  justify-content: center;
}

.dip-toggle-btn {
  padding: 10px 24px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
}

.dip-toggle-btn.disabled {
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.4);
  color: #f43f5e;
}

.dip-toggle-btn.enabled {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.4);
  color: #06b6d4;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
}

.coupling-widget {
  margin-top: 10px;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
}

.coupling-widget.coupled {
  border: 2px solid #f43f5e;
  background: rgba(244, 63, 94, 0.03);
  box-shadow: 0 0 25px rgba(244, 63, 94, 0.15);
}

.coupling-widget.decoupled {
  border: 2px solid #06b6d4;
  background: rgba(6, 182, 212, 0.03);
  box-shadow: 0 0 25px rgba(6, 182, 212, 0.15);
}

.coupling-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.coupling-value {
  font-size: 28px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  margin: 4px 0;
}

.coupled .coupling-value {
  color: #f43f5e;
}

.decoupled .coupling-value {
  color: #06b6d4;
}

.coupling-status {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.coupled .coupling-status {
  color: #f43f5e;
}

.decoupled .coupling-status {
  color: #10b981;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-line {
  display: inline-block;
  width: 24px;
  height: 2px;
  border-radius: 1px;
}

.legend-inheritance {
  background: #10B981;
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
}

.legend-realization {
  background: #06B6D4;
  box-shadow: 0 0 4px rgba(6, 182, 212, 0.4);
  background-image: repeating-linear-gradient(
    90deg,
    #06B6D4 0px,
    #06B6D4 4px,
    transparent 4px,
    transparent 7px
  );
  background-color: transparent;
}

.legend-dependency {
  background: #F59E0B;
  box-shadow: 0 0 4px rgba(245, 158, 11, 0.4);
  background-image: repeating-linear-gradient(
    90deg,
    #F59E0B 0px,
    #F59E0B 3px,
    transparent 3px,
    transparent 6px
  );
  background-color: transparent;
}

.legend-association {
  background: #e2e8f0;
  box-shadow: 0 0 3px rgba(226, 232, 240, 0.3);
}

.legend-text {
  font-size: 10px;
  color: #94a3b8;
}
</style>
