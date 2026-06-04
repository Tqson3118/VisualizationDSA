<template>
  <div class="h-full flex flex-col gap-4" style="font-family: 'Outfit', sans-serif;">
    <!-- Top: Algorithm Selector -->
    <CompareAlgorithmSelector />

    <!-- Middle: Split Screen Dual Canvas -->
    <div class="flex-1 min-h-0 grid grid-cols-2 gap-4">
      <!-- Left Canvas -->
      <CompareCanvasPanel
        :currentFrame="store.leftCurrentFrame"
        :totalFrames="store.leftTotalFrames"
        :currentIndex="store.leftCurrentIndex"
        :algorithmName="store.leftAlgorithmName"
        :timeComplexity="store.leftTimeComplexity"
        :isFinished="store.leftIsFinished"
        accentColor="#06B6D4"
        :playbackSpeed="store.globalPlaySpeed"
      />

      <!-- Right Canvas -->
      <CompareCanvasPanel
        :currentFrame="store.rightCurrentFrame"
        :totalFrames="store.rightTotalFrames"
        :currentIndex="store.rightCurrentIndex"
        :algorithmName="store.rightAlgorithmName"
        :timeComplexity="store.rightTimeComplexity"
        :isFinished="store.rightIsFinished"
        accentColor="#10B981"
        :playbackSpeed="store.globalPlaySpeed"
      />
    </div>

    <!-- Bottom: Dashboard + Unified Controls -->
    <div class="flex-shrink-0 space-y-3">
      <!-- Comparative Stats Dashboard -->
      <ComparativeDashboard />

      <!-- Unified VCR Controls -->
      <CompareVcrControls />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useCompareAlgorithmsStore } from '../store/useCompareAlgorithmsStore';
import CompareAlgorithmSelector from './CompareAlgorithmSelector.vue';
import CompareCanvasPanel from './CompareCanvasPanel.vue';
import ComparativeDashboard from './ComparativeDashboard.vue';
import CompareVcrControls from './CompareVcrControls.vue';

const store = useCompareAlgorithmsStore();

onBeforeUnmount(() => {
  store.cleanup();
});
</script>
