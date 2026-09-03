import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        oxy: {
          bg: "#05070d",
          surface: "#0b0f1a",
          border: "rgba(255,255,255,0.08)",
          blue: {
            50: "#eaf4ff",
            100: "#cfe6ff",
            300: "#7cc0ff",
            400: "#4aa8ff",
            500: "#1e8bff",
            600: "#0f6fe0",
            700: "#0c58b3",
          },
          cyan: {
            300: "#7ff3ec",
            400: "#3fe6db",
            500: "#14cabf",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(circle at 50% 0%, rgba(30,139,255,0.25), transparent 60%)",
        "cta-gradient": "linear-gradient(90deg, #1e8bff 0%, #14cabf 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(30,139,255,0.35)",
        "glow-cyan": "0 0 40px rgba(20,202,191,0.3)",
        glass: "0 8px 32px rgba(0,0,0,0.35)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        shimmer: "shimmer 3s linear infinite",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
