/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'alest-blue': '#1e40af',
        'alest-dark': '#1e293b',
        'alest-light': '#f8fafc',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
