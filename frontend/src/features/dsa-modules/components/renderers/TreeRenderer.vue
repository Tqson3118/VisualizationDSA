<template>
  <div ref="containerRef" class="w-full h-full bg-[#0F172A] relative">
    <canvas ref="canvasRef" class="w-full h-full block" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { FrameDTO, TreeNodeDTO } from '../../types/algorithm.types';

const props = defineProps<{
  frame: FrameDTO | null;
}>();

const NODE_RADIUS = 22;
const LEVEL_HEIGHT = 70;
const MARGIN_TOP = 50;

const COLOR_BG = '#0F172A';
const COLOR_NODE = '#1E293B';
const COLOR_BORDER = '#475569';
const COLOR_ACTIVE = '#FBBF24';
const COLOR_TEXT = '#FFFFFF';
const COLOR_EDGE = '#475569';

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

interface NodePosition {
  id: number;
  value: number;
  x: number;
  y: number;
  leftId: number | null;
  rightId: number | null;
}

function resizeCanvas(): void {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  renderCanvas();
}

function calculateNodePositions(
  treeNodes: TreeNodeDTO[],
  canvasWidth: number,
): NodePosition[] {
  if (treeNodes.length === 0) return [];

  const nodeMap = new Map<number, TreeNodeDTO>();
  for (const n of treeNodes) nodeMap.set(n.id, n);

  const childIds = new Set<number>();
  for (const n of treeNodes) {
    if (n.leftNodeId != null) childIds.add(n.leftNodeId);
    if (n.rightNodeId != null) childIds.add(n.rightNodeId);
  }
  const rootNode = treeNodes.find((n) => !childIds.has(n.id)) ?? treeNodes[0];

  const positions: NodePosition[] = [];

  function layout(nodeId: number, depth: number, xMin: number, xMax: number): void {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const x = (xMin + xMax) / 2;
    const y = MARGIN_TOP + depth * LEVEL_HEIGHT;

    positions.push({
      id: node.id,
      value: node.value,
      x,
      y,
      leftId: node.leftNodeId,
      rightId: node.rightNodeId,
    });

    if (node.leftNodeId != null) {
      layout(node.leftNodeId, depth + 1, xMin, x);
    }
    if (node.rightNodeId != null) {
      layout(node.rightNodeId, depth + 1, x, xMax);
    }
  }

  layout(rootNode.id, 0, 40, canvasWidth - 40);
  return positions;
}

function renderCanvas(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, w, h);

  const frame = props.frame;
  if (!frame || !frame.treeNodes || frame.treeNodes.length === 0) {
    if (!frame || frame.dataState.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cây BST rỗng', w / 2, h / 2);
    }
    return;
  }

  const positions = calculateNodePositions(frame.treeNodes, w);
  const posMap = new Map<number, NodePosition>();
  for (const p of positions) posMap.set(p.id, p);

  for (const pos of positions) {
    if (pos.leftId != null) {
      const child = posMap.get(pos.leftId);
      if (child) drawEdge(ctx, pos.x, pos.y, child.x, child.y);
    }
    if (pos.rightId != null) {
      const child = posMap.get(pos.rightId);
      if (child) drawEdge(ctx, pos.x, pos.y, child.x, child.y);
    }
  }

  for (const pos of positions) {
    const isActive = frame.highlights.active.includes(pos.id);
    drawNode(ctx, pos.x, pos.y, pos.value, isActive);
  }
}

function drawEdge(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const fromX = x1 + Math.cos(angle) * NODE_RADIUS;
  const fromY = y1 + Math.sin(angle) * NODE_RADIUS;
  const toX = x2 - Math.cos(angle) * NODE_RADIUS;
  const toY = y2 - Math.sin(angle) * NODE_RADIUS;

  ctx.strokeStyle = COLOR_EDGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  const arrowLen = 8;
  ctx.fillStyle = COLOR_EDGE;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowLen * Math.cos(angle - Math.PI / 6),
    toY - arrowLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - arrowLen * Math.cos(angle + Math.PI / 6),
    toY - arrowLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.fill();
}

function drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, isActive: boolean): void {
  ctx.beginPath();
  ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? COLOR_ACTIVE : COLOR_NODE;
  ctx.fill();
  ctx.strokeStyle = isActive ? COLOR_ACTIVE : COLOR_BORDER;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = isActive ? '#0F172A' : COLOR_TEXT;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}

watch(() => props.frame, renderCanvas, { deep: true });

onMounted(() => {
  resizeObserver = new ResizeObserver(resizeCanvas);
  if (containerRef.value) resizeObserver.observe(containerRef.value);
  resizeCanvas();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>
