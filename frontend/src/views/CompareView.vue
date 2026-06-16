<template>
  <section class="flex-1 min-h-0 relative">
    <CompareWorkspace />
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { CompareWorkspace } from '../features/compare-algorithms';
import { useGuidedTourStore } from '../features/guided-tour/store/useGuidedTourStore';

const tourStore = useGuidedTourStore();

onMounted(() => {
  tourStore.startPageTour('/compare', false);
});
</script>
