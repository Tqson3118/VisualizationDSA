import { describe, it, expect } from 'vitest';
import { ALGORITHM_CATALOG } from '../services/algorithmCatalog';

describe('algorithmCatalog', () => {
  it('contains exactly 10 algorithms', () => {
    expect(ALGORITHM_CATALOG.length).toBe(10);
  });

  it('all algorithms have required fields', () => {
    for (const algo of ALGORITHM_CATALOG) {
      expect(algo.id).toBeTruthy();
      expect(algo.name).toBeTruthy();
      expect(algo.category).toBeTruthy();
      expect(algo.difficulty).toBeTruthy();
      expect(algo.timeComplexity).toBeTruthy();
      expect(algo.spaceComplexity).toBeTruthy();
    }
  });

  it('has unique algorithm IDs', () => {
    const ids = ALGORITHM_CATALOG.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all 3 categories (Sorting has been removed)', () => {
    const categories = new Set(ALGORITHM_CATALOG.map((a) => a.category));
    expect(categories.has('Sorting')).toBe(false);
    expect(categories.has('Searching')).toBe(true);
    expect(categories.has('Stack-Queue')).toBe(true);
    expect(categories.has('Tree')).toBe(true);
  });

  it('has 3 searching algorithms', () => {
    const searching = ALGORITHM_CATALOG.filter((a) => a.category === 'Searching');
    expect(searching.length).toBe(3);
  });

  it('has 3 stack-queue algorithms', () => {
    const sq = ALGORITHM_CATALOG.filter((a) => a.category === 'Stack-Queue');
    expect(sq.length).toBe(3);
  });

  it('has 4 tree algorithms', () => {
    const tree = ALGORITHM_CATALOG.filter((a) => a.category === 'Tree');
    expect(tree.length).toBe(4);
  });
});
