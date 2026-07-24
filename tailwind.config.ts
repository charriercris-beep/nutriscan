import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sauge: { 50: '#f3f6f1', 100: '#e3ebde', 300: '#b7cbab', 500: '#87a878', 600: '#6d8c60', 700: '#57704c' },
        creme: { 50: '#faf7f0', 100: '#f4eee1' },
        anthracite: { 700: '#3a3d3f', 800: '#2b2d2e', 900: '#1c1d1e' },
        accent: { 500: '#e08e45', 600: '#c8752f' },
      },
      fontFamily: { sans: ['system-ui', 'sans-serif'] },
      keyframes: {
        'pop-in': { '0%': { transform: 'scale(0.85)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'ring-grow': { '0%': { strokeDashoffset: 'var(--ring-start, 283)' }, '100%': { strokeDashoffset: 'var(--ring-end, 283)' } },
      },
      animation: {
        'pop-in': 'pop-in 0.25s ease-out',
        'ring-grow': 'ring-grow 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
