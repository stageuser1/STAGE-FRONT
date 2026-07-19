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
      },
      // STAGE design tokens — 2026-07 redesign: confident ultramarine brand,
      // ink-on-white surfaces, verification always visible.
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
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)",
        raised: "0 12px 24px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
