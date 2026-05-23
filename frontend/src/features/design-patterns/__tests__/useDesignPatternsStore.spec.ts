import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDesignPatternsStore } from '../store/useDesignPatternsStore';

describe('useDesignPatternsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initializeScenario', () => {
    it('should load Strategy Pattern scenario with correct nodes and links', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      expect(store.activePatternId).toBe('strategy-pattern');
      expect(store.nodes.length).toBe(4);
      expect(store.links.length).toBe(3);
      expect(store.activeScenarioTitle).toBe('Strategy Pattern');
      expect(store.activeStrategyTargetId).toBe('Bubble');
    });

    it('should load Observer Pattern scenario with 5 nodes', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('observer-pattern');

      expect(store.activePatternId).toBe('observer-pattern');
      expect(store.nodes.length).toBe(5);
      expect(store.links.length).toBe(4);
      expect(store.activeScenarioTitle).toBe('Observer Pattern');
    });

    it('should load DIP Sandbox scenario with 2 nodes', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('solid-dip');

      expect(store.activePatternId).toBe('solid-dip');
      expect(store.nodes.length).toBe(2);
      expect(store.links.length).toBe(1);
      expect(store.isDIPEnabled).toBe(false);
    });

    it('should reset observer notifying state on scenario switch', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('observer-pattern');
      store.triggerObserverNotify();
      expect(store.isObserverNotifying).toBe(true);

      store.initializeScenario('strategy-pattern');
      expect(store.isObserverNotifying).toBe(false);
    });

    it('should calculate path cache for all links', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      expect(store.pathCache.size).toBe(3);
    });
  });

  describe('switchStrategy', () => {
    it('should swap dependency target from Bubble to Quick', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      store.switchStrategy('Quick');
      expect(store.activeStrategyTargetId).toBe('Quick');

      const clientLink = store.links.find((l) => l.id === 'ClientToStrategy');
      expect(clientLink?.targetId).toBe('Quick');
    });

    it('should recalculate paths after strategy swap', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      const pathBefore = store.pathCache.get('ClientToStrategy');
      store.switchStrategy('Quick');
      const pathAfter = store.pathCache.get('ClientToStrategy');

      expect(pathBefore).toBeDefined();
      expect(pathAfter).toBeDefined();
      // Path should change because target node has different coordinates
      expect(pathBefore).not.toBe(pathAfter);
    });

    it('should not switch strategy when not in strategy-pattern mode', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('observer-pattern');

      store.switchStrategy('Quick');
      expect(store.activeStrategyTargetId).toBe('Bubble');
    });
  });

  describe('triggerObserverNotify', () => {
    it('should set isObserverNotifying to true for 2 seconds', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('observer-pattern');

      store.triggerObserverNotify();
      expect(store.isObserverNotifying).toBe(true);

      vi.advanceTimersByTime(2000);
      expect(store.isObserverNotifying).toBe(false);
    });

    it('should not trigger when not in observer-pattern mode', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      store.triggerObserverNotify();
      expect(store.isObserverNotifying).toBe(false);
    });
  });

  describe('toggleDIP', () => {
    it('should add IDatabase interface node when enabled', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('solid-dip');
      expect(store.nodes.length).toBe(2);

      store.toggleDIP();
      expect(store.isDIPEnabled).toBe(true);
      expect(store.nodes.length).toBe(3);
      expect(store.nodes.find((n) => n.id === 'IDatabase')).toBeDefined();
    });

    it('should replace links with decoupled structure when enabled', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('solid-dip');

      store.toggleDIP();
      expect(store.links.length).toBe(2);
      expect(store.links.find((l) => l.id === 'HighToInterface')).toBeDefined();
      expect(store.links.find((l) => l.id === 'LowToInterface')).toBeDefined();
    });

    it('should remove IDatabase when disabled', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('solid-dip');

      store.toggleDIP(); // enable
      store.toggleDIP(); // disable
      expect(store.isDIPEnabled).toBe(false);
      expect(store.nodes.length).toBe(2);
      expect(store.nodes.find((n) => n.id === 'IDatabase')).toBeUndefined();
    });

    it('should restore direct coupling link when disabled', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('solid-dip');

      store.toggleDIP(); // enable
      store.toggleDIP(); // disable
      expect(store.links.length).toBe(1);
      expect(store.links[0].id).toBe('DirectCoupling');
    });

    it('should not toggle when not in solid-dip mode', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      store.toggleDIP();
      expect(store.isDIPEnabled).toBe(false);
    });
  });

  describe('couplingIndexMetric', () => {
    it('should return 85 when DIP is disabled (highly coupled)', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('solid-dip');

      expect(store.couplingIndexMetric).toBe(85);
      expect(store.couplingLabel).toBe('RẤT CHẶT');
    });

    it('should return 20 when DIP is enabled (loosely coupled)', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('solid-dip');

      store.toggleDIP();
      expect(store.couplingIndexMetric).toBe(20);
      expect(store.couplingLabel).toBe('LỎNG LẺO');
    });

    it('should return 35 for non-DIP scenarios', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      expect(store.couplingIndexMetric).toBe(35);
    });
  });

  describe('handleNodeDrag', () => {
    it('should update node position and recalculate paths', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      const oldPath = store.pathCache.get('ClientToStrategy');
      store.handleNodeDrag('Client', 400, 100, 900, 600);

      const movedNode = store.nodes.find((n) => n.id === 'Client');
      expect(movedNode?.x).toBe(400);
      expect(movedNode?.y).toBe(100);

      const newPath = store.pathCache.get('ClientToStrategy');
      expect(newPath).not.toBe(oldPath);
    });
  });

  describe('cleanup', () => {
    it('should reset all state', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      store.cleanup();
      expect(store.nodes.length).toBe(0);
      expect(store.links.length).toBe(0);
      expect(store.pathCache.size).toBe(0);
      expect(store.isObserverNotifying).toBe(false);
      expect(store.isDIPEnabled).toBe(false);
    });
  });

  describe('nodeCount / linkCount', () => {
    it('should compute correct counts', () => {
      const store = useDesignPatternsStore();
      store.initializeScenario('strategy-pattern');

      expect(store.nodeCount).toBe(4);
      expect(store.linkCount).toBe(3);
    });
  });
});
