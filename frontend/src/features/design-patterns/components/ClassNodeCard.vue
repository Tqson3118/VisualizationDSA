<template>
  <div
    class="uml-class-node-card"
    :class="[
      `type-${node.type}`,
      { 'is-dragging': isDragging },
      { 'is-active-strategy': isActiveStrategy },
      { 'is-observer-pulse': isObserverPulse },
    ]"
    :style="{ left: `${node.x}px`, top: `${node.y}px`, width: `${node.width}px` }"
    @mousedown.prevent="onMouseDown"
  >
    <!-- Header: class name + stereotype -->
    <div class="uml-node-header" :class="`header-${node.type}`">
      <div v-if="node.type === 'interface'" class="uml-stereotype">&laquo;interface&raquo;</div>
      <div v-else-if="node.type === 'abstract'" class="uml-stereotype">&laquo;abstract&raquo;</div>
      <div class="uml-class-name">{{ node.name }}</div>
    </div>

    <!-- Attributes section -->
    <div v-if="node.attributes && node.attributes.length > 0" class="uml-section">
      <div v-for="attr in node.attributes" :key="attr" class="uml-member">{{ attr }}</div>
    </div>
    <div v-else class="uml-section uml-section-empty" />

    <!-- Methods section -->
    <div v-if="node.methods && node.methods.length > 0" class="uml-section uml-section-last">
      <div v-for="method in node.methods" :key="method" class="uml-member">{{ method }}</div>
    </div>
    <div v-else class="uml-section uml-section-last uml-section-empty" />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import type { UMLNode } from '../types/design-patterns.types';

const props = defineProps<{
  node: UMLNode;
  isActiveStrategy?: boolean;
  isObserverPulse?: boolean;
}>();

const emit = defineEmits<{
  (e: 'drag', nodeId: string, x: number, y: number): void;
}>();

const isDragging = ref(false);
let offsetX = 0;
let offsetY = 0;

function onMouseDown(e: MouseEvent): void {
  isDragging.value = true;
  offsetX = e.clientX - props.node.x;
  offsetY = e.clientY - props.node.y;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e: MouseEvent): void {
  if (!isDragging.value) return;
  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;
  emit('drag', props.node.id, x, y);
}

function onMouseUp(): void {
  isDragging.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});
</script>

<style scoped>
.uml-class-node-card {
  position: absolute;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  z-index: 10;
  overflow: hidden;
}

.uml-class-node-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
}

.uml-class-node-card.is-dragging {
  cursor: grabbing;
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 15px 40px -8px rgba(0, 0, 0, 0.6);
  z-index: 50;
}

.uml-class-node-card.is-active-strategy {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
}

.uml-class-node-card.is-observer-pulse {
  animation: observer-glow 0.6s ease-in-out 3;
}

@keyframes observer-glow {
  0%, 100% { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5); }
  50% { box-shadow: 0 0 25px rgba(6, 182, 212, 0.4); border-color: rgba(6, 182, 212, 0.5); }
}

.uml-node-header {
  padding: 8px 12px;
  font-family: 'JetBrains Mono', monospace;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.uml-stereotype {
  font-size: 9px;
  font-weight: 400;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.uml-class-name {
  font-size: 13px;
  font-weight: 700;
}

.header-class .uml-class-name {
  color: #e2e8f0;
}

.header-interface .uml-class-name {
  color: #06b6d4;
}

.header-abstract .uml-class-name {
  color: #a78bfa;
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
  font-size: 10px;
  color: #94a3b8;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-interface {
  border-color: rgba(6, 182, 212, 0.15);
}

.type-abstract {
  border-color: rgba(167, 139, 250, 0.15);
}
</style>
