/** Prefixes so we can replace only ClearPath “baseline” rows on re-save from Settings. */
export const BASELINE_INCOME_REASON_PREFIX = '__CP_BASELINE__|income|';
export const BASELINE_EXPENSE_REASON_PREFIX = '__CP_BASELINE__|expense|';
export const BASELINE_DEBT_NOTES_PREFIX = '__CP_BASELINE__';

export function baselineIncomeReason(jobTitle: string): string {
  return `${BASELINE_INCOME_REASON_PREFIX}${jobTitle.trim()}`;
}

export function baselineExpenseReason(category: string, description: string, jobTitle: string): string {
  const d = (description || category || 'Monthly').trim().slice(0, 80);
  return `${BASELINE_EXPENSE_REASON_PREFIX}${category}|${d}|${jobTitle.trim().slice(0, 40)}`;
}

export function baselineDebtNotes(userNotes: string): string {
  const rest = (userNotes || '').trim();
  return rest ? `${BASELINE_DEBT_NOTES_PREFIX}\n${rest}` : BASELINE_DEBT_NOTES_PREFIX;
}
