/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",        // Matches App.tsx, index.tsx in root
    "./components/**/*.{js,ts,jsx,tsx}", // Matches files in components folder
    "./utils/**/*.{js,ts,jsx,tsx}"       // Matches files in utils folder
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
}