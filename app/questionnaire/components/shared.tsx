"use client";

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{eyebrow}</p>
      <h2 className="mt-2 font-display text-[30px] font-normal leading-tight text-void">{title}</h2>
      {subtitle && (
        <p className="mt-2.5 text-[14px] leading-relaxed text-dim">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
  label,
  sublabel,
  required,
  children,
}: {
  label: string;
  sublabel?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-[13.5px] font-semibold text-void">
          {label}
          {required && <span className="ml-1 text-mute">*</span>}
        </p>
        {sublabel && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-dim">{sublabel}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Section Footer ───────────────────────────────────────────────────────────

export function SectionFooter({
  onNext,
  onBack,
  saving,
  error,
  isFirst,
  nextLabel,
}: {
  onNext: () => void;
  onBack?: () => void;
  saving: boolean;
  error: string | null;
  isFirst?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-10">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        {!isFirst && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-wire px-5 py-2.5 text-[13px] font-semibold text-dim transition-all duration-150 hover:border-void/30 hover:text-void active:scale-[0.98]"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-void px-6 py-2.5 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Saving
            </span>
          ) : (
            nextLabel ?? "Continue →"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── CardSelect ───────────────────────────────────────────────────────────────

type CardOption = { value: string; label: string; sublabel?: string };

export function CardSelect({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: CardOption[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`group w-full rounded-xl border px-4 py-3.5 text-left transition-all duration-150 ${
              selected
                ? "border-void bg-void text-white shadow-[0_2px_8px_rgba(12,12,13,0.2)]"
                : "border-wire bg-white text-void hover:border-void/25 hover:shadow-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-semibold leading-snug">{opt.label}</span>
                {opt.sublabel && (
                  <span className={`mt-1 block text-[12px] leading-relaxed ${selected ? "text-white/55" : "text-dim"}`}>
                    {opt.sublabel}
                  </span>
                )}
              </div>
              {/* Selection indicator */}
              <div
                className={`mt-0.5 shrink-0 flex items-center justify-center rounded-full border transition-all duration-150 ${
                  selected
                    ? "border-white/40 bg-white/15"
                    : "border-wire group-hover:border-void/30"
                }`}
                style={{ height: 18, width: 18 }}
              >
                {selected && (
                  <div className="check-enter h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── TagSelect ────────────────────────────────────────────────────────────────

type TagOption = { value: string; label: string };

export function TagSelect({
  value,
  onChange,
  options,
  max,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: TagOption[];
  max?: number;
}) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, v]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {max && (
        <p className="w-full text-[11px] font-medium text-mute mb-0.5">
          {value.length} / {max} selected
        </p>
      )}
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        const atMax = max !== undefined && value.length >= max && !selected;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={atMax}
            className={`rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-all duration-150 ${
              selected
                ? "border-void bg-void text-white"
                : atMax
                ? "border-wire bg-pebble text-mute cursor-not-allowed"
                : "border-wire bg-white text-void hover:border-void/30 active:scale-[0.97]"
            }`}
          >
            {selected && <span className="mr-1.5 text-white/60 text-[11px]">✓</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

export function Stepper({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-wire bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-4 py-3 text-[18px] leading-none text-dim transition-colors hover:bg-pebble hover:text-void disabled:cursor-not-allowed disabled:opacity-30"
      >
        −
      </button>
      <div className="flex min-w-[100px] items-center justify-center border-x border-wire px-5 py-3">
        <span className="text-[15px] font-semibold tabular-nums text-void">{value}</span>
        {suffix && <span className="ml-1.5 text-[12px] text-dim">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-4 py-3 text-[18px] leading-none text-dim transition-colors hover:bg-pebble hover:text-void disabled:cursor-not-allowed disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
