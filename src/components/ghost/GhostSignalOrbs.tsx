import { useState } from 'react';
import type { GhostSuggestion } from '../../types/dashboard.types';
import '../../styles/ghost.css';

interface GhostSignalOrbsProps {
  suggestions: GhostSuggestion[];
}

function orbToneClass(signal: GhostSuggestion['signal']): string {
  if (signal === 'good') return 'ghost-orb--good';
  if (signal === 'alert') return 'ghost-orb--alert';
  return 'ghost-orb--caution';
}

export function GhostSignalOrbs({ suggestions }: GhostSignalOrbsProps) {
  const [active, setActive] = useState<number | null>(null);

  if (suggestions.length === 0) return null;

  return (
    <div className="ghost-signals">
      <div className="ghost-signals__label">Quick reads from this week &amp; month — hover an orb</div>
      <p className="ghost-signals__legend small mb-3 mb-md-2">
        <span className="ghost-signals__legend-item">
          <span className="ghost-signals__dot ghost-signals__dot--good" aria-hidden /> Green — on track
        </span>
        <span className="ghost-signals__legend-item">
          <span className="ghost-signals__dot ghost-signals__dot--caution" aria-hidden /> Orange — watch
        </span>
        <span className="ghost-signals__legend-item">
          <span className="ghost-signals__dot ghost-signals__dot--alert" aria-hidden /> Red — priority
        </span>
      </p>
      <div className="ghost-signals__orbs">
        {suggestions.map((s, idx) => {
          const tone = s.signal ?? 'caution';
          const orbClass = orbToneClass(tone);
          const toneLabel =
            tone === 'good' ? ' (on track)' : tone === 'alert' ? ' (priority)' : ' (watch)';
          return (
          <div
            key={`${s.title}-${idx}`}
            className={`ghost-orb-wrap ${active === idx ? 'is-lit' : ''}`}
            onMouseEnter={() => setActive(idx)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(idx)}
            onBlur={() => setActive(null)}
            tabIndex={0}
          >
            <button
              type="button"
              className={`ghost-orb ${orbClass}`}
              aria-label={`${s.title}${toneLabel}`}
            >
              <span className="ghost-orb__glow" />
            </button>
            <span className="ghost-orb__title">{s.title}</span>
          </div>
          );
        })}
      </div>
      <div className={`ghost-signals__panel ${active !== null ? 'is-visible' : ''}`} aria-live="polite">
        {active !== null && (
          <div key={active} className="ghost-signals__panel-inner">
            <strong className="d-block text-light mb-1 opacity-90">{suggestions[active].title}</strong>
            <p className="mb-0 small text-white-50">{suggestions[active].detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
