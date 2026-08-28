// Shared "old vs new" metric bars — drops above a dt-oldnew grid to *show* the
// gap (cost / time) instead of leaving the numbers buried in the two lists.
// The "new" bar inherits the page's --accent, so each vertical tints its own.

export type CompareMetric = {
  label: string;
  oldVal: string;
  newVal: string;
  /** New bar width as a % of the old (full) bar. Old is always the 100% reference. */
  newPct: number;
};

export function CompareBars({ metrics }: { metrics: CompareMetric[] }) {
  return (
    <div className="mo-compare" role="presentation">
      {metrics.map((m) => (
        <div className="mo-compare__row" key={m.label}>
          <div className="mo-compare__label">{m.label}</div>
          <div className="mo-compare__line">
            <div className="mo-compare__cell">
              <span className="mo-compare__bar mo-compare__bar--old" style={{ width: "100%" }} />
            </div>
            <span className="mo-compare__val">{m.oldVal}</span>
          </div>
          <div className="mo-compare__line">
            <div className="mo-compare__cell">
              <span
                className="mo-compare__bar mo-compare__bar--new"
                style={{ width: `${Math.max(m.newPct, 2)}%` }}
              />
            </div>
            <span className="mo-compare__val mo-compare__val--new">{m.newVal}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
