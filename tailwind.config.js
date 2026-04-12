/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f04000',
          50:  '#fff2ee',
          100: '#ffe0d5',
          200: '#ffc2aa',
          300: '#ff9b75',
          400: '#ff6a3d',
          500: '#f04000',
          600: '#d93800',
          700: '#b52e00',
          800: '#8f2500',
          900: '#6b1b00',
        },
        dark: {
          DEFAULT: '#0f0f13',
          50: '#161618',
          100: '#1e1e24',
          200: '#111115',
          300: '#0f0f13',
        },
      },
    },
  },
  plugins: [],
}
