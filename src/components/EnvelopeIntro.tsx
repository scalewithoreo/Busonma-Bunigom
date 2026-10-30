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
  // Always start as 'sealed' so refreshing the site restarts the envelope animation
  const [stage, setStage] = useState<'sealed' | 'opening' | 'dismissed'>('sealed');

  // Track music playback and mute state reactively
  const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);

  useEffect(() => {
    // Lock scrolling while envelope is active
    if (stage !== 'dismissed') {
      document.body.style.overflow = 'hidden';
    }

    // Subscribe to AudioManager changes
    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.isPlaying);
      setIsMuted(audioManager.isMuted);
    });

    // Global replay function for developer testing or UI triggers
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

    // 1. Play song if not muted by the user
    try {
      if (!audioManager.isMuted) {
        audioManager.play();
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    // 2. Confetti sparkle blast from seal center
    try {
      confetti({
        particleCount: 50,
        spread: 85,
        origin: { y: 0.5 },
        colors: ['#B91C1C', '#991B1B', '#E5A93C', '#F5EDE4', '#FFFFFF'],
        startVelocity: 28,
        gravity: 0.75,
        ticks: 150,
        disableForReducedMotion: true,
      });
    } catch (e) {}

    // 3. Initiate opening animation sequence
    setStage('opening');
    if (onOpeningStart) onOpeningStart();

    // 4. Reveal website hero section once the flap has fully opened
    setTimeout(() => {
      setStage('dismissed');
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 1300);
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

  // 350gsm Felt-Pressed Cotton Paper Texture
  const paperTextureStyle: React.CSSProperties = {
    backgroundImage: `url('/assets/cotton-paper-texture.jpg')`,
    backgroundSize: '750px auto',
    backgroundColor: '#F7F3EE',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="photoreal-3d-envelope"
        initial={{ opacity: 1 }}
        animate={{
          opacity: stage === 'opening' ? [1, 1, 0.9, 0] : 1,
          scale: stage === 'opening' ? [1, 1, 1.03, 1.06] : 1,
        }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        transition={{ duration: 1.3, times: [0, 0.6, 0.85, 1], ease: 'easeInOut' }}
        className="fixed inset-0 z-50 w-screen h-screen overflow-hidden select-none bg-[#0D0B0A]"
        style={{ perspective: '1800px' }}
      >
        {/* Subtle Ambient Room Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/85 pointer-events-none z-40" />

        {/* Minimalist Top Control Bar with Safe Margins */}
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-50 pointer-events-auto">
          {/* Fully Interactive Audio Pill */}
          <button
            onClick={handleAudioToggle}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-sans tracking-widest uppercase shadow-lg transition-all active:scale-95 cursor-pointer"
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
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 hover:border-[#B91C1C]/60 text-white text-[10px] sm:text-[11px] font-sans tracking-widest uppercase transition-all duration-200 shadow-lg cursor-pointer"
            aria-label="Skip into website"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#B91C1C]" />
          </button>
        </div>

        {/* ================= REALISTIC 3D ENVELOPE ================= */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Envelope Body Container - Fills Full Viewport */}
          <div className="relative w-full h-full overflow-hidden">

            {/* BASE COTTON PAPER SURFACE (Inside of envelope) */}
            <div
              className="absolute inset-0"
              style={paperTextureStyle}
            />

            {/* Internal Warm Golden Glow that shines through when the top flap flips open */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={stage === 'opening' ? { opacity: 0.85 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-[#B91C1C]/15 via-[#F5B853]/25 to-transparent pointer-events-none z-10"
            />

            {/* ================= LEFT FLAP ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: -35, opacity: 0.5, transition: { duration: 0.85, delay: 0.2, ease: [0.65, 0, 0.35, 1] } }
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
              {/* Inner crease shading */}
              <div className="absolute inset-0 shadow-[inset_-12px_0_35px_rgba(0,0,0,0.18)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/15" />
            </motion.div>

            {/* ================= RIGHT FLAP ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: 35, opacity: 0.5, transition: { duration: 0.85, delay: 0.2, ease: [0.65, 0, 0.35, 1] } }
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
              {/* Inner crease shading */}
              <div className="absolute inset-0 shadow-[inset_12px_0_35px_rgba(0,0,0,0.18)]" />
              <div className="absolute inset-0 bg-gradient-to-l from-black/5 via-transparent to-black/15" />
            </motion.div>

            {/* ================= BOTTOM FLAP ================= */}
            <motion.div
              initial={{ rotateX: 0, y: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateX: 35, y: 40, opacity: 0.5, transition: { duration: 0.85, delay: 0.2, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateX: 0, y: 0 }
              }
              style={{
                ...paperTextureStyle,
                transformOrigin: 'bottom center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 100%, 50% 50%, 100% 100%)',
              }}
              className="absolute inset-0 z-25 pointer-events-none"
            >
              {/* Bottom flap crease shadow */}
              <div className="absolute inset-0 shadow-[0_-22px_40px_rgba(0,0,0,0.22)]" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
            </motion.div>

            {/* ================= TOP FLAP (3D Opening on Hinge) ================= */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={
                stage === 'opening'
                  ? {
                      rotateX: 180,
                      zIndex: 15,
                      transition: { duration: 0.85, ease: [0.4, 0, 0.2, 1] },
                    }
                  : { rotateX: 0, zIndex: 30 }
              }
              style={{
                ...paperTextureStyle,
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 0%, 50% 50%, 100% 0%)',
              }}
              className="absolute inset-0 cursor-pointer flex flex-col items-center pt-20 sm:pt-24 md:pt-28"
              onClick={handleOpenEnvelope}
            >
              {/* Heavy natural shadow cast by the thick cotton flap onto bottom layers */}
              <div className="absolute inset-0 shadow-[0_28px_55px_rgba(0,0,0,0.32)]" />

              {/* Physical paper edge highlight */}
              <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/35 via-transparent to-black/15 pointer-events-none" />

              {/* Top Flap Typography: Shifted down comfortably below top bar, balanced & centralized */}
              <motion.div
                animate={stage === 'opening' ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.3 }}
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

            {/* ================= WAX SEAL & CENTRALIZED CONTROLS ================= */}
            <div className="absolute top-[52%] sm:top-[51%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center pointer-events-auto">

              {/* Photorealistic Wax Seal Button with Stamped M&M Monogram */}
              <motion.button
                onClick={handleOpenEnvelope}
                whileHover={stage === 'sealed' ? { scale: 1.05 } : {}}
                whileTap={stage === 'sealed' ? { scale: 0.95 } : {}}
                animate={
                  stage === 'opening'
                    ? {
                        scale: 1.25,
                        y: -50,
                        rotate: 15,
                        opacity: 0,
                        filter: 'drop-shadow(0 25px 40px rgba(185,28,28,0.9))',
                        transition: { duration: 0.5, ease: 'easeOut' },
                      }
                    : {
                        scale: [1, 1.025, 1],
                        transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                      }
                }
                className="relative z-50 cursor-pointer focus:outline-none rounded-full"
                aria-label="Click to break wax seal and open invitation"
              >
                {/* 3D Wax Seal Asset with Debossed M&M and Organic Edges */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 flex items-center justify-center">
                  <img
                    src="/assets/wax-seal-mm.png"
                    alt="Miracle & Malvin 3D Wax Seal"
                    className="w-full h-full object-contain filter drop-shadow-[0_18px_36px_rgba(185,28,28,0.7)] drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)] transition-transform duration-200 select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
              </motion.button>

              {/* Sleek, Single-Line, Unbroken "TAP TO UNSEAL" Button (Fixed Mobile Line-Break) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={
                  stage === 'opening'
                    ? { opacity: 0, y: 20, transition: { duration: 0.25 } }
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
        </div>

      </motion.div>
    </AnimatePresence>
  );
};