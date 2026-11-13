/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/dist/**/*.{js,mjs,ts}",
    "../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../packages/ui/dist/**/*.{js,mjs,ts}",
  ],
  safelist: [
    "grid-cols-7",
    "grid-cols-3",
    "grid-cols-4",
    "aspect-square",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      colors: {
        wess: {
          navy: "rgb(var(--wess-navy) / <alpha-value>)",
          ink: "rgb(var(--wess-ink) / <alpha-value>)",
          gold: "rgb(var(--wess-gold) / <alpha-value>)",
          cream: "rgb(var(--wess-cream) / <alpha-value>)",
          bg: "rgb(var(--wess-bg) / <alpha-value>)",
          muted: "rgb(var(--wess-muted) / <alpha-value>)",
          border: "rgb(var(--wess-border) / <alpha-value>)",
          surface: "rgb(var(--wess-surface) / <alpha-value>)",
          "surface-2": "rgb(var(--wess-surface-2) / <alpha-value>)",
          "navy-soft": "rgb(var(--wess-navy-soft) / <alpha-value>)",
          "gold-soft": "rgb(var(--wess-gold-soft) / <alpha-value>)",
          success: "rgb(var(--wess-success) / <alpha-value>)",
          warning: "rgb(var(--wess-warning) / <alpha-value>)",
          danger: "rgb(var(--wess-danger) / <alpha-value>)",
          sidebar: "rgb(var(--wess-sidebar) / <alpha-value>)",
          "sidebar-text": "rgb(var(--wess-sidebar-text) / <alpha-value>)",
          "sidebar-muted": "rgb(var(--wess-sidebar-muted) / <alpha-value>)",
          "sidebar-hover": "rgb(var(--wess-sidebar-hover) / <alpha-value>)",
          "sidebar-active": "rgb(var(--wess-sidebar-active) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "var(--wess-shadow-card)",
        "card-hover": "var(--wess-shadow-card-hover)",
      },
    },
  },
  plugins: [],
};
