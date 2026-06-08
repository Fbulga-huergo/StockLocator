/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0a0c10',
          900: '#0f1218',
          850: '#141821',
          800: '#1a1f2b',
          700: '#252b3a',
          600: '#323a4d',
        },
        editor: {
          DEFAULT: '#f59e0b',
          soft: '#fbbf24',
          deep: '#b45309',
        },
        guest: {
          DEFAULT: '#60a5fa',
          soft: '#93c5fd',
          deep: '#1e40af',
        },
      },
    },
  },
  plugins: [],
}
