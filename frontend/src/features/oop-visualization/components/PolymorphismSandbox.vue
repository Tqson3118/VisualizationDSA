<template>
  <div class="sandbox-panel">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-accent-purple" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          {{ activePillarTitle }} Sandbox
        </span>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="flex flex-wrap gap-3 mb-4">
      <!-- Class Selector -->
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-text-muted font-bold uppercase">Lớp:</span>
        <div class="flex gap-1">
          <button
            v-for="className in availableClasses"
            :key="className"
            class="class-btn"
            :class="selectedClass === className ? 'active' : 'inactive'"
            @click="$emit('select-class', className)"
          >
            {{ className }}
          </button>
        </div>
      </div>

      <!-- Instantiate Button -->
      <button
        class="instantiate-btn"
        :class="canAllocate ? 'enabled' : 'disabled'"
        :disabled="!canAllocate"
        @click="$emit('instantiate', selectedClass)"
      >
        + new {{ selectedClass }}()
      </button>

      <!-- Reset Button -->
      <button
        class="reset-btn"
        @click="$emit('reset')"
      >
        Reset All
      </button>
    </div>

    <!-- VTable Dispatch Map -->
    <div v-if="vTableEntries.length > 0" class="mb-4">
      <div class="text-[10px] font-bold uppercase text-text-muted mb-2">
        VTable Dispatch Map — {{ selectedClass }}
      </div>
      <div class="space-y-1.5">
        <button
          v-for="entry in vTableEntries"
          :key="entry.methodName"
          :id="`vtable-entry-${entry.methodName}`"
          class="dispatch-entry-btn"
          :class="{ 'active': isMethodActive(entry.methodName) }"
          @click="onDispatchMethod(entry.methodName)"
        >
          <div class="flex items-center gap-2">
            <span class="text-text-secondary font-mono">{{ entry.methodName }}()</span>
            <span class="text-[10px] text-text-disabled">→</span>
            <span class="font-bold" :class="getClassTextColor(entry.resolvedClass)">
              {{ entry.resolvedClass }}.{{ entry.methodName }}()
            </span>
          </div>
          <span
            class="override-badge"
            :class="entry.isOverridden ? 'override' : 'inherited'"
          >
            {{ entry.isOverridden ? 'override' : 'inherited' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Dispatch Status -->
    <div
      v-if="dispatchStatus !== 'IDLE'"
      class="dispatch-status-panel"
      :class="statusClass"
    >
      <div class="flex items-center gap-2">
        <span v-if="dispatchStatus === 'SEEKING_VTABLE'" class="status-dot seeking"></span>
        <span v-else-if="dispatchStatus === 'DISPATCHED'" class="status-dot dispatched"></span>
        <span v-else-if="dispatchStatus === 'ACCESS_VIOLATED'" class="status-dot violated"></span>
        <span class="font-bold">{{ statusLabel }}</span>
      </div>
      <div v-if="resolvedClass" class="mt-1 text-text-secondary">
        Phương thức được định tuyến sang: <span class="font-bold" :class="getClassTextColor(resolvedClass)">{{ resolvedClass }}</span>
      </div>
    </div>

    <!-- Encapsulation Violation Alert -->
    <div
      v-if="violation"
      class="violation-alert-panel"
    >
      <div class="flex items-center gap-2 text-accent-red text-xs">
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" x2="12" y1="8" y2="12"/>
          <line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
        <span class="font-bold">VI PHẠM ĐÓNG GÓI!</span>
      </div>
      <p class="text-[11px] text-accent-red mt-1 font-mono">{{ violation.errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DispatchStatus, EncapsulationViolation } from '../types/oop-visualization.types';

const props = defineProps<{
  availableClasses: string[];
  selectedClass: string;
  canAllocate: boolean;
  vTableEntries: Array<{ methodName: string; resolvedClass: string; isOverridden: boolean }>;
  dispatchStatus: DispatchStatus;
  resolvedClass?: string;
  activeMethod?: string | null;
  violation?: EncapsulationViolation | null;
  activePillar?: 'encapsulation' | 'inheritance' | 'polymorphism' | 'abstraction';
}>();

const activePillarTitle = computed(() => {
  switch (props.activePillar) {
    case 'encapsulation':
      return 'Đóng Gói';
    case 'inheritance':
      return 'Kế Thừa';
    case 'polymorphism':
      return 'Đa Hình';
    case 'abstraction':
      return 'Trừu Tượng';
    default:
      return 'OOP';
  }
});

const emit = defineEmits<{
  (e: 'select-class', className: string): void;
  (e: 'instantiate', className: string): void;
  (e: 'dispatch', methodName: string): void;
  (e: 'reset'): void;
}>();

const statusClass = computed(() => {
  switch (props.dispatchStatus) {
    case 'SEEKING_VTABLE':
      return 'seeking';
    case 'DISPATCHED':
      return 'dispatched';
    case 'ACCESS_VIOLATED':
      return 'violated';
    default:
      return 'default';
  }
});

const statusLabel = computed(() => {
  switch (props.dispatchStatus) {
    case 'SEEKING_VTABLE':
      return 'Đang tra cứu VTable...';
    case 'DISPATCHED':
      return 'Dynamic Dispatch thành công!';
    case 'ACCESS_VIOLATED':
      return 'Vi phạm đóng gói!';
    default:
      return '';
  }
});

function isMethodActive(methodName: string): boolean {
  return props.activeMethod?.endsWith(`.${methodName}`) ?? false;
}

function getClassTextColor(className: string): string {
  switch (className) {
    case 'Shape':
      return 'text-accent-green';
    case 'Circle':
      return 'text-accent-purple';
    case 'Rectangle':
      return 'text-accent-cyan';
    default:
      return 'text-text-secondary';
  }
}

function onDispatchMethod(methodName: string): void {
  emit('dispatch', methodName);
}
</script>

<style scoped>
.sandbox-panel {
  background-color: color-mix(in srgb, var(--vis-panel-bg-deep) 60%, transparent);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: 16px;
}

.class-btn {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: var(--font-bold);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.class-btn.active {
  background-color: var(--color-accent-purple-dim);
  border-color: color-mix(in srgb, var(--color-accent-purple) 50%, transparent);
  color: var(--color-accent-purple-light);
}

.class-btn.inactive {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
  border-color: var(--color-border-subtle);
  color: var(--color-text-muted);
}

.class-btn.inactive:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-border-default);
}

.instantiate-btn {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: var(--font-bold);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: var(--transition-fast);
  cursor: pointer;
}

.instantiate-btn.enabled {
  background-color: var(--color-accent-green-dim);
  border-color: color-mix(in srgb, var(--color-accent-green) 40%, transparent);
  color: var(--color-accent-green);
}

.instantiate-btn.enabled:hover {
  background-color: color-mix(in srgb, var(--color-accent-green) 50%, transparent);
}

.instantiate-btn.disabled {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
  border-color: var(--color-border-subtle);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.reset-btn {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: var(--font-bold);
  border-radius: var(--radius-md);
  background-color: var(--color-accent-red-dim);
  border: 1px solid color-mix(in srgb, var(--color-accent-red) 30%, transparent);
  color: var(--color-accent-red);
  cursor: pointer;
  transition: var(--transition-fast);
  margin-left: auto;
}

.reset-btn:hover {
  background-color: color-mix(in srgb, var(--color-accent-red) 40%, transparent);
}

.dispatch-entry-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
}

.dispatch-entry-btn.active {
  background-color: var(--color-accent-purple-dim);
  border-color: color-mix(in srgb, var(--color-accent-purple) 40%, transparent);
}

.dispatch-entry-btn:not(.active) {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
  border-color: var(--color-border-subtle);
}

.dispatch-entry-btn:not(.active):hover {
  border-color: var(--color-border-default);
}

.override-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.override-badge.override {
  background-color: var(--color-accent-green-dim);
  color: var(--color-accent-green);
  border-color: color-mix(in srgb, var(--color-accent-green) 30%, transparent);
}

.override-badge.inherited {
  background-color: var(--color-bg-surface);
  color: var(--color-text-muted);
}

.dispatch-status-panel {
  padding: 12px;
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  font-size: var(--text-xs);
}

.dispatch-status-panel.seeking {
  background-color: var(--color-accent-cyan-dim);
  border-color: color-mix(in srgb, var(--color-accent-cyan) 40%, transparent);
}

.dispatch-status-panel.dispatched {
  background-color: var(--color-accent-green-dim);
  border-color: color-mix(in srgb, var(--color-accent-green) 40%, transparent);
}

.dispatch-status-panel.violated {
  background-color: var(--color-accent-red-dim);
  border-color: color-mix(in srgb, var(--color-accent-red) 40%, transparent);
}

.dispatch-status-panel.default {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
  border-color: var(--color-border-subtle);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.seeking {
  background-color: var(--color-accent-cyan);
  animation: dot-blink 0.6s infinite;
}

.status-dot.dispatched {
  background-color: var(--color-accent-green);
  box-shadow: 0 0 6px var(--color-accent-green-glow);
}

.status-dot.violated {
  background-color: var(--color-accent-red);
  animation: dot-blink 0.3s infinite;
}

@keyframes dot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.violation-alert-panel {
  padding: 12px;
  background-color: var(--color-accent-red-dim);
  border: 1px solid color-mix(in srgb, var(--color-accent-red) 40%, transparent);
  border-radius: var(--radius-lg);
}

.text-accent-green { color: var(--color-accent-green); }
.text-accent-purple { color: var(--color-accent-purple); }
.text-accent-cyan { color: var(--color-accent-cyan); }
.text-accent-red { color: var(--color-accent-red); }
.text-accent-purple-light { color: var(--color-accent-purple-light); }
.text-text-secondary { color: var(--color-text-secondary); }
</style>
