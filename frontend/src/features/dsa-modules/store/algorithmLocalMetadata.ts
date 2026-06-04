import type { AlgorithmMetadata } from '../types/algorithm.types';

export const LOCAL_METADATA: Record<string, AlgorithmMetadata> = {
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
  'sliding-window': {
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    description:
      'Cửa sổ trượt (Sliding Window) duy trì một phạm vi phần tử liên tiếp (cửa sổ) và di chuyển nó dọc theo mảng để tính toán hiệu quả các bài toán mảng con. Ví dụ này tìm tổng lớn nhất của cửa sổ kích thước K = 3.',
    pseudoCode: [
      'slidingWindow(A, K):',
      '  left = 0, currentSum = 0, maxSum = 0',
      '  for right from 0 to N-1:',
      '    currentSum += A[right]',
      '    if right - left + 1 > K:',
      '      currentSum -= A[left]',
      '      left++',
      '    maxSum = max(maxSum, currentSum)',
      '  return maxSum',
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
  'monotonic-stack': {
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    description:
      'Ngăn xếp đơn điệu (Monotonic Stack) duy trì các phần tử tăng dần hoặc giảm dần để giải quyết hiệu quả các bài toán như "Tìm phần tử lớn hơn tiếp theo" (Next Greater Element) trong thời gian tuyến tính O(N).',
    pseudoCode: [
      'nextGreaterElement(A):',
      '  stack = []',
      '  res = [-1 for _ in A]',
      '  for i from 0 to N-1:',
      '    while stack is not empty and A[stack.top()] < A[i]:',
      '      idx = stack.pop()',
      '      res[idx] = A[i]',
      '    stack.push(i)',
      '  return res',
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
  bfs: {
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description:
      'Duyệt theo chiều rộng (BFS) đi qua các đỉnh của đồ thị/cây theo từng lớp (chiều rộng). Sử dụng Hàng đợi (Queue) để điều phối thứ tự duyệt.',
    pseudoCode: [
      'BFS(root):',
      '  queue = [root]',
      '  visited = {root}',
      '  while queue is not empty:',
      '    curr = queue.dequeue()',
      '    for neighbor in curr.neighbors:',
      '      if neighbor not in visited:',
      '        visited.add(neighbor)',
      '        queue.enqueue(neighbor)',
    ],
  },
  dfs: {
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description:
      'Duyệt theo chiều sâu (DFS) bắt đầu từ gốc, đi sâu hết mức có thể dọc theo mỗi nhánh trước khi quay lui (backtrack). Sử dụng Ngăn xếp (Stack) hoặc Đệ quy.',
    pseudoCode: [
      'DFS(node, visited):',
      '  visited.add(node)',
      '  for neighbor in node.neighbors:',
      '    if neighbor not in visited:',
      '      DFS(neighbor, visited)',
    ],
  },
  dijkstra: {
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    description:
      'Thuật toán Dijkstra tìm đường đi ngắn nhất từ đỉnh nguồn (nút gốc) đến tất cả các đỉnh khác trên đồ thị có trọng số. Mỗi cạnh trái có trọng số = 3, cạnh phải = 5.',
    pseudoCode: [
      'Dijkstra(graph, source):',
      '  dist = {v: infinity for v in graph}',
      '  dist[source] = 0',
      '  pq = PriorityQueue(source, 0)',
      '  while pq is not empty:',
      '    curr, d = pq.popMin()',
      '    for neighbor, weight in curr.edges:',
      '      newDist = d + weight',
      '      if newDist < dist[neighbor]:',
      '        dist[neighbor] = newDist',
      '        pq.push(neighbor, newDist)',
    ],
  },
};
