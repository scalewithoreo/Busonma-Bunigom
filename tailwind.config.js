/** @type {import('tailwindcss').Config} */
function withOpacity(varName, fallbackRgb) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${varName}, ${fallbackRgb}) / ${opacityValue})`;
    }
    return `rgb(var(${varName}, ${fallbackRgb}))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: withOpacity('--brand-primary-rgb', '197 168 128'),
          primaryDark: withOpacity('--brand-primary-dark-rgb', '153 125 89'),
          primaryLight: withOpacity('--brand-primary-light-rgb', '228 210 188'),

          beige: withOpacity('--brand-beige-rgb', '245 245 220'),
          cream: withOpacity('--brand-cream-rgb', '250 248 242'),
          ivory: withOpacity('--brand-ivory-rgb', '252 251 250'),
          sand: withOpacity('--brand-sand-rgb', '234 227 210'),
          sandDark: withOpacity('--brand-sand-dark-rgb', '213 203 184'),
          alabaster: withOpacity('--brand-cream-rgb', '250 248 242'),

          gold: withOpacity('--brand-gold-rgb', '197 168 128'),
          goldDark: withOpacity('--brand-gold-dark-rgb', '153 125 89'),
          goldLight: withOpacity('--brand-gold-light-rgb', '228 210 188'),

          wine: withOpacity('--brand-wine-rgb', '168 10 78'),
          crimson: withOpacity('--brand-primary-rgb', '185 28 28'),
          scarlet: withOpacity('--brand-primary-rgb', '185 28 28'),
          red: withOpacity('--brand-primary-rgb', '185 28 28'),

          noir: withOpacity('--brand-espresso-rgb', '20 18 16'),
          espresso: withOpacity('--brand-espresso-rgb', '20 18 16'),
          charcoal: withOpacity('--brand-charcoal-rgb', '34 31 28'),
          warmGray: withOpacity('--brand-warm-gray-rgb', '56 52 48'),
          muted: withOpacity('--brand-muted-rgb', '122 114 104'),
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
