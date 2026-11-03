import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  onRsvpClick: () => void;
}

export const Hero: FC<HeroProps> = ({ onRsvpClick }) => {
  const isPublicMode = import.meta.env.VITE_SITE_MODE === 'public';

  const scrollToRsvp = () => {
    if (onRsvpClick) {
      onRsvpClick();
    } else {
      const element = document.getElementById('rsvp');
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="welcome" className="relative min-h-screen overflow-hidden bg-[#FAF6F0]">
      {/* 1. Looping Botanical Floral Video Background (From Theme 26: plantilla-floral-v2-KP0kSw76.mp4) */}
      <video
        src="/assets/plantilla-floral-v2-KP0kSw76.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center center' }}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Floating Botanical Borders on sides (From Theme 26 R3: floral-border-J4FzR5M8.png) */}
      <img
        src="/assets/floral-border-J4FzR5M8.png"
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-[2%] h-[280px] md:h-[450px] w-auto object-contain object-right opacity-50 pointer-events-none z-10"
      />
      <img
        src="/assets/floral-border-J4FzR5M8.png"
        alt=""
        aria-hidden="true"
        className="absolute left-0 top-[8%] h-[320px] md:h-[480px] w-auto object-contain object-left opacity-45 pointer-events-none z-10 scale-x-[-1]"
      />

      {/* 2. Content Container - 100% Exact Layout to Theme 26 Component JF */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center px-8 max-w-sm sm:max-w-md mx-auto"
        >
          {/* Eyebrow Script: "Save the Date" */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-script text-3xl md:text-4xl text-[#3C281E] mb-6 select-none"
            style={{
              textShadow: '0.5px 0.5px 0px rgba(60, 40, 30, 0.3), -0.3px 0.3px 0px rgba(60, 40, 30, 0.1)',
            }}
          >
            Save the Date
          </motion.p>

          {/* Couple Names: Staggered uppercase Cormorant Garamond */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col items-center mb-6"
            style={{ textShadow: '0.3px 0.3px 0.5px rgba(40, 30, 20, 0.4)' }}
          >
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.15em] text-[#281E14] uppercase font-normal">
              MIRACLE
            </h1>
            <span className="font-display text-xl md:text-2xl tracking-[0.1em] text-[#4A3E34] my-1 font-normal">
              &amp;
            </span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.15em] text-[#281E14] uppercase font-normal">
              MALVIN
            </h1>
          </motion.div>

          {/* Subtitle Script */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-script text-xl md:text-2xl text-[#5A4E42] mb-8 select-none"
            style={{
              textShadow: '0.4px 0.4px 0px rgba(60, 40, 30, 0.25), -0.2px 0.2px 0px rgba(60, 40, 30, 0.1)',
            }}
          >
            {!isPublicMode ? 'We joyfully invite you' : "We're getting married!"}
          </motion.p>

          {/* Date Bar: JANUARY | 27 | WEDNESDAY */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex items-center justify-center gap-4 text-[#3C281E] mb-2"
            style={{ textShadow: '0.2px 0.2px 0.3px rgba(40, 30, 20, 0.3)' }}
          >
            <span className="font-display text-sm md:text-base tracking-[0.1em] uppercase">
              JANUARY
            </span>
            <span className="text-[#A0948A]">|</span>
            <span className="font-display text-xl md:text-2xl font-light">
              27
            </span>
            <span className="text-[#A0948A]">|</span>
            <span className="font-display text-sm md:text-base tracking-[0.1em] uppercase">
              WEDNESDAY
            </span>
          </motion.div>

          {/* Year: 2027 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="font-display text-base md:text-lg text-[#5A4E42] tracking-widest font-light"
            style={{ textShadow: '0.2px 0.2px 0.3px rgba(40, 30, 20, 0.3)' }}
          >
            2027
          </motion.p>
        </motion.div>

        {/* Bottom RSVP Link / Button with Bouncing Arrow */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          onClick={scrollToRsvp}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-[#3C281E]/60 hover:text-[#B91C1C] transition-colors cursor-pointer group"
          aria-label="Confirm attendance"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase font-body font-light text-[#3C281E]/75 group-hover:text-[#B91C1C] transition-colors">
            Confirm attendance
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-[#3C281E]/60 group-hover:text-[#B91C1C] transition-colors" />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
};
