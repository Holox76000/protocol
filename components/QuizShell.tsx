import { ReactNode } from "react";
import { ProgressBar } from "./ProgressBar";

type QuizShellProps = {
  children: ReactNode;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  backDisabled?: boolean;
};

export function QuizShell({
  children,
  showProgress = false,
  currentStep = 0,
  totalSteps = 0,
  onBack,
  backDisabled = false
}: QuizShellProps) {
  return (
    <div className="min-h-screen bg-ash">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-black/70">
            Protocol
          </div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={backDisabled}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          ) : null}
        </div>

        {showProgress && totalSteps > 0 ? (
          <div className="mt-6">
            <ProgressBar current={currentStep} total={totalSteps} />
          </div>
        ) : null}

        <div className="mt-8 flex flex-1 flex-col justify-center gap-6">
          {children}
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-[0.3em] text-black/50">
          Built for men stuck between cutting and bulking.
        </p>
      </div>
    </div>
  );
}
