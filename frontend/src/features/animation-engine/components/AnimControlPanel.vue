<template>
  <div class="h-full flex flex-col bg-slate-900 text-slate-200">
    <div class="px-4 py-2 border-b border-slate-800 bg-slate-800/50">
      <span class="text-xs font-medium text-slate-400 uppercase">Animation Controls</span>
    </div>
    <div class="flex-1 flex flex-col gap-4 p-4 overflow-auto">
      <!-- Timeline Scrubber -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>Step {{ store.currentIndex + 1 }}</span>
          <span>{{ store.totalSteps }} total</span>
        </div>
        <input
          type="range"
          min="0"
          :max="Math.max(store.totalSteps - 1, 0)"
          :value="store.currentIndex"
          :disabled="store.totalSteps === 0"
          class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          @input="onScrub"
        />
      </div>

      <!-- Playback Buttons -->
      <div class="flex items-center justify-center gap-2">
        <!-- Stop -->
        <button
          class="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40"
          :disabled="store.playbackState === 'UNINITIALIZED'"
          title="Reset (R)"
          @click="store.stop()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        <!-- Step Prev -->
        <button
          class="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40"
          :disabled="store.currentIndex === 0 || store.playbackState === 'UNINITIALIZED'"
          title="Step Prev (ArrowLeft)"
          @click="store.stepBackward()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="19 20 9 12 19 4 19 20" fill="currentColor" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        <!-- Play/Pause -->
        <button
          class="p-3 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="store.playbackState === 'UNINITIALIZED' || store.playbackState === 'FINISHED'"
          :title="store.isPlaying ? 'Pause (Space)' : 'Play (Space)'"
          @click="togglePlay"
        >
          <!-- Pause icon -->
          <svg v-if="store.isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          <!-- Play icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>

        <!-- Step Next -->
        <button
          class="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40"
          :disabled="store.isFinished || store.playbackState === 'UNINITIALIZED'"
          title="Step Next (ArrowRight)"
          @click="store.stepForward()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>

      <!-- Speed Control -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 w-12">Speed:</span>
        <div class="flex gap-1 flex-1">
          <button
            v-for="speed in SPEEDS"
            :key="speed"
            class="flex-1 px-2 py-1 rounded-md text-xs font-bold border transition-colors"
            :class="store.playbackSpeed === speed
              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/45'
              : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            "
            @click="store.setSpeed(speed)"
          >
            {{ speed }}x
          </button>
        </div>
      </div>

      <!-- State indicator -->
      <div class="flex items-center gap-2 mt-auto">
        <span
          class="w-2 h-2 rounded-full"
          :class="{
            'bg-slate-600': store.playbackState === 'UNINITIALIZED',
            'bg-cyan-500': store.playbackState === 'LOADED',
            'bg-green-500 animate-pulse': store.playbackState === 'PLAYING',
            'bg-amber-500': store.playbackState === 'PAUSED',
            'bg-emerald-500': store.playbackState === 'FINISHED',
          }"
        />
        <span class="text-xs text-slate-500">{{ store.playbackState }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useAnimationStore } from '../store/useAnimationStore';

const store = useAnimationStore();
const SPEEDS = [0.5, 1, 1.5, 2, 5];

function togglePlay(): void {
  if (store.isPlaying) {
    store.pause();
  } else {
    store.play();
  }
}

function onScrub(event: Event): void {
  const target = event.target as HTMLInputElement;
  store.scrubTo(parseInt(target.value, 10));
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent): void {
  if (store.playbackState === 'UNINITIALIZED') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      e.preventDefault();
      store.stepForward();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      store.stepBackward();
      break;
    case 'KeyR':
    case 'Escape':
      e.preventDefault();
      store.stop();
      break;
    case 'Digit1':
      store.setSpeed(1);
      break;
    case 'Digit2':
      store.setSpeed(2);
      break;
    case 'Digit3':
      store.setSpeed(5);
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>
