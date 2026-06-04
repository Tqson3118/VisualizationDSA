<template>
  <div class="lsp-panel flex flex-col gap-4">
    <!-- LSP Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full" :class="phaseStatusDot" />
        <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">
          LSP — Liskov Substitution Principle
        </span>
      </div>
      <span
        class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
        :class="phaseBadgeClass"
      >
        {{ phaseBadgeText }}
      </span>
    </div>

    <!-- Laser Fracture Overlay -->
    <LaserFractureOverlay
      :phase="lspPhase"
      :source-point="{ x: 80, y: 90 }"
      :target-point="{ x: 420, y: 90 }"
      source-label="makeBirdFly(bird)"
      target-label="Ostrich"
      :error-message="diagnosticResult ?? 'Đà điểu không thể bay!'"
    />

    <!-- Action Buttons -->
    <div class="flex gap-3">
      <button
        class="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
               bg-accent-red/40 text-accent-red border border-accent-red/40
               hover:bg-accent-red/60 transition-all"
        :disabled="lspPhase === 'TRANSMITTING'"
        @click="$emit('runViolation')"
      >
        🦤 Thay thế Ostrich (Vi phạm)
      </button>
      <button
        class="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
               bg-accent-green/40 text-accent-green border border-accent-green/40
               hover:bg-accent-green/60 transition-all"
        :disabled="lspPhase === 'TRANSMITTING'"
        @click="$emit('runValid')"
      >
        🕊️ Thay thế Eagle (Đạt)
      </button>
    </div>

    <!-- Diagnostic result -->
    <div
      v-if="diagnosticResult"
      class="text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur-md border"
      :class="lspPhase === 'SHATTERED'
        ? 'bg-accent-red/40 text-accent-red border-accent-red/40'
        : 'bg-accent-green/40 text-accent-green border-accent-green/40'"
    >
      {{ diagnosticResult }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LSPSubstitutionPhase } from '../types/solid-visualization.types';
import LaserFractureOverlay from './LaserFractureOverlay.vue';

const props = defineProps<{
  lspPhase: LSPSubstitutionPhase;
  diagnosticResult: string | null;
}>();

defineEmits<{
  runViolation: [];
  runValid: [];
}>();

const phaseStatusDot = computed(() => {
  switch (props.lspPhase) {
    case 'TRANSMITTING': return 'bg-accent-yellow animate-pulse';
    case 'SHATTERED': return 'bg-accent-red animate-pulse';
    case 'PASSED': return 'bg-accent-green';
    default: return 'bg-bg-hover';
  }
});

const phaseBadgeClass = computed(() => {
  switch (props.lspPhase) {
    case 'TRANSMITTING': return 'bg-accent-yellow/50 text-accent-yellow border border-accent-yellow/40';
    case 'SHATTERED': return 'bg-accent-red/50 text-accent-red border border-accent-red/40';
    case 'PASSED': return 'bg-accent-green/50 text-accent-green border border-accent-green/40';
    default: return 'bg-bg-surface/50 text-text-secondary border border-border-default/40';
  }
});

const phaseBadgeText = computed(() => {
  switch (props.lspPhase) {
    case 'TRANSMITTING': return 'TRANSMITTING...';
    case 'SHATTERED': return 'SHATTERED!';
    case 'PASSED': return 'LSP PASSED';
    default: return 'IDLE';
  }
});
</script>
