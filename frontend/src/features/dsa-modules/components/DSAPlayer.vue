<template>
  <div class="flex flex-col h-full w-full gap-2">
    <!-- Mode: Dashboard (no algorithm selected) -->
    <template v-if="!algoStore.currentAlgorithm">
      <AlgorithmDashboard :allowedCategories="allowedCategories" @select="onAlgorithmSelected" />
    </template>

    <!-- Mode: Visualization (algorithm selected) -->
    <template v-else>
      <DSAHeader
        :algorithm="algoStore.currentAlgorithm"
        :metadata="algoStore.metadata"
        :isExecuting="isExecuting"
        @back="goBack"
        @execute="executeVisualization"
      />

      <!-- Mode: Theory or Simulation -->
      <div v-if="algoStore.viewMode === 'theory'" class="flex-1 flex gap-4 min-h-0">
        <!-- Theory Content (60%) -->
        <div class="flex-[60] flex flex-col gap-4">
          <div class="rounded-xl bg-bg-secondary/60 border border-white/5 backdrop-blur-xl p-6 shadow-lg flex-1 overflow-y-auto">
            <h3 class="text-lg font-bold text-text-primary mb-3">📚 Bài học Lý thuyết: {{ algoStore.currentAlgorithm.name }}</h3>
            
            <p class="text-sm text-text-secondary leading-relaxed mb-6">
              {{ algoStore.metadata?.description || 'Chưa có mô tả lý thuyết cho thuật toán này.' }}
            </p>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 rounded-xl bg-bg-surface border border-border-default/50">
                <div class="text-[10px] text-text-disabled uppercase tracking-wider">Độ phức tạp thời gian</div>
                <div class="text-xl font-bold text-accent mt-1">{{ algoStore.metadata?.timeComplexity || 'N/A' }}</div>
              </div>
              <div class="p-4 rounded-xl bg-bg-surface border border-border-default/50">
                <div class="text-[10px] text-text-disabled uppercase tracking-wider">Độ phức tạp bộ nhớ</div>
                <div class="text-xl font-bold text-accent mt-1">{{ algoStore.metadata?.spaceComplexity || 'N/A' }}</div>
              </div>
            </div>

            <div class="flex gap-3 mt-4">
              <button @click="algoStore.setViewMode('simulation'); executeVisualization();"
                class="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/80 transition-all duration-200 shadow-md flex items-center gap-2">
                <span>🎬 Bắt đầu Chạy mô phỏng</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Reference Code / Pseudo (40%) -->
        <div class="flex-[40] flex flex-col">
          <div class="rounded-xl bg-bg-secondary/60 border border-white/5 backdrop-blur-xl p-5 shadow-lg flex-1 flex flex-col min-h-0">
            <h4 class="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Mã giả tham khảo (Pseudocode)</h4>
            <div class="flex-1 overflow-y-auto font-mono text-xs bg-bg-surface/50 p-4 rounded-lg border border-border-default/30">
              <div v-for="(line, idx) in algoStore.metadata?.pseudoCode" :key="idx" class="py-1.5 border-b border-border-default/10 text-text-primary whitespace-pre-wrap">
                {{ line }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="flex-1 flex gap-2 min-h-0">
          <!-- Canvas Visualizer (65%) -->
          <div class="flex-[65] rounded-xl overflow-hidden border border-border-subtle shadow-lg relative">
            <AlgorithmVisualizer />
          </div>

          <!-- Sidebar: Pseudocode + Input (35%) -->
          <div class="flex-[35] flex flex-col gap-2 min-h-0">
            <PseudocodeViewer
              v-if="algoStore.metadata"
              :pseudoCode="algoStore.metadata.pseudoCode"
              :activeLine="animStore.currentFrame?.activeLine"
              :description="algoStore.metadata.description"
            />
            <DSAInputForm
              v-model="inputText"
              :algorithmCategory="algoStore.currentAlgorithm.category"
              @submit="executeVisualization"
            />
          </div>
        </div>

        <!-- Explanation Row -->
        <div v-if="animStore.currentFrame"
          class="h-10 rounded-xl overflow-hidden border border-border-subtle shadow-lg bg-bg-secondary flex items-center px-4">
          <span class="text-xs text-text-secondary">{{ animStore.currentFrame.explanation }}</span>
        </div>

        <!-- Control Panel -->
        <AnimationVcrControls
          :isPlaying="animStore.isPlaying"
          :currentIndex="animStore.currentIndex"
          :totalSteps="animStore.totalSteps"
          :playbackSpeed="animStore.playbackSpeed"
          @stop="animStore.stop()"
          @stepBackward="animStore.stepBackward()"
          @stepForward="animStore.stepForward()"
          @togglePlay="animStore.isPlaying ? animStore.pause() : animStore.play()"
          @scrub="animStore.scrubTo"
          @speedChange="animStore.setSpeed"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAlgorithmStore } from '../store/useAlgorithmStore';
import { useAnimationStore } from '../../animation-engine/store/useAnimationStore';
import { executeDSAAlgorithm } from '../services/dsaApi';
import type { Algorithm } from '../types/algorithm.types';
import AlgorithmDashboard from './AlgorithmDashboard.vue';
import AlgorithmVisualizer from './AlgorithmVisualizer.vue';
import DSAHeader from './DSAHeader.vue';
import DSAInputForm from './DSAInputForm.vue';
import PseudocodeViewer from './PseudocodeViewer.vue';
import AnimationVcrControls from '../../animation-engine/components/AnimationVcrControls.vue';
import { useDSAKeyboard } from '../composables/useDSAKeyboard';

const props = defineProps<{
  allowedCategories?: string[];
}>();

const algoStore   = useAlgorithmStore();
const animStore   = useAnimationStore();
const inputText   = ref('5, 3, 8, 1, 9, 2, 7');
const isExecuting = ref(false);

useDSAKeyboard(() => !!algoStore.currentAlgorithm, animStore as any);

function onAlgorithmSelected(algo: Algorithm): void {
  generateDefaultInput(algo);
  executeVisualization();
}

function generateDefaultInput(algo: Algorithm): void {
  const category = algo.category.toLowerCase();
  if (category === 'searching')       inputText.value = '2, 5, 8, 12, 16, 23, 38, 56, 72, 91, 23';
  else if (category === 'tree')       inputText.value = '50, 30, 70, 20, 40, 60, 80';
  else if (category === 'stack-queue') inputText.value = '10, 20, 30, 40, 50';
  else                                inputText.value = '5, 3, 8, 1, 9, 2, 7';
}

async function executeVisualization(): Promise<void> {
  if (!algoStore.currentAlgorithm || isExecuting.value) return;
  isExecuting.value = true;
  try {
    const data = inputText.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (data.length === 0) return;
    const result = await executeDSAAlgorithm(algoStore.currentAlgorithm.id, data);
    animStore.loadResult({ algorithmId: result.algorithmId, pseudoCode: result.pseudoCode, frames: result.frames });
  } catch (error) { console.error('Lỗi thực thi trực quan hóa:', error); }
  finally { isExecuting.value = false; }
}

function goBack(): void { animStore.stop(); algoStore.clearActive(); }
</script>
