import { useEffect, useState } from 'react';
import { fetchGhostOverview } from '../api/ghostApi';
import type { GhostOverview } from '../types/dashboard.types';
import { GhostHabitPanel } from '../components/ghost/GhostHabitPanel';
import { GhostSignalOrbs } from '../components/ghost/GhostSignalOrbs';
import '../styles/dashboard.css';
import '../styles/ghost.css';

export default function GhostPage() {
  const [data, setData] = useState<GhostOverview | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    fetchGhostOverview()
      .then((d) => {
        if (!c) setData(d);
      })
      .catch((e: Error) => {
        if (!c) setErr(e.message || 'Failed to load ghost analytics');
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading ghost analytics…</p>
      </div>
    );
  }

  if (err || !data) {
    return <div className="alert alert-danger">{err || 'No data'}</div>;
  }

  const cur = data.currency;
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const insights = data.categoryInsights ?? [];

  return (
    <div className="dashboard-shell">
      <header className="dashboard-hero mb-3">
        <h1>Real vs Ghost</h1>
        <p>
          Your <strong>real</strong> balance is what actually left your account. Your <strong>ghost</strong>{' '}
          balance is what might be left if your spending lined up with a leaner, category-by-category
          habit model — not judging, just a second lens. I also compare{' '}
          <strong>this week to last week</strong> and <strong>this month to the same days last month</strong>{' '}
          so the notes below sound more like a text from someone who gets your money, not a spreadsheet.
        </p>
      </header>

      <div className="balance-compare mb-4">
        <div className="balance-panel real">
          <h2>Real balance</h2>
          <div className="amt">
            {fmt(data.realBalance)} {cur}
          </div>
          <p className="small mt-2 mb-0 opacity-90">
            Income {fmt(data.totalIncome)} − expenses {fmt(data.totalExpense)}
          </p>
        </div>
        <div className="balance-panel ghost">
          <h2>Ghost balance</h2>
          <div className="amt">
            {fmt(data.ghostBalance)} {cur}
          </div>
          <p className="small mt-2 mb-0 opacity-90">
            Modeled spend: {fmt(data.ghostExpenseTotal)} {cur}
          </p>
        </div>
      </div>

      <div className="metric-card mb-4">
        <h3 className="text-uppercase small text-muted mb-2">Total ghost gap</h3>
        <div className="fs-3 fw-bold text-primary">
          {fmt(data.totalGap)} {cur}
        </div>
        <p className="small text-muted mb-0 mt-1">
          Roughly how much more you could have kept if your day-to-day habits matched the tighter
          ghost pattern — a what-if, not money in the bank.
        </p>
      </div>

      <h2 className="ghost-section-title">Where your habits drift from the leaner model</h2>
      <p className="small text-muted mb-3">
        Each card lines up <strong>what you spent</strong> next to <strong>what the ghost pattern
        expects</strong>. Hover for a plain-English read — I'm going for conversational, not corporate.
      </p>
      <GhostHabitPanel insights={insights} currency={cur} fmt={fmt} />

      <GhostSignalOrbs suggestions={data.suggestions} />
    </div>
  );
}
