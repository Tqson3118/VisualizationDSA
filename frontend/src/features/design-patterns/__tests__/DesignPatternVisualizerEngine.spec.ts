import { describe, it, expect, beforeEach } from 'vitest';
import { DesignPatternVisualizerEngine } from '../engine/DesignPatternVisualizerEngine';
import type { UMLNode, UMLLink } from '../types/design-patterns.types';

describe('DesignPatternVisualizerEngine', () => {
  let engine: DesignPatternVisualizerEngine;
  let nodeA: UMLNode;
  let nodeB: UMLNode;
  let link: UMLLink;

  beforeEach(() => {
    nodeA = { id: 'N1', name: 'SorterClient', type: 'class', x: 100, y: 100, width: 100, height: 50 };
    nodeB = { id: 'N2', name: 'ISortStrategy', type: 'interface', x: 100, y: 300, width: 100, height: 50 };
    link = { id: 'L1', sourceId: 'N1', targetId: 'N2', type: 'dependency' };
    engine = new DesignPatternVisualizerEngine([nodeA, nodeB], [link]);
  });

  describe('calculateBezierPath', () => {
    it('should calculate correct Cubic Bezier path between two nodes', () => {
      const path = engine.calculateBezierPath('L1');
      // Source bottom center: (100+50=150, 100+50=150)
      // Target top center: (100+50=150, 300)
      expect(path).toContain('M 150,150');
      expect(path).toContain('150,300');
    });

    it('should return empty string for non-existent link', () => {
      expect(engine.calculateBezierPath('FAKE')).toBe('');
    });

    it('should calculate control offset based on deltaY', () => {
      const path = engine.calculateBezierPath('L1');
      // deltaY = |300 - 150| = 150, controlOffset = min(100, 75) = 75
      expect(path).toContain('C 150,225 150,225 150,300');
    });

    it('should clamp minimum control offset to 30', () => {
      const closeNodeA: UMLNode = { id: 'CA', name: 'A', type: 'class', x: 100, y: 100, width: 100, height: 50 };
      const closeNodeB: UMLNode = { id: 'CB', name: 'B', type: 'class', x: 100, y: 160, width: 100, height: 50 };
      const closeLink: UMLLink = { id: 'CL', sourceId: 'CA', targetId: 'CB', type: 'dependency' };
      const closeEngine = new DesignPatternVisualizerEngine([closeNodeA, closeNodeB], [closeLink]);

      const path = closeEngine.calculateBezierPath('CL');
      // deltaY = |160 - 150| = 10, controlOffset = max(30, min(100, 5)) = 30
      expect(path).toContain('M 150,150');
      // cp1Y = 150+30=180, cp2Y = 160-30=130
      expect(path).toContain('C 150,180 150,130 150,160');
    });

    it('should cap controlOffset at 100 for large deltaY', () => {
      const farNodeB: UMLNode = { id: 'FB', name: 'B', type: 'class', x: 100, y: 600, width: 100, height: 50 };
      const farLink: UMLLink = { id: 'FL', sourceId: 'N1', targetId: 'FB', type: 'dependency' };
      const farEngine = new DesignPatternVisualizerEngine([nodeA, farNodeB], [farLink]);

      const path = farEngine.calculateBezierPath('FL');
      // deltaY = |600 - 150| = 450, controlOffset = min(100, 225) = 100
      expect(path).toContain('C 150,250 150,500 150,600');
    });
  });

  describe('calculateAllPaths', () => {
    it('should return a Map with paths for all links', () => {
      const paths = engine.calculateAllPaths();
      expect(paths.size).toBe(1);
      expect(paths.has('L1')).toBe(true);
      expect(paths.get('L1')).toContain('M 150,150');
    });
  });

  describe('updateNodePosition', () => {
    it('should update node coordinates', () => {
      engine.updateNodePosition('N1', 200, 200);
      const updated = engine.getNodeById('N1');
      expect(updated?.x).toBe(200);
      expect(updated?.y).toBe(200);
    });

    it('should clamp node position within canvas boundaries', () => {
      engine.updateNodePosition('N1', -50, -50, 900, 600);
      const node = engine.getNodeById('N1');
      expect(node?.x).toBe(10); // padding
      expect(node?.y).toBe(10);
    });

    it('should clamp maximum position', () => {
      engine.updateNodePosition('N1', 1000, 1000, 900, 600);
      const node = engine.getNodeById('N1');
      // maxX = 900 - 100 - 10 = 790, maxY = 600 - 50 - 10 = 540
      expect(node?.x).toBe(790);
      expect(node?.y).toBe(540);
    });

    it('should ignore non-existent node', () => {
      engine.updateNodePosition('FAKE', 200, 200);
      expect(engine.getNodes().length).toBe(2);
    });
  });

  describe('swapStrategyTarget', () => {
    it('should swap link target to a new node', () => {
      const nodeC: UMLNode = { id: 'N3', name: 'QuickSort', type: 'class', x: 300, y: 300, width: 100, height: 50 };
      const strategyEngine = new DesignPatternVisualizerEngine([nodeA, nodeB, nodeC], [link]);

      const success = strategyEngine.swapStrategyTarget('L1', 'N3');
      expect(success).toBe(true);
      expect(strategyEngine.getLinks()[0].targetId).toBe('N3');
    });

    it('should return false for non-existent link', () => {
      expect(engine.swapStrategyTarget('FAKE', 'N2')).toBe(false);
    });

    it('should return false if target node does not exist', () => {
      expect(engine.swapStrategyTarget('L1', 'NONEXISTENT')).toBe(false);
    });
  });

  describe('getLinksToTarget / getLinksFromSource', () => {
    it('should find all links to a target', () => {
      const linksToN2 = engine.getLinksToTarget('N2');
      expect(linksToN2.length).toBe(1);
      expect(linksToN2[0].id).toBe('L1');
    });

    it('should find all links from a source', () => {
      const linksFromN1 = engine.getLinksFromSource('N1');
      expect(linksFromN1.length).toBe(1);
    });

    it('should return empty for non-existent node', () => {
      expect(engine.getLinksToTarget('FAKE').length).toBe(0);
    });
  });

  describe('replaceState', () => {
    it('should replace all nodes and links', () => {
      const newNodes: UMLNode[] = [
        { id: 'X', name: 'X', type: 'class', x: 0, y: 0, width: 80, height: 40 },
      ];
      const newLinks: UMLLink[] = [];
      engine.replaceState(newNodes, newLinks);

      expect(engine.getNodes().length).toBe(1);
      expect(engine.getLinks().length).toBe(0);
      expect(engine.getNodes()[0].id).toBe('X');
    });
  });

  describe('getNodeById', () => {
    it('should return the correct node', () => {
      expect(engine.getNodeById('N1')?.name).toBe('SorterClient');
    });

    it('should return undefined for non-existent id', () => {
      expect(engine.getNodeById('FAKE')).toBeUndefined();
    });
  });
});
