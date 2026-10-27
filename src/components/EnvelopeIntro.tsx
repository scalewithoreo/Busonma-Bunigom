import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Sparkles, ArrowRight } from 'lucide-react';
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

    // 2. Doctor Strange Golden Eldritch Spark Explosion
    try {
      // Golden star & spark fireworks
      confetti({
        particleCount: 70,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFB800', '#FFA500', '#FFF275', '#B91C1C', '#FFFFFF'],
        startVelocity: 35,
        gravity: 0.8,
        ticks: 200,
        disableForReducedMotion: true,
      });

      // Secondary fine spark shower
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 140,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA000', '#FFFFFF'],
          startVelocity: 25,
          gravity: 0.6,
          ticks: 150,
          disableForReducedMotion: true,
        });
      }, 150);
    } catch (e) {}

    // 3. Trigger 3D Opening Animation
    setStage('opening');

    // 4. Reveal Hero Section Immediately after smooth 3D unfolding (~0.95s)
    setTimeout(() => {
      sessionStorage.setItem('mm_envelope_opened', 'true');
      setStage('dismissed');
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 1000);
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

  return (
    <AnimatePresence>
      <motion.div
        key="full-envelope-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
        className="fixed inset-0 z-50 w-screen h-screen overflow-hidden select-none bg-[#121212]"
        style={{ perspective: '1400px' }}
      >
        {/* Top Control Bar: Audio indicator & Skip Button */}
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-[60] pointer-events-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs font-sans tracking-widest uppercase shadow-md">
            <Volume2 className="w-3.5 h-3.5 text-[#FFD700] animate-pulse" />
            <span className="text-[11px] font-medium tracking-wider">Do 4 Love &bull; Snoh Aalegra</span>
          </div>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 hover:border-[#FFD700]/50 text-[#F5EDE4] text-xs font-sans tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            aria-label="Skip directly to website"
          >
            <span>Skip into Website</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FFD700]" />
          </button>
        </div>

        {/* ================= FULL VIEWPORT 3D ENVELOPE ================= */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Golden Portal Light Bloom behind flaps when opening */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              stage === 'opening'
                ? { opacity: [0, 1, 0.8, 0], scale: [0.8, 1.8, 2.5, 3], transition: { duration: 1.1, ease: 'easeOut' } }
                : { opacity: 0 }
            }
            className="absolute z-10 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.95) 0%, rgba(255, 140, 0, 0.75) 30%, rgba(185, 28, 28, 0.5) 65%, transparent 75%)',
              filter: 'blur(30px)',
            }}
          />

          {/* Envelope Body Container - Covers Full Viewport */}
          <div className="relative w-full h-full overflow-hidden shadow-2xl">
            
            {/* Base Paper Texture Background */}
            <div 
              className="absolute inset-0 bg-[#F5EDE4]"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.04) 100%),
                  linear-gradient(rgba(18, 18, 18, 0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(18, 18, 18, 0.02) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 28px 28px, 28px 28px',
              }}
            />

            {/* Ambient vignette and lighting */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 pointer-events-none" />

            {/* ================= LEFT FLAP ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: -110, opacity: 0, transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateY: 0 }
              }
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)',
              }}
              className="absolute inset-0 z-20 bg-gradient-to-r from-[#EEDFD0] via-[#F5EDE4] to-[#E3D1BE] pointer-events-none"
            >
              {/* Embossed Paper Border & Bevel */}
              <div className="absolute inset-0 shadow-[inset_10px_0_30px_rgba(0,0,0,0.08)]" />
              {/* Subtle blind-embossed floral vines */}
              <svg className="absolute inset-y-0 left-0 h-full w-2/5 opacity-30 text-[#8C7A6B]" viewBox="0 0 200 800" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M40 0 C 80 150, 120 300, 70 450 C 30 580, 100 700, 60 800" />
                <path d="M60 180 Q 120 220, 80 270" />
                <path d="M70 380 Q 130 420, 90 480" />
                <circle cx="85" cy="225" r="5" fill="currentColor" opacity="0.6" />
                <circle cx="95" cy="425" r="5" fill="currentColor" opacity="0.6" />
              </svg>
            </motion.div>

            {/* ================= RIGHT FLAP ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: 110, opacity: 0, transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateY: 0 }
              }
              style={{
                transformOrigin: 'right center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(100% 0%, 50% 50%, 100% 100%)',
              }}
              className="absolute inset-0 z-20 bg-gradient-to-l from-[#EEDFD0] via-[#F5EDE4] to-[#E3D1BE] pointer-events-none"
            >
              <div className="absolute inset-0 shadow-[inset_-10px_0_30px_rgba(0,0,0,0.08)]" />
              <svg className="absolute inset-y-0 right-0 h-full w-2/5 opacity-30 text-[#8C7A6B]" viewBox="0 0 200 800" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M160 0 C 120 150, 80 300, 130 450 C 170 580, 100 700, 140 800" />
                <path d="M140 180 Q 80 220, 120 270" />
                <path d="M130 380 Q 70 420, 110 480" />
                <circle cx="115" cy="225" r="5" fill="currentColor" opacity="0.6" />
                <circle cx="105" cy="425" r="5" fill="currentColor" opacity="0.6" />
              </svg>
            </motion.div>

            {/* ================= BOTTOM FLAP ================= */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateX: 110, opacity: 0, transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateX: 0 }
              }
              style={{
                transformOrigin: 'bottom center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 100%, 50% 50%, 100% 100%)',
              }}
              className="absolute inset-0 z-25 bg-gradient-to-t from-[#E2CEB9] via-[#EFE2D2] to-[#F5EDE4] pointer-events-none"
            >
              <div className="absolute inset-0 shadow-[0_-12px_28px_rgba(0,0,0,0.12)]" />
              {/* Bottom fold embossing */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
            </motion.div>

            {/* ================= TOP FLAP (Sealed with Wax Seal) ================= */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateX: -160, opacity: 0, transition: { duration: 0.85, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateX: 0 }
              }
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 0%, 50% 50%, 100% 0%)',
              }}
              className="absolute inset-0 z-30 bg-gradient-to-b from-[#FFFDF9] via-[#F5EDE4] to-[#E5D2BF] cursor-pointer"
              onClick={handleOpenEnvelope}
            >
              {/* Pronounced flap edge shadow */}
              <div className="absolute inset-0 shadow-[0_15px_35px_rgba(0,0,0,0.18)]" />
              
              {/* Blind-embossed floral lace along top triangle */}
              <svg className="absolute inset-0 w-full h-full opacity-35 text-[#8C7A6B]" viewBox="0 0 1000 500" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M 0,0 Q 250,180 500,250 Q 750,180 1000,0" strokeDasharray="4 4" />
                <circle cx="250" cy="120" r="6" fill="currentColor" opacity="0.4" />
                <circle cx="500" cy="210" r="8" fill="currentColor" opacity="0.4" />
                <circle cx="750" cy="120" r="6" fill="currentColor" opacity="0.4" />
              </svg>
            </motion.div>

            {/* ================= DOCTOR STRANGE ANIMATED ELDRITCH WAX SEAL ================= */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center">

              {/* Doctor Strange Eldritch Mandala & Sparks Layer */}
              <div className="absolute pointer-events-none w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
                
                {/* 1. Deep Core Golden Ambient Bloom */}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.65, 0.95, 0.65],
                  }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 200, 0, 0.7) 0%, rgba(255, 120, 0, 0.45) 50%, rgba(255, 80, 0, 0) 75%)',
                    filter: 'blur(16px)',
                  }}
                />

                {/* 2. Outer Eldritch Rune Ring (Rotating Counter-Clockwise) */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
                  className="absolute w-[240px] h-[240px] sm:w-[290px] sm:h-[290px]"
                >
                  <svg viewBox="0 0 300 300" className="w-full h-full">
                    {/* Outer rune ring */}
                    <circle
                      cx="150"
                      cy="150"
                      r="135"
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="2"
                      strokeDasharray="6 14 18 8 2 12 30 6"
                      opacity="0.85"
                      filter="drop-shadow(0 0 6px #FFA500)"
                    />
                    {/* Inscribed mystic squares & runes */}
                    <rect
                      x="55"
                      y="55"
                      width="190"
                      height="190"
                      fill="none"
                      stroke="#FFB800"
                      strokeWidth="1.2"
                      opacity="0.6"
                      transform="rotate(45 150 150)"
                      strokeDasharray="10 8"
                    />
                    <circle
                      cx="150"
                      cy="150"
                      r="120"
                      fill="none"
                      stroke="#FFA000"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                      opacity="0.7"
                    />
                  </svg>
                </motion.div>

                {/* 3. Middle Fiery Eldritch Sparks Ring (Rotating Fast Clockwise) */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
                  className="absolute w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]"
                >
                  <svg viewBox="0 0 240 240" className="w-full h-full">
                    <circle
                      cx="120"
                      cy="120"
                      r="105"
                      fill="none"
                      stroke="#FFF275"
                      strokeWidth="3.5"
                      strokeDasharray="14 22 4 18 35 12"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 8px #FF9E00) drop-shadow(0 0 16px #FF5500)"
                    />
                    <circle
                      cx="120"
                      cy="120"
                      r="95"
                      fill="none"
                      stroke="#FF8C00"
                      strokeWidth="2"
                      strokeDasharray="30 15 10 20"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  </svg>
                </motion.div>

                {/* 4. Orbiting Fiery Sparks Shooting Outwards */}
                {[...Array(12)].map((_, i) => {
                  const angle = (i * 360) / 12;
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [0.6, 1.3, 0.6],
                        opacity: [0.5, 1, 0.3],
                        rotate: [0, 360],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8 + (i % 4) * 0.4,
                        ease: 'easeInOut',
                        delay: i * 0.15,
                      }}
                      className="absolute w-2 h-2 rounded-full bg-[#FFF380]"
                      style={{
                        transform: `rotate(${angle}deg) translate(${85 + (i % 3) * 18}px)`,
                        boxShadow: '0 0 10px #FF9E00, 0 0 20px #FF5500',
                      }}
                    />
                  );
                })}
              </div>

              {/* The Realistic Crimson Wax Seal Button */}
              <motion.button
                onClick={handleOpenEnvelope}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                animate={
                  stage === 'opening'
                    ? {
                        scale: [1, 1.4, 0],
                        rotate: [0, 25, 60],
                        opacity: [1, 0.9, 0],
                        filter: 'brightness(2)',
                        transition: { duration: 0.55, ease: 'easeIn' },
                      }
                    : {
                        scale: [1, 1.03, 1],
                        transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                      }
                }
                className="relative z-50 cursor-pointer focus:outline-none rounded-full"
                aria-label="Click to break wax seal and open invitation"
              >
                {/* Photorealistic 3D Wax Seal with Heavy Stamped Monogram */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                  <svg
                    viewBox="0 0 160 160"
                    className="w-full h-full drop-shadow-[0_15px_30px_rgba(185,28,28,0.65)]"
                  >
                    <defs>
                      {/* Deep Rich Scarlet Red Wax Radial Lighting */}
                      <radialGradient id="deepWaxGradient" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="25%" stopColor="#DC2626" />
                        <stop offset="55%" stopColor="#B91C1C" />
                        <stop offset="80%" stopColor="#7F1D1D" />
                        <stop offset="100%" stopColor="#450A0A" />
                      </radialGradient>

                      {/* Glossy Curved Rim Highlight */}
                      <linearGradient id="rimShine" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
                        <stop offset="40%" stopColor="rgba(239, 68, 68, 0.3)" />
                        <stop offset="70%" stopColor="rgba(69, 10, 10, 0.8)" />
                        <stop offset="100%" stopColor="rgba(0, 0, 0, 0.9)" />
                      </linearGradient>

                      {/* Pure High-Carat Gold Foil Gradient for M&M */}
                      <linearGradient id="goldMonogramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF8E7" />
                        <stop offset="25%" stopColor="#FFE082" />
                        <stop offset="55%" stopColor="#FFC107" />
                        <stop offset="80%" stopColor="#D48806" />
                        <stop offset="100%" stopColor="#874D00" />
                      </linearGradient>

                      {/* Monogram Bevel Drop Shadow */}
                      <filter id="debossShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#3B0505" floodOpacity="0.9" />
                      </filter>
                    </defs>

                    {/* Organic Molten Wax Outer Contour */}
                    <path
                      d="M 80,6
                         C 94,5 108,9 120,18
                         C 133,28 144,41 148,56
                         C 152,70 151,86 144,100
                         C 137,114 126,127 113,136
                         C 99,145 83,148 67,146
                         C 51,144 37,137 26,126
                         C 15,115 8,101 6,86
                         C 4,71 8,56 16,43
                         C 25,30 38,20 52,13
                         C 62,8 71,6 80,6 Z"
                      fill="url(#deepWaxGradient)"
                      stroke="url(#rimShine)"
                      strokeWidth="2.5"
                    />

                    {/* Deep Concentric Stamped Well */}
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="#8F1515"
                      stroke="#450A0A"
                      strokeWidth="3.5"
                    />

                    {/* Concentric Inner Bevel Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="50"
                      fill="none"
                      stroke="url(#rimShine)"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />

                    {/* Highly Pronounced M&M Monogram with Gold Foil & Deep Stamp */}
                    <text
                      x="80"
                      y="92"
                      fontFamily="'Playfair Display', Georgia, serif"
                      fontSize="44"
                      fontWeight="900"
                      fontStyle="italic"
                      letterSpacing="0.02em"
                      textAnchor="middle"
                      fill="url(#goldMonogramGradient)"
                      filter="url(#debossShadow)"
                      stroke="#FFE89C"
                      strokeWidth="0.8"
                    >
                      M&M
                    </text>

                    {/* Top Arc Highlight Glare */}
                    <path
                      d="M 45,35 Q 80,24 115,35"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.45)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </motion.button>

              {/* Pulsing Action Callout below Wax Seal */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleOpenEnvelope}
                className="absolute top-[110%] flex flex-col items-center cursor-pointer pointer-events-auto"
              >
                <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/60 hover:bg-[#B91C1C] border border-[#FFD700]/40 hover:border-[#FFD700] backdrop-blur-md shadow-[0_4px_25px_rgba(255,184,0,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 group">
                  <Sparkles className="w-4 h-4 text-[#FFD700] group-hover:rotate-12 transition-transform" />
                  <span className="font-sans text-xs sm:text-sm tracking-[0.25em] uppercase font-bold text-white">
                    Tap Wax Seal To Open
                  </span>
                </div>
                <p className="text-[11px] font-sans text-white/70 tracking-widest uppercase mt-2 drop-shadow-md">
                  Unseals directly into the celebration
                </p>
              </motion.div>

            </div>

          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};
