/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eefdf3",
          100: "#d6fae1",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
        },
        paper: "#f6f4ee",
        sidebar: {
          DEFAULT: "#12281a",
          muted: "#86ab8f",
          accent: "#4ade80",
        },
      },
    },
  },
  plugins: [],
};
