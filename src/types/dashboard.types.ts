export interface DashboardSummary {
  currency: string;
  displayName: string;
  totals: {
    income: number;
    expenses: number;
    net: number;
  };
  ghost: {
    realBalance: number;
    ghostBalance: number;
    totalGap: number;
  };
  /** Income, expenses, and savings (net = income − expenses) for the flow chart */
  flow: {
    income: number;
    expenses: number;
    savings: number;
  };
  /** Your totals vs ghost-modeled spending and resulting balances */
  ghostVsUser: {
    expenseActual: number;
    expenseGhost: number;
    savingsActual: number;
    savingsGhost: number;
  };
  expenseByCategory: { name: string; value: number }[];
  incomeVsExpense: { name: string; value: number }[];
  gapByCategory: { name: string; value: number }[];
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

export interface GhostSuggestion {
  title: string;
  detail: string;
  kind?: string;
  /** green = on track, orange = heads up, red = high priority (e.g. food/entertainment spike) */
  signal?: 'good' | 'caution' | 'alert';
}

export interface SpendingWindow {
  id: 'week' | 'month';
  title: string;
  currentLabel: string;
  previousLabel: string;
  deltas: {
    category: string;
    currentTotal: number;
    previousTotal: number;
    currentEntries: number;
    previousEntries: number;
  }[];
}

/** Entertainment row on the ghost page (actual vs modeled + copy) */
export interface EntertainmentGhost {
  actual: number;
  modeled: number;
  gapAmount: number;
  bubbleTeaser: string;
  weekMonthDetail: string;
  vacationLine: string;
}

export interface GhostOverview {
  currency: string;
  realBalance: number;
  ghostBalance: number;
  totalIncome: number;
  totalExpense: number;
  ghostExpenseTotal: number;
  totalGap: number;
  gapByCategory: {
    category: string;
    actual: number;
    ghostPortion: number;
    gap: number;
  }[];
  suggestions: GhostSuggestion[];
  categoryInsights: CategoryHabitInsight[];
  spendingWindows?: SpendingWindow[];
}
