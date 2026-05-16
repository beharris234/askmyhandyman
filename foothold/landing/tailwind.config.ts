import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clay:  "#0D5C4E", // deep forest teal — primary
        sand:  "#FAF7F2", // warm off-white — background
        amber: "#D97706", // CTA accent
        ink:   "#1A2A30", // body text
        stone: "#5A6B72", // secondary text
        moss:  "#E8EFE9", // tonal surface
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      maxWidth: {
        prose: "62ch",
      },
    },
  },
  plugins: [],
};

export default config;
