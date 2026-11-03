import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../utils/audio';

interface EnvelopeIntroProps {
  onComplete?: () => void;
  onOpeningStart?: () => void;
}

export const EnvelopeIntro: React.FC<EnvelopeIntroProps> = ({ onComplete, onOpeningStart }) => {
  // Opening state machine modeled after DigitalYes Theme 26 (Floral)
  const [stage, setStage] = useState<'idle' | 'opening' | 'dismissed'>('idle');

  // Track audio state reactively
  const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);

  useEffect(() => {
    // Lock body scrolling while the floral intro gate is active
    if (stage !== 'dismissed') {
      document.body.style.overflow = 'hidden';
    }

    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.isPlaying);
      setIsMuted(audioManager.isMuted);
    });

    (window as any).replayWeddingEnvelope = () => {
      setStage('idle');
      document.body.style.overflow = 'hidden';
    };

    return () => {
      document.body.style.overflow = '';
      unsubscribe();
      delete (window as any).replayWeddingEnvelope;
    };
  }, [stage]);

  const handleOpenInvitation = () => {
    if (stage !== 'idle') return;

    // 1. Play wedding music on first guest interaction
    try {
      if (!audioManager.isMuted) {
        audioManager.play();
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    // 2. Confetti sparkle blast in project's signature Crimson & Champagne colors
    try {
      confetti({
        particleCount: 65,
        spread: 90,
        origin: { y: 0.52 },
        colors: ['#B91C1C', '#991B1B', '#D8C7B5', '#FAF6F0', '#FFFFFF'],
        startVelocity: 30,
        gravity: 0.75,
        ticks: 150,
        disableForReducedMotion: true,
      });
    } catch (e) {}

    // 3. Initiate Theme 26 Opening sequence with smooth white glow fade
    setStage('opening');
    if (onOpeningStart) onOpeningStart();

    // 4. Reveal the main invitation after the 750ms bloom transition
    setTimeout(() => {
      setStage('dismissed');
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 750);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStage('dismissed');
    document.body.style.overflow = '';
    if (onComplete) onComplete();
  };

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioManager.toggle();
  };

  if (stage === 'dismissed') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="floral-theme-26-intro"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        className="fixed inset-0 z-50 w-screen h-screen overflow-hidden select-none bg-[#FAF6F0]"
      >
        {/* Floating Audio Controller */}
        <button
          onClick={handleAudioToggle}
          className="fixed bottom-6 left-4 sm:bottom-auto sm:top-6 sm:left-8 z-55 flex items-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-full bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-sans tracking-widest uppercase shadow-2xl transition-all active:scale-95 cursor-pointer pointer-events-auto"
          aria-label={isMuted || !isPlaying ? 'Unmute wedding music' : 'Mute wedding music'}
        >
          {isMuted || !isPlaying ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
              <span className="opacity-80">Muted &bull; Tap to Play</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#B91C1C] animate-pulse" />
              <span className="opacity-95 font-medium">Do 4 Love &bull; Tap to Mute</span>
            </>
          )}
        </button>

        {/* Quick Skip Button */}
        <button
          onClick={handleSkip}
          className="fixed top-4 sm:top-6 right-4 sm:right-8 z-55 flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-[#B91C1C]/60 text-white text-[10px] sm:text-[11px] font-sans tracking-widest uppercase transition-all duration-200 shadow-xl cursor-pointer pointer-events-auto"
          aria-label="Skip into website"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#B91C1C]" />
        </button>

        {/* ================= THE DIGITAL YES THEME 26 (FLORAL) BOTANICAL GATE ================= */}
        <button
          type="button"
          onClick={handleOpenInvitation}
          aria-label="Tap to open invitation"
          className="relative w-full h-full overflow-hidden bg-[#FAF6F0] cursor-pointer block text-left focus:outline-none"
        >
          {/* Subtle paper grain texture layer */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
            style={{
              backgroundImage: `url('/assets/cotton-paper-texture.jpg')`,
              backgroundSize: '750px auto',
            }}
          />

          {/* Left Botanical Floral Border (Theme 26 Ju.border mirrored) */}
          <img
            src="/assets/floral-border-J4FzR5M8.png"
            alt=""
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-auto object-contain object-left opacity-60 pointer-events-none scale-x-[-1] transition-transform duration-1000"
          />

          {/* Right Botanical Floral Border (Theme 26 Ju.border right) */}
          <img
            src="/assets/floral-border-J4FzR5M8.png"
            alt=""
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-full w-auto object-contain object-right opacity-60 pointer-events-none transition-transform duration-1000"
          />

          {/* Top-Right & Bottom-Left Botanical Corner Accents */}
          <img
            src="/assets/floral-corner-BCj0Yuap.png"
            alt=""
            aria-hidden="true"
            className="absolute top-0 right-0 w-36 sm:w-52 h-auto object-contain opacity-35 pointer-events-none"
          />
          <img
            src="/assets/floral-corner-BCj0Yuap.png"
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto object-contain opacity-35 pointer-events-none scale-x-[-1] scale-y-[-1]"
          />

          {/* Central Floral Composition */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-8 text-center z-20">
            
            {/* Eyebrow: The Wedding Of / Date */}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.35em] text-[#7A6B5C] font-semibold mb-3 sm:mb-4"
            >
              The Wedding Of &bull; January 27, 2027
            </motion.p>

            {/* Couple's Names in Cormorant Garamond Serif */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
              className="font-serif text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-[#1C1510] tracking-[0.14em] uppercase font-medium leading-none drop-shadow-sm mb-6 sm:mb-7"
            >
              Miracle &amp; Malvin
            </motion.h1>

            {/* Theme 26 Signature Center Medallion (Circular Monogram Seal) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={
                stage === 'opening'
                  ? { scale: 1.18, opacity: 0.85, transition: { duration: 0.45, ease: 'easeOut' } }
                  : { opacity: 1, scale: 1 }
              }
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-full border border-[#B91C1C]/35 bg-white/80 backdrop-blur-md shadow-[0_12px_40px_rgba(185,28,28,0.18)] my-1 sm:my-2 cursor-pointer group"
            >
              {/* Outer decorative ring */}
              <div className="absolute inset-1.5 rounded-full border border-[#B91C1C]/20 border-dashed pointer-events-none animate-[spin_60s_linear_infinite]" />
              
              {/* Monogram Seal: Miracle & Malvin */}
              <span className="font-script text-4xl sm:text-5xl text-[#B91C1C] drop-shadow-sm select-none group-hover:scale-105 transition-transform duration-300">
                M &amp; M
              </span>
            </motion.div>

            {/* Delicate Botanical Divider */}
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              src="/assets/floral-divider-Bf711ADW.png"
              alt=""
              className="h-3.5 sm:h-4.5 w-auto my-4 sm:my-5 opacity-70"
            />

            {/* Invitation Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="font-serif italic text-sm sm:text-base text-[#5A4E42] max-w-sm sm:max-w-md mb-6 font-light"
            >
              We joyfully invite you to celebrate our union
            </motion.p>

            {/* Interactive "TAP TO OPEN" Callout Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="inline-flex items-center justify-center px-7 sm:px-9 py-2.5 sm:py-3 rounded-full bg-[#1C1510] hover:bg-[#B91C1C] text-white shadow-xl hover:shadow-[0_8px_30px_rgba(185,28,28,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
            >
              <span className="font-sans font-semibold text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-white whitespace-nowrap">
                Tap to Open
              </span>
            </motion.div>

          </div>

          {/* Theme 26 Signature White Glow Flash Fade Transition Overlay */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === 'opening' ? 1 : 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          />

        </button>
      </motion.div>
    </AnimatePresence>
  );
};
