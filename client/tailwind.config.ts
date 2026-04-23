import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Manrope", "Segoe UI", "sans-serif"],
        body: ["DM Sans", "Segoe UI", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef0ff",
          100: "#d8dcff",
          200: "#b4bbff",
          300: "#878fff",
          400: "#5559f5",
          500: "#2f2fe4",
          600: "#162e93",
          700: "#1a1953",
          800: "#111033",
          900: "#080616",
        },
        accent: {
          50: "#f1f2ff",
          100: "#e2e6ff",
          200: "#c7ceff",
          300: "#98a6ff",
          400: "#6178ff",
          500: "#2f2fe4",
          600: "#2332bf",
          700: "#162e93",
          800: "#171f66",
          900: "#12143d",
        },
      },
      boxShadow: {
        card: "0 16px 42px rgba(8, 6, 22, 0.14)",
      },
    },
  },
  plugins: [],
} satisfies Config;
