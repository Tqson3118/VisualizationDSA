<template>
  <div class="sorting-view-root flex flex-col h-full w-full gap-4 p-4 max-w-[1600px] mx-auto overflow-hidden">
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
        <span>Sorting & Linear DSA</span>
      </div>
    </div>

    <!-- Active Panel Area -->
    <div class="flex-1 min-h-0 relative">
      <KeepAlive>
        <component :is="activeComponent" class="absolute inset-0 w-full h-full" v-bind="activeProps" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue';
import { ArrayBarVisualizer, SortingDetailPanel } from '../features/algorithm-sandbox';
import { VcrControlPanel } from '../features/vcr-player';
import { DSAPlayer } from '../features/dsa-modules';
import BaseIcon from '../shared/components/BaseIcon.vue';

const activeTab = ref('sorting');

const tabs = [
  { id: 'sorting', name: 'Sorting Sandbox', icon: 'sorting' },
  { id: 'dsa', name: 'Searching & Linear DSA', icon: 'dsa' }
];

// Define static sub-component for Sorting Sandbox to keep the state alive properly
const SortingSandbox = defineComponent({
  name: 'SortingSandbox',
  setup() {
    return () => h('div', { class: 'absolute inset-0 flex flex-col lg:flex-row gap-4 w-full h-full' }, [
      h(ArrayBarVisualizer, { class: 'flex-1 lg:flex-[65] min-h-0 w-full' }),
      h('div', { class: 'w-full lg:w-auto lg:flex-[35] shrink-0 flex flex-col gap-4 min-h-0' }, [
        h(VcrControlPanel, { class: 'panel-card h-fit overflow-y-auto' }),
        h(SortingDetailPanel, { class: 'flex-1 panel-card min-h-0 overflow-y-auto' })
      ])
    ]);
  }
});

const activeComponent = computed(() => {
  return activeTab.value === 'sorting' ? SortingSandbox : DSAPlayer;
});

const activeProps = computed(() => {
  if (activeTab.value === 'dsa') {
    return { allowedCategories: ['Searching', 'Stack-Queue'] };
  }
  return {};
});
</script>

<style scoped>
.sorting-view-root {
  background-color: var(--color-bg-primary);
}

.panel-card {
  background-color: color-mix(in srgb, var(--vis-panel-bg) 85%, transparent);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid color-mix(in srgb, var(--color-border-default) 60%, transparent);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  transition: var(--transition-smooth);
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

