import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardSummary } from '../../api/dashboardApi';
import type { DashboardSummary } from '../../types/dashboard.types';
import {
  EXPENSE_CHART_META,
  FLOW_IES_META,
  GHOST_BALANCE_PIE_META,
  GHOST_GAP_META,
  GHOST_SPENDING_PIE_META,
  GHOST_USER_CHART_META,
  balanceMagnitudePieSlices,
  expenseSlicesWithHints,
  flowPieSlices,
  gapPieSlices,
  ghostSpendingPieSlices,
} from '../../data/chartHints';
import { useAuth } from '../../context/AuthContext';
import { PieSvg } from '../charts/PieSvg';
import '../../styles/dashboard.css';
import '../../styles/ghost.css';

const PALETTE = [
  '#5b5f97',
  '#3a0ca3',
  '#4cc9f0',
  '#f72585',
  '#7209b7',
  '#4361ee',
  '#06d6a0',
  '#ff9e00',
  '#ef476f',
  '#118ab2',
];

const GHOST_SPEND_COLORS = ['#0f766e', '#a78bfa'];
const GHOST_BAL_COLORS = ['#14b8a6', '#7c3aed'];

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="d-flex align-items-center justify-content-center h-100 text-muted py-5">
      <span>{label}</span>
    </div>
  );
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboardSummary()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message || 'Could not load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const goGhost = () => navigate('/ghost');
  const onGhostGapKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goGhost();
    }
  };

  if (loading) {
    return (
      <div className="dashboard-shell">
        <div className="loading-screen">
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="dashboard-shell">
        <div className="alert alert-danger">{err || 'No data'}</div>
      </div>
    );
  }

  const cur = data.currency;
  const name =
    user?.displayName || data.displayName || user?.email?.split('@')[0] || 'there';

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const expensePie = expenseSlicesWithHints(
    data.expenseByCategory.map((x) => ({ name: x.name, value: x.value }))
  );
  const flowPie = flowPieSlices(data.flow.income, data.flow.expenses);
  const spendPie = ghostSpendingPieSlices(data.ghostVsUser.expenseActual, data.ghostVsUser.expenseGhost);
  const balPie = balanceMagnitudePieSlices(data.ghostVsUser.savingsActual, data.ghostVsUser.savingsGhost);
  const gapPie = gapPieSlices(data.gapByCategory.map((x) => ({ name: x.name, value: x.value })));

  return (
    <div className="dashboard-shell">
      <header className="dashboard-hero">
        <h1>Welcome back, {name}</h1>
        <p>
          Interactive charts for spending mix, cash flow, ghost comparison, and gap by category — hover slices for
          details.
        </p>
      </header>

      <div className="metric-grid">
        <div className="metric-card">
          <h3>Net position</h3>
          <div className="value">
            {fmt(data.totals.net)} {cur}
          </div>
        </div>
        <div className="metric-card">
          <h3>Total income</h3>
          <div className="value">
            {fmt(data.totals.income)} {cur}
          </div>
        </div>
        <div className="metric-card">
          <h3>Total expenses</h3>
          <div className="value">
            {fmt(data.totals.expenses)} {cur}
          </div>
        </div>
        <div className="metric-card accent">
          <h3>Ghost gap (potential)</h3>
          <div className="value">
            {fmt(data.ghost.totalGap)} {cur}
          </div>
        </div>
        <div className="metric-card">
          <h3>Real balance</h3>
          <div className="value">
            {fmt(data.ghost.realBalance)} {cur}
          </div>
        </div>
        <div className="metric-card">
          <h3>Ghost balance</h3>
          <div className="value">
            {fmt(data.ghost.ghostBalance)} {cur}
          </div>
        </div>
      </div>

      <div className="chart-grid chart-grid--top">
        <div className="chart-card chart-card--even">
          {expensePie.length === 0 ? (
            <>
              <div className="chart-section-title">Expense breakdown by category</div>
              <ChartEmpty label="Add categorized expenses to see this chart." />
            </>
          ) : (
            <PieSvg
              data={expensePie}
              colors={PALETTE}
              size={260}
              formatValue={(v) => `${fmt(v)} ${cur}`}
              chartTitle={EXPENSE_CHART_META.title}
              chartExplainer={EXPENSE_CHART_META.explainer}
            />
          )}
          <p className="chart-note">Hover a slice or legend row for category context.</p>
        </div>

        <div className="chart-card chart-card--even">
          {flowPie.length === 0 ? (
            <>
              <div className="chart-section-title">{FLOW_IES_META.title}</div>
              <ChartEmpty label="Add income and expenses to see how income splits between spending and surplus." />
            </>
          ) : (
            <PieSvg
              data={flowPie}
              colors={['#ef476f', '#06d6a0']}
              size={260}
              formatValue={(v) => `${fmt(v)} ${cur}`}
              chartTitle={FLOW_IES_META.title}
              chartExplainer={FLOW_IES_META.explainer}
            />
          )}
          <p className="chart-note">Savings slice = income minus expenses when you’re not overspent.</p>
        </div>

        <div className="chart-card chart-card--even chart-card--split">
          <p className="pie-chart-meta small text-muted mb-2">
            <strong className="text-secondary d-block">{GHOST_USER_CHART_META.title}</strong>
            <span className="d-block mt-1">{GHOST_USER_CHART_META.explainer}</span>
          </p>
          <div className="dashboard-dual-pies">
            {spendPie.length === 0 ? (
              <div className="dashboard-dual-pies__cell">
                <ChartEmpty label="Spending comparison appears once you log expenses." />
              </div>
            ) : (
              <div className="dashboard-dual-pies__cell">
                <PieSvg
                  data={spendPie}
                  colors={GHOST_SPEND_COLORS}
                  size={220}
                  layout="stacked"
                  formatValue={(v) => `${fmt(v)} ${cur}`}
                  chartTitle={GHOST_SPENDING_PIE_META.title}
                  chartExplainer={GHOST_SPENDING_PIE_META.explainer}
                />
              </div>
            )}
            {balPie.length === 0 ? (
              <div className="dashboard-dual-pies__cell">
                <ChartEmpty label="Balance comparison needs recorded flows." />
              </div>
            ) : (
              <div className="dashboard-dual-pies__cell">
                <PieSvg
                  data={balPie}
                  colors={GHOST_BAL_COLORS}
                  size={220}
                  layout="stacked"
                  formatValue={(v) => `${fmt(v)} ${cur}`}
                  chartTitle={GHOST_BALANCE_PIE_META.title}
                  chartExplainer={GHOST_BALANCE_PIE_META.explainer}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="chart-card chart-card--wide chart-card--interactive"
        role="link"
        tabIndex={0}
        onClick={goGhost}
        onKeyDown={onGhostGapKey}
        aria-label="Open Ghost page for full gap insights"
      >
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1">
          <div className="chart-section-title mb-0">{GHOST_GAP_META.title}</div>
          <span className="badge rounded-pill dashboard-ghost-cta">Ghost insights →</span>
        </div>
        <p className="small text-muted mb-2">{GHOST_GAP_META.explainer}</p>
        <div className="dashboard-gap-pie px-1">
          {gapPie.length === 0 ? (
            <ChartEmpty label="Ghost gap by category appears once you have expenses modeled." />
          ) : (
            <PieSvg
              data={gapPie}
              colors={PALETTE}
              size={280}
              formatValue={(v) => `${fmt(v)} ${cur}`}
              chartTitle=""
              chartExplainer=""
            />
          )}
        </div>
        <p className="chart-note mb-0">Click anywhere on this card to open the Ghost page for habits, orbs, and full narrative.</p>
      </div>
    </div>
  );
}

export default StudentDashboard;
