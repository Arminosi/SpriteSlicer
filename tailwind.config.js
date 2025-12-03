/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // zinc-950
        surface: '#18181b', // zinc-900
        'surface-hover': '#27272a', // zinc-800
        border: '#27272a', // zinc-800
        primary: '#3b82f6', // blue-500
        'primary-hover': '#2563eb', // blue-600
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
