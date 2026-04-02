import { describe, it, expect } from 'vitest';
import { computeGhostMetrics, buildSpendingAwarenessSuggestions } from './ghost.service';

describe('computeGhostMetrics', () => {
  it('returns zero gap when no expenses', () => {
    const m = computeGhostMetrics([], [{ amount: 1000 }]);
    expect(m.realBalance).toBe(1000);
    expect(m.ghostBalance).toBe(1000);
    expect(m.totalGap).toBe(0);
  });

  it('computes real vs ghost when expenses exist', () => {
    const m = computeGhostMetrics(
      [
        { amount: 100, category: 'Entertainment' },
        { amount: 200, category: 'Rent' },
      ],
      [{ amount: 5000 }]
    );
    expect(m.totalExpense).toBe(300);
    expect(m.realBalance).toBe(4700);
    expect(m.ghostExpenseTotal).toBeLessThan(300);
    expect(m.ghostBalance).toBeGreaterThan(4700);
    expect(m.totalGap).toBeGreaterThan(0);
  });
});

describe('buildSpendingAwarenessSuggestions', () => {
  it('returns guidance when no period data', () => {
    const s = buildSpendingAwarenessSuggestions([], 'CAD');
    expect(s.length).toBeGreaterThan(0);
  });
});
