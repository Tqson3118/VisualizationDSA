/**
 * useLiveCompilerStore — Pinia Setup Store điều phối biên dịch AST → Worker → Canvas.
 *
 * Quản lý: sourceCode, trạng thái biên dịch, console logs,
 * tích hợp ASTInstrumentationEngine + WorkerLifecycleCoordinator,
 * nạp Frame kết quả vào useAnimationStore để Canvas vẽ hoạt ảnh.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAnimationStore } from '../../animation-engine/store/useAnimationStore';
import { compileAndInstrument } from '../engine/ASTInstrumentationEngine';
import {
  executeInSandbox,
  terminateActiveSession,
} from '../engine/WorkerLifecycleCoordinator';
import type { ConsoleLogEntry, LiveFrameDTO } from '../types/compiler.types';
import type { FrameDTO, AlgorithmResult } from '../../animation-engine/types/animation.types';

const DEFAULT_SOURCE_CODE = `function bubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}`;

const DEFAULT_INPUT_ARRAY = [5, 3, 8, 1, 9, 2, 7, 4, 6];

export const useLiveCompilerStore = defineStore('liveCompiler', () => {
  const animStore = useAnimationStore();

  // State
  const sourceCode = ref<string>(DEFAULT_SOURCE_CODE);
  const isCompiling = ref<boolean>(false);
  const compilerConsoleLogs = ref<ConsoleLogEntry[]>([]);
  const hasCompileError = ref<boolean>(false);
  const inputArray = ref<number[]>([...DEFAULT_INPUT_ARRAY]);

  // Actions

  function addConsoleLog(
    text: string,
    type: 'info' | 'success' | 'error' | 'warn' = 'info',
  ): void {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    compilerConsoleLogs.value.push({ text, type, timestamp });
  }

  function clearLogs(): void {
    compilerConsoleLogs.value = [];
  }

  function setSourceCode(code: string): void {
    sourceCode.value = code;
  }

  function setInputArray(arr: number[]): void {
    inputArray.value = [...arr];
  }

  /**
   * Biên dịch AST + chạy Sandbox + nạp Frame vào Canvas.
   */
  async function compileAndExecuteCode(): Promise<void> {
    if (isCompiling.value) return;

    isCompiling.value = true;
    hasCompileError.value = false;
    compilerConsoleLogs.value = [];

    addConsoleLog('Bắt đầu phân tích cú pháp AST...', 'info');

    // 1. Parse & instrument AST
    const compileResult = compileAndInstrument(sourceCode.value);

    if (!compileResult.success || !compileResult.instrumentedCode) {
      isCompiling.value = false;
      hasCompileError.value = true;
      const errorMsg = compileResult.error ?? 'Lỗi biên dịch không xác định.';
      const lineInfo = compileResult.errorLine
        ? ` (Dòng số ${compileResult.errorLine})`
        : '';
      addConsoleLog(`Biên dịch AST thất bại: ${errorMsg}${lineInfo}`, 'error');
      return;
    }

    addConsoleLog(
      'Phân tích AST thành công. Khởi chạy luồng Web Worker Sandbox...',
      'success',
    );

    // 2. Execute in Web Worker Sandbox
    try {
      const liveFrames = await executeInSandbox(
        compileResult.instrumentedCode,
        [...inputArray.value],
      );

      addConsoleLog(
        `Tạo vết thực thi thành công! Sinh ra ${liveFrames.length} bước hoạt ảnh.`,
        'success',
      );

      // 3. Convert LiveFrameDTO[] → FrameDTO[] for AnimationStore
      const animFrames = convertToAnimationFrames(liveFrames);
      const result: AlgorithmResult = {
        algorithmId: 'custom-code',
        pseudoCode: [],
        frames: animFrames,
      };
      animStore.loadResult(result);
      animStore.play();
    } catch (err: unknown) {
      hasCompileError.value = true;
      const errorMsg =
        err instanceof Error ? err.message : 'Lỗi thực thi Sandbox.';
      addConsoleLog(`Lỗi thực thi Sandbox: ${errorMsg}`, 'error');
    } finally {
      isCompiling.value = false;
    }
  }

  function cancelExecution(): void {
    terminateActiveSession();
    isCompiling.value = false;
    addConsoleLog('Đã hủy bỏ biên dịch.', 'warn');
  }

  return {
    sourceCode,
    isCompiling,
    compilerConsoleLogs,
    hasCompileError,
    inputArray,
    addConsoleLog,
    clearLogs,
    setSourceCode,
    setInputArray,
    compileAndExecuteCode,
    cancelExecution,
  };
});

/**
 * Chuyển đổi LiveFrameDTO[] sang FrameDTO[] tương thích useAnimationStore.
 */
function convertToAnimationFrames(liveFrames: LiveFrameDTO[]): FrameDTO[] {
  return liveFrames.map((lf, index) => {
    const highlights = {
      compare: lf.type === 'COMPARE' ? lf.indices : [],
      swap: lf.type === 'SWAP' ? lf.indices : [],
      sorted: lf.type === 'ACCESS' ? Array.from({ length: lf.arrayState.length }, (_, i) => i) : [],
    };

    let explanation = '';
    if (lf.type === 'COMPARE') {
      explanation = `So sánh phần tử tại vị trí [${lf.indices.join(', ')}]`;
    } else if (lf.type === 'SWAP') {
      explanation = `Gán trị phần tử tại vị trí [${lf.indices.join(', ')}]`;
    } else {
      explanation = 'Thuật toán hoàn thành — mảng đã được sắp xếp.';
    }

    return {
      stepId: index + 1,
      activeLine: 0,
      explanation,
      dataState: lf.arrayState,
      highlights,
      variables: lf.variables,
    };
  });
}
