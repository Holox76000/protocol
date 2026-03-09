import Image from "next/image";
import BeforeAfterSlider from "../program/BeforeAfterSlider";
import styles from "./interface.module.css";
import beforeImage from "../../2-before.png";
import afterImage from "../../2-after.png";

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
    title: "Take magnesium to improve sleep quality",
    text:
      "Your recovery markers suggest you are not sleeping enough. Magnesium glycinate in the evening can help you fall asleep faster, stay asleep longer, and recover better from training.",
  },
  {
    title: "Increase your daily protein intake",
    text:
      "Your current intake is too low for body recomposition. Push protein higher so you preserve muscle while leaning out and give your body enough raw material to build new tissue.",
  },
  {
    title: "Reduce cardio and shift toward resistance training",
    text:
      "Too much cardio is limiting muscle gain. Replace part of it with structured lifting so you can build more mass, improve shape, and raise your resting metabolic rate over time.",
  },
];

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <mask id="protocol-interface-logo-mask">
          <rect width="32" height="32" fill="black" />
          <circle cx="14" cy="14" r="12" fill="none" stroke="white" strokeWidth="24" />
        </mask>
      </defs>
      <g mask="url(#protocol-interface-logo-mask)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.11495 19.1086C5.42092 12.6972 5.16924 5.91332 8.55161 3.9569C11.934 1.9993 17.6708 5.61043 21.3649 12.0218C22.8785 14.65 23.8146 17.3407 24.1592 19.7356C25.2647 17.9984 25.9021 15.9571 25.9021 13.7744C25.9021 7.43368 20.5299 2.29395 13.9015 2.29395C7.27441 2.29395 1.90213 7.43368 1.90213 13.7744C1.90213 20.1139 7.27441 25.2536 13.9015 25.2536C14.0039 25.2536 14.1062 25.2524 14.2085 25.2501C12.3715 23.7604 10.5827 21.6554 9.11495 19.1086Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24.1592 19.7354C22.1023 22.9658 18.4259 25.1485 14.2085 25.2499C16.9946 27.5104 19.8889 28.353 21.9282 27.1733C23.924 26.0195 24.6543 23.1838 24.1592 19.7354Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

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

export default function InterfacePage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <a href="/" className={styles.logoLink} aria-label="Protocol home">
              <LogoMark />
            </a>
            <button type="button" className={styles.iconButton} aria-label="Collapse sidebar">
              <SidebarIcon />
            </button>
          </div>

          <nav className={styles.nav} aria-label="Interface sections">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="/interface"
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
                Markus&apos;s <span>Protocol</span>
              </h1>
              <p className={styles.subtitle}>
                Here&apos;s what your leaner, more athletic physique could look like with the right protocol.
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
                beforePosition="50% 18%"
                afterPosition="50% 18%"
              />
            </section>
          </div>

          <aside className={styles.detailsColumn}>
            <section className={styles.scorePanel}>
              <div className={styles.scoreHeader}>
                <div>
                  <p className={styles.eyebrow}>Aesthetic score</p>
                  <p className={styles.scoreCaption}>Your score is higher than 65% of your age group.</p>
                </div>
                <div className={styles.scoreBox}>72</div>
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
                <h2>Build a sharper V-taper</h2>
              </div>

              <div className={styles.thumbRow}>
                <div className={styles.thumbCard}>
                  <Image src={beforeImage} alt="Before body preview" fill sizes="160px" />
                </div>
                <div className={styles.thumbArrow} aria-hidden="true">
                  →
                </div>
                <div className={styles.thumbCard}>
                  <Image src={afterImage} alt="After body preview" fill sizes="160px" />
                </div>
              </div>

              <div className={styles.copyBlock}>
                <h3>Why this recommendation?</h3>
                <p>
                  A stronger upper back, wider shoulders, and a tighter waist create a more athletic silhouette.
                  This improves proportions immediately and makes the whole physique look leaner, stronger, and
                  more put together.
                </p>
              </div>

              <div className={styles.copyBlock}>
                <h3>The solutions we offer</h3>
                <p>
                  We focus on body recomposition changes that are realistic, measurable, and sustainable without
                  guesswork or shortcuts.
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
                  <strong>Upper-body specialization block</strong>
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
