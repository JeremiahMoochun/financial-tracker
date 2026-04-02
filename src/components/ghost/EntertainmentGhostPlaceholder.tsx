import '../../styles/ghost.css';

/** Shown when the API has no entertainment payload yet — same layout so the feature is visible. */
export function EntertainmentGhostPlaceholder() {
  return (
    <div className="ghost-habit-card ghost-ent-card ghost-ent-placeholder">
      <div className="ghost-habit-card__top">
        <span className="ghost-pulse" aria-hidden />
        <div>
          <div className="ghost-habit-card__cat">Entertainment</div>
          <div className="ghost-habit-card__sub">
            Log at least one Entertainment expense to unlock personalized copy
          </div>
        </div>
        <div className="ghost-habit-card__gap ghost-ent-placeholder__dash">
          —
        </div>
      </div>

      <div className="ghost-ent-bar-wrap">
        <div className="ghost-habit-card__bar-track ghost-ent-bar-track">
          <div className="ghost-habit-card__bar-fill" style={{ width: '12%' }} />
          <div className="ghost-ent-bubble-anchor">
            <div
              className="ghost-ent-bubble ghost-ent-bubble--placeholder"
              tabIndex={0}
              role="tooltip"
              aria-label="Placeholder: add Entertainment spending to see live tips."
            >
              <div className="ghost-ent-bubble__teaser">
                Summon the bubble — add an Entertainment expense
              </div>
              <div className="ghost-ent-bubble__popover">
                <p className="ghost-ent-bubble__detail">
                  Week vs prior week and month vs same span last month show here after you log Entertainment
                  with <strong>dates</strong> on your expenses.
                </p>
                <p className="ghost-ent-bubble__vacation">
                  Set a savings goal above (e.g. vacation); live text will tie trimmable spend to that goal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className="ghost-ent-tag">Nights &amp; tickets</span>
    </div>
  );
}
