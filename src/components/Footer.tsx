import { FC } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export const Footer: FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-brand-espresso text-brand-cream relative overflow-hidden pt-24 pb-12 px-4 sm:px-6">
      {/* Background watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-6 flex items-center justify-center"
        >
          <img loading="lazy" decoding="async" 
            src="/assets/logo.png" 
            alt="O & D Logo" 
            className="h-24 sm:h-32 w-auto object-contain drop-shadow-md"
          />
        </motion.div>

        {/* Heading 1 */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl sm:text-5xl md:text-6xl text-brand-cream font-light tracking-wide"
        >
          Thank you for celebrating with us
        </motion.h2>

        {/* Heading 2: Oluwadara & Oreoluwa */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="font-alex tracking-normal text-3xl sm:text-5xl md:text-6xl text-brand-gold my-4"
        >
          Oluwadara & Oreoluwa
        </motion.p>

        <p className="text-sm font-sans tracking-[0.2em] uppercase text-brand-muted/70 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center mb-10">
          {import.meta.env.VITE_SITE_MODE === 'public' ? (
            <span>December 2026</span>
          ) : (
            <>
              <span>Saturday, December 12, 2026</span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-brand-gold/30"></span>
              <span>Lagos, Nigeria</span>
            </>
          )}
        </p>

        {/* Back to top button */}
        <button
          onClick={scrollToTop}
          className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-brand-cream transition-all duration-300 mb-12 group shadow-md"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 text-brand-gold group-hover:-translate-y-0.5 transition-transform" />
        </button>

        {/* Copyright */}
        <div className="w-full pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-xs font-sans text-brand-muted">
          <div>© 2026 Oluwadara & Oreoluwa. All Rights Reserved.</div>
          <div className="hidden sm:block text-white/20">&bull;</div>
          <div>
            Built by{' '}
            <a 
              href="https://oreokunade.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-gold hover:text-white transition-colors underline decoration-brand-gold/30 hover:decoration-white"
            >
              Oreoluwa Okunade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
