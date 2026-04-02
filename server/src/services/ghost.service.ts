import { expenseCategories } from '../models/expenseCategories.js';
import type { PeriodWindow } from './ghostPeriod.service.js';

export const CATEGORY_GHOST_FACTORS: Record<string, number> = {
  Food: 0.78,
  Transport: 0.88,
  Rent: 1,
  Utilities: 1,
  Entertainment: 0.45,
  Healthcare: 1,
  Education: 1,
  Other: 0.72,
};

function factorForCategory(category: string): number {
  const f = CATEGORY_GHOST_FACTORS[category];
  if (f !== undefined) return f;
  return 0.8;
}

export interface ExpenseRow {
  amount: number;
  category: string;
}

export interface GhostMetrics {
  totalIncome: number;
  totalExpense: number;
  realBalance: number;
  ghostExpenseTotal: number;
  ghostBalance: number;
  totalGap: number;
  gapByCategory: { category: string; actual: number; ghostPortion: number; gap: number }[];
}

export function computeGhostMetrics(
  expenses: ExpenseRow[],
  incomes: { amount: number }[]
): GhostMetrics {
  const totalIncome = incomes.reduce((s, i) => s + Math.max(0, i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Math.max(0, e.amount), 0);
  const realBalance = totalIncome - totalExpense;

  const byCat = new Map<string, { actual: number; ghost: number }>();
  for (const c of expenseCategories) {
    byCat.set(c, { actual: 0, ghost: 0 });
  }

  for (const e of expenses) {
    const amt = Math.max(0, e.amount);
    const cat = expenseCategories.includes(e.category) ? e.category : 'Other';
    const fac = factorForCategory(cat);
    const ghostPortion = amt * fac;
    const cur = byCat.get(cat) || { actual: 0, ghost: 0 };
    cur.actual += amt;
    cur.ghost += ghostPortion;
    byCat.set(cat, cur);
  }

  let ghostExpenseTotal = 0;
  const gapByCategory: GhostMetrics['gapByCategory'] = [];
  for (const [category, v] of byCat) {
    if (v.actual <= 0) continue;
    ghostExpenseTotal += v.ghost;
    gapByCategory.push({
      category,
      actual: v.actual,
      ghostPortion: v.ghost,
      gap: v.actual - v.ghost,
    });
  }

  gapByCategory.sort((a, b) => b.gap - a.gap);

  const ghostBalance = totalIncome - ghostExpenseTotal;
  const totalGap = ghostBalance - realBalance;

  return {
    totalIncome,
    totalExpense,
    realBalance,
    ghostExpenseTotal,
    ghostBalance,
    totalGap,
    gapByCategory,
  };
}

export interface Suggestion {
  title: string;
  detail: string;
  kind: 'awareness' | 'habit' | 'summary';
  /** Orb color: good = green, caution = orange, alert = red */
  signal: 'good' | 'caution' | 'alert';
}

/** Optional profile hint for personalized “saving toward X” copy */
export interface SavingsGoalContext {
  label: string;
  target?: number;
}

function goalSavingsPhrase(goal?: SavingsGoalContext): string {
  if (goal?.label?.trim()) {
    const l = goal.label.trim();
    if (/^(your|a|an)\s/i.test(l)) return l;
    return `your ${l}`;
  }
  return "what you're saving for";
}

function goalTouchSentence(goal: SavingsGoalContext | undefined, extra: number, currency: string): string {
  const amt = extra.toFixed(2);
  if (goal?.label?.trim()) {
    return `If you're putting money toward ${goalSavingsPhrase(goal)}, an extra ${amt} ${currency} in this bucket is worth noticing — not to stress you out, just so the tradeoff is visible.`;
  }
  return `Over the next few months, an extra ${amt} ${currency} here and there can quietly slow bigger goals you're working toward.`;
}

export interface CategoryHabitInsight {
  category: string;
  gap: number;
  actual: number;
  modeled: number;
  headline: string;
  body: string;
  pulse: string;
}

function warmPeriodSentence(cat: string, windows: PeriodWindow[], currency: string): string {
  const bits: string[] = [];
  for (const w of windows) {
    const d = w.deltas.find((x) => x.category === cat);
    if (!d) continue;
    if (d.currentTotal + d.previousTotal < 0.01) continue;
    const curL = w.currentLabel ?? 'this period';
    const prevL = w.previousLabel ?? 'the prior stretch';
    if (d.previousTotal > 0 && d.currentTotal > d.previousTotal * 1.08) {
      bits.push(
        `I'm seeing more in ${cat.toLowerCase()} ${curL.toLowerCase()} than ${prevL.toLowerCase()} (${d.currentTotal.toFixed(2)} ${currency} vs ${d.previousTotal.toFixed(2)} ${currency}).`
      );
    } else if (d.previousTotal > 0 && d.currentTotal < d.previousTotal * 0.9) {
      bits.push(
        `You're actually spending less on ${curL.toLowerCase()} than ${prevL.toLowerCase()} — I'll take that as a win.`
      );
    }
  }
  return bits.slice(0, 2).join(' ');
}

function habitCopyForCategory(
  cat: string,
  gap: number,
  actual: number,
  modeled: number,
  currency: string,
  windows: PeriodWindow[],
  goal?: SavingsGoalContext
): { headline: string; body: string; pulse: string } {
  const pct = actual > 0 ? Math.round((gap / actual) * 100) : 0;
  const gapStr = gap.toFixed(2);
  const periodNote = warmPeriodSentence(cat, windows, currency);
  const goalLine =
    (cat === 'Entertainment' || cat === 'Food') && gap > 0.01
      ? ` ${goalTouchSentence(goal, gap, currency)}`
      : '';

  const blocks: Record<string, () => { headline: string; body: string; pulse: string }> = {
    Food: () => ({
      headline: "Here's what I'm seeing with food",
      body: `All in, you've spent ${actual.toFixed(2)} ${currency} on food. My leaner pattern lands closer to ${modeled.toFixed(2)} ${currency}, so there's about ${gapStr} ${currency} of wiggle room if you ever want to line up with that calmer baseline — roughly ${pct}% of what you spent here.${goalLine}${periodNote ? ` ${periodNote}` : ' Add dates to your entries and I can compare this week to last week in plain language.'}`,
      pulse: 'Meals & groceries',
    }),
    Transport: () => ({
      headline: 'A quick read on transport',
      body: `You're at ${actual.toFixed(2)} ${currency} vs ${modeled.toFixed(2)} ${currency} in my model — gap ${gapStr} ${currency}. ${periodNote || 'When trips are dated, I can tell you if this week looked busier than last.'}`,
      pulse: 'Commute & rides',
    }),
    Rent: () => ({
      headline: 'Rent looks steady',
      body: `I mostly treat rent as fixed, so small differences are usually timing, not habits. ${periodNote}`,
      pulse: 'Housing',
    }),
    Utilities: () => ({
      headline: 'Utilities snapshot',
      body: `You've logged ${actual.toFixed(2)} ${currency}; I modeled ${modeled.toFixed(2)} ${currency}. ${periodNote}`,
      pulse: 'Bills',
    }),
    Entertainment: () => ({
      headline: 'Entertainment is where the story shows up',
      body: `I'm noticing about ${gapStr} ${currency} between how you actually spent and the tighter pattern I use for fun money — that's the biggest lever if you want more room elsewhere.${goalLine}${periodNote ? ` ${periodNote}` : ' With dated nights out, I can say whether this month is running hotter than the same days last month.'}`,
      pulse: 'Nights & tickets',
    }),
    Healthcare: () => ({
      headline: 'Healthcare',
      body: `This one I keep close to real life — essentials first. ${periodNote}`,
      pulse: 'Essentials',
    }),
    Education: () => ({
      headline: 'Education',
      body: `School-related spend is in here. ${periodNote}`,
      pulse: 'School costs',
    }),
    Other: () => ({
      headline: 'The “everything else” bucket',
      body: `Mixed charges land here; I still trim a bit in the model. Gap is ${gapStr} ${currency}. ${periodNote}`,
      pulse: 'Misc',
    }),
  };

  const fn = blocks[cat] || blocks.Other;
  return fn();
}

export function buildCategoryHabitInsights(
  metrics: GhostMetrics,
  currencyCode = 'CAD',
  windows: PeriodWindow[] = [],
  goal?: SavingsGoalContext
): CategoryHabitInsight[] {
  const currency = currencyCode || 'CAD';
  const out: CategoryHabitInsight[] = [];
  for (const row of metrics.gapByCategory) {
    if (row.gap < 0.01) continue;
    const copy = habitCopyForCategory(
      row.category,
      row.gap,
      row.actual,
      row.ghostPortion,
      currency,
      windows,
      goal
    );
    out.push({
      category: row.category,
      gap: Math.round(row.gap * 100) / 100,
      actual: Math.round(row.actual * 100) / 100,
      modeled: Math.round(row.ghostPortion * 100) / 100,
      headline: copy.headline,
      body: copy.body,
      pulse: copy.pulse,
    });
  }
  return out;
}

function praiseHint(
  cat: string,
  d: {
    currentTotal: number;
    previousTotal: number;
    currentEntries: number;
    previousEntries: number;
  },
  prevLabel: string,
  currency: string
): string | null {
  if (d.previousTotal < 12) return null;
  const drop = d.previousTotal - d.currentTotal;
  const pctDrop = d.previousTotal > 0 ? drop / d.previousTotal : 0;
  if (drop <= 0 || pctDrop < 0.08) return null;

  const saved = drop.toFixed(2);
  if (cat === 'Food') {
    return `I noticed you eased up on eating out and groceries compared with ${prevLabel.toLowerCase()} — about ${saved} ${currency} less. Great work; that kind of change is exactly what moves savings without feeling like a crash diet.`;
  }
  if (cat === 'Entertainment') {
    return `I saw you dial back entertainment versus ${prevLabel.toLowerCase()} — roughly ${saved} ${currency} less. Nice — that breathing room adds up faster than it feels in the moment.`;
  }
  if (cat === 'Transport') {
    return `You spent less on transport than ${prevLabel.toLowerCase()} — around ${saved} ${currency} saved. Love seeing that.`;
  }
  if (cat === 'Other') {
    return `“Other” spend came down versus ${prevLabel.toLowerCase()} — about ${saved} ${currency}. Small wins still count.`;
  }
  return `I'm seeing less in ${cat} than ${prevLabel.toLowerCase()} — about ${saved} ${currency} less. That's real progress.`;
}

function spikeHint(
  cat: string,
  d: {
    currentTotal: number;
    previousTotal: number;
    currentEntries: number;
    previousEntries: number;
  },
  curLabel: string,
  prevLabel: string,
  currency: string,
  goal?: SavingsGoalContext
): string | null {
  const up = d.previousTotal > 0 && d.currentTotal > d.previousTotal;
  const more = d.currentEntries > d.previousEntries && d.previousEntries > 0;
  if (!up && !more) return null;

  const extra = Math.max(0, d.currentTotal - d.previousTotal);
  const extraStr = extra.toFixed(2);
  const goalClosing = goal?.label?.trim()
    ? ` If you're saving toward ${goalSavingsPhrase(goal)}, that extra can quietly pull from that pot over the next few months.`
    : " If you have something big you're saving toward, that extra adds up over a few months.";

  if (cat === 'Entertainment') {
    if (more) {
      return `I've noticed more entertainment picks this stretch — ${d.currentEntries} entries ${curLabel.toLowerCase()} vs ${d.previousEntries} ${prevLabel.toLowerCase()}. More nights out than your calmer weeks.${goalClosing}`;
    }
    return `This period you're running about ${extraStr} ${currency} higher on entertainment than ${prevLabel.toLowerCase()} (${d.currentTotal.toFixed(2)} vs ${d.previousTotal.toFixed(2)}). One fewer planned night out often gets you back to the pace you like.${goalClosing}`;
  }
  if (cat === 'Food') {
    return `Food came in higher ${curLabel.toLowerCase()} (${d.currentTotal.toFixed(2)} ${currency}) than ${prevLabel.toLowerCase()} (${d.previousTotal.toFixed(2)} ${currency}) — roughly ${extraStr} ${currency} more. Maybe swap one delivery for a home-cooked night; small shifts stack.${goalClosing}`;
  }
  if (cat === 'Transport') {
    return `Transport is up ${curLabel.toLowerCase()} vs ${prevLabel.toLowerCase()}. Fewer discretionary trips — or one lighter weekend — usually gets you closer to last month's vibe.`;
  }
  if (cat === 'Other') {
    return `“Other” spend is up ${curLabel.toLowerCase()} vs ${prevLabel.toLowerCase()}. A quick pass on small subscriptions or impulse buys often pulls this back.`;
  }
  return `${cat} is higher ${curLabel.toLowerCase()} (${d.currentTotal.toFixed(2)} ${currency}) than ${prevLabel.toLowerCase()} (${d.previousTotal.toFixed(2)} ${currency}). I'd trim frequency first — it feels more like a habit tweak than a big goal lecture.`;
}

function signalForSpikeCategory(cat: string): 'alert' | 'caution' {
  if (cat === 'Entertainment' || cat === 'Food') return 'alert';
  return 'caution';
}

export function buildSpendingAwarenessSuggestions(
  windows: PeriodWindow[],
  currencyCode = 'CAD',
  goal?: SavingsGoalContext
): Suggestion[] {
  const currency = currencyCode || 'CAD';
  const out: Suggestion[] = [];

  const hasData = windows.some((w) => w.deltas.some((d) => d.currentTotal > 0 || d.previousTotal > 0));
  if (!hasData) {
    out.push({
      title: "I'm ready when you are",
      detail:
        "Once you add expenses with dates, I can compare this week to last week and this month to the same days last month — and talk to you like a friend who actually looked at the numbers.",
      kind: 'summary',
      signal: 'caution',
    });
    return out;
  }

  for (const w of windows) {
    for (const d of w.deltas) {
      const praise = praiseHint(d.category, d, w.previousLabel, currency);
      if (praise) {
        out.push({
          title: `Nice — ${d.category} cooled down`,
          detail: praise,
          kind: 'awareness',
          signal: 'good',
        });
        continue;
      }

      const spike = spikeHint(d.category, d, w.currentLabel, w.previousLabel, currency, goal);
      if (!spike) continue;
      out.push({
        title: `Heads up — ${d.category} picked up`,
        detail: spike,
        kind: 'awareness',
        signal: signalForSpikeCategory(d.category),
      });
    }
  }

  const seen = new Set<string>();
  const deduped: Suggestion[] = [];
  for (const s of out) {
    const key = s.title + s.detail.slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
  }

  if (deduped.length === 0) {
    deduped.push({
      title: "You're in a steady stretch",
      detail:
        "I'm not seeing a big spike versus last week or the same days last month — nice. When something jumps, I'll flag it in plain language (and I'll cheer when you ease off, too).",
      kind: 'summary',
      signal: 'good',
    });
  }

  return deduped.slice(0, 12);
}
