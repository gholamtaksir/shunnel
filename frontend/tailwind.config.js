/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#dcf2ff',
          200: '#b2e7ff',
          300: '#6dd4ff',
          400: '#20bdff',
          500: '#06a3f0',
          600: '#0082cd',
          700: '#0067a6',
          800: '#055789',
          900: '#0a4871',
          950: '#072d4b',
        },
      },
    },
  },
  plugins: [],
}
