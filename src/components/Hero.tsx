import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';

interface HeroProps {
  onRsvpClick: () => void;
}

export const Hero: FC<HeroProps> = () => {
  const isPublicMode = import.meta.env.VITE_SITE_MODE === 'public';

  return (
    <section id="welcome" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-brand-espresso">
      {/* Background Image with Cinematic Moody Overlay */}
      <div className="absolute inset-0 z-0">
        <img  decoding="sync"
          src="/assets/hero-image-new.jpg"
          alt="Oluwadara and Oreoluwa"
          className="w-full h-full object-cover object-[center_45%] scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Layered Gradient Vignette matching reference mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-brand-espresso" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/80" />
      </div>

      {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 mt-10 sm:mt-14 max-w-5xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-3 sm:mb-4 drop-shadow-md"
          >
            <img  decoding="sync" 
              src="/assets/logo.png" 
              alt="Oluwadara & Oreoluwa Logo" 
              className="h-32 sm:h-44 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            />
          </motion.div>

          {/* Couple Name - Belyga font with order: Oluwadara & Oreoluwa */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-alex tracking-normal text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] text-brand-cream leading-tight my-1 selection:text-brand-gold"
          >
            Oluwadara & Oreoluwa
          </motion.h1>

          {/* Invitation Text */}
          {!isPublicMode && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="font-serif italic text-lg sm:text-2xl md:text-3xl text-brand-cream/90 max-w-2xl mt-1 mb-2 sm:mb-3 font-light tracking-wide"
            >
              We Joyfully invite you to our wedding
            </motion.p>
          )}

        {/* Location - Borderless Clean Text */}
        {!isPublicMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex items-center justify-center gap-2 mb-2 sm:mb-3 text-brand-cream"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-gold shrink-0" />
            <span className="font-sans text-[14px] sm:text-[15px] tracking-widest uppercase">
              Lagos, Nigeria
            </span>
          </motion.div>
        )}

        {/* Public Mode Date Teaser */}
        {isPublicMode && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="font-serif italic text-2xl sm:text-3xl text-brand-cream/90 mb-2 sm:mb-3"
          >
            December 2026
          </motion.p>
        )}

        {/* Hashtag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="font-sans text-brand-gold tracking-widest text-sm sm:text-base uppercase font-bold"
        >
          #BecomingTheOkunades
        </motion.p>


      </div>

      {/* Scroll Down Cue */}
      <motion.a
        href="#countdown"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-brand-cream/60 hover:text-brand-gold transition-colors"
        aria-label="Scroll to countdown"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] font-sans">Scroll</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-brand-gold" />
      </motion.a>
    </section>
  );
};
