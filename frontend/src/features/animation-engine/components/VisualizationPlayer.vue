<template>
  <div class="flex flex-col h-full w-full gap-2">
    <!-- Input Bar -->
    <div class="flex-shrink-0 flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
      <label class="text-xs text-slate-400 whitespace-nowrap">Array:</label>
      <input
        v-model="rawInput"
        type="text"
        class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
        placeholder="5, 3, 8, 1, 9"
      />
      <button
        class="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-colors active:scale-95"
        @click="onVisualize"
      >
        Visualize
      </button>
    </div>

    <!-- Top Area: Canvas + Pseudocode -->
    <div class="flex-1 flex gap-2 min-h-0">
      <!-- Canvas (70%) -->
      <div class="flex-[7] rounded-xl overflow-hidden border border-slate-800 shadow-lg">
        <CanvasLayer />
      </div>
      <!-- Pseudocode (30%) -->
      <div class="flex-[3] rounded-xl overflow-hidden border border-slate-800 shadow-lg">
        <AnimPseudoCodePanel />
      </div>
    </div>

    <!-- Explanation Row -->
    <div class="h-16 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
      <ExplanationPanel />
    </div>

    <!-- Control Panel Row -->
    <div class="h-40 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
      <AnimControlPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CanvasLayer from './CanvasLayer.vue';
import AnimPseudoCodePanel from './AnimPseudoCodePanel.vue';
import ExplanationPanel from './ExplanationPanel.vue';
import AnimControlPanel from './AnimControlPanel.vue';
import { useAnimationStore } from '../store/useAnimationStore';
import { generateDummyBubbleSortResult, executeAlgorithm } from '../services/algorithmApi';

const store = useAnimationStore();
const rawInput = ref('5, 3, 8, 1, 9');

async function onVisualize(): Promise<void> {
  const parsed = rawInput.value
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));

  if (parsed.length === 0) return;

  try {
    const result = await executeAlgorithm({
      algorithmId: 'bubble-sort',
      dataType: 'array',
      inputData: parsed,
    });
    store.loadResult(result);
  } catch {
    const result = generateDummyBubbleSortResult(parsed);
    store.loadResult(result);
  }
}
</script>
