interface IncomeExpenseSavingsChartProps {
  income: number;
  expenses: number;
  savings: number;
  formatValue: (v: number) => string;
  title: string;
  explainer: string;
}

const COLORS = {
  income: '#06d6a0',
  expenses: '#ef476f',
  savings: '#4361ee',
  shortfall: '#b91c1c',
};

export function IncomeExpenseSavingsChart({
  income,
  expenses,
  savings,
  formatValue,
  title,
  explainer,
}: IncomeExpenseSavingsChartProps) {
  const hasAny = income > 0 || expenses > 0 || savings !== 0;
  const max = Math.max(income, expenses, Math.abs(savings), 1);

  const barPct = (v: number) => Math.min(100, (Math.abs(v) / max) * 100);

  if (!hasAny) {
    return (
      <div>
        <p className="pie-chart-meta small text-muted mb-2 mb-md-3">
          <strong className="text-secondary d-block">{title}</strong>
          <span className="d-block mt-1">{explainer}</span>
        </p>
        <div className="d-flex align-items-center justify-content-center text-muted py-5" style={{ minHeight: 160 }}>
          Add income or expenses to see this chart.
        </div>
      </div>
    );
  }

  const items = [
    { key: 'income', label: 'Income', value: income, color: COLORS.income },
    { key: 'expenses', label: 'Expenses', value: expenses, color: COLORS.expenses },
    {
      key: 'savings',
      label: savings >= 0 ? 'Savings (net)' : 'Shortfall',
      value: savings,
      color: savings >= 0 ? COLORS.savings : COLORS.shortfall,
    },
  ];

  return (
    <div className="flow-triple-bars">
      <p className="pie-chart-meta small text-muted mb-2 mb-md-3">
        <strong className="text-secondary d-block">{title}</strong>
        <span className="d-block mt-1">{explainer}</span>
      </p>
      <div className="flow-triple-bars__row">
        {items.map((item) => (
          <div key={item.key} className="flow-triple-bars__col">
            <div className="flow-triple-bars__track">
              <div
                className="flow-triple-bars__fill"
                style={{
                  height: `${barPct(item.value)}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.label}: ${formatValue(item.value)}`}
              />
            </div>
            <div className="flow-triple-bars__label small">{item.label}</div>
            <div className="flow-triple-bars__value small text-muted">{formatValue(item.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
