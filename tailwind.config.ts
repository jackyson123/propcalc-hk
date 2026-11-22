import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      colors: {
        gold: {
          DEFAULT: "var(--gold)",
          soft: "var(--gold-2)",
          deep: "var(--gold-deep)",
        },
      },
      maxWidth: {
        shell: "1360px",
      },
    },
  },
  plugins: [],
};

export default config;
