import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Legacy (keep for /f1 and marketing pages)
        "ink": "#0a0a0a",
        "ash": "#f7f7f7",
        "fog": "#ededed",
        "charcoal": "#1b1b1b",
        "slate": "#253239",
        "steel": "#7f949b",
        "mist": "#dfe4e6",
        "cloud": "#f7f9fa",
        // New SaaS design tokens
        "void": "#0c0c0d",       // near-black — dark panel bg, primary buttons
        "pebble": "#f6f5f2",     // warm off-white — app page bg
        "wire": "#e6e4df",       // warm border
        "dim": "#6b6866",        // secondary text
        "mute": "#a8a5a0",       // tertiary / placeholder
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0, 0, 0, 0.16)",
        hard: "0 10px 30px rgba(0, 0, 0, 0.35)",
        card: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
      }
    }
  },
  plugins: []
};

export default config;
