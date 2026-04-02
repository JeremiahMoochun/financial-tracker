export interface DatedExpense {
  amount: number;
  category: string;
  date: Date;
}

export interface CategoryPeriodDelta {
  category: string;
  currentTotal: number;
  previousTotal: number;
  currentEntries: number;
  previousEntries: number;
}

export interface PeriodWindow {
  id: 'week' | 'month';
  title: string;
  currentLabel: string;
  previousLabel: string;
  deltas: CategoryPeriodDelta[];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function inRange(t: Date, start: Date, end: Date): boolean {
  return t >= start && t <= end;
}

function sumByCategory(
  expenses: DatedExpense[],
  start: Date,
  end: Date
): Map<string, { total: number; entries: number }> {
  const m = new Map<string, { total: number; entries: number }>();
  for (const e of expenses) {
    if (!inRange(e.date, start, end)) continue;
    const cat = e.category || 'Other';
    const amt = Math.max(0, e.amount);
    const cur = m.get(cat) || { total: 0, entries: 0 };
    cur.total += amt;
    cur.entries += 1;
    m.set(cat, cur);
  }
  return m;
}

function mergeDeltas(
  cats: Set<string>,
  cur: Map<string, { total: number; entries: number }>,
  prev: Map<string, { total: number; entries: number }>
): CategoryPeriodDelta[] {
  const out: CategoryPeriodDelta[] = [];
  for (const category of cats) {
    const a = cur.get(category) || { total: 0, entries: 0 };
    const b = prev.get(category) || { total: 0, entries: 0 };
    if (a.total + b.total + a.entries + b.entries <= 0) continue;
    out.push({
      category,
      currentTotal: Math.round(a.total * 100) / 100,
      previousTotal: Math.round(b.total * 100) / 100,
      currentEntries: a.entries,
      previousEntries: b.entries,
    });
  }
  out.sort((x, y) => y.currentTotal + y.previousTotal - (x.currentTotal + x.previousTotal));
  return out;
}

export function buildPeriodWindows(expenses: DatedExpense[], nowInput: Date): PeriodWindow[] {
  const now = new Date(nowInput);
  const allCats = new Set<string>();
  for (const e of expenses) allCats.add(e.category || 'Other');

  const endW = endOfDay(now);
  const startW = startOfDay(addDays(now, -6));
  const prevEndW = endOfDay(addDays(startW, -1));
  const startPrevW = startOfDay(addDays(startW, -7));

  const curW = sumByCategory(expenses, startW, endW);
  const prevW = sumByCategory(expenses, startPrevW, prevEndW);
  const weekCats = new Set([...allCats]);
  const weekDeltas = mergeDeltas(weekCats, curW, prevW);

  const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = endOfDay(now);
  const dayCount = Math.max(
    1,
    Math.floor((+monthEnd - +monthStart) / 86400000) + 1
  );

  let prevMonth = now.getMonth() - 1;
  let prevYear = now.getFullYear();
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const prevMonthStart = startOfDay(new Date(prevYear, prevMonth, 1));
  const dim = new Date(prevYear, prevMonth + 1, 0).getDate();
  const span = Math.min(dayCount, dim);
  const prevMonthSpanEnd = endOfDay(new Date(prevYear, prevMonth, span));

  const curM = sumByCategory(expenses, monthStart, monthEnd);
  const prevM = sumByCategory(expenses, prevMonthStart, prevMonthSpanEnd);
  const monthDeltas = mergeDeltas(new Set([...allCats]), curM, prevM);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return [
    {
      id: 'week',
      title: 'Last 7 days vs prior 7 days',
      currentLabel: 'Last 7 days',
      previousLabel: 'Prior 7 days',
      deltas: weekDeltas,
    },
    {
      id: 'month',
      title: `Month to date vs same days last month (${monthNames[prevMonth]})`,
      currentLabel: `${monthNames[now.getMonth()]} (1st–today)`,
      previousLabel: `${monthNames[prevMonth]} (same span)`,
      deltas: monthDeltas,
    },
  ];
}

export function parseExpenseDate(raw: unknown): Date {
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  const d = new Date(String(raw));
  return isNaN(d.getTime()) ? new Date() : d;
}
