<template>
  <Transition name="lecture-fade">
    <div
      v-if="lectureStore.isActive"
      class="lecture-backdrop"
      :class="{ 'backdrop-dimmed': !lectureStore.isMinimized }"
    >
      <!-- Lecture Panel -->
      <div
        class="lecture-panel"
        :class="{
          'panel-minimized': lectureStore.isMinimized,
          'panel-visible': !lectureStore.isMinimized,
        }"
      >
        <!-- Header -->
        <div class="panel-header">
          <div class="header-left">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              class="header-icon"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span class="header-title">E-Lecture</span>
            <span class="slide-counter">{{ lectureStore.slideProgress }}</span>
          </div>
          <button
            class="close-btn"
            @click="lectureStore.exitLecture()"
            title="Thoát bài giảng (Esc)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- Lecture Title -->
        <div v-if="lectureStore.currentLecture" class="lecture-title-row">
          <h2 class="lecture-title">{{ lectureStore.currentLecture.title }}</h2>
        </div>

        <!-- Slide Content -->
        <div v-if="activeSlide" class="slide-content-area">
          <!-- Slide Type Badge -->
          <div class="slide-badge" :class="slideBadgeClass">
            {{ slideBadgeText }}
          </div>

          <!-- HTML Content -->
          <div class="slide-html-content" v-html="activeSlide.content"></div>
        </div>

        <!-- Waiting Indicator -->
        <div v-if="lectureStore.isWaitingForAnimation" class="waiting-indicator">
          <div class="spinner"></div>
          <span class="waiting-text">Đang phát hoạt ảnh minh họa...</span>
        </div>

        <!-- Navigation -->
        <div class="nav-area">
          <!-- Pagination Dots -->
          <div class="pagination-dots">
            <button
              v-for="(slide, idx) in lectureStore.currentLecture?.slides ?? []"
              :key="slide.slideId"
              class="dot"
              :class="{
                'dot-active': idx === lectureStore.currentSlideIndex,
                'dot-visited': idx < lectureStore.currentSlideIndex,
              }"
              :disabled="lectureStore.isWaitingForAnimation"
              @click="lectureStore.goToSlide(idx)"
              :title="`Slide ${idx + 1}`"
            ></button>
          </div>

          <!-- Back / Next Buttons -->
          <div class="nav-buttons">
            <button
              class="nav-btn nav-btn-back"
              :disabled="lectureStore.isFirstSlide || lectureStore.isWaitingForAnimation"
              @click="lectureStore.prevSlide()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>Quay lại</span>
            </button>

            <button
              v-if="!lectureStore.isLastSlide"
              class="nav-btn nav-btn-next"
              @click="lectureStore.nextSlide()"
            >
              <span>{{ lectureStore.isWaitingForAnimation ? 'Bỏ qua' : 'Tiếp tục' }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            <button
              v-else
              class="nav-btn nav-btn-finish"
              @click="lectureStore.exitLecture()"
            >
              <span>Thoát Bài giảng</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useLectureStore } from '../store/useLectureStore';

const lectureStore = useLectureStore();

const activeSlide = computed(() => lectureStore.activeSlide);

const slideBadgeClass = computed(() => {
  if (!activeSlide.value) return '';
  switch (activeSlide.value.type) {
    case 'theory': return 'badge-theory';
    case 'guided-animation': return 'badge-animation';
    case 'interactive-check': return 'badge-interactive';
    default: return '';
  }
});

const slideBadgeText = computed(() => {
  if (!activeSlide.value) return '';
  switch (activeSlide.value.type) {
    case 'theory': return 'Lý thuyết';
    case 'guided-animation': return 'Hoạt họa dẫn dắt';
    case 'interactive-check': return 'Điểm kiểm tra';
    default: return '';
  }
});

function handleKeydown(e: KeyboardEvent): void {
  if (!lectureStore.isActive) return;

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      lectureStore.nextSlide();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      lectureStore.prevSlide();
      break;
    case 'Escape':
      e.preventDefault();
      lectureStore.exitLecture();
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.lecture-backdrop {
  position: absolute;
  inset: 0;
  z-index: 900;
  transition: background-color 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.backdrop-dimmed {
  background: rgba(15, 23, 42, 0.4);
}

.lecture-panel {
  position: absolute;
  top: 10%;
  left: 5%;
  width: 380px;
  min-height: 250px;
  padding: 20px;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3),
              0 10px 10px -5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.panel-visible {
  opacity: 1;
  transform: scale(1) translate(0, 0);
  pointer-events: auto;
}

.panel-minimized {
  opacity: 0.15;
  transform: scale(0.88) translate(-20px, 0);
  pointer-events: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: #06b6d4;
  width: 16px;
  height: 16px;
}

.header-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #06b6d4;
}

.slide-counter {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  padding: 2px 8px;
  border-radius: 6px;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: rgba(15, 23, 42, 0.6);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: #334155;
  color: #f1f5f9;
  border-color: #475569;
}

.lecture-title-row {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.lecture-title {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.4;
  margin: 0;
}

.slide-content-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.slide-badge {
  display: inline-flex;
  align-self: flex-start;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 10px;
  border-radius: 6px;
}

.badge-theory {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.badge-animation {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: #67e8f9;
}

.badge-interactive {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.slide-html-content {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.65;
}

.slide-html-content :deep(h3) {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 6px 0;
}

.slide-html-content :deep(p) {
  margin: 0 0 8px 0;
}

.slide-html-content :deep(b) {
  color: #e2e8f0;
  font-weight: 600;
}

.slide-html-content :deep(em) {
  color: #94a3b8;
  font-style: italic;
}

.slide-html-content :deep(ul) {
  margin: 4px 0 8px 0;
  padding-left: 18px;
}

.slide-html-content :deep(li) {
  margin-bottom: 4px;
}

.waiting-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-top-color: #06b6d4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.waiting-text {
  font-size: 12px;
  color: #67e8f9;
  font-weight: 500;
}

.nav-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.pagination-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #334155;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.dot:hover:not(:disabled) {
  background: #64748b;
  transform: scale(1.3);
}

.dot:disabled {
  cursor: not-allowed;
}

.dot-active {
  background: #06b6d4;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
  transform: scale(1.3);
}

.dot-visited {
  background: #475569;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid #334155;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-btn-back {
  background: rgba(15, 23, 42, 0.8);
  color: #94a3b8;
}

.nav-btn-back:hover:not(:disabled) {
  background: #1e293b;
  color: #f1f5f9;
}

.nav-btn-next {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
  color: #67e8f9;
  margin-left: auto;
}

.nav-btn-next:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.25);
  border-color: rgba(6, 182, 212, 0.5);
}

.nav-btn-finish {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
  margin-left: auto;
}

.nav-btn-finish:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: rgba(16, 185, 129, 0.5);
}

/* Transition animations */
.lecture-fade-enter-active,
.lecture-fade-leave-active {
  transition: opacity 0.35s ease;
}

.lecture-fade-enter-active .lecture-panel,
.lecture-fade-leave-active .lecture-panel {
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
              opacity 0.35s ease;
}

.lecture-fade-enter-from {
  opacity: 0;
}

.lecture-fade-enter-from .lecture-panel {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.lecture-fade-leave-to {
  opacity: 0;
}

.lecture-fade-leave-to .lecture-panel {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
