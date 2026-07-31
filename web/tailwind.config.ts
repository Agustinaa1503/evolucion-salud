import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7eefa',
          100: '#ecd9f1',
          200: '#d8b0e2',
          300: '#c07fd0',
          400: '#a94fbf',
          500: '#8f3da8',
          600: '#762d8f',
          700: '#63277a',
          800: '#522167',
          900: '#401a52',
          950: '#280f35',
        },
        leaf: {
          50: '#f0f7f2',
          100: '#dcece2',
          200: '#bad9c6',
          300: '#8fc0a2',
          400: '#5fa37c',
          500: '#38805a',
          600: '#2b6748',
          700: '#23523a',
          800: '#1d4230',
          900: '#183629',
          950: '#0b1d16',
        },
        clay: {
          50: '#fdf3ec',
          100: '#fbe5d5',
          200: '#f6cab0',
          300: '#f0a97f',
          400: '#e8945d',
          500: '#d88242',
          600: '#c06a2e',
          700: '#9c5426',
          800: '#7a411f',
          900: '#63361d',
        },
        sun: {
          50: '#fefce8',
          100: '#fdf7c8',
          200: '#fbed8e',
          300: '#f7e255',
          400: '#f3dd2b',
          500: '#e0c611',
          600: '#bd9f0d',
          700: '#977a0e',
          800: '#7b5f13',
          900: '#675014',
        },
        ink: {
          900: '#0b1f1c',
          950: '#06130f',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-manrope)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'var(--font-manrope)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        lift: '0 20px 45px -18px rgb(118 45 143 / 0.35)',
        glow: '0 0 40px -8px rgb(118 45 143 / 0.55)',
        glass: '0 8px 32px rgb(6 19 15 / 0.25)',
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        'marquee-slow': 'marquee 55s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'float-delayed': 'float 9s ease-in-out 1.5s infinite',
        blob: 'blob 18s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-soft': 'pulse-soft 3.2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-16px) translateX(8px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(28px, -36px) scale(1.08)' },
          '66%': { transform: 'translate(-22px, 24px) scale(0.94)' },
        },
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
