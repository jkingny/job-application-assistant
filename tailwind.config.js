/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0B0D12',
          900: '#0F1115',
          800: '#171A21',
          700: '#1E222B',
          600: '#2A2F3A',
          500: '#3A4150',
          400: '#8B92A3',
          200: '#D5D8DE',
          100: '#E8E6E1',
        },
        signal: {
          amber: '#E8A33D',
          teal: '#4FD1C5',
          blue: '#5B8DEF',
          red: '#E8615D',
          violet: '#9B8CFF',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5)',
        panel: '-12px 0 40px -12px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
