<template>
  <!--
    h-full → fills the flex-1 from SortingView (canvas uses ALL available height).
    flex-col → header (shrink-0) + visualizer zone (flex-1) + progress (shrink-0).
    Visualizer zone fills every pixel of remaining canvas height — no wasted space.
  -->
  <div
    class="visualizer-canvas-container relative w-full h-full rounded-[18px] overflow-hidden flex flex-col"
    data-tour-id="dsa-simulation-tab"
  >
    <!-- Background grid -->
    <div class="canvas-grid absolute inset-0 opacity-[0.18] pointer-events-none [mask-image:radial-gradient(ellipse_65%_55%_at_50%_50%,#000_60%,transparent_100%)]" />

    <!-- Header: HUD label + algorithm picker — shrink-0, ~52px -->
    <div class="relative z-10 flex items-start justify-between px-4 pt-3 pb-2 shrink-0">
      <SortingHudOverlay :stepDescription="stepDescription" />
      <SortingAlgorithmControls :selectedAlgo="selectedAlgo" @select="selectAlgorithm" />
    </div>

    <!--
      Visualizer zone: flex-1 min-h-0 → fills ALL canvas height after header + progress.
      Each visualizer child must use h-full to utilise this space fully.
      overflow-x-auto for wide arrays, overflow-y-hidden (visualizers self-contain vertically).
    -->
    <div class="relative z-10 flex-1 min-h-0 flex flex-col px-4 pb-4 overflow-hidden">
      <!-- Visualizer Canvas -->
      <div class="flex-1 min-h-[0] overflow-x-auto overflow-y-hidden">
        <BubbleSortVisualizer   v-if="selectedAlgo === 'bubble'"      :frame="currentSortFrame" />
        <QuickSortVisualizer    v-else-if="selectedAlgo === 'quick'"  :frame="currentSortFrame" />
        <MergeSortVisualizer    v-else-if="selectedAlgo === 'merge'"  :frame="currentSortFrame" />
        <HeapSortVisualizer     v-else-if="selectedAlgo === 'heap'"   :frame="currentSortFrame" />
        <RadixSortVisualizer    v-else-if="selectedAlgo === 'radix'"  :frame="currentSortFrame" />
        <CountingSortVisualizer v-else-if="selectedAlgo === 'counting'" :frame="currentSortFrame" />
        <BucketSortVisualizer   v-else-if="selectedAlgo === 'bucket'"   :frame="currentSortFrame" />
      </div>
    </div>

    <!-- Progress bar — shrink-0, ~8px -->
    <SortingProgressBar :progressPercent="progressPercent" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useVcrStore } from "../../vcr-player";
import { useSortingAnimation } from "../composables/useSortingAnimation";
import SortingHudOverlay from "./SortingHudOverlay.vue";
import SortingAlgorithmControls from "./SortingAlgorithmControls.vue";
import SortingProgressBar from "./SortingProgressBar.vue";
import BubbleSortVisualizer from "./BubbleSortVisualizer.vue";
import QuickSortVisualizer from "./QuickSortVisualizer.vue";
import MergeSortVisualizer from "./MergeSortVisualizer.vue";
import HeapSortVisualizer from "./HeapSortVisualizer.vue";
import RadixSortVisualizer from "./RadixSortVisualizer.vue";
import CountingSortVisualizer from "./CountingSortVisualizer.vue";
import BucketSortVisualizer from "./BucketSortVisualizer.vue";

const vcrStore = useVcrStore();
const {
  selectedAlgo, currentSortFrame, stepDescription,
  progressPercent, recompileForAlgo, selectAlgorithm,
} = useSortingAnimation();

onMounted(() => {
  vcrStore.customCompileFn = () => recompileForAlgo(selectedAlgo.value);
  recompileForAlgo("bubble");
});
</script>

<style scoped>
.visualizer-canvas-container {
  background-color: var(--color-bg-primary);
  border: 1px solid color-mix(in srgb, var(--color-border-subtle) 85%, transparent);
  box-shadow: 0 8px 40px var(--color-accent-cyan-dim), 0 2px 12px rgba(0, 0, 0, 0.5);
}

.canvas-grid {
  background-image: 
    linear-gradient(to right, var(--color-border-default) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-border-default) 1px, transparent 1px);
  background-size: 3.5rem 3.5rem;
}
</style>
