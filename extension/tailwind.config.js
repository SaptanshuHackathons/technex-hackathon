/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#ededed",
        border: "#262626",
        primary: "#ffffff",
        "primary-foreground": "#000000",
        secondary: "#262626",
        "secondary-foreground": "#ffffff",
        muted: "#262626",
        "muted-foreground": "#a1a1aa",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
