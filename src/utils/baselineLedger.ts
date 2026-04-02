import type { IncomeRecord } from '../api/incomeApi';
import type { ExpenseRecord } from '../api/expenseApi';
import type { DebtRecord } from '../api/debtApi';
import type { User } from '../types/auth.types';
import type { BaselineCsvPayload } from './baselineCsv';

const BASE_INC = '__CP_BASELINE__|income|';
const BASE_EXP = '__CP_BASELINE__|expense|';
const BASE_DEBT = '__CP_BASELINE__';

function rid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Build spreadsheet initial values from tagged “baseline” ledger rows + profile. */
export function ledgerToBaselineInitial(
  incomes: IncomeRecord[],
  expenses: ExpenseRecord[],
  debts: DebtRecord[],
  user: User
): Partial<BaselineCsvPayload> {
  const inc = incomes.find((i) => i.reason?.startsWith(BASE_INC));
  const jobTitle = inc ? inc.reason.slice(BASE_INC.length) : user.jobTitle || '';
  const monthlyTakeHome = inc ? String(inc.amount) : '';

  const fromTagged = expenses.filter((e) => e.reason?.startsWith(BASE_EXP));
  const expenseRows: BaselineCsvPayload['expenseRows'] = fromTagged.map((e) => {
    const rest = (e.reason || '').slice(BASE_EXP.length);
    const parts = rest.split('|');
    const category = parts[0] || e.category || 'Other';
    const description = parts[1] || '';
    return {
      id: rid(),
      category,
      description,
      monthly: String(e.amount),
    };
  });

  const baselineDebts = debts.filter((d) => d.notes?.startsWith(BASE_DEBT));
  const debtRows: BaselineCsvPayload['debtRows'] = baselineDebts.map((d) => ({
    id: rid(),
    name: d.label,
    balance: String(d.amount),
    notes: (d.notes || '').replace(new RegExp(`^${BASE_DEBT}\\n?`), '').trim(),
  }));

  const savingsRows: BaselineCsvPayload['savingsRows'] = (user.savingsGoals || [])
    .filter((g) => g.label?.trim())
    .map((g) => ({
      id: rid(),
      label: g.label,
      target: g.target != null ? String(g.target) : '',
    }));

  const out: Partial<BaselineCsvPayload> = {
    jobTitle,
    monthlyTakeHome,
  };
  if (expenseRows.length > 0) out.expenseRows = expenseRows;
  if (debtRows.length > 0) out.debtRows = debtRows;
  if (savingsRows.length > 0) out.savingsRows = savingsRows;
  return out;
}
