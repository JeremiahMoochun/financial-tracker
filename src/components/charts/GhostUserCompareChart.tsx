interface GhostUserCompareChartProps {
  expenseActual: number;
  expenseGhost: number;
  savingsActual: number;
  savingsGhost: number;
  formatValue: (v: number) => string;
  title: string;
  explainer: string;
}

const YOU = '#0f766e';
const GHOST = '#7c3aed';

export function GhostUserCompareChart({
  expenseActual,
  expenseGhost,
  savingsActual,
  savingsGhost,
  formatValue,
  title,
  explainer,
}: GhostUserCompareChartProps) {
  const hasSpend = expenseActual > 0 || expenseGhost > 0;
  const expMax = Math.max(expenseActual, expenseGhost, 1);
  const savMax = Math.max(Math.abs(savingsActual), Math.abs(savingsGhost), 1);

  const pct = (v: number, max: number) => Math.min(100, (Math.abs(v) / max) * 100);

  return (
    <div className="ghost-user-compare">
      <p className="pie-chart-meta small text-muted mb-2 mb-md-3">
        <strong className="text-secondary d-block">{title}</strong>
        <span className="d-block mt-1">{explainer}</span>
      </p>

      <div className="ghost-user-compare__section mb-4">
        <div className="small fw-semibold text-secondary mb-2">Spending</div>
        {!hasSpend ? (
          <p className="text-muted small mb-0">No spending recorded yet — ghost shows modeled spend once you log expenses.</p>
        ) : (
          <>
            <div className="ghost-user-compare__pair mb-2">
              <span className="ghost-user-compare__tag" style={{ color: YOU }}>
                You
              </span>
              <div className="progress" style={{ height: 12, borderRadius: 6, flex: 1 }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${pct(expenseActual, expMax)}%`,
                    backgroundColor: YOU,
                  }}
                />
              </div>
              <span className="ghost-user-compare__num small">{formatValue(expenseActual)}</span>
            </div>
            <div className="ghost-user-compare__pair">
              <span className="ghost-user-compare__tag" style={{ color: GHOST }}>
                Ghost
              </span>
              <div className="progress" style={{ height: 12, borderRadius: 6, flex: 1 }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${pct(expenseGhost, expMax)}%`,
                    backgroundColor: GHOST,
                  }}
                />
              </div>
              <span className="ghost-user-compare__num small">{formatValue(expenseGhost)}</span>
            </div>
          </>
        )}
      </div>

      <div className="ghost-user-compare__section">
        <div className="small fw-semibold text-secondary mb-2">Savings (balance)</div>
        <p className="small text-muted mb-2">
          What remains after expenses — yours vs the tighter ghost spending model.
        </p>
        <div className="ghost-user-compare__pair mb-2">
          <span className="ghost-user-compare__tag" style={{ color: YOU }}>
            You
          </span>
          <div className="progress" style={{ height: 12, borderRadius: 6, flex: 1 }}>
            <div
              className="progress-bar"
              style={{
                width: `${pct(savingsActual, savMax)}%`,
                backgroundColor: YOU,
              }}
            />
          </div>
          <span className="ghost-user-compare__num small">{formatValue(savingsActual)}</span>
        </div>
        <div className="ghost-user-compare__pair">
          <span className="ghost-user-compare__tag" style={{ color: GHOST }}>
            Ghost
          </span>
          <div className="progress" style={{ height: 12, borderRadius: 6, flex: 1 }}>
            <div
              className="progress-bar"
              style={{
                width: `${pct(savingsGhost, savMax)}%`,
                backgroundColor: GHOST,
              }}
            />
          </div>
          <span className="ghost-user-compare__num small">{formatValue(savingsGhost)}</span>
        </div>
      </div>
    </div>
  );
}
