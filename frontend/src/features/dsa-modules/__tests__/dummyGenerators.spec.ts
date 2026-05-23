import { describe, it, expect } from 'vitest';
import { generateDummyResult } from '../services/dummyGenerators';

describe('dummyGenerators', () => {
  describe('Bubble Sort', () => {
    it('generates frames with correct algorithm id', () => {
      const result = generateDummyResult('bubble-sort', [5, 3, 1]);
      expect(result.algorithmId).toBe('bubble-sort');
      expect(result.frames.length).toBeGreaterThan(0);
      expect(result.pseudoCode.length).toBeGreaterThan(0);
    });

    it('final frame has sorted array', () => {
      const result = generateDummyResult('bubble-sort', [5, 3, 1]);
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.dataState).toEqual([1, 3, 5]);
    });

    it('frames have stepId incrementing', () => {
      const result = generateDummyResult('bubble-sort', [3, 1, 2]);
      for (let i = 0; i < result.frames.length; i++) {
        expect(result.frames[i].stepId).toBe(i + 1);
      }
    });
  });

  describe('Selection Sort', () => {
    it('sorts correctly', () => {
      const result = generateDummyResult('selection-sort', [4, 2, 7, 1]);
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.dataState).toEqual([1, 2, 4, 7]);
    });
  });

  describe('Insertion Sort', () => {
    it('sorts correctly', () => {
      const result = generateDummyResult('insertion-sort', [8, 3, 5, 1]);
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.dataState).toEqual([1, 3, 5, 8]);
    });
  });

  describe('Quick Sort', () => {
    it('sorts correctly', () => {
      const result = generateDummyResult('quick-sort', [6, 2, 9, 3, 1]);
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.dataState).toEqual([1, 2, 3, 6, 9]);
    });

    it('has pivot highlights in some frames', () => {
      const result = generateDummyResult('quick-sort', [5, 3, 8, 1]);
      const pivotFrames = result.frames.filter((f) => f.highlights.pivot != null);
      expect(pivotFrames.length).toBeGreaterThan(0);
    });
  });

  describe('Merge Sort', () => {
    it('sorts correctly', () => {
      const result = generateDummyResult('merge-sort', [8, 3, 5, 1, 9]);
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.dataState).toEqual([1, 3, 5, 8, 9]);
    });
  });

  describe('Linear Search', () => {
    it('finds target (last element is target)', () => {
      const result = generateDummyResult('linear-search', [5, 3, 8, 1, 3]);
      expect(result.algorithmId).toBe('linear-search');
      const foundFrames = result.frames.filter((f) => f.highlights.found != null);
      expect(foundFrames.length).toBe(1);
    });

    it('handles not found case', () => {
      const result = generateDummyResult('linear-search', [5, 3, 8, 1, 99]);
      const foundFrames = result.frames.filter((f) => f.highlights.found != null);
      expect(foundFrames.length).toBe(0);
    });
  });

  describe('Binary Search', () => {
    it('finds target in sorted array', () => {
      const result = generateDummyResult('binary-search', [1, 3, 5, 8, 12, 5]);
      expect(result.algorithmId).toBe('binary-search');
      const foundFrames = result.frames.filter((f) => f.highlights.found != null);
      expect(foundFrames.length).toBe(1);
    });

    it('has low/mid/high pointers', () => {
      const result = generateDummyResult('binary-search', [1, 3, 5, 8, 12, 5]);
      const pointerFrames = result.frames.filter((f) => f.highlights.mid != null);
      expect(pointerFrames.length).toBeGreaterThan(0);
    });
  });

  describe('Stack', () => {
    it('generates push and pop operations', () => {
      const result = generateDummyResult('stack', [10, 20, 30]);
      expect(result.algorithmId).toBe('stack');
      expect(result.frames.length).toBeGreaterThan(3);

      const pushFrames = result.frames.filter((f) => f.explanation.includes('Push'));
      expect(pushFrames.length).toBe(3);
    });

    it('final frame has empty data', () => {
      const result = generateDummyResult('stack', [10, 20]);
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.dataState).toEqual([]);
    });
  });

  describe('Queue', () => {
    it('generates enqueue and dequeue operations', () => {
      const result = generateDummyResult('queue', [10, 20, 30]);
      expect(result.algorithmId).toBe('queue');

      const enqueueFrames = result.frames.filter((f) => f.explanation.includes('Enqueue'));
      expect(enqueueFrames.length).toBe(3);
    });

    it('final frame has empty data', () => {
      const result = generateDummyResult('queue', [10, 20]);
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.dataState).toEqual([]);
    });
  });

  describe('BST', () => {
    it('generates tree nodes', () => {
      const result = generateDummyResult('bst', [50, 30, 70]);
      expect(result.algorithmId).toBe('bst');
      const lastFrame = result.frames[result.frames.length - 1];
      expect(lastFrame.treeNodes).toBeDefined();
      expect(lastFrame.treeNodes!.length).toBe(3);
    });

    it('tree structure has correct parent-child relationships', () => {
      const result = generateDummyResult('bst', [50, 30, 70]);
      const lastFrame = result.frames[result.frames.length - 1];
      const root = lastFrame.treeNodes!.find((n) => n.value === 50);
      expect(root).toBeDefined();
      expect(root!.leftNodeId).not.toBeNull();
      expect(root!.rightNodeId).not.toBeNull();
    });
  });

  describe('Unknown algorithm', () => {
    it('returns fallback result', () => {
      const result = generateDummyResult('unknown-algo', [1, 2, 3]);
      expect(result.algorithmId).toBe('unknown-algo');
      expect(result.frames.length).toBe(1);
    });
  });
});
