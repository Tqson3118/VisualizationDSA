<template>
  <div class="h-full flex flex-col bg-slate-900 text-slate-200">
    <div class="px-4 py-2 border-b border-slate-800 bg-slate-800/50">
      <span class="text-xs font-medium text-slate-400 uppercase">Pseudocode</span>
    </div>
    <div class="flex-1 overflow-auto p-4 font-mono text-sm">
      <div
        v-for="(line, idx) in pseudoCode"
        :key="idx"
        class="px-3 py-1.5 rounded-md transition-colors duration-150"
        :class="idx === activeLine
          ? 'bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-500'
          : 'text-slate-400 border-l-2 border-transparent'
        "
      >
        <span class="text-slate-600 mr-3 select-none text-xs">{{ idx + 1 }}</span>
        {{ line }}
      </div>
      <p v-if="pseudoCode.length === 0" class="text-slate-500 italic">
        Chưa có mã giả. Hãy chọn thuật toán và nhấn Visualize.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAnimationStore } from '../store/useAnimationStore';

const store = useAnimationStore();
const pseudoCode = computed(() => store.pseudoCode);
const activeLine = computed(() => store.currentFrame?.activeLine ?? -1);
</script>
