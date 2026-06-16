<template>
  <div class="code-editor-card backdrop-blur-md border border-border-subtle/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5 h-full">
    <CodeEditorPresetTabs
      :presets="PRESETS"
      :active-preset="activePreset"
      @select="loadPreset"
    />
    <CodeEditorApiHints />
    <div class="flex-1 relative flex flex-col min-h-0 editor-wrapper rounded-xl border border-border-subtle overflow-hidden">
      <div v-if="editorLoadError" class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-bg-surface/30">
        <span class="text-2xl mb-2">⚠️</span>
        <p class="text-xs font-semibold text-text-primary mb-1">Không thể tải Monaco Editor</p>
        <p class="text-[10px] text-text-secondary mb-4 max-w-xs leading-normal font-sans">
          Lỗi do xung đột tối ưu hóa module hoặc kết nối. Hãy reload lại trang.
        </p>
        <button @click="reloadPage" class="px-3 py-1.5 rounded-lg text-xs bg-accent/25 text-accent border border-accent/30 hover:bg-accent/40 transition-colors font-sans cursor-pointer">
          Tải lại trang (F5)
        </button>
      </div>
      <div v-else ref="editorContainer" class="w-full h-full"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import loader from "@monaco-editor/loader";
import { useVcrStore } from "../../vcr-player/store/useVcrStore";
import { MonacoLineSyncerCoordinator } from "../../algorithm-sandbox/engine/MonacoLineSyncerCoordinator";
import CodeEditorPresetTabs from "./CodeEditorPresetTabs.vue";
import CodeEditorApiHints from "./CodeEditorApiHints.vue";

const vcrStore = useVcrStore();
const editorContainer = ref<HTMLDivElement | null>(null);
const editorLoadError = ref(false);

function reloadPage() {
  window.location.reload();
}

let editorInstance: any = null;
let syncerCoordinator: MonacoLineSyncerCoordinator | null = null;

const activePreset = ref<"bubble" | "selection" | "insertion">("bubble");

const PRESETS = {
  bubble: {
    name: "Sắp xếp nổi bọt (Bubble Sort)",
    code: `// Thuật toán Sắp xếp nổi bọt
for (let i = 0; i < array.length - 1; i++) {
  for (let j = 0; j < array.length - i - 1; j++) {
    compare(j, j + 1);
    if (array[j] > array[j + 1]) {
      swap(j, j + 1);
    }
  }
  highlight(array.length - i - 1);
}
highlight(0);`,
  },
  selection: {
    name: "Sắp xếp chọn (Selection Sort)",
    code: `// Thuật toán Sắp xếp chọn
for (let i = 0; i < array.length - 1; i++) {
  let minIdx = i;
  for (let j = i + 1; j < array.length; j++) {
    compare(minIdx, j);
    if (array[j] < array[minIdx]) { minIdx = j; }
  }
  if (minIdx !== i) { swap(i, minIdx); }
  highlight(i);
}
highlight(array.length - 1);`,
  },
  insertion: {
    name: "Sắp xếp chèn (Insertion Sort)",
    code: `// Thuật toán Sắp xếp chèn
highlight(0);
for (let i = 1; i < array.length; i++) {
  let j = i;
  while (j > 0) {
    compare(j - 1, j);
    if (array[j] < array[j - 1]) { swap(j - 1, j); j--; }
    else { break; }
  }
  for (let k = 0; k <= i; k++) { highlight(k); }
}`,
  },
};

onMounted(async () => {
  let monaco;
  try {
    monaco = await loader.init();
  } catch (err) {
    console.error('Monaco load failed in code editor:', err);
    editorLoadError.value = true;
    return;
  }
  if (!editorContainer.value) return;
  editorInstance = monaco.editor.create(editorContainer.value, {
    value: vcrStore.code, language: "javascript", theme: "vs-dark",
    automaticLayout: true, fontSize: 14, lineNumbers: "on",
    minimap: { enabled: false }, scrollBeyondLastLine: false,
    cursorBlinking: "smooth", cursorSmoothCaretAnimation: "on",
    padding: { top: 12, bottom: 12 },
    fontFamily: "JetBrains Mono, Fira Code, monospace",
    scrollbar: { vertical: "visible", horizontal: "visible", verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  });
  editorInstance.onDidChangeModelContent(() => { vcrStore.code = editorInstance.getValue(); });
  syncerCoordinator = new MonacoLineSyncerCoordinator(editorInstance, vcrStore);
});

onBeforeUnmount(() => {
  syncerCoordinator?.destroy();
  editorInstance?.dispose();
});

function loadPreset(key: string): void {
  if (key !== "bubble" && key !== "selection" && key !== "insertion") return;
  activePreset.value = key;
  const newCode = PRESETS[key].code;
  vcrStore.code = newCode;
  editorInstance?.setValue(newCode);
  vcrStore.compileAndLoad();
}
</script>

<style scoped>
.code-editor-card {
  background-color: color-mix(in srgb, var(--vis-panel-bg) 70%, transparent);
}
.editor-wrapper {
  background-color: var(--color-bg-primary);
}
</style>

