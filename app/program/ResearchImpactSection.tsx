"use client";

import { useMemo, useState } from "react";

export type ResearchItem = {
  titleHtml: string;
  description: string;
  source: string;
};

export type ResearchTab = {
  label: string;
  items: ResearchItem[];
};

type ResearchImpactSectionProps = {
  tabs: ResearchTab[];
  titleHtml?: string;
  subtitle?: string;
};

export default function ResearchImpactSection({
  tabs,
  titleHtml = "Your Body Composition Impacts <strong>Your Life More Than You Think</strong>",
  subtitle = "Research consistently shows that men with a lean, athletic build earn more, attract more, and are perceived as more capable. Below is a detailed collection of studies.",
}: ResearchImpactSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeTab = useMemo(() => tabs[activeIndex] ?? tabs[0], [tabs, activeIndex]);

  if (!activeTab) {
    return null;
  }

  return (
    <section className="program-research" aria-labelledby="program-research-title">
      <div className="program-research__inner">
        <header className="program-research__header">
          <p className="program-research__eyebrow">Research</p>
          <h2
            id="program-research-title"
            className="program-research__title"
            dangerouslySetInnerHTML={{ __html: titleHtml }}
          />
          <p className="program-research__subtitle">{subtitle}</p>
        </header>

        <div className="program-research__tabs" aria-label="Research categories">
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={tab.label}
                type="button"
                className={`program-research__tab${isActive ? " is-active" : ""}`}
                aria-pressed={isActive}
                aria-expanded={isActive}
                aria-controls={`program-research-panel-${index}`}
                id={`program-research-tab-${index}`}
                onClick={() => setActiveIndex(index)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="program-research__panel"
          id={`program-research-panel-${activeIndex}`}
          aria-labelledby={`program-research-tab-${activeIndex}`}
        >
          {activeTab.items.length > 0 ? (
            activeTab.items.map((item, idx) => (
              <div key={`${item.titleHtml}-${idx}`} className="program-research__row">
                <div
                  className="program-research__row-title"
                  dangerouslySetInnerHTML={{ __html: item.titleHtml }}
                />
                <div className="program-research__row-body">
                  <p className="program-research__row-description">{item.description}</p>
                  <p className="program-research__row-source">
                    <span className="program-research__row-source-icon" aria-hidden="true" />
                    <span>{item.source}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="program-research__row program-research__row--empty">
              <div className="program-research__row-title">More coming soon</div>
              <div className="program-research__row-body">
                <p className="program-research__row-description">
                  This category is being finalized. Check back shortly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
