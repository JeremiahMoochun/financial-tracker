import type { ReactNode } from 'react';

export interface BarDatum {
  name: string;
  value: number;
}

interface BarRowsProps {
  data: BarDatum[];
  color?: string;
  max?: number;
  formatValue?: (v: number) => string;
  empty?: ReactNode;
}

export function BarRows({
  data,
  color = '#5b5f97',
  max,
  formatValue = (v) => v.toLocaleString(),
  empty,
}: BarRowsProps) {
  const filtered = data.filter((d) => d.value > 0);
  const top = max ?? Math.max(...filtered.map((d) => d.value), 1);

  if (filtered.length === 0) {
    return <>{empty ?? <p className="text-muted small mb-0">No data</p>}</>;
  }

  return (
    <div className="w-100">
      {filtered.map((d) => (
        <div key={d.name} className="mb-3">
          <div className="d-flex justify-content-between small mb-1">
            <span>{d.name}</span>
            <span className="text-muted">{formatValue(d.value)}</span>
          </div>
          <div className="progress" style={{ height: 10, borderRadius: 6 }}>
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(100, (d.value / top) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
