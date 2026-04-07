import Image from "next/image";
import BeforeAfterSlider from "../../program/BeforeAfterSlider";
import styles from "../../interface/interface.module.css";
const beforeImage = { src: "/assets/woman-1-before.png" };
const afterImage = { src: "/assets/woman-1-after.png" };

const navItems = [
  { label: "Protocols", active: true, badge: null },
  { label: "Biometrics", active: false, badge: null },
  { label: "Your Analysis", active: false, badge: null },
  { label: "Stack", active: false, badge: "Coming Soon" },
  { label: "Settings", active: false, badge: null },
];

const statCards = [
  { label: "Category", value: "Training" },
  { label: "Recommendation level", value: "#1" },
  { label: "Difficulty", value: "Low" },
  { label: "Cadence", value: "Daily" },
];

const recommendations = [
  {
    title: "Increase glute-focused lower-body work",
    text:
      "Your proportions would benefit from more lower-body volume and progressive overload. Building the glutes changes the whole silhouette faster than most women expect.",
  },
  {
    title: "Tighten your nutrition around protein and recovery",
    text:
      "Your current body-composition pattern suggests you need more consistency in protein intake and recovery support to lose softness without flattening your shape.",
  },
  {
    title: "Replace random cardio with structured training",
    text:
      "Too much low-value cardio often keeps women tired without changing proportions. A better strength split will improve tone, posture, and shape more predictably.",
  },
];

function SidebarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 2.75V15.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MenuGlyph({ active = false }: { active?: boolean }) {
  return (
    <span className={`${styles.menuGlyph} ${active ? styles.menuGlyphActive : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export const metadata = {
  title: "Protocol | Women Interface",
};

export default function WomanInterfacePage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <a href="/woman" className={styles.logoLink} aria-label="Protocol women home">
              <Image
                src="/program/static/landing/images/shared/Prtcl.png"
                alt="Protocol"
                width={44}
                height={44}
                className={styles.logoImage}
              />
            </a>
            <button type="button" className={styles.iconButton} aria-label="Collapse sidebar">
              <SidebarIcon />
            </button>
          </div>

          <nav className={styles.nav} aria-label="Interface sections">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="/woman/interface"
                className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
              >
                <MenuGlyph active={item.active} />
                <span>{item.label}</span>
                {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
              </a>
            ))}
          </nav>

          <button type="button" className={styles.logout}>
            <span className={styles.logoutIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3H3.75A1.75 1.75 0 0 0 2 4.75v6.5C2 12.2165 2.7835 13 3.75 13H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M9 11L12 8L9 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span>Logout</span>
          </button>
        </aside>

        <section className={styles.workspace}>
          <div className={styles.mainColumn}>
            <div className={styles.toolbar}>
              <button type="button" className={styles.customizeButton}>
                <span>Customize</span>
                <span className={styles.sparkle}>✧</span>
              </button>
            </div>

            <header className={styles.hero}>
              <h1 className={styles.title}>
                Sophia&apos;s <span>Protocol</span>
              </h1>
              <p className={styles.subtitle}>
                Here&apos;s what your leaner, tighter, more sculpted shape could look like with the right protocol.
              </p>
            </header>

            <section className={styles.compareCard} aria-label="Before and after preview">
              <div className={styles.compareLabels}>
                <span>Before</span>
                <span>After</span>
              </div>
              <BeforeAfterSlider
                className={styles.compareSlider}
                subject="Body transformation preview"
                beforeSrc={beforeImage.src}
                afterSrc={afterImage.src}
                beforeAlt="Before body"
                afterAlt="After body"
                beforePosition="50% 24%"
                afterPosition="50% 24%"
              />
            </section>
          </div>

          <aside className={styles.detailsColumn}>
            <section className={styles.scorePanel}>
              <div className={styles.scoreHeader}>
                <div>
                  <p className={styles.eyebrow}>Aesthetic score</p>
                  <p className={styles.scoreCaption}>Your score is higher than 71% of your age group.</p>
                </div>
                <div className={styles.scoreBox}>79</div>
              </div>
              <div className={styles.progressTrack} aria-hidden="true">
                <span className={styles.progressBar} />
              </div>
            </section>

            <section className={styles.recommendationCard}>
              <div className={styles.recommendationTop}>
                <button type="button" className={styles.backButton} aria-label="Back">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M11.25 4.5L6.75 9L11.25 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h2>Build a tighter waist-to-glute ratio</h2>
              </div>

              <div className={styles.thumbRow}>
                <div className={styles.thumbCard}>
                  <Image src={beforeImage.src} alt="Before body preview" fill sizes="160px" />
                </div>
                <div className={styles.thumbArrow} aria-hidden="true">
                  →
                </div>
                <div className={styles.thumbCard}>
                  <Image src={afterImage.src} alt="After body preview" fill sizes="160px" />
                </div>
              </div>

              <div className={styles.copyBlock}>
                <h3>Why this recommendation?</h3>
                <p>
                  A tighter waist, better posture, and fuller glutes create a more athletic and sculpted silhouette.
                  Improving those proportions changes how the whole body reads almost immediately.
                </p>
              </div>

              <div className={styles.copyBlock}>
                <h3>The solutions we offer</h3>
                <p>
                  We focus on body-recomposition changes that are realistic, measurable, and sustainable without
                  guesswork or extremes.
                </p>
              </div>

              <div className={styles.copyBlock}>
                <h3>Priority recommendations</h3>
                <div className={styles.recommendationList}>
                  {recommendations.map((item) => (
                    <article key={item.title} className={styles.recommendationItem}>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className={styles.solutionHeader}>
                <div>
                  <strong>Lower-body specialization block</strong>
                  <span className={styles.solutionBadge}>Best &amp; Most Sustainable</span>
                </div>
                <span className={styles.chevron} aria-hidden="true">
                  ⌃
                </span>
              </div>

              <div className={styles.statsGrid}>
                {statCards.map((card) => (
                  <article key={card.label} className={styles.statCard}>
                    <p>{card.label}</p>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
