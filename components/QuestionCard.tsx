import type { Question } from "../lib/quizConfig";

type QuestionCardProps = {
  question: Question;
  selected?: string;
  onSelect: (optionId: string) => void;
};

export function QuestionCard({ question, selected, onSelect }: QuestionCardProps) {
  return (
    <div className="rounded-3xl border border-black bg-white p-6 shadow-hard">
      <p className="text-[11px] uppercase tracking-[0.4em] text-charcoal/70">Assessment</p>
      <h2 className="mt-3 text-2xl font-display font-semibold text-ink">
        {question.title}
      </h2>
      <div className="mt-5 flex flex-col gap-3">
        {question.options.map((option) => {
          const isActive = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-base font-medium transition ${
                isActive
                  ? "border-black bg-black text-white shadow-hard"
                  : "border-black/15 bg-white text-charcoal hover:border-black hover:bg-fog"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
