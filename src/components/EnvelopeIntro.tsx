import React, { useState, useRef, useEffect, FC } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../utils/audio';

interface EnvelopeIntroProps {
  onComplete?: () => void;
  onOpeningStart?: () => void;
}

/**
 * Exact 100% Reverse-Engineered Opening Engine from The Digital Yes Theme 26 (Floral)
 * Customized for Miracle & Malvin:
 * - Red Wax Seal embossed with "M & M"
 * - High-prominence "Tap to Open Invitation" button
 * - Opens with the exact video unsealing & flap unfold sequence from Theme 26
 * - Smooth white glow fade into the botanical floral hero
 */
export const EnvelopeIntro: FC<EnvelopeIntroProps> = ({ onComplete, onOpeningStart }) => {
  const [status, setStatus] = useState<'idle' | 'playing' | 'fading' | 'dismissed'>('idle');
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Track audio state reactively
  const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);

  useEffect(() => {
    if (status !== 'dismissed') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    if (videoRef.current) {
      videoRef.current.load();
    }

    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.isPlaying);
      setIsMuted(audioManager.isMuted);
    });

    (window as any).replayWeddingEnvelope = () => {
      setStatus('idle');
      setCanPlay(false);
      document.body.style.overflow = 'hidden';
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.load();
      }
    };

    return () => {
      document.body.style.overflow = '';
      unsubscribe();
      delete (window as any).replayWeddingEnvelope;
    };
  }, [status]);

  const handleCanPlayThrough = () => {
    setCanPlay(true);
  };

  const handleTap = () => {
    if (status !== 'idle' || !canPlay) return;

    setStatus('playing');
    if (onOpeningStart) onOpeningStart();

    // 1. Play wedding music on first guest interaction
    try {
      if (!audioManager.isMuted) {
        audioManager.play();
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    // 2. Confetti sparkle blast in Crimson & Gold
    try {
      confetti({
        particleCount: 75,
        spread: 90,
        origin: { y: 0.52 },
        colors: ['#B91C1C', '#991B1B', '#E5A93C', '#FAF6F0', '#FFFFFF'],
        startVelocity: 32,
        gravity: 0.75,
        ticks: 150,
        disableForReducedMotion: true,
      });
    } catch (e) {}

    // 3. Play envelope opening video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    // When video is within 0.8s of completion, trigger white glow bloom into Hero
    if (vid.duration - vid.currentTime <= 0.8 && status === 'playing') {
      setStatus('fading');
      setTimeout(() => {
        setStatus('dismissed');
        if (onComplete) onComplete();
      }, 800);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus('fading');
    setTimeout(() => {
      setStatus('dismissed');
      if (onComplete) onComplete();
    }, 400);

    try {
      if (!audioManager.isMuted) {
        audioManager.play();
      }
    } catch (err) {}
  };

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioManager.toggle();
  };

  if (status === 'dismissed') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer bg-[#FAF6F0] overflow-hidden select-none"
      onClick={handleTap}
    >
      {/* Audio Controller */}
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

      {/* Floating Skip Button */}
      <button
        onClick={handleSkip}
        className="fixed top-4 sm:top-6 right-4 sm:right-8 z-55 flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-[#B91C1C]/60 text-white text-[10px] sm:text-[11px] font-sans tracking-widest uppercase transition-all duration-200 shadow-xl cursor-pointer pointer-events-auto"
        aria-label="Skip into website"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#B91C1C]" />
      </button>

      {/* 1. Theme 26 Sealed Envelope Background Poster */}
      <motion.img
        src="/assets/intro-poster-cma-eou6SMwT.jpg"
        alt="Sealed Wedding Envelope"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 1 }}
        animate={{ opacity: status === 'idle' ? 1 : 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />

      {/* 2. Theme 26 Envelope Opening Video */}
      <motion.video
        ref={videoRef}
        src="/assets/intro-cma-BtcZIfbL.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onCanPlayThrough={handleCanPlayThrough}
        playsInline
        muted
        preload="auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: status !== 'idle' ? 1 : 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />

      {/* ================= CUSTOMIZED RED M & M WAX SEAL & PROMINENT TAP BUTTON ================= */}
      {status === 'idle' && (
        <div className="absolute top-[52.9%] left-[51.9%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center pointer-events-none">
          {/* Custom Red 3D Wax Seal with "M & M" Embossing */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.03, 1], opacity: 1 }}
            transition={{
              scale: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
              opacity: { duration: 0.5 },
            }}
            className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex items-center justify-center filter drop-shadow-[0_16px_36px_rgba(185,28,28,0.7)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          >
            <img
              src="/assets/wax-seal-mm.png"
              alt="Miracle & Malvin Custom Red Wax Seal with M&M Embossing"
              className="w-full h-full object-contain select-none"
              draggable={false}
            />
          </motion.div>

          {/* Prominent, Evident "TAP TO OPEN" Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: 1,
              y: [0, -5, 0],
            }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            }}
            className="mt-6 sm:mt-7"
          >
            <div className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#181310]/95 hover:bg-[#B91C1C] text-white shadow-[0_12px_35px_rgba(0,0,0,0.5),0_0_25px_rgba(185,28,28,0.5)] border-2 border-[#B91C1C]/70 hover:border-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
              <Sparkles className="w-4 h-4 text-[#B91C1C] animate-pulse" />
              <span className="font-sans font-bold text-xs sm:text-sm tracking-[0.26em] uppercase text-white whitespace-nowrap">
                Tap to Open Invitation
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Disintegrating / Opening Seal Transition when Tapped */}
      {status === 'playing' && (
        <motion.div
          initial={{ scale: 1, opacity: 1, y: 0 }}
          animate={{ scale: 1.35, opacity: 0, y: -25, rotate: 8 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute top-[52.9%] left-[51.9%] -translate-x-1/2 -translate-y-1/2 z-30 w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex items-center justify-center filter drop-shadow-[0_20px_40px_rgba(185,28,28,0.9)] pointer-events-none"
        >
          <img
            src="/assets/wax-seal-mm.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </motion.div>
      )}

      {/* 3. Theme 26 Signature White Fade Transition */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: status === 'fading' ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
    </div>
  );
};
