import type { EntertainmentGhost } from '../../types/dashboard.types';
import '../../styles/ghost.css';

interface EntertainmentGhostRowProps {
  ghost: EntertainmentGhost;
  currency: string;
  fmt: (n: number) => string;
  maxGap: number;
}

export function EntertainmentGhostRow({ ghost, currency, fmt, maxGap }: EntertainmentGhostRowProps) {
  const widthPct = Math.min(100, (ghost.gapAmount / maxGap) * 100);

  return (
    <div className="ghost-habit-card ghost-ent-card">
      <div className="ghost-habit-card__top">
        <span className="ghost-pulse" aria-hidden />
        <div>
          <div className="ghost-habit-card__cat">Entertainment</div>
          <div className="ghost-habit-card__sub">
            Actual {fmt(ghost.actual)} {currency} · Modeled {fmt(ghost.modeled)} {currency}
          </div>
        </div>
        <div className="ghost-habit-card__gap">
          {fmt(ghost.gapAmount)}
          <span className="ghost-habit-card__ccy">{currency}</span>
        </div>
      </div>

      <div className="ghost-ent-bar-wrap">
        <div className="ghost-habit-card__bar-track ghost-ent-bar-track">
          <div className="ghost-habit-card__bar-fill" style={{ width: `${widthPct}%` }} />
          <div className="ghost-ent-bubble-anchor">
            <div
              className="ghost-ent-bubble"
              tabIndex={0}
              role="tooltip"
              aria-label={`${ghost.bubbleTeaser}. Hover for week and month comparison.`}
            >
              <div className="ghost-ent-bubble__teaser">{ghost.bubbleTeaser}</div>
              <div className="ghost-ent-bubble__popover">
                <p className="ghost-ent-bubble__detail">{ghost.weekMonthDetail}</p>
                <p className="ghost-ent-bubble__vacation">{ghost.vacationLine}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className="ghost-ent-tag">Nights &amp; tickets</span>
    </div>
  );
}
