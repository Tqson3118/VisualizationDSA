<template>
  <div class="heap-allocator">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-accent-yellow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Heap Memory Allocator
        </span>
      </div>
      <span class="text-[10px] font-mono text-text-muted">
        {{ heapObjects.length }}/{{ maxObjects }} objects
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="heapObjects.length === 0" class="text-center py-8">
      <div class="text-text-muted text-xs">
        Chưa có đối tượng nào trên Heap.
      </div>
    </div>

    <!-- Heap Instances -->
    <TransitionGroup v-else name="heap-list" tag="div" class="space-y-2">
      <div
        v-for="instance in heapObjects"
        :key="instance.address"
        :id="`heap-obj-${instance.address}`"
        class="heap-instance transition-all cursor-pointer hover:border-border-default"
        :class="{ 'active-instance': instance.address === activeAddress }"
        @click="$emit('select', instance.address)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono text-accent-yellow font-bold">
              {{ instance.address }}
            </span>
            <span
              class="text-xs font-bold"
              :class="getClassColor(instance.className)"
            >
              {{ instance.className }}
            </span>
          </div>
          <button
            @click.stop="$emit('remove', instance.address)"
            class="free-btn"
          >
            free()
          </button>
        </div>

        <!-- Fields -->
        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="fieldName in getFieldNames(instance)"
            :key="fieldName"
            class="field-badge"
          >
            {{ fieldName }}
          </span>
        </div>

        <!-- VTable Summary -->
        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="[methodName, resolvedClass] in getVTableEntries(instance)"
            :key="methodName"
            class="vtable-badge"
            :class="resolvedClass !== instance.className ? 'inherited' : 'override'"
          >
            {{ methodName }}() → {{ resolvedClass }}
          </span>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { HeapObjectInstance } from '../types/oop-visualization.types';
import { MAX_HEAP_OBJECTS } from '../types/oop-visualization.types';

defineProps<{
  heapObjects: HeapObjectInstance[];
  activeAddress?: string | null;
}>();

defineEmits<{
  (e: 'remove', address: string): void;
  (e: 'select', address: string): void;
}>();

const maxObjects = MAX_HEAP_OBJECTS;

function getClassColor(className: string): string {
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

function getFieldNames(instance: HeapObjectInstance): string[] {
  return Array.from(instance.fieldsData.keys());
}

function getVTableEntries(instance: HeapObjectInstance): Array<[string, string]> {
  return Array.from(instance.vTable.entries());
}
</script>

<style scoped>
.heap-allocator {
  background-color: color-mix(in srgb, var(--vis-panel-bg-deep) 60%, transparent);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: 16px;
}

.heap-instance {
  padding: 12px;
  background-color: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.active-instance {
  border-color: color-mix(in srgb, var(--color-accent-yellow) 50%, transparent) !important;
  box-shadow: 0 0 15px var(--color-accent-yellow-glow);
}

.free-btn {
  font-size: 10px;
  color: var(--color-accent-red);
  background: transparent;
  border: none;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.free-btn:hover {
  background-color: color-mix(in srgb, var(--color-accent-red) 30%, transparent);
}

.field-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-surface);
  color: var(--color-text-secondary);
}

.vtable-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.vtable-badge.inherited {
  background-color: var(--color-accent-yellow-dim);
  color: var(--color-accent-yellow);
  border-color: color-mix(in srgb, var(--color-accent-yellow) 30%, transparent);
}

.vtable-badge.override {
  background-color: var(--color-accent-green-dim);
  color: var(--color-accent-green);
  border-color: color-mix(in srgb, var(--color-accent-green) 30%, transparent);
}

.text-accent-yellow { color: var(--color-accent-yellow); }
.text-accent-green { color: var(--color-accent-green); }
.text-accent-purple { color: var(--color-accent-purple); }
.text-accent-cyan { color: var(--color-accent-cyan); }

/* Transition Group Animations for Heap */
.heap-list-enter-active,
.heap-list-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.heap-list-enter-from {
  opacity: 0;
  transform: scale(0.6) translateY(20px);
}
.heap-list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}
</style>
