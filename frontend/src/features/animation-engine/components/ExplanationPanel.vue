<template>
  <div class="h-full flex flex-col bg-slate-900 text-slate-200">
    <div class="px-4 py-2 border-b border-slate-800 bg-slate-800/50">
      <span class="text-xs font-medium text-slate-400 uppercase">Explanation</span>
    </div>
    <div class="flex-1 overflow-auto p-4">
      <p
        v-if="currentFrame"
        class="text-sm leading-relaxed text-slate-300"
      >
        {{ currentFrame.explanation }}
      </p>
      <p v-else class="text-sm text-slate-500 italic">
        Chưa có dữ liệu hoạt ảnh. Hãy nhấn Visualize để bắt đầu.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAnimationStore } from '../store/useAnimationStore';

const store = useAnimationStore();
const currentFrame = computed(() => store.currentFrame);
</script>
