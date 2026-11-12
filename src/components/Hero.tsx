import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

interface HeroProps {
  onRsvpClick: () => void;
}

export const Hero: FC<HeroProps> = () => {
  const { wedding } = useWedding();
  const isPublicMode = import.meta.env.VITE_SITE_MODE === 'public';

  return (
    <section id="welcome" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-brand-espresso">
      {/* Background Image with Cinematic Moody Overlay */}
      <div className="absolute inset-0 z-0">
        <img decoding="sync"
          src={wedding.couple.heroImage}
          alt={wedding.couple.title}
          className="w-full h-full object-cover scale-100 transition-transform duration-1000 ease-out object-center"
        />
        {/* Layered Cinematic Vignette: Clean contrast for text while keeping the couple clearly visible and radiant */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-brand-espresso/75 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/15 to-black/55 pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 mt-8 sm:mt-12 max-w-5xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-2 sm:mb-3 drop-shadow-md"
        >
          <img decoding="sync" 
            src={wedding.couple.logoImage} 
            alt={`${wedding.couple.title} Logo`} 
            className="h-24 sm:h-32 md:h-36 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        {/* Couple Name */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-alex tracking-normal text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] text-brand-cream leading-tight my-1 selection:text-brand-gold drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
        >
          {wedding.couple.title}
        </motion.h1>

        {/* Invitation Text */}
        {!isPublicMode && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-serif italic text-lg sm:text-2xl md:text-3xl text-brand-cream/95 max-w-2xl mt-1 mb-2 sm:mb-3 font-light tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
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
            className="flex items-center justify-center gap-2 mb-2 sm:mb-3 text-brand-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-gold shrink-0" />
            <span className="font-sans text-[14px] sm:text-[15px] tracking-widest uppercase">
              {wedding.couple.locationText}
            </span>
          </motion.div>
        )}

        {/* Public Mode Date Teaser */}
        {isPublicMode && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="font-serif italic text-2xl sm:text-3xl text-brand-cream/90 mb-2 sm:mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            {wedding.couple.dateTeaser}
          </motion.p>
        )}

        {/* Hashtag */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-2.5 inline-flex items-center justify-center px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl"
        >
          <span className="font-sans text-[#F7E7CE] tracking-[0.22em] text-xs sm:text-sm uppercase font-bold drop-shadow-md select-none">
            {wedding.couple.hashtag}
          </span>
        </motion.div>
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
