import { describe, it, expect } from 'vitest';
import { getScenario, getAllScenarioIds, SCENARIO_LABELS } from '../scenarios/scenarioData';
import type { PatternScenarioId } from '../types/design-patterns.types';

describe('scenarioData', () => {
  describe('getScenario', () => {
    it('should return Strategy Pattern scenario with 4 nodes and 3 links', () => {
      const scenario = getScenario('strategy-pattern');
      expect(scenario).not.toBeNull();
      expect(scenario?.patternId).toBe('strategy-pattern');
      expect(scenario?.nodes.length).toBe(4);
      expect(scenario?.links.length).toBe(3);
      expect(scenario?.title).toBe('Strategy Pattern');
    });

    it('should return Observer Pattern scenario with 5 nodes and 4 links', () => {
      const scenario = getScenario('observer-pattern');
      expect(scenario).not.toBeNull();
      expect(scenario?.nodes.length).toBe(5);
      expect(scenario?.links.length).toBe(4);
    });

    it('should return DIP scenario with 2 nodes and 1 link', () => {
      const scenario = getScenario('solid-dip');
      expect(scenario).not.toBeNull();
      expect(scenario?.nodes.length).toBe(2);
      expect(scenario?.links.length).toBe(1);
    });

    it('should return null for non-existent scenario', () => {
      expect(getScenario('non-existent' as PatternScenarioId)).toBeNull();
    });

    it('should include attributes and methods in Strategy nodes', () => {
      const scenario = getScenario('strategy-pattern');
      const client = scenario?.nodes.find((n) => n.id === 'Client');
      expect(client?.attributes).toContain('- strategy: ISortStrategy');
      expect(client?.methods).toContain('+ sort(data): void');
    });

    it('should have interface type for ISortStrategy node', () => {
      const scenario = getScenario('strategy-pattern');
      const iface = scenario?.nodes.find((n) => n.id === 'Strategy');
      expect(iface?.type).toBe('interface');
    });

    it('should have dependency link from Client to Strategy', () => {
      const scenario = getScenario('strategy-pattern');
      const depLink = scenario?.links.find((l) => l.id === 'ClientToStrategy');
      expect(depLink?.type).toBe('dependency');
      expect(depLink?.sourceId).toBe('Client');
      expect(depLink?.targetId).toBe('Strategy');
    });

    it('should have realization links from concrete sorts to ISortStrategy', () => {
      const scenario = getScenario('strategy-pattern');
      const bubbleLink = scenario?.links.find((l) => l.id === 'BubbleToStrategy');
      expect(bubbleLink?.type).toBe('realization');
      const quickLink = scenario?.links.find((l) => l.id === 'QuickToStrategy');
      expect(quickLink?.type).toBe('realization');
    });
  });

  describe('getAllScenarioIds', () => {
    it('should return 3 scenario IDs', () => {
      const ids = getAllScenarioIds();
      expect(ids.length).toBe(3);
      expect(ids).toContain('strategy-pattern');
      expect(ids).toContain('observer-pattern');
      expect(ids).toContain('solid-dip');
    });
  });

  describe('SCENARIO_LABELS', () => {
    it('should have labels for all scenarios', () => {
      expect(SCENARIO_LABELS['strategy-pattern']).toBe('Strategy Pattern');
      expect(SCENARIO_LABELS['observer-pattern']).toBe('Observer Pattern');
      expect(SCENARIO_LABELS['solid-dip']).toBe('DIP Sandbox');
    });
  });
});
