export interface TabItem {
  readonly id: string;
  readonly path: string;
  readonly name: string;
}

export interface TabGroup {
  readonly groupName: string;
  readonly items: readonly TabItem[];
}

export const APP_TABS: readonly (TabGroup | TabItem)[] = [
  {
    groupName: 'Algorithms',
    items: [
      { id: 'sorting',  path: '/sorting',  name: 'Sorting' },
      { id: 'graph',    path: '/graph',    name: 'Graph' },
      { id: 'code-ide', path: '/code-ide', name: 'Code Debugger' }
    ]
  },
  {
    groupName: 'Concepts',
    items: [
      { id: 'oop',      path: '/oop',      name: 'OOP Viz' },
      { id: 'solid',    path: '/solid',    name: 'SOLID Viz' },
      { id: 'patterns', path: '/patterns', name: 'Patterns' },
      { id: 'di',       path: '/di',       name: 'DI/IoC' },
      { id: 'system',   path: '/system',   name: 'System Design' }
    ]
  },
] as const;
