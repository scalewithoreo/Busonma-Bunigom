import { FC } from 'react';
import { motion } from 'framer-motion';
import { useWedding } from '../context/WeddingContext';

export const WarmWelcome: FC = () => {
  const { wedding } = useWedding();
  const story = wedding.story;

  if (!story.welcomeQuote) return null;

  const welcomePhoto = wedding.couple.wishlistImage || story.image;

  return (
    <section id="welcome-note" className="py-20 sm:py-28 px-4 sm:px-6 bg-brand-cream relative border-t border-brand-sand/30 overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-12 lg:p-14 shadow-xl border border-brand-gold/25 flex flex-col md:flex-row items-center gap-8 lg:gap-14"
        >
          {/* Couple Photo Attached */}
          <div className="w-full max-w-[280px] sm:max-w-xs shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-brand-gold/30 bg-brand-espresso group relative aspect-[3/4]">
            <img 
              loading="lazy" 
              decoding="async" 
              src={welcomePhoto} 
              alt={`${wedding.couple.title} Warm Welcome`} 
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Welcome Message Text */}
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="inline-flex items-center px-4 sm:px-5 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/40 mb-4 shadow-sm">
              <span className="text-[10px] sm:text-[11px] font-sans tracking-[0.28em] uppercase text-brand-goldDark font-semibold">
                A Warm Welcome From The Couple
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-brand-espresso mb-6 font-normal">
              Welcome to Our Corner
            </h2>

            <p className="font-serif italic text-lg sm:text-xl lg:text-2xl text-brand-espresso/90 leading-relaxed mb-6 font-light">
              "{story.welcomeQuote}"
            </p>

            <div className="pt-2">
              <span className="font-alex text-2xl sm:text-3xl text-brand-goldDark tracking-wide">
                Bunigom &amp; Busonma
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
