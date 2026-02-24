import { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  ghost?: string;
  tone?: "light" | "dark";
  sparkle?: boolean;
};

export function SectionShell({
  id,
  children,
  className,
  ghost,
  tone = "light",
  sparkle = false
}: SectionShellProps) {
  return (
    <section
      id={id}
      data-tone={tone}
      data-sparkle={sparkle}
      className={`section-shell py-24 ${className ?? ""}`.trim()}
    >
      {sparkle ? <div className="section-divider" aria-hidden="true" /> : null}
      {ghost ? (
        <div className="section-ghost" aria-hidden="true">
          {ghost}
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-6xl px-6">
        {children}
      </div>
    </section>
  );
}
