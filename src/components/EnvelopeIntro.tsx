import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Sparkles, ChevronDown, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../utils/audio';

interface EnvelopeIntroProps {
  onComplete?: () => void;
}

export const EnvelopeIntro: React.FC<EnvelopeIntroProps> = ({ onComplete }) => {
  // Check if previously opened in this session
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<'sealed' | 'breaking' | 'opened' | 'dismissed'>('sealed');
  const [hasStartedAudio, setHasStartedAudio] = useState(false);

  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem('mm_envelope_opened');
    if (alreadyOpened === 'true') {
      setStage('dismissed');
    } else {
      setIsOpen(true);
      // Lock background scrolling while envelope is active
      document.body.style.overflow = 'hidden';
    }

    // Expose global replay function so users can replay the envelope from the footer or nav anytime
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

    // 1. Play background song
    try {
      audioManager.play();
      setHasStartedAudio(true);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    // 2. Trigger micro confetti burst
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.52 },
        colors: ['#B91C1C', '#991B1B', '#F5EDE4', '#FFFFFF', '#D4AF37'],
        disableForReducedMotion: true,
      });
    } catch (e) {}

    // 3. Advance to breaking stage
    setStage('breaking');

    // 4. Advance to fully opened flap & sliding card
    setTimeout(() => {
      setStage('opened');
    }, 600);
  };

  const handleDismiss = () => {
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
        key="envelope-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#121212]/92 backdrop-blur-xl overflow-hidden select-none"
      >
        {/* Ambient atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#B91C1C]/20 via-[#F5EDE4]/10 to-transparent rounded-full blur-3xl animate-pulseSlow" />
        </div>

        {/* Top Control Bar: Audio indicator & Skip Button */}
        <div className="absolute top-5 inset-x-5 sm:inset-x-8 flex items-center justify-between z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-xs font-sans tracking-widest uppercase">
            <Volume2 className="w-3.5 h-3.5 text-[#B91C1C]" />
            <span>Do 4 Love &bull; Snoh Aalegra</span>
          </div>

          <button
            onClick={handleDismiss}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-[#F5EDE4] text-xs font-sans tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Skip into website"
          >
            <span>Skip to Website</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Outer Phone/Card Frame Wrapper */}
        <div className="relative w-full max-w-[380px] sm:max-w-[420px] h-[640px] sm:h-[680px] flex items-center justify-center perspective-[1200px]">
          
          {/* ================= INVITATION CARD (Slides up when envelope opens) ================= */}
          <motion.div
            initial={{ y: 70, scale: 0.88, opacity: 0 }}
            animate={
              stage === 'opened'
                ? { y: -80, scale: 1, opacity: 1, transition: { delay: 0.35, duration: 1.1, ease: [0.16, 1, 0.3, 1] } }
                : { y: 70, scale: 0.88, opacity: 0 }
            }
            className="absolute z-20 w-[90%] max-w-[340px] sm:max-w-[360px] h-[520px] bg-[#FAF7F2] rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#B91C1C]/25 flex flex-col justify-between items-center text-center overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(#B91C1C 0.6px, transparent 0.6px)`,
              backgroundSize: '24px 24px',
              backgroundColor: '#FAF7F2',
            }}
          >
            {/* Elegant Floral Arch Border (SVG) */}
            <div className="absolute inset-2 sm:inset-3 border border-[#B91C1C]/20 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between text-[#B91C1C]/40 text-xs">
                <span>✦</span>
                <span>✦</span>
              </div>
              <div className="flex justify-between text-[#B91C1C]/40 text-xs">
                <span>✦</span>
                <span>✦</span>
              </div>
            </div>

            {/* Top Monogram Crest */}
            <div className="relative z-10 pt-2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-[#B91C1C]/30 flex items-center justify-center bg-[#F5EDE4]/70 mb-2">
                <span className="font-alex text-2xl text-[#B91C1C]">M&M</span>
              </div>
              <p className="text-[10px] font-sans uppercase tracking-[0.3em] font-semibold text-[#B91C1C]">
                The Wedding Celebration Of
              </p>
            </div>

            {/* Couple Names */}
            <div className="relative z-10 my-auto py-2">
              <h2 className="font-alex text-5xl sm:text-6xl text-[#121212] leading-tight">
                Miracle
              </h2>
              <span className="font-serif italic text-2xl text-[#B91C1C] my-0.5 block">&</span>
              <h2 className="font-alex text-5xl sm:text-6xl text-[#121212] leading-tight">
                Malvin
              </h2>
            </div>

            {/* Event Details */}
            <div className="relative z-10 space-y-1.5 pb-2">
              <p className="font-serif text-lg sm:text-xl text-[#121212] font-medium tracking-wide">
                Wednesday, January 27, 2027
              </p>
              <p className="text-xs font-sans uppercase tracking-widest text-[#6E6760]">
                Celebration Church Int'l HQ &bull; Lagos
              </p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1 rounded-full bg-[#B91C1C]/10 text-[#B91C1C] text-[10px] font-sans font-bold uppercase tracking-widest">
                  High-Fashion Editorial Black-Tie
                </span>
              </div>
            </div>

            {/* Enter Button Action */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDismiss}
              className="relative z-10 w-full py-3.5 px-6 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-sans text-xs font-bold uppercase tracking-[0.25em] shadow-lg flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <span>Enter Wedding Website</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* ================= ENVELOPE BODY & FLAPS ================= */}
          <div className="relative z-30 w-full h-[380px] sm:h-[410px] mt-28">
            
            {/* Envelope Back Plate (Internal Pocket) */}
            <div className="absolute inset-0 bg-[#E5D7C7] rounded-3xl shadow-2xl border border-[#D8C7B5] overflow-hidden">
              {/* Inner Lining with Dark Luxury Aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#181513] to-[#25201C] opacity-90 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-[#B91C1C]/20 flex items-center justify-center">
                  <span className="font-alex text-4xl text-[#B91C1C]/30">M & M</span>
                </div>
              </div>
            </div>

            {/* Left Flap */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#F5EDE4] to-[#EBDDD0] shadow-md z-30 pointer-events-none"
              style={{
                clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
                borderTopLeftRadius: '24px',
                borderBottomLeftRadius: '24px',
              }}
            >
              {/* Subtle Embossed Floral Line Pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-25 text-[#6E6760]" viewBox="0 0 200 400" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M20 50 C 40 80, 80 120, 100 180 C 110 210, 120 260, 40 350" />
                <path d="M50 100 Q 80 130 60 170" />
                <circle cx="70" cy="120" r="3" fill="currentColor" />
                <circle cx="95" cy="190" r="4" fill="currentColor" />
                <circle cx="45" cy="320" r="3" fill="currentColor" />
              </svg>
            </div>

            {/* Right Flap */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#F5EDE4] to-[#EBDDD0] shadow-md z-30 pointer-events-none"
              style={{
                clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)',
                borderTopRightRadius: '24px',
                borderBottomRightRadius: '24px',
              }}
            >
              {/* Subtle Embossed Floral Line Pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-25 text-[#6E6760]" viewBox="0 0 200 400" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M180 50 C 160 80, 120 120, 100 180 C 90 210, 80 260, 160 350" />
                <path d="M150 100 Q 120 130 140 170" />
                <circle cx="130" cy="120" r="3" fill="currentColor" />
                <circle cx="105" cy="190" r="4" fill="currentColor" />
                <circle cx="155" cy="320" r="3" fill="currentColor" />
              </svg>
            </div>

            {/* Bottom Pocket Flap */}
            <div
              className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#F0E4D5] to-[#E6D6C4] shadow-lg z-30 pointer-events-none"
              style={{
                clipPath: 'polygon(0% 100%, 50% 15%, 100% 100%)',
                borderBottomLeftRadius: '24px',
                borderBottomRightRadius: '24px',
              }}
            >
              {/* Subtle Bottom Crease Light */}
              <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/5 to-transparent" />
            </div>

            {/* TOP FOLDING FLAP (Opens 180 degrees upward on click) */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={
                stage === 'breaking' || stage === 'opened'
                  ? {
                      rotateX: 180,
                      zIndex: stage === 'opened' ? 10 : 35,
                      transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
                    }
                  : { rotateX: 0, zIndex: 35 }
              }
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 0%, 50% 85%, 100% 0%)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
              className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-[#FAF4EC] to-[#EBDDD0] shadow-md flex items-center justify-center cursor-pointer"
              onClick={handleOpenEnvelope}
            >
              {/* Backside shading when flipped */}
              <div className="absolute inset-0 bg-[#E0D0BE]/40 pointer-events-none" />
            </motion.div>

            {/* ================= 3D WAX SEAL (Scarlet & Crimson #B91C1C) ================= */}
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
              <motion.button
                onClick={handleOpenEnvelope}
                whileHover={stage === 'sealed' ? { scale: 1.08 } : {}}
                whileTap={stage === 'sealed' ? { scale: 0.95 } : {}}
                animate={
                  stage === 'sealed'
                    ? {
                        scale: [1, 1.04, 1],
                        filter: [
                          'drop-shadow(0 8px 18px rgba(185, 28, 28, 0.4))',
                          'drop-shadow(0 12px 26px rgba(185, 28, 28, 0.65))',
                          'drop-shadow(0 8px 18px rgba(185, 28, 28, 0.4))',
                        ],
                        transition: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
                      }
                    : stage === 'breaking'
                    ? {
                        scale: 1.25,
                        opacity: 0.85,
                        rotate: 15,
                        y: -15,
                        transition: { duration: 0.45, ease: 'easeOut' },
                      }
                    : {
                        scale: 0.7,
                        opacity: 0,
                        y: -80,
                        transition: { duration: 0.5, ease: 'easeIn' },
                      }
                }
                className="relative group cursor-pointer focus:outline-none"
                aria-label="Break wax seal and open invitation"
              >
                {/* Wax Seal SVG Body */}
                <svg width="96" height="96" viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24">
                  <defs>
                    {/* Realistic Red Wax Radial Gradient */}
                    <radialGradient id="waxGradient" cx="38%" cy="32%" r="68%">
                      <stop offset="0%" stopColor="#DC2626" />
                      <stop offset="45%" stopColor="#B91C1C" />
                      <stop offset="85%" stopColor="#881313" />
                      <stop offset="100%" stopColor="#550A0A" />
                    </radialGradient>

                    {/* Wax Rim Bevel Gradient */}
                    <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                      <stop offset="50%" stopColor="rgba(185, 28, 28, 0.2)" />
                      <stop offset="100%" stopColor="rgba(0, 0, 0, 0.6)" />
                    </linearGradient>

                    {/* Gold Monogram Gradient */}
                    <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2D6" />
                      <stop offset="50%" stopColor="#E5C396" />
                      <stop offset="100%" stopColor="#B3864E" />
                    </linearGradient>
                  </defs>

                  {/* Organic Wax Outer Perimeter */}
                  <path
                    d="M 50,4 
                       C 58,3 67,6 74,12 
                       C 82,18 89,26 92,35 
                       C 95,44 96,54 92,63 
                       C 88,72 82,81 74,87 
                       C 66,93 56,96 46,95 
                       C 36,94 27,90 20,83 
                       C 12,76 7,67 5,57 
                       C 3,47 6,37 11,29 
                       C 16,21 24,14 33,9 
                       C 40,5 45,4 50,4 Z"
                    fill="url(#waxGradient)"
                    stroke="url(#bevelGrad)"
                    strokeWidth="1.8"
                  />

                  {/* Inner Debossed Concentric Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="#991B1B"
                    stroke="#5A0808"
                    strokeWidth="2.5"
                    opacity="0.9"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="32"
                    fill="none"
                    stroke="url(#bevelGrad)"
                    strokeWidth="1"
                    opacity="0.7"
                  />

                  {/* Monogram Text: M&M in Luxury Calligraphy */}
                  <text
                    x="50"
                    y="57"
                    fontFamily="'Alex Brush', cursive"
                    fontSize="27"
                    fontWeight="normal"
                    textAnchor="middle"
                    fill="url(#sealGold)"
                    filter="drop-shadow(0 1.5px 2px rgba(0,0,0,0.6))"
                  >
                    M&M
                  </text>
                </svg>

                {/* Sparkling Aura around Seal in sealed state */}
                {stage === 'sealed' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.1, 0.95] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-2 rounded-full border border-[#B91C1C]/40 pointer-events-none"
                  />
                )}
              </motion.button>
            </div>

            {/* Prompt Banner below seal when still sealed */}
            {stage === 'sealed' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleOpenEnvelope}
                className="absolute -bottom-16 inset-x-0 flex flex-col items-center text-center cursor-pointer group"
              >
                <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-[#F5EDE4]/20 group-hover:bg-[#B91C1C]/80 group-hover:border-[#B91C1C] transition-all duration-300">
                  <Sparkles className="w-3.5 h-3.5 text-[#B91C1C] group-hover:text-white transition-colors" />
                  <span className="text-xs font-sans tracking-[0.2em] uppercase font-semibold text-[#F5EDE4]">
                    Tap Wax Seal to Open
                  </span>
                </div>
                <p className="text-[11px] font-sans text-white/50 tracking-wider mt-2">
                  Touch to unseal your invitation with music
                </p>
              </motion.div>
            )}

          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};
