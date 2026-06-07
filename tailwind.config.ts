import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0A122A",
        slate: "#255957",
        paper: "#EEEBD3",
        mahogany: "#B3001B",
        blaze: "#F26419",
        "ink-card": "#15213D",
        surface: "#FFFFFF",
        mist: "#F5F2F4",
        line: "#E5E7E9"
      },
      borderRadius: {
        card: "18px",
        control: "16px"
      },
      boxShadow: {
        academic: "0 4px 20px rgba(10, 18, 42, 0.06)",
        active: "0 8px 30px rgba(10, 18, 42, 0.12)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      maxWidth: {
        mobile: "430px",
        content: "1200px"
      }
    }
  },
  plugins: []
} satisfies Config;
