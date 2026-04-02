import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { User } from '../types/auth.types';
import { listIncomes } from '../api/incomeApi';
import { listExpenses } from '../api/expenseApi';
import { listDebts } from '../api/debtApi';
import { ledgerToBaselineInitial } from '../utils/baselineLedger';
import type { BaselineCsvPayload } from '../utils/baselineCsv';
import { BaselineSpreadsheetForm } from '../components/baseline/BaselineSpreadsheetForm';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [initial, setInitial] = useState<Partial<BaselineCsvPayload> | undefined>(undefined);
  const [gridKey, setGridKey] = useState(0);
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameErr, setNameErr] = useState('');
  const [nameOk, setNameOk] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadErr('');
    try {
      const [incomes, expenses, debts] = await Promise.all([listIncomes(), listExpenses(), listDebts()]);
      const patch = ledgerToBaselineInitial(incomes, expenses, debts, user);
      setInitial(patch);
      setGridKey((k) => k + 1);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Could not load ledger');
      setInitial({
        jobTitle: user.jobTitle || '',
        monthlyTakeHome: '',
        savingsRows: (user.savingsGoals || []).map((g, i) => ({
          id: `sg-${i}-${g.label}`,
          label: g.label,
          target: g.target != null ? String(g.target) : '',
        })),
      });
      setGridKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
  }, [user?.id, user?.displayName]);

  if (!user) {
    return (
      <div className="loading-screen">
        <p>Loading…</p>
      </div>
    );
  }

  if (loading && gridKey === 0) {
    return (
      <div className="loading-screen">
        <p>Loading baseline…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="container py-3">
        <div className="card border-0 shadow-sm mb-4" style={{ maxWidth: 520 }}>
          <div className="card-body">
            <h2 className="h5 mb-3">Profile</h2>
            <p className="small text-muted mb-3">
              This name appears in the dashboard greeting. It is stored on your account, not in the demo seed.
            </p>
            <form
              className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-end"
              onSubmit={async (e) => {
                e.preventDefault();
                setNameErr('');
                setNameOk(false);
                setNameSaving(true);
                try {
                  await api.request<{ user: User }>('/auth/profile', {
                    method: 'PATCH',
                    body: JSON.stringify({ displayName }),
                  });
                  await refreshUser();
                  setNameOk(true);
                } catch (err) {
                  setNameErr(err instanceof Error ? err.message : 'Could not save');
                } finally {
                  setNameSaving(false);
                }
              }}
            >
              <div className="flex-grow-1">
                <label className="form-label small mb-1" htmlFor="settings-display-name">
                  Preferred name
                </label>
                <input
                  id="settings-display-name"
                  type="text"
                  className="form-control"
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setNameOk(false);
                  }}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={nameSaving}>
                {nameSaving ? 'Saving…' : 'Save name'}
              </button>
            </form>
            {nameErr && <div className="alert alert-danger py-2 mt-3 mb-0 small">{nameErr}</div>}
            {nameOk && !nameErr && (
              <div className="alert alert-success py-2 mt-3 mb-0 small">Saved. Your dashboard greeting uses this name.</div>
            )}
          </div>
        </div>
      </div>
      {loadErr && (
        <div className="container mb-3">
          <div className="alert alert-warning py-2 mb-0">{loadErr}</div>
        </div>
      )}
      <BaselineSpreadsheetForm
        key={gridKey}
        variant="settings"
        initial={initial}
        onSubmit={async (body) => {
          await api.request<{ user: User }>('/auth/baseline', {
            method: 'PATCH',
            body: JSON.stringify(body),
          });
          await refreshUser();
          await load();
        }}
        submitLabel="Save baseline worksheet"
      />
      <div className="container text-muted small pb-4">
        <p className="mb-1">
          Saving replaces only ClearPath-tagged baseline income, expenses, and debts (created during onboarding or the
          last save here). Other transactions you added elsewhere stay as they are.
        </p>
      </div>
    </div>
  );
}
