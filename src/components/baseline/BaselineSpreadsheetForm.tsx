import { useRef, useState } from 'react';
import {
  exportBaselineCsv,
  importBaselineCsv,
  downloadTextFile,
  type BaselineCsvPayload,
} from '../../utils/baselineCsv';
import '../../styles/baseline-grid.css';

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Other',
] as const;

function rid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyPayload(): BaselineCsvPayload {
  return {
    jobTitle: '',
    monthlyTakeHome: '',
    expenseRows: EXPENSE_CATEGORIES.map((category) => ({
      id: rid(),
      category,
      description: '',
      monthly: '',
    })),
    debtRows: [
      { id: rid(), name: '', balance: '', notes: '' },
      { id: rid(), name: '', balance: '', notes: '' },
    ],
    savingsRows: [
      { id: rid(), label: 'RRSP', target: '' },
      { id: rid(), label: 'Vacation', target: '' },
      { id: rid(), label: '', target: '' },
    ],
  };
}

function mergeInitial(base: BaselineCsvPayload, patch?: Partial<BaselineCsvPayload>): BaselineCsvPayload {
  if (!patch) return base;
  return {
    jobTitle: patch.jobTitle ?? base.jobTitle,
    monthlyTakeHome: patch.monthlyTakeHome ?? base.monthlyTakeHome,
    expenseRows:
      patch.expenseRows && patch.expenseRows.length > 0
        ? patch.expenseRows.map((r) => ({ ...r, id: r.id || rid() }))
        : base.expenseRows,
    debtRows:
      patch.debtRows && patch.debtRows.length > 0
        ? patch.debtRows.map((r) => ({ ...r, id: r.id || rid() }))
        : base.debtRows,
    savingsRows:
      patch.savingsRows && patch.savingsRows.length > 0
        ? patch.savingsRows.map((r) => ({ ...r, id: r.id || rid() }))
        : base.savingsRows,
  };
}

export interface BaselineSpreadsheetFormProps {
  variant: 'onboarding' | 'settings';
  /** When provided (e.g. after loading APIs), pre-fills the grid */
  initial?: Partial<BaselineCsvPayload>;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
}

export function BaselineSpreadsheetForm({
  variant,
  initial,
  onSubmit,
  submitLabel,
}: BaselineSpreadsheetFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<BaselineCsvPayload>(() => mergeInitial(emptyPayload(), initial));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const title =
    variant === 'onboarding'
      ? 'Financial baseline worksheet'
      : 'Baseline profile (spreadsheet view)';

  const subtitle =
    variant === 'onboarding'
      ? 'Enter typical monthly figures. Download the CSV to complete offline in Excel or Google Sheets, then upload it back — or edit every cell here.'
      : 'Update ClearPath-tagged baseline income, expenses, debts, and savings. Other ledger entries are untouched. CSV download/upload works the same as onboarding.';

  const downloadCsv = () => {
    downloadTextFile(
      variant === 'onboarding' ? 'clearpath-baseline-template.csv' : 'clearpath-baseline-export.csv',
      exportBaselineCsv(state)
    );
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = importBaselineCsv(text);
      setState((prev) =>
        mergeInitial(prev, {
          jobTitle: parsed.jobTitle || prev.jobTitle,
          monthlyTakeHome: parsed.monthlyTakeHome || prev.monthlyTakeHome,
          expenseRows: parsed.expenseRows?.length ? parsed.expenseRows : prev.expenseRows,
          debtRows: parsed.debtRows?.length ? parsed.debtRows : prev.debtRows,
          savingsRows: parsed.savingsRows?.length ? parsed.savingsRows : prev.savingsRows,
        })
      );
    };
    reader.readAsText(f);
  };

  const addExpenseRow = () => {
    setState((p) => ({
      ...p,
      expenseRows: [...p.expenseRows, { id: rid(), category: 'Other', description: '', monthly: '' }],
    }));
  };

  const addDebtRow = () => {
    setState((p) => ({
      ...p,
      debtRows: [...p.debtRows, { id: rid(), name: '', balance: '', notes: '' }],
    }));
  };

  const addSavingsRow = () => {
    setState((p) => ({
      ...p,
      savingsRows: [...p.savingsRows, { id: rid(), label: '', target: '' }],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const monthlyTakeHome = Number(state.monthlyTakeHome);
      if (!state.jobTitle.trim()) {
        setErr('Job title is required.');
        return;
      }
      if (!(monthlyTakeHome > 0)) {
        setErr('Enter a monthly take-home amount greater than zero.');
        return;
      }

      const expenseRows = state.expenseRows
        .filter((r) => Number(r.monthly) > 0)
        .map((r) => ({
          category: r.category,
          description: r.description.trim(),
          amount: Number(r.monthly),
        }));

      const debtRows = state.debtRows
        .filter((r) => r.name.trim() && Number(r.balance) > 0)
        .map((r) => ({
          label: r.name.trim(),
          amount: Number(r.balance),
          notes: r.notes.trim(),
        }));

      const savingsRows = state.savingsRows
        .filter((r) => r.label.trim() && Number(r.target) > 0)
        .map((r) => ({
          label: r.label.trim(),
          target: Number(r.target),
        }));

      await onSubmit({
        jobTitle: state.jobTitle.trim(),
        monthlyTakeHome,
        expenseRows,
        debtRows,
        savingsRows,
      });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="baseline-shell">
      <header className="baseline-hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      <form onSubmit={submit}>
        {err && <div className="alert alert-danger py-2 mb-3">{err}</div>}

        <div className="baseline-toolbar">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={downloadCsv}>
            Download CSV
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => fileRef.current?.click()}>
            Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="d-none" onChange={onPickFile} />
          <span className="small text-muted ms-md-2">
            Template columns: record_type, name_or_category, description, monthly_amount, balance_or_target, notes
          </span>
        </div>

        <div className="baseline-panel">
          <div className="baseline-panel__head">Income</div>
          <div className="p-3">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Job title</label>
                <input
                  className="form-control"
                  value={state.jobTitle}
                  onChange={(e) => setState((p) => ({ ...p, jobTitle: e.target.value }))}
                  placeholder="e.g. Part-time retail"
                  maxLength={100}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">Monthly take-home (after tax)</label>
                <input
                  className="form-control"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={state.monthlyTakeHome}
                  onChange={(e) => setState((p) => ({ ...p, monthlyTakeHome: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="baseline-panel">
          <div className="baseline-panel__head">Monthly expenses (typical)</div>
          <div className="baseline-table-wrap">
            <table className="table table-bordered baseline-table mb-0">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ width: 140 }}>Monthly amount</th>
                  <th style={{ width: 72 }} />
                </tr>
              </thead>
              <tbody>
                {state.expenseRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <select
                        className="form-select"
                        value={r.category}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            expenseRows: p.expenseRows.map((x) =>
                              x.id === r.id ? { ...x, category: e.target.value } : x
                            ),
                          }))
                        }
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={r.description}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            expenseRows: p.expenseRows.map((x) =>
                              x.id === r.id ? { ...x, description: e.target.value } : x
                            ),
                          }))
                        }
                        placeholder="e.g. Shared apartment"
                      />
                    </td>
                    <td>
                      <input
                        className="form-control text-end"
                        type="number"
                        min={0}
                        step="0.01"
                        value={r.monthly}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            expenseRows: p.expenseRows.map((x) =>
                              x.id === r.id ? { ...x, monthly: e.target.value } : x
                            ),
                          }))
                        }
                        placeholder="0"
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        title="Remove row"
                        onClick={() =>
                          setState((p) => ({
                            ...p,
                            expenseRows: p.expenseRows.filter((x) => x.id !== r.id),
                          }))
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="baseline-actions-row">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addExpenseRow}>
              + Add expense row
            </button>
          </div>
        </div>

        <div className="baseline-panel">
          <div className="baseline-panel__head">Debts (balance you owe)</div>
          <div className="baseline-table-wrap">
            <table className="table table-bordered baseline-table mb-0">
              <thead>
                <tr>
                  <th>Debt name</th>
                  <th style={{ width: 140 }}>Balance owed</th>
                  <th>Notes (optional)</th>
                  <th style={{ width: 72 }} />
                </tr>
              </thead>
              <tbody>
                {state.debtRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        className="form-control"
                        value={r.name}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            debtRows: p.debtRows.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)),
                          }))
                        }
                        placeholder="e.g. Student line of credit"
                      />
                    </td>
                    <td>
                      <input
                        className="form-control text-end"
                        type="number"
                        min={0}
                        step="0.01"
                        value={r.balance}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            debtRows: p.debtRows.map((x) => (x.id === r.id ? { ...x, balance: e.target.value } : x)),
                          }))
                        }
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={r.notes}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            debtRows: p.debtRows.map((x) => (x.id === r.id ? { ...x, notes: e.target.value } : x)),
                          }))
                        }
                        placeholder="APR, minimum payment, etc."
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() =>
                          setState((p) => ({
                            ...p,
                            debtRows: p.debtRows.filter((x) => x.id !== r.id),
                          }))
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="baseline-actions-row">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addDebtRow}>
              + Add debt row
            </button>
          </div>
        </div>

        <div className="baseline-panel">
          <div className="baseline-panel__head">Savings goals (targets)</div>
          <div className="baseline-table-wrap">
            <table className="table table-bordered baseline-table mb-0">
              <thead>
                <tr>
                  <th>Goal label</th>
                  <th style={{ width: 160 }}>Target amount</th>
                  <th style={{ width: 72 }} />
                </tr>
              </thead>
              <tbody>
                {state.savingsRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        className="form-control"
                        value={r.label}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            savingsRows: p.savingsRows.map((x) =>
                              x.id === r.id ? { ...x, label: e.target.value } : x
                            ),
                          }))
                        }
                        placeholder="e.g. Emergency fund"
                      />
                    </td>
                    <td>
                      <input
                        className="form-control text-end"
                        type="number"
                        min={0}
                        step="0.01"
                        value={r.target}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            savingsRows: p.savingsRows.map((x) =>
                              x.id === r.id ? { ...x, target: e.target.value } : x
                            ),
                          }))
                        }
                        placeholder="0"
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() =>
                          setState((p) => ({
                            ...p,
                            savingsRows: p.savingsRows.filter((x) => x.id !== r.id),
                          }))
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="baseline-actions-row">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSavingsRow}>
              + Add savings goal
            </button>
          </div>
        </div>

        <div className="baseline-footer-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
