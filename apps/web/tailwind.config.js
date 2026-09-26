/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090e',
          900: '#0d111a',
          850: '#131826',
          800: '#1b2234',
          700: '#28324a',
        },
        brand: {
          teal: '#00f2fe',
          cyan: '#4facfe',
          emerald: '#10b981',
          violet: '#8b5cf6',
          amber: '#f59e0b',
          crimson: '#ef4444',
          rose: '#e11d48',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(15 23 42 / 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'zoom-in-95': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-from-top-2': {
          from: { opacity: '0', transform: 'translateY(-0.5rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fadeIn': 'fade-in 300ms ease-out',
        'zoom-in-95': 'zoom-in-95 200ms ease-out',
        'slide-in-from-top-2': 'slide-in-from-top-2 150ms ease-out',
      },
    },
  },
  plugins: [],
};
