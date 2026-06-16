<template>
  <div class="code-debugger-view-root flex flex-col h-full w-full gap-4 p-4 max-w-[1600px] mx-auto overflow-hidden">
    <!-- Header Sub-Tabs Switcher (Glassmorphic) -->
    <div class="tabs-header-bar flex items-center justify-between px-4 py-2 border rounded-xl"
      style="background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(12px); border-color: rgba(255, 255, 255, 0.05);"
    >
      <div class="flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="sub-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
          :class="activeTab === tab.id
            ? 'sub-tab-btn--active'
            : 'sub-tab-btn--inactive'"
          @click="activeTab = tab.id"
        >
          <BaseIcon :name="tab.icon" class="w-3.5 h-3.5" />
          <span>{{ tab.name }}</span>
        </button>
      </div>
      <div class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted select-none">
        <span class="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
        <span>Code Debugger Suite</span>
      </div>
    </div>

    <!-- Active Component Area (KeepAlive preserves Monaco Editors / terminal states) -->
    <div class="flex-1 min-h-0 relative">
      <KeepAlive>
        <component :is="activeComponent" class="absolute inset-0 w-full h-full" />
      </KeepAlive>
    </div>

    <!-- Nút Trợ giúp Guided Tour -->
    <HelpButton />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CodeWorkspace } from '../features/code-to-visualization';
import { DebugWorkspace } from '../features/debug-mode';
import BaseIcon from '../shared/components/BaseIcon.vue';
import HelpButton from '../features/guided-tour/components/HelpButton.vue';
import { useGuidedTourStore } from '../features/guided-tour/store/useGuidedTourStore';

const activeTab = ref('workspace');
const tourStore = useGuidedTourStore();

onMounted(() => {
  tourStore.startPageTour('/code-ide', false);
});

const tabs = [
  { id: 'workspace', name: 'IDE Workspace', icon: 'code-ide' },
  { id: 'debugger', name: 'Live Debugger', icon: 'debug' }
];

const activeComponent = computed(() => {
  if (activeTab.value === 'debugger') return DebugWorkspace;
  return CodeWorkspace;
});
</script>

<style scoped>
.code-debugger-view-root {
  background-color: var(--color-bg-primary);
}

.sub-tab-btn--inactive {
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
}

.sub-tab-btn--inactive:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
  border-color: rgba(255, 255, 255, 0.03);
}

.sub-tab-btn--active {
  color: var(--color-accent-cyan) !important;
  background: rgba(6, 182, 212, 0.08) !important;
  border: 1px solid rgba(6, 182, 212, 0.25) !important;
  box-shadow: 0 0 12px rgba(6, 182, 212, 0.15);
}
</style>
