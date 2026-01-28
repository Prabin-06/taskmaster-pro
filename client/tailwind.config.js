/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",   // ⭐ THIS LINE IS WHAT YOU ARE MISSING
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
