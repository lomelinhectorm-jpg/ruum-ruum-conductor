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
          blue: "#1565FF",
          navy: "#0A1F44",
          green: "#00C853",
          orange: "#FF6D00",
          bg: "#F8FAFC",
          text: "#111827",
          muted: "#6B7280",
          // Paleta del Design System Técnico (componentes RR)
          primary: "#1565FF",
          primaryHover: "#0D47E6",
          primaryLight: "#EDF4FF",
          secondary: "#0A1F44",
          secondaryLight: "#132C5A",
          success: "#00C853",
          successLight: "#E8FFF2",
          warning: "#FF6D00",
          warningLight: "#FFF2E8",
          danger: "#E53935",
          dangerLight: "#FFECEC",
          black: "#111827",
          gray700: "#374151",
          gray500: "#6B7280",
          gray300: "#D1D5DB",
          gray200: "#E5E7EB",
          gray100: "#F3F4F6",
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
        "rr-blue": "0 12px 26px rgba(21, 101, 255, 0.30)",
        rrCard: "0 10px 30px rgba(21,101,255,.08)",
        rrFloating: "0 20px 60px rgba(0,0,0,.12)",
        rrModal: "0 30px 80px rgba(0,0,0,.18)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
