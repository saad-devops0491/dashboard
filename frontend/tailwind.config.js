/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      scrollbar: {
        thin: {
          width: '6px',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'heading-xl': ['2.5rem', { fontWeight: '700' }],
        'heading-lg': ['1.875rem', { fontWeight: '600' }],
        'body-lg': ['1.125rem', { fontWeight: '400' }],
        'body-sm': ['0.875rem', { fontWeight: '400' }],
      },
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e6f2',
          200: '#b3cce5',
          300: '#8db3d8',
          400: '#6799cb',
          500: '#4080be',
          600: '#1a3a5c',
          700: '#153149',
          800: '#102736',
          900: '#0b1d3b',
        },
        yellow: {
          400: '#fbbf24',
          500: '#ffd500',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-white': {
          'scrollbar-color': '#ffffff transparent',
        },
        '.scrollbar-thumb-\\[\\#38BF9D\\]': {
          'scrollbar-color': '#38BF9D transparent',
        },
        '.scrollbar-track-transparent': {
          'scrollbar-track-color': 'transparent',
        },
        /* For webkit browsers */
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
        },
        '.scrollbar-thumb-white::-webkit-scrollbar-thumb': {
          'background-color': '#ffffff',
          'border-radius': '3px',
        },
        '.scrollbar-thumb-\\[\\#38BF9D\\]::-webkit-scrollbar-thumb': {
          'background-color': '#38BF9D',
          'border-radius': '3px',
        },
        '.scrollbar-track-transparent::-webkit-scrollbar-track': {
          'background-color': 'transparent',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};