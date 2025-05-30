/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#C8F5FF",
          "primary-content": "#026262",
          secondary: "#89d7e9",
          "secondary-content": "#088484",
          accent: "#026262",
          "accent-content": "#E9FBFF",
          neutral: "#088484",
          "neutral-content": "#F0FCFF",
          "base-100": "#F0FCFF",
          "base-200": "#E1FAFF",
          "base-300": "#C8F5FF",
          "base-content": "#088484",
          info: "#026262",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
      {
        dark: {
          primary: "#026262",
          "primary-content": "#C8F5FF",
          secondary: "#107575",
          "secondary-content": "#E9FBFF",
          accent: "#C8F5FF",
          "accent-content": "#088484",
          neutral: "#E9FBFF",
          "neutral-content": "#11ACAC",
          "base-100": "#11ACAC",
          "base-200": "#088484",
          "base-300": "#026262",
          "base-content": "#E9FBFF",
          info: "#C8F5FF",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
};