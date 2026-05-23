import { defineStore } from 'pinia';
import { shallowRef, ref, computed } from 'vue';
import type {
  FrameDTO,
  AlgorithmResult,
  PlaybackState,
} from '../types/animation.types';

/**
 * useAnimationStore — Pinia Store quản lý trạng thái hoạt họa giải thuật.
 * Thiết kế theo Composition API (Setup Store) với shallowRef tối ưu RAM.
 */
export const useAnimationStore = defineStore('animation', () => {
  // ==========================================
  // 1. STATE
  // ==========================================

  const frames = shallowRef<FrameDTO[]>([]);
  const pseudoCode = ref<string[]>([]);
  const algorithmId = ref<string>('');

  const currentIndex = ref<number>(0);
  const isPlaying = ref<boolean>(false);
  const playbackSpeed = ref<number>(1.0);
  let timerId: number | null = null;

  // ==========================================
  // 2. GETTERS (Computed)
  // ==========================================

  const currentFrame = computed<FrameDTO | null>(() => {
    if (frames.value.length === 0) return null;
    return frames.value[currentIndex.value] ?? null;
  });

  const isFinished = computed<boolean>(() => {
    if (frames.value.length === 0) return false;
    return currentIndex.value === frames.value.length - 1;
  });

  const totalSteps = computed<number>(() => frames.value.length);

  const progressPercent = computed<number>(() => {
    if (frames.value.length <= 1) return 0;
    return (currentIndex.value / (frames.value.length - 1)) * 100;
  });

  const playbackState = computed<PlaybackState>(() => {
    if (frames.value.length === 0) return 'UNINITIALIZED';
    if (isFinished.value && !isPlaying.value) return 'FINISHED';
    if (isPlaying.value) return 'PLAYING';
    return currentIndex.value === 0 ? 'LOADED' : 'PAUSED';
  });

  // ==========================================
  // 3. ACTIONS
  // ==========================================

  function loadResult(result: AlgorithmResult): void {
    stop();
    algorithmId.value = result.algorithmId;
    pseudoCode.value = result.pseudoCode;
    frames.value = result.frames;
    currentIndex.value = 0;
  }

  function play(): void {
    if (isPlaying.value || isFinished.value) return;
    isPlaying.value = true;
    tick();
  }

  function tick(): void {
    if (!isPlaying.value) return;
    if (isFinished.value) {
      pause();
      return;
    }

    currentIndex.value++;

    const baseDelay = 1000;
    const currentDelay = baseDelay / playbackSpeed.value;

    timerId = setTimeout(() => {
      tick();
    }, currentDelay) as unknown as number;
  }

  function pause(): void {
    isPlaying.value = false;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function stop(): void {
    pause();
    currentIndex.value = 0;
  }

  function stepForward(): void {
    pause();
    if (currentIndex.value < frames.value.length - 1) {
      currentIndex.value++;
    }
  }

  function stepBackward(): void {
    pause();
    if (currentIndex.value > 0) {
      currentIndex.value--;
    }
  }

  function scrubTo(index: number): void {
    pause();
    if (index >= 0 && index < frames.value.length) {
      currentIndex.value = index;
    }
  }

  function setSpeed(speed: number): void {
    playbackSpeed.value = speed;
    if (isPlaying.value) {
      pause();
      play();
    }
  }

  return {
    frames,
    pseudoCode,
    algorithmId,
    currentIndex,
    isPlaying,
    playbackSpeed,
    currentFrame,
    isFinished,
    totalSteps,
    progressPercent,
    playbackState,
    loadResult,
    play,
    pause,
    stop,
    stepForward,
    stepBackward,
    scrubTo,
    setSpeed,
  };
});
