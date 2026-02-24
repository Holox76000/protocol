type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-charcoal/70">
        <span>Progress</span>
        <span>{current} / {total}</span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-fog">
        <div
          className="h-2 rounded-full bg-ink transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
