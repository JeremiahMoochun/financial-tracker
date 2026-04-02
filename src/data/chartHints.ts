import type { PieSlice } from '../components/charts/PieSvg';

export const EXPENSE_CHART_META = {
  title: 'Expense breakdown',
  explainer:
    'Each slice is a share of your total recorded spending. Larger slices are where your budget weight sits.',
};

export const FLOW_IES_META = {
  title: 'Income, expenses & savings',
  explainer:
    'Income you recorded, what you spent, and what is left (net). Savings here means income minus expenses for the period.',
};

export const GHOST_USER_CHART_META = {
  title: 'You vs ghost',
  explainer:
    'Compare your actual spending to the ghost model’s leaner totals, and how each path affects the balance you keep.',
};

export const GHOST_SPENDING_PIE_META = {
  title: 'Spending vs ghost model',
  explainer: 'How your real spending splits relative to the tighter ghost pattern (same total as your actual spend).',
};

export const GHOST_BALANCE_PIE_META = {
  title: 'Balance scale (you vs ghost)',
  explainer: 'Relative size of each balance; use the metric cards above for exact positive or negative amounts.',
};

export const GHOST_GAP_META = {
  title: 'Ghost gap by category',
  explainer:
    'Shows recoverable headroom per category: where actual spend exceeds the ghost model’s tighter pattern.',
};

const CATEGORY_SLICE_HINTS: Record<string, string> = {
  Food: 'Groceries, dining, delivery — often the first place habits show up.',
  Transport: 'Transit, fuel, rides — recurring mobility costs.',
  Rent: 'Housing; modeled as mostly fixed in ghost math.',
  Utilities: 'Power, water, internet — usage-driven recurring bills.',
  Entertainment: 'Discretionary fun; ghost model assumes the largest trim here.',
  Healthcare: 'Copays, prescriptions — treated as essential in the model.',
  Education: 'Tuition, books, software tied to school.',
  Other: 'Everything that did not fit a standard label.',
};

export function expenseSlicesWithHints(rows: { name: string; value: number }[]): PieSlice[] {
  return rows.map((r) => ({
    name: r.name,
    value: r.value,
    hint: CATEGORY_SLICE_HINTS[r.name] || CATEGORY_SLICE_HINTS.Other,
  }));
}

/** Partition of income: spending vs what’s left; if overspent, income vs the gap. */
export function flowPieSlices(income: number, expenses: number): PieSlice[] {
  const inc = Math.max(0, income);
  const exp = Math.max(0, expenses);
  if (inc <= 0 && exp <= 0) return [];
  if (inc >= exp) {
    const left = inc - exp;
    const slices: PieSlice[] = [];
    if (exp > 0) {
      slices.push({
        name: 'Spending',
        value: exp,
        hint: 'Total expenses logged against this income.',
      });
    }
    if (left > 0) {
      slices.push({
        name: 'Savings (surplus)',
        value: left,
        hint: 'What’s left after expenses — your net for the period.',
      });
    }
    return slices;
  }
  const over = exp - inc;
  const out: PieSlice[] = [];
  if (inc > 0) {
    out.push({
      name: 'Income',
      value: inc,
      hint: 'Income you recorded this period.',
    });
  }
  if (over > 0) {
    out.push({
      name: 'Spending beyond income',
      value: over,
      hint: 'Shortfall: expenses higher than income for this view.',
    });
  }
  return out;
}

/** Split actual spending into “within ghost line” vs “above it”. */
export function ghostSpendingPieSlices(actual: number, ghostModel: number): PieSlice[] {
  const a = Math.max(0, actual);
  const g = Math.max(0, ghostModel);
  if (a <= 0.005) return [];
  const extra = Math.max(0, a - g);
  const within = a - extra;
  const out: PieSlice[] = [];
  if (within > 0) {
    out.push({
      name: 'Up to ghost-model spend',
      value: within,
      hint: 'Portion of your actual spend at or below the leaner ghost pattern.',
    });
  }
  if (extra > 0) {
    out.push({
      name: 'Above ghost-model spend',
      value: extra,
      hint: 'Extra versus the tighter habit model — the “ghost gap” driver.',
    });
  }
  return out;
}

/** Side-by-side scale of balance magnitudes (see metric cards for +/−). */
export function balanceMagnitudePieSlices(real: number, ghost: number): PieSlice[] {
  const a = Math.abs(real);
  const b = Math.abs(ghost);
  if (a + b < 0.01) return [];
  return [
    {
      name: 'Your balance (scale)',
      value: a,
      hint:
        real >= 0
          ? 'Positive balance magnitude; hover metrics above for the exact signed total.'
          : 'Negative balance — slice size is magnitude; check cards for the signed amount.',
    },
    {
      name: 'Ghost balance (scale)',
      value: b,
      hint:
        ghost >= 0
          ? 'What you’d keep under the ghost spending model (magnitude).'
          : 'Ghost-model shortfall magnitude.',
    },
  ];
}

export function gapPieSlices(rows: { name: string; value: number }[]): PieSlice[] {
  return rows.map((r) => ({
    name: r.name,
    value: r.value,
    hint:
      CATEGORY_SLICE_HINTS[r.name] ||
      'Difference between your actual spend and the ghost pattern in this category.',
  }));
}

