type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-black/60">
        <span>Progress</span>
        <span>{current} / {total}</span>
      </div>
      <div className="mt-3 h-[3px] w-full bg-black/10">
        <div
          className="h-[3px] bg-black transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
