import Image from "next/image";

const FOLLOWERS_CARDS = [
  {
    title: "Recommended by Leading Fitness Scientists",
    description: "Supported by world-renowned experts.",
    image: "/program/static/landing/images/home/experts-think/doctor.webp",
    imageFit: "contain" as const,
    imagePosition: "center center",
  },
  {
    title: "Steroid-Free",
    description: "Effective enhancements, no surgery required.",
    renderMedia: <SkinnyFatRecompositionGraphic />,
  },
  {
    title: "100% Personalised",
    description: "Every recommendation is tailored to you.",
    renderMedia: <PersonalisedPlanGraphic />,
  },
  {
    title: "Science-Backed",
    description: "Backed by research, proven by results.",
    renderMedia: <ScienceBackedGraphic />,
  },
];

function SkinnyFatRecompositionGraphic() {
  return (
    <div className="program-followers__skinny-fat" aria-hidden="true">
      <svg viewBox="0 0 560 360" role="presentation">
        <defs>
          <linearGradient id="skinny-fat-surface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbfcfb" />
            <stop offset="100%" stopColor="#eef2ef" />
          </linearGradient>
          <linearGradient id="skinny-fat-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8d2c7" />
            <stop offset="100%" stopColor="#8ea08b" />
          </linearGradient>
          <linearGradient id="skinny-fat-line" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4ddd3" />
            <stop offset="100%" stopColor="#a8b4a5" />
          </linearGradient>
        </defs>

        <rect x="34" y="30" width="492" height="294" rx="28" fill="url(#skinny-fat-surface)" />

        <g opacity="0.9">
          <rect x="64" y="58" width="110" height="106" rx="24" fill="#f6f8f6" stroke="#dbe3da" />
          <rect x="202" y="58" width="156" height="106" rx="24" fill="#f9fbf9" stroke="#dbe3da" />
          <rect x="386" y="58" width="104" height="106" rx="24" fill="#f6f8f6" stroke="#dbe3da" />
          <rect x="64" y="186" width="206" height="100" rx="24" fill="#f9fbf9" stroke="#dbe3da" />
          <rect x="286" y="186" width="204" height="100" rx="24" fill="#f6f8f6" stroke="#dbe3da" />
        </g>

        <g transform="translate(92 74) scale(0.92)">
          <path
            d="M28 12c18 0 31 14 31 32v9c0 10-4 20-11 27l-8 8v29h-24V88l-8-8C1 73-3 63-3 53v-9C-3 26 10 12 28 12Z"
            fill="#dbe4db"
          />
          <path
            d="M28 30c8 0 14 6 14 15v6c0 7-3 13-8 18l-6 7-6-7c-5-5-8-11-8-18v-6c0-9 6-15 14-15Z"
            fill="#a8b8a5"
          />
          <path d="M28 76v41" stroke="url(#skinny-fat-line)" strokeWidth="8" strokeLinecap="round" />
          <path d="M2 116h52" stroke="#c2ccc0" strokeWidth="8" strokeLinecap="round" />
          <path d="M11 126h34" stroke="#d3dbd1" strokeWidth="8" strokeLinecap="round" />
        </g>

        <g transform="translate(220 76)">
          <text x="0" y="0" className="program-followers__skinny-fat-label">
            SKINNY FAT
          </text>
          <text x="0" y="30" className="program-followers__skinny-fat-title">
            <tspan x="0" dy="0">
              Recomposition
            </tspan>
            <tspan x="0" dy="20">
              path
            </tspan>
          </text>
        </g>

        <g transform="translate(414 82) scale(0.88)">
          <circle cx="30" cy="30" r="26" fill="#eef3ee" stroke="#d2dbd1" />
          <path
            d="M30 14c9 0 16 7 16 16s-7 16-16 16-16-7-16-16 7-16 16-16Zm0 8c-4 0-7 4-7 8 0 5 3 8 7 8s7-3 7-8c0-4-3-8-7-8Z"
            fill="#91a38e"
          />
          <path d="M14 56h32" stroke="#bac6b8" strokeWidth="8" strokeLinecap="round" />
        </g>

        <g transform="translate(84 208) scale(0.9)">
          <path
            d="M0 42h40l26-18 42 8 38-24 44 12"
            fill="none"
            stroke="url(#skinny-fat-accent)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="42" r="8" fill="#d2dbd1" />
          <circle cx="66" cy="24" r="8" fill="#bcc8ba" />
          <circle cx="108" cy="32" r="8" fill="#a9b9a6" />
          <circle cx="146" cy="8" r="8" fill="#95a692" />
          <circle cx="190" cy="20" r="8" fill="#7f947d" />
          <text x="0" y="84" className="program-followers__skinny-fat-small">
            Leaner waist
          </text>
          <text x="118" y="78" className="program-followers__skinny-fat-small">
            <tspan x="128" dy="0">
              More upper-body
            </tspan>
            <tspan x="128" dy="16">
              shape
            </tspan>
          </text>
        </g>

        <g transform="translate(336 210)">
          <rect x="0" y="0" width="134" height="66" rx="18" fill="#f9fbf9" stroke="#d7e0d6" />
          <text x="18" y="24" className="program-followers__skinny-fat-stat">
            + Shoulder width
          </text>
          <text x="18" y="42" className="program-followers__skinny-fat-stat">
            - Lower abdomen
          </text>
          <text x="18" y="60" className="program-followers__skinny-fat-stat">
            + Visible structure
          </text>
        </g>
      </svg>
    </div>
  );
}

function ScienceBackedGraphic() {
  return (
    <div className="program-followers__science" aria-hidden="true">
      <svg viewBox="0 0 560 360" role="presentation">
        <defs>
          <linearGradient id="science-surface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbfcfb" />
            <stop offset="100%" stopColor="#eef2ef" />
          </linearGradient>
        </defs>

        <rect x="34" y="30" width="492" height="294" rx="28" fill="url(#science-surface)" />

        <g opacity="0.94">
          <rect x="90" y="72" width="110" height="86" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="220" y="72" width="160" height="86" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="400" y="72" width="70" height="86" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="90" y="188" width="150" height="86" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="258" y="188" width="212" height="86" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
        </g>

        <g transform="translate(116 92)">
          <path d="M0 42h28l22-18 24 10 20-16" fill="none" stroke="#98a896" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="0" cy="42" r="7" fill="#c5cec3" />
          <circle cx="50" cy="24" r="7" fill="#aab9a7" />
          <circle cx="74" cy="34" r="7" fill="#95a492" />
          <circle cx="94" cy="18" r="7" fill="#7f917c" />
        </g>

        <g transform="translate(240 94)">
          <text x="0" y="0" className="program-followers__science-label">
            SCIENCE-BACKED
          </text>
          <text x="0" y="30" className="program-followers__science-title">
            <tspan x="0" dy="0">Research-led</tspan>
            <tspan x="0" dy="18">protocols</tspan>
          </text>
        </g>

        <g transform="translate(418 92)">
          <circle cx="18" cy="18" r="16" fill="#edf2ed" stroke="#d4ddd3" />
          <path d="m10 18 5 5 11-12" fill="none" stroke="#7f917c" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g transform="translate(112 212)">
          <path d="M0 42h38l30-16 34 10" fill="none" stroke="#a6b4a3" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="0" cy="42" r="8" fill="#d0d8ce" />
          <circle cx="68" cy="26" r="8" fill="#adbcaa" />
          <circle cx="102" cy="36" r="8" fill="#8e9f8a" />
          <text x="0" y="74" className="program-followers__science-small">Measured inputs</text>
        </g>

        <g transform="translate(284 205)">
          <rect x="0" y="0" width="160" height="52" rx="18" fill="#fbfcfb" stroke="#d7dfd6" />
          <path d="M24 19h46M24 33h70" stroke="#97a796" strokeWidth="7" strokeLinecap="round" />
          <path d="m118 18 10 10 18-18" fill="none" stroke="#7f917c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <text x="0" y="76" className="program-followers__science-small">Validated results</text>
        </g>
      </svg>
    </div>
  );
}

function PersonalisedPlanGraphic() {
  return (
    <div className="program-followers__personalised" aria-hidden="true">
      <svg viewBox="0 0 560 360" role="presentation">
        <defs>
          <linearGradient id="personalised-surface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbfcfb" />
            <stop offset="100%" stopColor="#eef2ef" />
          </linearGradient>
          <linearGradient id="personalised-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c5cec3" />
            <stop offset="100%" stopColor="#829381" />
          </linearGradient>
        </defs>

        <rect x="34" y="30" width="492" height="294" rx="28" fill="url(#personalised-surface)" />

        <g opacity="0.94">
          <rect x="64" y="58" width="116" height="104" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="196" y="58" width="168" height="104" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="382" y="58" width="108" height="104" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="64" y="182" width="220" height="104" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
          <rect x="302" y="182" width="188" height="104" rx="22" fill="#f8faf8" stroke="#d9e0d7" />
        </g>

        <g transform="translate(92 82)">
          <circle cx="30" cy="28" r="24" fill="#edf2ed" stroke="#d3dbd2" />
          <path
            d="M30 16c6 0 11 5 11 11s-5 11-11 11-11-5-11-11 5-11 11-11Zm0 26c12 0 22 8 24 20H6c2-12 12-20 24-20Z"
            fill="#94a491"
          />
        </g>

        <g transform="translate(218 78)">
          <text x="0" y="0" className="program-followers__personalised-label">
            100% PERSONALISED
          </text>
          <text x="0" y="28" className="program-followers__personalised-title">
            Tailored plan
            <tspan x="0" dy="18">
              for your body
            </tspan>
          </text>
        </g>

        <g transform="translate(408 80)">
          <rect x="0" y="0" width="56" height="52" rx="14" fill="#eef3ee" stroke="#d5ddd4" />
          <path d="M16 18h24M16 28h18M16 38h20" stroke="#9aac97" strokeWidth="6" strokeLinecap="round" />
        </g>

        <g transform="translate(86 202)">
          <rect x="0" y="0" width="176" height="68" rx="18" fill="#fbfcfb" stroke="#d7dfd6" />
          <path d="M22 24h46M22 42h68" stroke="#98a896" strokeWidth="7" strokeLinecap="round" />
          <circle cx="126" cy="24" r="10" fill="#c4cec2" />
          <circle cx="146" cy="42" r="10" fill="#8ea08b" />
        </g>

        <g transform="translate(322 196)">
          <path
            d="M0 58c28-20 56-32 84-36 22-3 42 0 62 10"
            fill="none"
            stroke="url(#personalised-accent)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="0" cy="58" r="8" fill="#c6cfc4" />
          <circle cx="82" cy="22" r="8" fill="#9daf9a" />
          <circle cx="146" cy="32" r="8" fill="#7f917c" />
          <text x="4" y="90" className="program-followers__personalised-small">
            Inputs
          </text>
          <text x="106" y="90" className="program-followers__personalised-small">
            Custom output
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function FollowersSection() {
  return (
    <section className="program-followers" aria-labelledby="program-followers-title">
      <div className="program-followers__inner">
        <aside
          className="program-followers__hero"
          style={{ ["--followers-bg" as string]: "url(/program/static/landing/images/home/features-grid/background.webp)" }}
        >
          <div className="program-followers__hero-top">
            <p className="program-followers__num">25k+</p>
            <p className="program-followers__label">men</p>
          </div>
          <h2 id="program-followers-title" className="program-followers__hero-copy">
            The world&apos;s largest male body transformation science community
          </h2>
        </aside>

        <div className="program-followers__grid">
          {FOLLOWERS_CARDS.map((card) => (
            <article key={card.title} className="program-followers__card">
              <div className="program-followers__media">
                {"renderMedia" in card ? (
                  card.renderMedia
                ) : (
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw"
                    style={{ objectFit: card.imageFit, objectPosition: card.imagePosition }}
                  />
                )}
              </div>
              <div className="program-followers__text">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
