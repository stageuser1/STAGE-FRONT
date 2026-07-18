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
          "PingFang SC",
          "Noto Sans SC",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      // STAGE design tokens (see designer sheets STAGE UI Extension 01–04).
      colors: {
        brand: {
          DEFAULT: "#2563EB",
          700: "#1D4ED8",
          600: "#2563EB",
          500: "#3B82F6",
          300: "#93C5FD",
          100: "#DBEAFE",
          50: "#EFF6FF",
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
        page: "#F8FAFC",
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
