<template>
  <div class="flex-1 rounded-xl overflow-hidden border border-border-subtle shadow-lg min-h-0 bg-bg-secondary p-3 overflow-auto">
    <h4 class="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">Mã giả (Pseudocode)</h4>
    <div v-if="pseudoCode.length > 0" class="space-y-0.5">
      <div
        v-for="(line, idx) in pseudoCode"
        :key="idx"
        class="text-xs font-mono px-2 py-0.5 rounded transition-colors"
        :class="
          activeLine === idx
            ? 'bg-accent-cyan/40 text-accent-cyan'
            : 'text-text-secondary'
        "
      >
        {{ line }}
      </div>
    </div>
    <div v-if="description" class="mt-3 text-xs text-text-muted leading-relaxed">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  pseudoCode: string[];
  activeLine: number | undefined;
  description: string;
}>();
</script>
