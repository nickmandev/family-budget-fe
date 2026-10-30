/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Violet / fuchsia primary palette (see docs/UI_DESIGN.md)
        violet: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#5B21B6',
          900: '#3C1380',
          950: '#2E1065',
        },
        fuchsia: {
          100: '#FAE8FF',
          400: '#E879F9',
          500: '#D946EF',
          600: '#C026D3',
          700: '#A21CAF',
        },
        // Semantic aliases from the design system
        surface: '#FFFFFF',
        muted: '#F5F3FF',
        success: '#10B981',
        danger: '#F43F5E',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
