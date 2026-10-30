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
  // Always start sealed on page refresh so animation runs fresh every time
  const [stage, setStage] = useState<'sealed' | 'opening' | 'dismissed'>('sealed');

  // Track audio state reactively
  const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);

  useEffect(() => {
    // Lock scroll while envelope covers the viewport
    if (stage !== 'dismissed') {
      document.body.style.overflow = 'hidden';
    }

    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.isPlaying);
      setIsMuted(audioManager.isMuted);
    });

    (window as any).replayWeddingEnvelope = () => {
      setStage('sealed');
      document.body.style.overflow = 'hidden';
    };

    return () => {
      document.body.style.overflow = '';
      unsubscribe();
      delete (window as any).replayWeddingEnvelope;
    };
  }, [stage]);

  const handleOpenEnvelope = () => {
    if (stage !== 'sealed') return;

    // 1. Play music if not muted
    try {
      if (!audioManager.isMuted) {
        audioManager.play();
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    // 2. Confetti sparkle blast from center
    try {
      confetti({
        particleCount: 55,
        spread: 90,
        origin: { y: 0.52 },
        colors: ['#B91C1C', '#991B1B', '#E5A93C', '#F5EDE4', '#FFFFFF'],
        startVelocity: 30,
        gravity: 0.75,
        ticks: 160,
        disableForReducedMotion: true,
      });
    } catch (e) {}

    // 3. Initiate Slow Pull-Back Reveal Sequence
    setStage('opening');
    if (onOpeningStart) onOpeningStart();

    // 4. Once all 4 envelope parts have smoothly pulled back to the page edges (~3.0s), dismiss the overlay
    setTimeout(() => {
      setStage('dismissed');
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 6200);
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

  // 350gsm Felt-Pressed Cotton Paper Surface
  const paperTextureStyle: React.CSSProperties = {
    backgroundImage: `url('/assets/cotton-paper-texture.jpg')`,
    backgroundSize: '750px auto',
    backgroundColor: '#F7F3EE',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="photoreal-3d-staggered-envelope"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        className="fixed inset-0 z-50 w-screen h-screen overflow-hidden select-none pointer-events-none"
        style={{ perspective: '2200px' }}
      >
        {/* Audio Pill: Lower-Left on Mobile, Top-Left on Desktop */}
        <button
          onClick={handleAudioToggle}
          className="fixed bottom-6 left-4 sm:bottom-auto sm:top-6 sm:left-8 z-50 flex items-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-full bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-sans tracking-widest uppercase shadow-2xl transition-all active:scale-95 cursor-pointer pointer-events-auto"
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

        {/* Quick Skip Button: Top-Right */}
        <button
          onClick={handleSkip}
          className="fixed top-4 sm:top-6 right-4 sm:right-8 z-50 flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-[#B91C1C]/60 text-white text-[10px] sm:text-[11px] font-sans tracking-widest uppercase transition-all duration-200 shadow-xl cursor-pointer pointer-events-auto"
          aria-label="Skip into website"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#B91C1C]" />
        </button>

        {/* ================= 4-PART PULL-BACK REVEAL ENVELOPE ================= */}
        <div className="relative w-full h-full overflow-hidden">

          {/* ================= TOP FLAP: SLOWLY PULLS UPWARDS ================= */}
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    y: '-105%',
                    opacity: [1, 1, 0.9, 0],
                    transition: {
                      duration: 5.8,
                      delay: 0.15,
                      times: [0, 0.75, 0.95, 1],
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
                : { y: 0, opacity: 1 }
            }
            className="absolute inset-0 z-30 cursor-pointer pointer-events-auto flex flex-col items-center pt-16 xs:pt-20 sm:pt-28 md:pt-32"
            onClick={handleOpenEnvelope}
          >
            {/* The clipped paper flap background (ClipPath applied ONLY to background so typography is NEVER clipped) */}
            <div
              style={{
                ...paperTextureStyle,
                clipPath: 'polygon(-0.5% -0.5%, 100.5% -0.5%, 50% 50.5%)',
              }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Soft depth shadow cast over lower flaps */}
              <div className="absolute inset-0 shadow-[0_16px_40px_rgba(0,0,0,0.22)]" />
              <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none" />
            </div>

            {/* Top Flap Typography: Brought down and increased font, strictly single-line */}
            <motion.div
              animate={stage === 'opening' ? { opacity: [1, 1, 0.7, 0] } : { opacity: 1 }}
              transition={{ duration: 5.0, times: [0, 0.7, 0.92, 1] }}
              className="relative z-35 flex flex-col items-center text-center px-4 max-w-full pointer-events-none select-none"
            >
              <p className="text-[11px] sm:text-xs md:text-sm lg:text-base font-sans tracking-[0.32em] uppercase text-[#7A6B5C] mb-3 sm:mb-4 font-semibold whitespace-nowrap">
                JANUARY 2027
              </p>

              <h1 className="font-serif text-lg xs:text-xl sm:text-3xl md:text-5xl lg:text-6xl font-semibold text-[#1C1510] tracking-[0.12em] sm:tracking-[0.2em] uppercase drop-shadow-sm leading-none whitespace-nowrap">
                MIRACLE &amp; MALVIN
              </h1>
            </motion.div>
          </motion.div>

          {/* ================= RIGHT FLAP: SLOWLY PULLS RIGHTWARDS ================= */}
          <motion.div
            initial={{ x: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    x: '105%',
                    opacity: [1, 1, 0.9, 0],
                    transition: {
                      duration: 5.8,
                      delay: 0.15,
                      times: [0, 0.75, 0.95, 1],
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
                : { x: 0, opacity: 1 }
            }
            style={{
              ...paperTextureStyle,
              clipPath: 'polygon(100.5% -0.5%, 100.5% 100.5%, 49.5% 50%)',
            }}
            className="absolute inset-0 z-24 pointer-events-none"
          >
            {/* Crease shading */}
            <div className="absolute inset-0 shadow-[inset_14px_0_35px_rgba(0,0,0,0.18)]" />
            <div className="absolute inset-0 bg-gradient-to-l from-black/5 via-transparent to-black/10" />
          </motion.div>

          {/* ================= LEFT FLAP: SLOWLY PULLS LEFTWARDS ================= */}
          <motion.div
            initial={{ x: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    x: '-105%',
                    opacity: [1, 1, 0.9, 0],
                    transition: {
                      duration: 5.8,
                      delay: 0.15,
                      times: [0, 0.75, 0.95, 1],
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
                : { x: 0, opacity: 1 }
            }
            style={{
              ...paperTextureStyle,
              clipPath: 'polygon(-0.5% -0.5%, 50.5% 50%, -0.5% 100.5%)',
            }}
            className="absolute inset-0 z-22 pointer-events-none"
          >
            {/* Crease shading */}
            <div className="absolute inset-0 shadow-[inset_-14px_0_35px_rgba(0,0,0,0.18)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/10" />
          </motion.div>

          {/* ================= BOTTOM FLAP: SLOWLY PULLS DOWNWARDS ================= */}
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    y: '105%',
                    opacity: [1, 1, 0.9, 0],
                    transition: {
                      duration: 5.8,
                      delay: 0.15,
                      times: [0, 0.75, 0.95, 1],
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
                : { y: 0, opacity: 1 }
            }
            style={{
              ...paperTextureStyle,
              clipPath: 'polygon(-0.5% 100.5%, 50% 49.5%, 100.5% 100.5%)',
            }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* Bottom flap crease shadow */}
            <div className="absolute inset-0 shadow-[0_-18px_40px_rgba(0,0,0,0.2)]" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
          </motion.div>

          {/* ================= WAX SEAL & TAP BUTTON ================= */}
          <div className="absolute top-[52%] sm:top-[51%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center pointer-events-auto">

            {/* Photorealistic 3D Wax Seal Button */}
            <motion.button
              onClick={handleOpenEnvelope}
              whileHover={stage === 'sealed' ? { scale: 1.05 } : {}}
              whileTap={stage === 'sealed' ? { scale: 0.95 } : {}}
              animate={
                stage === 'opening'
                  ? {
                      scale: 1.25,
                      y: -40,
                      rotate: 12,
                      opacity: 0,
                      filter: 'drop-shadow(0 25px 40px rgba(185,28,28,0.95))',
                      transition: { duration: 1.2, ease: 'easeOut' },
                    }
                  : {
                      scale: [1, 1.025, 1],
                      transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                    }
              }
              className="relative z-50 cursor-pointer focus:outline-none rounded-full"
              aria-label="Click to break wax seal and open invitation"
            >
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 flex items-center justify-center">
                <img
                  src="/assets/wax-seal-mm.png"
                  alt="Miracle & Malvin 3D Wax Seal"
                  className="w-full h-full object-contain filter drop-shadow-[0_18px_36px_rgba(185,28,28,0.7)] drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)] transition-transform duration-200 select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </motion.button>

            {/* Sleek, Single-Line "TAP TO UNSEAL" Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={
                stage === 'opening'
                  ? { opacity: 0, y: 20, transition: { duration: 0.2 } }
                  : { opacity: 1, y: 0 }
              }
              transition={{ delay: 0.15 }}
              onClick={handleOpenEnvelope}
              className="mt-6 sm:mt-7 flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-[#181310] hover:bg-[#B91C1C] text-white shadow-xl hover:shadow-[0_8px_30px_rgba(185,28,28,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 whitespace-nowrap shrink-0">
                <span className="font-sans font-bold text-xs sm:text-sm tracking-[0.22em] uppercase text-white whitespace-nowrap select-none">
                  Tap to Unseal
                </span>
              </div>
            </motion.div>

          </div>

        </div>

      </motion.div>
    </AnimatePresence>
  );
};