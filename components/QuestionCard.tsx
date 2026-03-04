import type { Question } from "../lib/quizConfig";

type QuestionCardProps = {
  question: Question;
  selected?: string;
  onSelect: (optionId: string) => void;
};

export function QuestionCard({ question, selected, onSelect }: QuestionCardProps) {
  return (
    <div className="card-raise rounded-3xl border border-black/20 bg-white p-6">
      <p className="text-[11px] uppercase tracking-[0.4em] text-black/60">Assessment</p>
      <h2 className="mt-3 text-2xl font-display font-semibold uppercase tracking-[0.1em] text-black">
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
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm uppercase tracking-[0.15em] transition ${
                isActive
                  ? "border-black bg-black text-white"
                  : "border-black/20 bg-white text-black/70 hover:border-black hover:bg-black/5"
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
