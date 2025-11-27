/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        correct: '#6aaa64',    // Green for correct letters
        present: '#c9b458',    // Yellow for present letters
        absent: '#787c7e',     // Gray for absent letters
        empty: '#ffffff',      // White for empty tiles
      },
    },
  },
  plugins: [],
}
