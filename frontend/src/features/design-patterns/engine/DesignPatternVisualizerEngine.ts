/**
 * DesignPatternVisualizerEngine
 *
 * Core engine for UML class diagram visualization.
 * Manages node positions, calculates Cubic Bezier SVG paths,
 * and handles Strategy runtime swapping.
 */

import type { UMLNode, UMLLink } from '../types/design-patterns.types';

export class DesignPatternVisualizerEngine {
  private nodes: UMLNode[];
  private links: UMLLink[];

  constructor(initialNodes: UMLNode[], initialLinks: UMLLink[]) {
    this.nodes = initialNodes;
    this.links = initialLinks;
  }

  /**
   * Update node position when user drags on Canvas.
   * Clamps coordinates within canvas boundaries.
   */
  public updateNodePosition(
    nodeId: string,
    x: number,
    y: number,
    canvasWidth: number = 900,
    canvasHeight: number = 600,
  ): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const padding = 10;
    node.x = Math.max(padding, Math.min(x, canvasWidth - node.width - padding));
    node.y = Math.max(padding, Math.min(y, canvasHeight - node.height - padding));
  }

  /**
   * Calculate Cubic Bezier curve path between source and target nodes.
   * Returns SVG path string `M startX,startY C cp1X,cp1Y cp2X,cp2Y endX,endY`.
   */
  public calculateBezierPath(linkId: string): string {
    const link = this.links.find((l) => l.id === linkId);
    if (!link) return '';

    const source = this.nodes.find((n) => n.id === link.sourceId);
    const target = this.nodes.find((n) => n.id === link.targetId);
    if (!source || !target) return '';

    const startX = source.x + source.width / 2;
    const startY = source.y + source.height;

    const endX = target.x + target.width / 2;
    const endY = target.y;

    const deltaY = Math.abs(endY - startY);
    const controlOffset = Math.max(30, Math.min(100, deltaY * 0.5));

    const cp1X = startX;
    const cp1Y = startY + controlOffset;
    const cp2X = endX;
    const cp2Y = endY - controlOffset;

    return `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;
  }

  /**
   * Calculate all Bezier paths for current links.
   * Returns a Map of linkId → SVG path string.
   */
  public calculateAllPaths(): Map<string, string> {
    const paths = new Map<string, string>();
    for (const link of this.links) {
      paths.set(link.id, this.calculateBezierPath(link.id));
    }
    return paths;
  }

  /**
   * Swap Strategy dependency target at runtime.
   * Snaps the dependency link to a new target node.
   */
  public swapStrategyTarget(linkId: string, newTargetId: string): boolean {
    const link = this.links.find((l) => l.id === linkId);
    if (!link) return false;

    const targetExists = this.nodes.some((n) => n.id === newTargetId);
    if (!targetExists) return false;

    link.targetId = newTargetId;
    return true;
  }

  /**
   * Get all link IDs connected to a specific target node.
   */
  public getLinksToTarget(targetId: string): UMLLink[] {
    return this.links.filter((l) => l.targetId === targetId);
  }

  /**
   * Get all link IDs from a specific source node.
   */
  public getLinksFromSource(sourceId: string): UMLLink[] {
    return this.links.filter((l) => l.sourceId === sourceId);
  }

  public getNodes(): UMLNode[] {
    return this.nodes;
  }

  public getLinks(): UMLLink[] {
    return this.links;
  }

  public getNodeById(id: string): UMLNode | undefined {
    return this.nodes.find((n) => n.id === id);
  }

  /**
   * Replace all nodes and links (used when switching scenarios).
   */
  public replaceState(nodes: UMLNode[], links: UMLLink[]): void {
    this.nodes = nodes;
    this.links = links;
  }
}
