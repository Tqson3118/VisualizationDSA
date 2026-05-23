import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Algorithm, AlgorithmMetadata } from '../types/algorithm.types';
import { ALGORITHM_CATALOG } from '../services/algorithmCatalog';

export const useAlgorithmStore = defineStore('algorithm', () => {
  const algorithms = ref<Algorithm[]>([]);
  const currentAlgorithm = ref<Algorithm | null>(null);
  const metadata = ref<AlgorithmMetadata | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string>('');
  const searchQuery = ref<string>('');

  const filteredAlgorithms = computed<Algorithm[]>(() => {
    if (!searchQuery.value.trim()) return algorithms.value;
    const q = searchQuery.value.toLowerCase();
    return algorithms.value.filter(
      (a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q),
    );
  });

  const categories = computed<string[]>(() => {
    const cats = new Set(algorithms.value.map((a) => a.category));
    return Array.from(cats);
  });

  async function fetchAlgorithms(): Promise<void> {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch('/api/v1/algorithms');
      if (!response.ok) throw new Error('Không thể tải danh sách thuật toán từ máy chủ.');
      algorithms.value = await response.json();
    } catch {
      algorithms.value = ALGORITHM_CATALOG;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadAlgorithmDetails(algoId: string): Promise<void> {
    isLoading.value = true;
    error.value = '';

    const matched = algorithms.value.find((a) => a.id === algoId);
    if (matched) {
      currentAlgorithm.value = matched;
    }

    try {
      const response = await fetch(`/api/v1/algorithms/${algoId}/metadata`);
      if (!response.ok) throw new Error('Không thể tải siêu dữ liệu chi tiết của giải thuật.');
      metadata.value = await response.json();
    } catch {
      metadata.value = getLocalMetadata(algoId);
    } finally {
      isLoading.value = false;
    }
  }

  function selectAlgorithm(algo: Algorithm): void {
    currentAlgorithm.value = algo;
    metadata.value = getLocalMetadata(algo.id);
  }

  function clearActive(): void {
    currentAlgorithm.value = null;
    metadata.value = null;
    error.value = '';
  }

  function setSearchQuery(query: string): void {
    searchQuery.value = query;
  }

  return {
    algorithms,
    currentAlgorithm,
    metadata,
    isLoading,
    error,
    searchQuery,
    filteredAlgorithms,
    categories,
    fetchAlgorithms,
    loadAlgorithmDetails,
    selectAlgorithm,
    clearActive,
    setSearchQuery,
  };
});

function getLocalMetadata(algoId: string): AlgorithmMetadata | null {
  const meta = LOCAL_METADATA[algoId];
  return meta ?? null;
}

const LOCAL_METADATA: Record<string, AlgorithmMetadata> = {
  'bubble-sort': {
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description:
      'Bubble Sort so sánh hai phần tử liền kề và hoán đổi nếu chúng không đúng thứ tự. Lặp lại cho đến khi mảng được sắp xếp hoàn toàn.',
    pseudoCode: [
      'for i from 0 to N-1',
      '  for j from 0 to N-i-2',
      '    if A[j] > A[j+1]',
      '      swap(A[j], A[j+1])',
    ],
  },
  'selection-sort': {
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description:
      'Selection Sort tìm phần tử nhỏ nhất trong phần chưa sắp xếp và hoán đổi với phần tử đầu tiên của phần chưa sắp xếp.',
    pseudoCode: [
      'for i from 0 to N-1',
      '  minIdx = i',
      '  for j from i+1 to N-1',
      '    if A[j] < A[minIdx]',
      '      minIdx = j',
      '  swap(A[i], A[minIdx])',
    ],
  },
  'insertion-sort': {
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(1)',
    description:
      'Insertion Sort chèn từng phần tử vào đúng vị trí trong phần đã sắp xếp, giống cách sắp xếp bài trên tay.',
    pseudoCode: [
      'for i from 1 to N-1',
      '  key = A[i]',
      '  j = i - 1',
      '  while j >= 0 and A[j] > key',
      '    A[j+1] = A[j]; j--',
      '  A[j+1] = key',
    ],
  },
  'quick-sort': {
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(log N)',
    description:
      'Quick Sort chọn phần tử chốt (Pivot) và phân hoạch mảng thành hai nửa, sau đó đệ quy sắp xếp từng nửa.',
    pseudoCode: [
      'quickSort(A, low, high)',
      '  if low < high',
      '    pivotIdx = partition(A, low, high)',
      '    quickSort(A, low, pivotIdx - 1)',
      '    quickSort(A, pivotIdx + 1, high)',
    ],
  },
  'merge-sort': {
    timeComplexity: 'O(N log N)',
    spaceComplexity: 'O(N)',
    description:
      'Merge Sort chia mảng thành hai nửa đệ quy và trộn các nửa đã sắp xếp lại với nhau.',
    pseudoCode: [
      'mergeSort(A, left, right)',
      '  if left < right',
      '    mid = (left + right) / 2',
      '    mergeSort(A, left, mid)',
      '    mergeSort(A, mid+1, right)',
      '    merge(A, left, mid, right)',
    ],
  },
  'linear-search': {
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description:
      'Linear Search duyệt tuần tự từng phần tử trong mảng từ đầu đến cuối để tìm giá trị mục tiêu.',
    pseudoCode: [
      'linearSearch(A, target)',
      '  for i from 0 to N-1',
      '    if A[i] == target',
      '      return i',
      '  return -1',
    ],
  },
  'binary-search': {
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    description:
      'Binary Search chia đôi phạm vi tìm kiếm bằng cách so sánh giá trị giữa với target. Yêu cầu mảng đã sắp xếp.',
    pseudoCode: [
      'binarySearch(A, target)',
      '  low = 0, high = N-1',
      '  while low <= high',
      '    mid = (low + high) / 2',
      '    if A[mid] == target: return mid',
      '    else if A[mid] < target: low = mid + 1',
      '    else: high = mid - 1',
    ],
  },
  stack: {
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description:
      'Ngăn xếp (Stack) hoạt động theo nguyên tắc LIFO — Vào sau ra trước. Push đẩy vào đỉnh, Pop lấy ở đỉnh ra.',
    pseudoCode: [
      'stack = []',
      'push(value):',
      '  stack.append(value)',
      'pop():',
      '  return stack.removeLast()',
    ],
  },
  queue: {
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N)',
    description:
      'Hàng đợi (Queue) hoạt động theo nguyên tắc FIFO — Vào trước ra trước. Enqueue thêm vào cuối, Dequeue lấy ở đầu.',
    pseudoCode: [
      'queue = []',
      'enqueue(value):',
      '  queue.append(value)',
      'dequeue():',
      '  return queue.removeFirst()',
    ],
  },
  bst: {
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N)',
    description:
      'Cây tìm kiếm nhị phân (BST) lưu trữ dữ liệu sao cho node trái nhỏ hơn, node phải lớn hơn node cha.',
    pseudoCode: [
      'insert(root, value):',
      '  if root is null: return new Node(value)',
      '  if value < root.value:',
      '    root.left = insert(root.left, value)',
      '  else:',
      '    root.right = insert(root.right, value)',
      '  return root',
    ],
  },
};
