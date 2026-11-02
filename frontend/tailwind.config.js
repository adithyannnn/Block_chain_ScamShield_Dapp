/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060A13',
          900: '#0A0F1D',
          850: '#0D1527',
          800: '#111C35',
          700: '#1A294C',
          600: '#233766',
        },
        cyber: {
          cyan: '#06B6D4',
          teal: '#14B8A6',
          blue: '#3B82F6',
          amber: '#F59E0B',
          red: '#EF4444',
          emerald: '#10B981',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

