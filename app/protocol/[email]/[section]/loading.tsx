export default function ProtocolSectionLoading() {
  const navRows = [
    { w: 128, delay: 0.00 },
    { w: 112, delay: 0.07 },
    { w: 100, delay: 0.14 },
    { isGroup: true, w: 52, delay: 0.20 },
    { w: 120, delay: 0.26 },
    { w: 144, delay: 0.33 },
    { w: 108, delay: 0.40 },
    { w: 124, delay: 0.47 },
    { w: 130, delay: 0.54 },
  ];

  // r=23 → circumference ≈ 144.5 ; arc ≈ 30 % → 43 dash / 101 gap
  const R = 23;
  const C = 2 * Math.PI * R;
  const arcLen = C * 0.3;
  const gapLen = C - arcLen;

  return (
    <>
      <style>{`
        @keyframes _shimmer {
          0%   { background-position: -320px 0; }
          100% { background-position: 320px  0; }
        }
        @keyframes _spin {
          to { transform: rotate(360deg); }
        }
        @keyframes _rise {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .psk {
          background: linear-gradient(
            90deg,
            #edeae4 0px,
            #f8f6f3 80px,
            #edeae4 160px
          );
          background-size: 320px 100%;
          animation: _shimmer 1.8s ease-in-out infinite;
          border-radius: 3px;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f6f5f2" }}>

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <header style={{
          height: 48,
          flexShrink: 0,
          background: "#fff",
          borderBottom: "1px solid #e6e4df",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 10,
        }}>
          <div className="psk" style={{ width: 28, height: 28, borderRadius: 7 }} />
          <div className="psk" style={{ width: 130, height: 12 }} />
          <div style={{ flex: 1 }} />
          <div className="psk" style={{ width: 72, height: 10 }} />
        </header>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* Sidebar */}
          <aside style={{
            width: 216,
            flexShrink: 0,
            background: "#fff",
            borderRight: "1px solid #e6e4df",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Identity row */}
            <div style={{
              borderBottom: "1px solid #e6e4df",
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div className="psk" style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="psk" style={{ width: 100, height: 12 }} />
                <div className="psk" style={{ width: 68, height: 8 }} />
              </div>
            </div>

            {/* Nav items */}
            <nav style={{ padding: "10px", display: "flex", flexDirection: "column" }}>
              {navRows.map((row, i) =>
                row.isGroup ? (
                  <div key={i} style={{ padding: "14px 10px 6px" }}>
                    <div
                      className="psk"
                      style={{ width: row.w, height: 7, animationDelay: `${row.delay}s` }}
                    />
                  </div>
                ) : (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                  }}>
                    <div
                      className="psk"
                      style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0, animationDelay: `${row.delay}s` }}
                    />
                    <div
                      className="psk"
                      style={{ width: row.w, height: 11, animationDelay: `${row.delay}s` }}
                    />
                  </div>
                )
              )}
            </nav>
          </aside>

          {/* ── Content: precision dial ──────────────────────────────────── */}
          <main style={{
            flex: 1,
            background: "#f6f5f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              animation: "_rise 0.55s cubic-bezier(0.16,1,0.3,1) 0.12s both",
            }}>

              {/* Dial */}
              <div style={{ position: "relative", width: 56, height: 56 }}>

                {/* Static track + tick marks */}
                <svg
                  width="56" height="56" viewBox="0 0 56 56"
                  style={{ position: "absolute", inset: 0 }}
                  aria-hidden="true"
                >
                  {/* Outer track */}
                  <circle
                    cx="28" cy="28" r={R}
                    fill="none"
                    stroke="#dedad3"
                    strokeWidth="1"
                  />
                  {/* 8 tick marks */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i * 45 * Math.PI) / 180;
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    return (
                      <line
                        key={i}
                        x1={28 + (R - 2) * sin} y1={28 - (R - 2) * cos}
                        x2={28 + R * sin}       y2={28 - R * cos}
                        stroke="#cbc8c1"
                        strokeWidth="0.9"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>

                {/* Spinning arc */}
                <svg
                  width="56" height="56" viewBox="0 0 56 56"
                  style={{
                    position: "absolute",
                    inset: 0,
                    animation: "_spin 1.7s linear infinite",
                    transformOrigin: "center",
                  }}
                  aria-hidden="true"
                >
                  <circle
                    cx="28" cy="28" r={R}
                    fill="none"
                    stroke="#4a7a5e"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeDasharray={`${arcLen.toFixed(1)} ${gapLen.toFixed(1)}`}
                    transform="rotate(-90 28 28)"
                  />
                </svg>

                {/* Center dot */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#4a7a5e",
                  }} />
                </div>
              </div>

              {/* Label */}
              <p style={{
                margin: 0,
                fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#a8a5a0",
              }}>
                Preparing protocol
              </p>
            </div>
          </main>

        </div>
      </div>
    </>
  );
}
