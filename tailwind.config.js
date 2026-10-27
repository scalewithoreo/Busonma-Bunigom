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
          // Warm Foundation: Warm Alabaster
          beige: '#F5EDE4',
          cream: '#F5EDE4',
          ivory: '#FAF6F0',
          sand: '#EAE1D5',
          sandDark: '#D8C7B5',
          alabaster: '#F5EDE4',

          // Signature Primary: Scarlet & Crimson (#B91C1C)
          primary: '#B91C1C',
          primaryDark: '#991B1B',
          primaryLight: '#DC2626',
          crimson: '#B91C1C',
          scarlet: '#B91C1C',
          red: '#B91C1C',

          // Accent colors mapped to primary scarlet & crimson palette
          gold: '#B91C1C',
          goldDark: '#991B1B',
          goldLight: '#DC2626',
          wine: '#831843',

          // Base Neutral: Editorial Noir (#121212)
          noir: '#121212',
          espresso: '#121212',
          charcoal: '#1C1C1C',
          warmGray: '#2A2A2A',
          muted: '#6E6760',
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
