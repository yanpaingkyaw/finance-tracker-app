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
          50: "#f5f8f6",
          100: "#dbe8de",
          200: "#b8d2bf",
          300: "#92b8a1",
          400: "#6ea484",
          500: "#4f8b68",
          600: "#3f7053",
          700: "#355a45",
          800: "#2f4a3a",
          900: "#283d31",
        },
        accent: {
          50: "#fff8ef",
          100: "#ffe8c9",
          200: "#ffd9a3",
          300: "#ffc77a",
          400: "#ffb04e",
          500: "#f7941d",
          600: "#d97310",
          700: "#af560e",
          800: "#8f4313",
          900: "#763913",
        },
      },
      boxShadow: {
        card: "0 10px 30px rgba(39, 63, 46, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
