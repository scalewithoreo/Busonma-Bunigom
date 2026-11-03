import React, { useState, useRef, useEffect, FC } from 'react';
import { motion } from 'framer-motion';
import { audioManager } from '../utils/audio';

interface EnvelopeIntroProps {
  onComplete?: () => void;
  onOpeningStart?: () => void;
}

/**
 * Exact 100% Reverse-Engineered Opening Engine from The Digital Yes Theme 26 (Floral)
 * Reconstructed directly from E3 in floral-index.js:
 * - Plays the high-resolution envelope unsealing and opening video
 * - Manages 'idle' -> 'playing' -> 'fading' -> 'dismissed' states
 * - Synchronizes audio activation and white glow bloom transition into Hero
 */
export const EnvelopeIntro: FC<EnvelopeIntroProps> = ({ onComplete, onOpeningStart }) => {
  const [status, setStatus] = useState<'idle' | 'playing' | 'fading' | 'dismissed'>('idle');
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (status !== 'dismissed') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    if (videoRef.current) {
      videoRef.current.load();
    }

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

    // Trigger wedding music on guest tap interaction
    try {
      if (!audioManager.isMuted) {
        audioManager.play();
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    // Exactly from Theme 26 E3: when within 0.8s of end, fade to white
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

  if (status === 'dismissed') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer bg-black overflow-hidden select-none"
      onClick={handleTap}
    >
      {/* 1. Theme 26 Sealed Envelope Poster */}
      <motion.img
        src="/assets/intro-poster-cma-eou6SMwT.jpg"
        alt="Sealed Wedding Envelope"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 1 }}
        animate={{ opacity: status === 'idle' ? 1 : 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />

      {/* 2. Theme 26 Unsealing & Envelope Opening Video */}
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

      {/* Subtle Call to Action Prompt in Idle State */}
      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute inset-0 flex flex-col items-center justify-end pb-20 sm:pb-24 pointer-events-none"
        >
          <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-[#B91C1C]/30 shadow-lg">
            <span className="font-sans text-[11px] uppercase tracking-[0.3em] font-medium text-[#1C1510]">
              Tap to Open
            </span>
          </div>
        </motion.div>
      )}

      {/* 3. Theme 26 Signature White Fade Transition */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: status === 'fading' ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* 4. Quick Skip Button (Theme 26 'Saltar') */}
      <motion.button
        onClick={handleSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
        className="absolute bottom-8 right-8 text-xs font-sans tracking-widest uppercase text-neutral-400 hover:text-white transition-colors duration-300 pointer-events-auto z-10"
      >
        Skip
      </motion.button>
    </div>
  );
};
