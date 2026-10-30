import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../utils/audio';

interface EnvelopeIntroProps {
  onComplete?: () => void;
}

export const EnvelopeIntro: React.FC<EnvelopeIntroProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<'sealed' | 'opening' | 'dismissed'>('sealed');

  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem('mm_envelope_opened');
    if (alreadyOpened === 'true') {
      setStage('dismissed');
    } else {
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }

    // Expose global replay function
    (window as any).replayWeddingEnvelope = () => {
      sessionStorage.removeItem('mm_envelope_opened');
      setStage('sealed');
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    };

    return () => {
      document.body.style.overflow = '';
      delete (window as any).replayWeddingEnvelope;
    };
  }, []);

  const handleOpenEnvelope = () => {
    if (stage !== 'sealed') return;

    // 1. Play background song immediately
    try {
      audioManager.play();
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    // 2. Confetti sparkle blast
    try {
      confetti({
        particleCount: 55,
        spread: 95,
        origin: { y: 0.5 },
        colors: ['#B91C1C', '#991B1B', '#FFD700', '#F5EDE4', '#FFFFFF'],
        startVelocity: 32,
        gravity: 0.7,
        ticks: 170,
        disableForReducedMotion: true,
      });
    } catch (e) {}

    // 3. 3D flap unsealing
    setStage('opening');

    // 4. Reveal Hero Section Immediately
    setTimeout(() => {
      sessionStorage.setItem('mm_envelope_opened', 'true');
      setStage('dismissed');
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 900);
  };

  const handleSkip = () => {
    sessionStorage.setItem('mm_envelope_opened', 'true');
    setStage('dismissed');
    document.body.style.overflow = '';
    if (onComplete) onComplete();
  };

  if (stage === 'dismissed' || !isOpen) {
    return null;
  }

  // Authentic 350gsm Felt-Pressed Cotton Paper Background Styling
  const paperTextureStyle = {
    backgroundImage: `url('/assets/cotton-paper-texture.jpg')`,
    backgroundSize: '800px auto',
    backgroundColor: '#F7F3EE',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="photoreal-3d-envelope"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
        className="fixed inset-0 z-50 w-screen h-screen overflow-hidden select-none bg-[#0D0B0A]"
        style={{ perspective: '1600px' }}
      >
        {/* Subtle Ambient Light Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80 pointer-events-none z-40" />

        {/* Sleek Minimalist Controls */}
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-50 pointer-events-auto">
          {/* Audio pill: sleek & minimal */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-sans tracking-widest uppercase shadow-md">
            <Volume2 className="w-3.5 h-3.5 text-[#B91C1C] animate-pulse" />
            <span className="opacity-90 font-medium">Do 4 Love &bull; Snoh Aalegra</span>
          </div>

          {/* Skip pill: sleek & minimal */}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/10 hover:border-[#B91C1C]/60 text-white/90 hover:text-white text-[11px] font-sans tracking-widest uppercase transition-all duration-200 shadow-md"
            aria-label="Skip to website"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#B91C1C]" />
          </button>
        </div>

        {/* ================= VOLUMETRIC 3D ENVELOPE ================= */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Envelope Body Container - Covers Full Viewport Responsively */}
          <div className="relative w-full h-full overflow-hidden">

            {/* BASE COTTON PAPER SURFACE (Beneath flaps) */}
            <div
              className="absolute inset-0"
              style={paperTextureStyle}
            />

            {/* Subtle natural fold shading */}
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-black/15 via-transparent to-black/15" />

            {/* ================= LEFT FLAP (3D Felt-Pressed Cotton Paper) ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: -115, opacity: 0, transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateY: 0 }
              }
              style={{
                ...paperTextureStyle,
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)',
              }}
              className="absolute inset-0 z-20 pointer-events-none"
            >
              {/* Deep diagonal seam drop-shadow */}
              <div className="absolute inset-0 shadow-[inset_-10px_0_30px_rgba(0,0,0,0.18)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/10" />
            </motion.div>

            {/* ================= RIGHT FLAP (3D Felt-Pressed Cotton Paper) ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: 115, opacity: 0, transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateY: 0 }
              }
              style={{
                ...paperTextureStyle,
                transformOrigin: 'right center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(100% 0%, 50% 50%, 100% 100%)',
              }}
              className="absolute inset-0 z-20 pointer-events-none"
            >
              <div className="absolute inset-0 shadow-[inset_10px_0_30px_rgba(0,0,0,0.18)]" />
              <div className="absolute inset-0 bg-gradient-to-l from-black/5 via-transparent to-black/10" />
            </motion.div>

            {/* ================= BOTTOM FLAP ================= */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateX: 110, opacity: 0, transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateX: 0 }
              }
              style={{
                ...paperTextureStyle,
                transformOrigin: 'bottom center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 100%, 50% 50%, 100% 100%)',
              }}
              className="absolute inset-0 z-25 pointer-events-none"
            >
              {/* Realistic deep pocket shadow over lower fold */}
              <div className="absolute inset-0 shadow-[0_-20px_36px_rgba(0,0,0,0.2)]" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/15 to-transparent" />
            </motion.div>

            {/* ================= TOP FLAP (With EST. 2027 and Bold MIRACLE & MALVIN) ================= */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateX: -160, opacity: 0, transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateX: 0 }
              }
              style={{
                ...paperTextureStyle,
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 0%, 50% 50%, 100% 0%)',
              }}
              className="absolute inset-0 z-30 cursor-pointer flex flex-col items-center pt-10 sm:pt-16"
              onClick={handleOpenEnvelope}
            >
              {/* Heavy shadow cast by the thick cotton flap onto bottom layers */}
              <div className="absolute inset-0 shadow-[0_24px_50px_rgba(0,0,0,0.28)]" />

              {/* Physical cotton paper edge highlight */}
              <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/35 via-transparent to-black/10 pointer-events-none" />

              {/* Top Flap Typography: EST. 2027 & Bold, Pronounced Couple Name */}
              <div className="relative z-35 flex flex-col items-center text-center px-4 pointer-events-none">
                <p className="text-xs sm:text-sm font-sans tracking-[0.35em] uppercase text-[#7A6B5C] mb-2 font-semibold">
                  EST. 2027
                </p>

                <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-semibold text-[#1C1510] tracking-[0.22em] uppercase drop-shadow-sm my-1">
                  MIRACLE & MALVIN
                </h1>
              </div>
            </motion.div>

            {/* ================= PHOTOREALISTIC WAX SEAL & BOLD CALLOUT ================= */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center">

              {/* The Photorealistic Wax Seal Button with Stamped M&M Monogram */}
              <motion.button
                onClick={handleOpenEnvelope}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                animate={
                  stage === 'opening'
                    ? {
                        scale: [1, 1.35, 0],
                        rotate: [0, 20, 50],
                        opacity: [1, 0.9, 0],
                        filter: 'brightness(2)',
                        transition: { duration: 0.5, ease: 'easeIn' },
                      }
                    : {
                        scale: [1, 1.025, 1],
                        transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                      }
                }
                className="relative z-50 cursor-pointer focus:outline-none rounded-full"
                aria-label="Click to break wax seal and open invitation"
              >
                {/* Genuine Photographic 3D Wax Seal Asset (with Organic Molten Edges & Debossed M&M) */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                  <img
                    src="/assets/wax-seal-mm.png"
                    alt="Miracle & Malvin 3D Wax Seal"
                    className="w-full h-full object-contain filter drop-shadow-[0_18px_36px_rgba(185,28,28,0.7)] drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)] transition-transform duration-200 select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
              </motion.button>

              {/* Very Bold, Legible, Accessible "TAP TO UNSEAL" (Shifted down below seal) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleOpenEnvelope}
                className="mt-8 flex flex-col items-center cursor-pointer pointer-events-auto"
              >
                <div className="flex items-center gap-2.5 px-8 py-3 rounded-full bg-[#1A1410] hover:bg-[#B91C1C] text-white shadow-2xl hover:shadow-[0_8px_30px_rgba(185,28,28,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/15">
                  <span className="font-sans font-extrabold text-xs sm:text-sm tracking-[0.28em] uppercase text-white">
                    Tap to Unseal
                  </span>
                </div>
              </motion.div>

            </div>

          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};
