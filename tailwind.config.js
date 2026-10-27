/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          beige: '#f5f5dc',
          cream: '#faf8f2',
          ivory: '#fcfbfa',
          sand: '#eae3d2',
          sandDark: '#d5cbb8',
          gold: '#c5a880',
          goldDark: '#997d59',
          goldLight: '#e4d2bc',
          wine: '#A80A4E',
          espresso: '#141210',
          charcoal: '#221f1c',
          warmGray: '#383430',
          muted: '#7a7268',
        }
      },
      fontFamily: {
        belyga: ['"Belyga"', 'serif'],
        laora: ['"Laora"', 'serif', 'sans-serif'],
        alex: ['"Alex Brush"', 'cursive'],
        script: ['"Great Vibes"', 'cursive'],
        allura: ['"Allura"', 'cursive'],
        parisienne: ['"Parisienne"', 'cursive'],
        pinyon: ['"Pinyon Script"', 'cursive'],
        tangerine: ['"Tangerine"', 'cursive'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        pulseSlow: 'pulseSlow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
