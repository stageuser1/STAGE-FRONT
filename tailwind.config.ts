import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "PingFang SC",
          "Noto Sans SC",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        // Marketing surface only (doc 02 §3). Applied via the (marketing) layout.
        "stage-sans": ["var(--font-noto-sans-sc)", "Noto Sans SC", "sans-serif"],
        "stage-mono": ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        stage: "1200px",
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.14", letterSpacing: "-0.03em" }],
        "display-sm": [
          "2.25rem",
          { lineHeight: "1.22", letterSpacing: "-0.02em" },
        ],
        h2: ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "h2-sm": ["1.875rem", { lineHeight: "1.27", letterSpacing: "-0.02em" }],
        h3: ["1.5rem", { lineHeight: "1.33", letterSpacing: "-0.01em" }],
        "h3-sm": ["1.25rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        "body-lg": ["1.125rem", { lineHeight: "1.56" }],
        body: ["1rem", { lineHeight: "1.625" }],
        caption: ["0.8125rem", { lineHeight: "1.54", letterSpacing: "0.06em" }],
        stat: ["2.75rem", { lineHeight: "1.09", letterSpacing: "-0.02em" }],
        "stat-sm": ["2rem", { lineHeight: "1.125", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        "stage-sm": "var(--stage-radius-sm)",
        "stage-md": "var(--stage-radius-md)",
        "stage-lg": "var(--stage-radius-lg)",
        "stage-xl": "var(--stage-radius-xl)",
      },
      backgroundImage: {
        "stage-gradient-cta": "var(--stage-gradient-cta)",
        "stage-gradient-text": "var(--stage-gradient-text)",
      },
      // Colors: existing Explore tokens (brand/ink/line/page) + additive,
      // namespaced stage-* marketing tokens (doc 02). Explore tokens untouched.
      colors: {
        brand: {
          DEFAULT: "#2B46EB",
          800: "#1B2CA0",
          700: "#2237C7",
          600: "#2B46EB",
          500: "#5068F2",
          300: "#B9C4FA",
          100: "#E1E7FE",
          50: "#EEF1FE",
        },
        ink: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
          100: "#F1F5F9",
          50: "#F8FAFC",
        },
        line: {
          DEFAULT: "#E2E8F0",
          subtle: "#F1F5F9",
        },
        page: "#F6F7FB",
        stage: {
          "blue-50": "var(--stage-blue-50)",
          "blue-100": "var(--stage-blue-100)",
          "blue-200": "var(--stage-blue-200)",
          "blue-400": "var(--stage-blue-400)",
          "blue-500": "var(--stage-blue-500)",
          "blue-600": "var(--stage-blue-600)",
          "navy-700": "var(--stage-navy-700)",
          "navy-800": "var(--stage-navy-800)",
          "navy-900": "var(--stage-navy-900)",
          "sky-100": "var(--stage-sky-100)",
          "sky-300": "var(--stage-sky-300)",
          white: "var(--stage-white)",
          mist: "var(--stage-mist)",
          bg: "var(--stage-bg)",
          "bg-soft": "var(--stage-bg-soft)",
          fg: "var(--stage-fg)",
          "fg-muted": "var(--stage-fg-muted)",
          "fg-on-dark": "var(--stage-fg-on-dark)",
          "fg-on-dark-muted": "var(--stage-fg-on-dark-muted)",
          primary: "var(--stage-primary)",
          "primary-hover": "var(--stage-primary-hover)",
          border: "var(--stage-border)",
          "surface-dark": "var(--stage-surface-dark)",
          success: "var(--stage-success)",
          warning: "var(--stage-warning)",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)",
        raised: "0 12px 24px rgba(15,23,42,0.12)",
        "stage-sm": "var(--stage-shadow-sm)",
        "stage-md": "var(--stage-shadow-md)",
        "stage-glow": "var(--stage-glow-card)",
      },
    },
  },
  plugins: [],
};

export default config;
