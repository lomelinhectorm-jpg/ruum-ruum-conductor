import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        rr: {
          // Paleta legacy (compatibilidad con clases existentes)
          blue: "#3D7BFF",
          navy: "#14141A",
          green: "#1FAE63",
          orange: "#FFC400",
          bg: "#F7F6F2",
          text: "#14141A",
          muted: "#6B7280",
          // Paleta del Design System Técnico (componentes RR)
          primary: "#FFC400",
          primaryHover: "#E0A800",
          primaryLight: "#FFF4CC",
          secondary: "#14141A",
          secondaryLight: "#1E1F28",
          trace: "#3D7BFF",
          traceLight: "#E8EFFF",
          traceDeep: "#1A3D8F",
          success: "#1FAE63",
          successLight: "#E5F8ED",
          warning: "#FFC400",
          warningLight: "#FFF4CC",
          danger: "#E0334E",
          dangerLight: "#FCE8EB",
          black: "#14141A",
          gray700: "#374151",
          gray500: "#6B7280",
          gray300: "#D8D5CC",
          gray200: "#EAE7DD",
          gray100: "#F4F2EC",
          white: "#FFFFFF"
        }
      },
      borderRadius: {
        "4xl": "2rem",
        rrSm: "12px",
        rrMd: "16px",
        rrLg: "24px",
        rrHero: "32px"
      },
      boxShadow: {
        rr: "0 14px 40px rgba(15, 23, 42, 0.08)",
        "rr-blue": "0 12px 26px rgba(255, 196, 0, 0.28)",
        rrCard: "0 10px 30px rgba(20,20,26,.08)",
        rrFloating: "0 20px 60px rgba(20,20,26,.14)",
        rrModal: "0 30px 80px rgba(0,0,0,.18)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
