import Link from "next/link";
import "./program.css";
import type { ReactNode } from "react";

type InternalPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function InternalPageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: InternalPageShellProps) {
  return (
    <main className="program-internal program-internal--theme-test">
      <section className="program-internal__hero">
        <div className="program-internal__shell">
          <div className="program-internal__topbar">
            <Link href="/" className="program-internal__logo" aria-label="Back to homepage">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="program-internal-logo-mask">
                    <rect width="32" height="32" fill="black" />
                    <circle cx="14" cy="14" r="12" fill="none" stroke="white" strokeWidth="24" />
                  </mask>
                </defs>
                <g mask="url(#program-internal-logo-mask)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.11495 19.1086C5.42092 12.6972 5.16924 5.91332 8.55161 3.9569C11.934 1.9993 17.6708 5.61043 21.3649 12.0218C22.8785 14.65 23.8146 17.3407 24.1592 19.7356C25.2647 17.9984 25.9021 15.9571 25.9021 13.7744C25.9021 7.43368 20.5299 2.29395 13.9015 2.29395C7.27441 2.29395 1.90213 7.43368 1.90213 13.7744C1.90213 20.1139 7.27441 25.2536 13.9015 25.2536C14.0039 25.2536 14.1062 25.2524 14.2085 25.2501C12.3715 23.7604 10.5827 21.6554 9.11495 19.1086Z"
                    fill="#233137"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M24.1592 19.7354C22.1023 22.9658 18.4259 25.1485 14.2085 25.2499C16.9946 27.5104 19.8889 28.353 21.9282 27.1733C23.924 26.0195 24.6543 23.1838 24.1592 19.7354Z"
                    fill="#233137"
                  />
                </g>
              </svg>
            </Link>
            <div className="program-internal__actions">
              <Link href="/" className="program-internal__back">
                Back to homepage
              </Link>
              <Link href="/checkout?funnel=main" className="program-internal__cta">
                Get started
              </Link>
            </div>
          </div>

          <header className="program-internal__header">
            <p className="program-internal__eyebrow">{eyebrow}</p>
            <h1 className="program-internal__title">{title}</h1>
            {subtitle ? <p className="program-internal__subtitle">{subtitle}</p> : null}
          </header>

          <div className="program-internal__content">{children}</div>
        </div>
      </section>
    </main>
  );
}
