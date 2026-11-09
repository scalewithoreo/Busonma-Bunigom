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
          // Dynamic CSS variable tokens injected by WeddingContext
          primary: 'var(--brand-primary, #c5a880)',
          primaryDark: 'var(--brand-primary-dark, #997d59)',
          primaryLight: 'var(--brand-primary-light, #e4d2bc)',
          
          beige: 'var(--brand-beige, #f5f5dc)',
          cream: 'var(--brand-cream, #faf8f2)',
          ivory: 'var(--brand-ivory, #fcfbfa)',
          sand: 'var(--brand-sand, #eae3d2)',
          sandDark: 'var(--brand-sand-dark, #d5cbb8)',
          alabaster: 'var(--brand-cream, #faf8f2)',

          gold: 'var(--brand-gold, #c5a880)',
          goldDark: 'var(--brand-gold-dark, #997d59)',
          goldLight: 'var(--brand-gold-light, #e4d2bc)',

          wine: 'var(--brand-wine, #A80A4E)',
          crimson: 'var(--brand-primary, #B91C1C)',
          scarlet: 'var(--brand-primary, #B91C1C)',
          red: 'var(--brand-primary, #B91C1C)',

          noir: 'var(--brand-espresso, #141210)',
          espresso: 'var(--brand-espresso, #141210)',
          charcoal: 'var(--brand-charcoal, #221f1c)',
          warmGray: 'var(--brand-warm-gray, #383430)',
          muted: 'var(--brand-muted, #7a7268)',
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
