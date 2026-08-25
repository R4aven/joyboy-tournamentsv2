import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        joy: {
          black: "#08080B",
          dark: "#101015",
          card: "#15151E",
          border: "#22222F",
          violet: "#7C3AED",
          violet2: "#A855F7",
          cyan: "#06B6D4",
          cyan2: "#22D3EE",
        }
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: { glow: "0 0 30px rgba(124,58,237,0.3)", glowCyan: "0 0 30px rgba(6,182,214,0.25)" },
      animation: { float: "float 6s ease-in-out infinite", pulseGlow: "pulseGlow 2s ease-in-out infinite" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        pulseGlow: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.7" } }
      }
    }
  },
  plugins: []
};
export default config;