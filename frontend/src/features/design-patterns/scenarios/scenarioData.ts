/**
 * Predefined UML scenario data for the Design Patterns Visualizer.
 * Three scenarios: Strategy Pattern, Observer Pattern, DIP Sandbox.
 */

import type { UMLScenarioPayload, PatternScenarioId } from '../types/design-patterns.types';

const strategyPatternScenario: UMLScenarioPayload = {
  patternId: 'strategy-pattern',
  title: 'Strategy Pattern',
  description: 'Hoán đổi thuật toán sắp xếp tại runtime — đường liên kết phụ thuộc snap sang Strategy mới.',
  nodes: [
    { id: 'Client', name: 'SorterClient', type: 'class', x: 200, y: 50, width: 160, height: 70, attributes: ['- strategy: ISortStrategy'], methods: ['+ sort(data): void'] },
    { id: 'Strategy', name: 'ISortStrategy', type: 'interface', x: 200, y: 200, width: 160, height: 60, attributes: [], methods: ['+ execute(data): void'] },
    { id: 'Bubble', name: 'BubbleSort', type: 'class', x: 80, y: 360, width: 140, height: 60, attributes: [], methods: ['+ execute(data): void'] },
    { id: 'Quick', name: 'QuickSort', type: 'class', x: 300, y: 360, width: 140, height: 60, attributes: [], methods: ['+ execute(data): void'] },
  ],
  links: [
    { id: 'ClientToStrategy', sourceId: 'Client', targetId: 'Strategy', type: 'dependency' },
    { id: 'BubbleToStrategy', sourceId: 'Bubble', targetId: 'Strategy', type: 'realization' },
    { id: 'QuickToStrategy', sourceId: 'Quick', targetId: 'Strategy', type: 'realization' },
  ],
};

const observerPatternScenario: UMLScenarioPayload = {
  patternId: 'observer-pattern',
  title: 'Observer Pattern',
  description: 'Subject gửi tín hiệu Notify — tia sáng Neon lan tỏa đồng loạt tới các Observer.',
  nodes: [
    { id: 'Subject', name: 'NewsPublisher', type: 'class', x: 220, y: 50, width: 160, height: 70, attributes: ['- observers: IObserver[]'], methods: ['+ notify(): void'] },
    { id: 'IObserver', name: 'IObserver', type: 'interface', x: 220, y: 200, width: 160, height: 60, attributes: [], methods: ['+ update(data): void'] },
    { id: 'ObsA', name: 'EmailSubscriber', type: 'class', x: 40, y: 360, width: 150, height: 60, attributes: [], methods: ['+ update(data): void'] },
    { id: 'ObsB', name: 'SMSSubscriber', type: 'class', x: 220, y: 360, width: 150, height: 60, attributes: [], methods: ['+ update(data): void'] },
    { id: 'ObsC', name: 'AppSubscriber', type: 'class', x: 400, y: 360, width: 150, height: 60, attributes: [], methods: ['+ update(data): void'] },
  ],
  links: [
    { id: 'SubjectToObserver', sourceId: 'Subject', targetId: 'IObserver', type: 'association' },
    { id: 'ObsAToInterface', sourceId: 'ObsA', targetId: 'IObserver', type: 'realization' },
    { id: 'ObsBToInterface', sourceId: 'ObsB', targetId: 'IObserver', type: 'realization' },
    { id: 'ObsCToInterface', sourceId: 'ObsC', targetId: 'IObserver', type: 'realization' },
  ],
};

const solidDipScenario: UMLScenarioPayload = {
  patternId: 'solid-dip',
  title: 'SOLID — DIP Sandbox',
  description: 'Bật/Tắt DIP Mode để thấy Interface tách rời khớp nối cứng giữa Module cấp cao và cấp thấp.',
  nodes: [
    { id: 'HighModule', name: 'ReportingService', type: 'class', x: 200, y: 50, width: 180, height: 70, attributes: ['- db: SupabaseDatabase'], methods: ['+ generateReport(): void'] },
    { id: 'LowModule', name: 'SupabaseDatabase', type: 'class', x: 200, y: 360, width: 180, height: 70, attributes: ['- connectionString: string'], methods: ['+ query(sql): ResultSet'] },
  ],
  links: [
    { id: 'DirectCoupling', sourceId: 'HighModule', targetId: 'LowModule', type: 'dependency' },
  ],
};

const scenarioRegistry = new Map<PatternScenarioId, UMLScenarioPayload>([
  ['strategy-pattern', strategyPatternScenario],
  ['observer-pattern', observerPatternScenario],
  ['solid-dip', solidDipScenario],
]);

export function getScenario(patternId: PatternScenarioId): UMLScenarioPayload | null {
  return scenarioRegistry.get(patternId) ?? null;
}

export function getAllScenarioIds(): PatternScenarioId[] {
  return Array.from(scenarioRegistry.keys());
}

export const SCENARIO_LABELS: Record<PatternScenarioId, string> = {
  'strategy-pattern': 'Strategy Pattern',
  'observer-pattern': 'Observer Pattern',
  'solid-dip': 'DIP Sandbox',
};
