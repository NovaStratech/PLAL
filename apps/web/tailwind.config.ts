import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette chaleureuse, humaine, rassurante
        cream: '#FBF8F3',
        sand: '#F3ECE0',
        ink: '#2B2622',
        trust: {
          50: '#F0F7F4',
          100: '#D9EDE4',
          200: '#B3DBCA',
          300: '#86C4AC',
          400: '#54A88A',
          500: '#2F8C6D',
          600: '#207056',
          700: '#1A5946',
          800: '#164838',
          900: '#123A2E',
        },
        warmth: {
          400: '#F2A65A',
          500: '#E8893F',
          600: '#D2722B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(43, 38, 34, 0.12)',
        card: '0 2px 16px -6px rgba(43, 38, 34, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
