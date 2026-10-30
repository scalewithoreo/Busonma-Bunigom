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

    // 3. Initiate Staggered 4-Flap Opening Sequence
    setStage('opening');
    if (onOpeningStart) onOpeningStart();

    // 4. Once all 4 flaps have sequentially opened (~2.3s total), dismiss the overlay
    setTimeout(() => {
      setStage('dismissed');
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 2350);
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

        {/* ================= 4-FLAP STAGGERED REVEAL SURFACE ================= */}
        <div className="relative w-full h-full">

          {/* ================= 1ST TO OPEN: TOP FLAP (Delay: 0.2s) ================= */}
          <motion.div
            initial={{ rotateX: 0, y: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    rotateX: 160,
                    y: -140,
                    opacity: [1, 1, 0.7, 0],
                    transition: {
                      duration: 0.85,
                      delay: 0.2,
                      times: [0, 0.4, 0.75, 1],
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }
                : { rotateX: 0, y: 0, opacity: 1 }
            }
            style={{
              ...paperTextureStyle,
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)',
            }}
            className="absolute inset-0 z-30 cursor-pointer pointer-events-auto flex flex-col items-center pt-20 sm:pt-24 md:pt-28"
            onClick={handleOpenEnvelope}
          >
            {/* Natural bottom drop shadow cast over lower flaps */}
            <div className="absolute inset-0 shadow-[0_24px_50px_rgba(0,0,0,0.35)]" />
            <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/30 via-transparent to-black/15 pointer-events-none" />

            {/* Top Flap Typography */}
            <motion.div
              animate={stage === 'opening' ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="relative z-35 flex flex-col items-center text-center px-4 max-w-xl pointer-events-none"
            >
              <p className="text-[11px] sm:text-xs md:text-sm font-sans tracking-[0.32em] uppercase text-[#7A6B5C] mb-1.5 sm:mb-2 font-semibold">
                EST. 2027
              </p>

              <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1C1510] tracking-[0.16em] sm:tracking-[0.22em] uppercase drop-shadow-sm leading-tight">
                MIRACLE & MALVIN
              </h1>
            </motion.div>
          </motion.div>

          {/* ================= 2ND TO OPEN: RIGHT FLAP (Delay: 0.65s) ================= */}
          <motion.div
            initial={{ rotateY: 0, x: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    rotateY: 150,
                    x: 140,
                    opacity: [1, 1, 0.7, 0],
                    transition: {
                      duration: 0.85,
                      delay: 0.65,
                      times: [0, 0.4, 0.75, 1],
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }
                : { rotateY: 0, x: 0, opacity: 1 }
            }
            style={{
              ...paperTextureStyle,
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
              clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)',
            }}
            className="absolute inset-0 z-24 pointer-events-none"
          >
            {/* Crease shading */}
            <div className="absolute inset-0 shadow-[inset_14px_0_35px_rgba(0,0,0,0.2)]" />
            <div className="absolute inset-0 bg-gradient-to-l from-black/5 via-transparent to-black/15" />
          </motion.div>

          {/* ================= 3RD TO OPEN: LEFT FLAP (Delay: 1.05s) ================= */}
          <motion.div
            initial={{ rotateY: 0, x: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    rotateY: -150,
                    x: -140,
                    opacity: [1, 1, 0.7, 0],
                    transition: {
                      duration: 0.85,
                      delay: 1.05,
                      times: [0, 0.4, 0.75, 1],
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }
                : { rotateY: 0, x: 0, opacity: 1 }
            }
            style={{
              ...paperTextureStyle,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)',
            }}
            className="absolute inset-0 z-22 pointer-events-none"
          >
            {/* Crease shading */}
            <div className="absolute inset-0 shadow-[inset_-14px_0_35px_rgba(0,0,0,0.2)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/15" />
          </motion.div>

          {/* ================= 4TH TO OPEN: BOTTOM FLAP (Delay: 1.45s) ================= */}
          <motion.div
            initial={{ rotateX: 0, y: 0, opacity: 1 }}
            animate={
              stage === 'opening'
                ? {
                    rotateX: -140,
                    y: 140,
                    opacity: [1, 1, 0.7, 0],
                    transition: {
                      duration: 0.85,
                      delay: 1.45,
                      times: [0, 0.4, 0.75, 1],
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }
                : { rotateX: 0, y: 0, opacity: 1 }
            }
            style={{
              ...paperTextureStyle,
              transformOrigin: 'bottom center',
              transformStyle: 'preserve-3d',
              clipPath: 'polygon(0% 100%, 50% 50%, 100% 100%)',
            }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* Bottom flap crease shadow */}
            <div className="absolute inset-0 shadow-[0_-22px_45px_rgba(0,0,0,0.25)]" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />
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
                      scale: 1.3,
                      y: -65,
                      rotate: 18,
                      opacity: 0,
                      filter: 'drop-shadow(0 25px 40px rgba(185,28,28,0.95))',
                      transition: { duration: 0.45, ease: 'easeOut' },
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