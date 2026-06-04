<template>
  <div class="dip-panel flex flex-col gap-4">
    <!-- DIP Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full" :class="isViolating ? 'bg-accent-red animate-pulse' : 'bg-accent-green'" />
        <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">
          DIP — Dependency Inversion Principle
        </span>
      </div>
      <span
        class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
        :class="isViolating
          ? 'bg-accent-red/50 text-accent-red border border-accent-red/40'
          : 'bg-accent-green/50 text-accent-green border border-accent-green/40'"
      >
        {{ isViolating ? 'DIRECT COUPLING' : 'INVERTED' }}
      </span>
    </div>

    <!-- Neon Flowing Path -->
    <NeonFlowingPath
      :is-violating="isViolating"
      :has-interface="hasInterface"
    />

    <!-- Action Buttons -->
    <div class="flex gap-3">
      <button
        class="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
               bg-accent-green/40 text-accent-green border border-accent-green/40
               hover:bg-accent-green/60 transition-all"
        :disabled="hasInterface"
        @click="$emit('insertInterface')"
      >
        Chèn Interface trừu tượng
      </button>
      <button
        class="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
               bg-bg-surface/40 text-text-secondary border border-border-default/40
               hover:bg-bg-active/60 transition-all"
        :disabled="!hasInterface"
        @click="$emit('resetDIP')"
      >
        Reset DIP
      </button>
    </div>

    <!-- Diagnostic result -->
    <div
      v-if="diagnosticResult"
      class="text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur-md border"
      :class="isViolating
        ? 'bg-accent-red/40 text-accent-red border-accent-red/40'
        : 'bg-accent-green/40 text-accent-green border-accent-green/40'"
    >
      {{ diagnosticResult }}
    </div>
  </div>
</template>

<script setup lang="ts">
import NeonFlowingPath from './NeonFlowingPath.vue';

defineProps<{
  isViolating: boolean;
  hasInterface: boolean;
  diagnosticResult: string | null;
}>();

defineEmits<{
  insertInterface: [];
  resetDIP: [];
}>();
</script>
