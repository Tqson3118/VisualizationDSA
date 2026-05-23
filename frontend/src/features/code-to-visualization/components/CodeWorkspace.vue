<template>
  <div class="ide-workspace-container">
    <!-- Left Panel: Monaco Editor + Compiler Console -->
    <div class="ide-editor-panel">
      <!-- Monaco Editor (60%) -->
      <div class="flex-[6] min-h-0">
        <MonacoEditorPanel />
      </div>

      <!-- Compiler Console (40%) -->
      <div class="flex-[4] min-h-0 border-t" style="border-color: rgba(255, 255, 255, 0.05);">
        <CompilerConsole />
      </div>
    </div>

    <!-- Right Panel: Canvas + Controls -->
    <div class="ide-canvas-panel">
      <!-- Input Array Bar -->
      <div class="flex items-center gap-3 mb-3">
        <label class="text-[11px] text-slate-400 uppercase tracking-wider font-medium whitespace-nowrap">
          Mảng đầu vào:
        </label>
        <input
          v-model="inputArrayText"
          type="text"
          placeholder="5, 3, 8, 1, 9"
          class="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono
            border transition-colors focus:outline-none"
          :class="inputValidClass"
          @blur="parseInputArray"
          @keydown.enter="parseInputArray"
          style="background: rgba(15, 23, 42, 0.6);"
        />

        <!-- Run Button -->
        <button
          @click="runCompilation"
          :disabled="compilerStore.isCompiling"
          class="run-btn"
          :class="{ 'run-btn-loading': compilerStore.isCompiling }"
        >
          <svg v-if="!compilerStore.isCompiling"
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="currentColor" class="mr-1.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <div v-else class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
          <span class="text-xs font-semibold uppercase tracking-wider">
            {{ compilerStore.isCompiling ? 'Đang biên dịch...' : 'Run' }}
          </span>
        </button>
      </div>

      <!-- Canvas Visualization -->
      <div class="flex-1 rounded-xl overflow-hidden border shadow-lg relative min-h-0"
        style="border-color: rgba(255, 255, 255, 0.05);">
        <CanvasLayer />

        <!-- Empty state overlay -->
        <div v-if="!hasFrames" class="absolute inset-0 flex items-center justify-center"
          style="background: rgba(15, 23, 42, 0.8);">
          <div class="text-center px-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="1.5"
              class="mx-auto mb-3 text-slate-600">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <p class="text-sm text-slate-500">
              Viết mã sắp xếp bên trái, nhấn
              <span class="text-cyan-400 font-semibold">RUN</span>
              để xem hoạt ảnh.
            </p>
          </div>
        </div>
      </div>

      <!-- Control Panel -->
      <div class="mt-2 rounded-xl overflow-hidden border shadow-lg h-32"
        style="border-color: rgba(255, 255, 255, 0.05);">
        <AnimControlPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MonacoEditorPanel from './MonacoEditorPanel.vue';
import CompilerConsole from './CompilerConsole.vue';
import CanvasLayer from '../../animation-engine/components/CanvasLayer.vue';
import AnimControlPanel from '../../animation-engine/components/AnimControlPanel.vue';
import { useLiveCompilerStore } from '../store/useLiveCompilerStore';
import { useAnimationStore } from '../../animation-engine/store/useAnimationStore';

const compilerStore = useLiveCompilerStore();
const animStore = useAnimationStore();

const inputArrayText = ref('5, 3, 8, 1, 9, 2, 7, 4, 6');
const inputValid = ref(true);

const hasFrames = computed(() => animStore.totalSteps > 0);

const inputValidClass = computed(() => {
  if (!inputValid.value) return 'border-rose-500/50 text-rose-300';
  return 'border-slate-700 text-slate-200 focus:border-cyan-500/50';
});

function parseInputArray(): void {
  const text = inputArrayText.value.trim();
  if (!text) {
    inputValid.value = false;
    return;
  }

  const parts = text.split(',').map((s) => s.trim());
  const numbers: number[] = [];

  for (const part of parts) {
    const num = Number(part);
    if (isNaN(num) || !isFinite(num)) {
      inputValid.value = false;
      return;
    }
    numbers.push(num);
  }

  if (numbers.length < 2 || numbers.length > 50) {
    inputValid.value = false;
    return;
  }

  inputValid.value = true;
  compilerStore.setInputArray(numbers);
}

function runCompilation(): void {
  parseInputArray();
  if (!inputValid.value) return;
  compilerStore.compileAndExecuteCode();
}

onMounted(() => {
  parseInputArray();
});
</script>

<style scoped>
.ide-workspace-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  height: 100%;
  font-family: 'Outfit', sans-serif;
}

.ide-editor-panel {
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.ide-canvas-panel {
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
}

.run-btn {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #06B6D4, #0891B2);
  color: white;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.run-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #22D3EE, #06B6D4);
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.4);
}

.run-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.run-btn-loading {
  background: linear-gradient(135deg, #0891B2, #0E7490);
  animation: loadingPulse 1.5s infinite alternate;
}

@keyframes loadingPulse {
  0% { box-shadow: 0 0 8px rgba(6, 182, 212, 0.2); }
  100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.5); }
}
</style>
