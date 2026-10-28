import React, { useState, useEffect, useRef } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const explosionRef = useRef(false);

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
      explosionRef.current = false;
      document.body.style.overflow = 'hidden';
    };

    return () => {
      document.body.style.overflow = '';
      delete (window as any).replayWeddingEnvelope;
    };
  }, []);

  // ================= DOCTOR STRANGE SPARK CANVAS =================
  useEffect(() => {
    if (stage === 'dismissed' || !isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = 360);
    let height = (canvas.height = 360);
    const cx = width / 2;
    const cy = height / 2;
    const ringRadius = 78;

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
      color: string;
    }

    const sparks: Spark[] = [];
    const colors = ['#FFF799', '#FFD700', '#FFA500', '#FF7700', '#FF3300', '#FFFFFF'];
    let rotation = 0;

    const createSpark = (fromCenter = false) => {
      if (fromCenter) {
        // Explosion spark
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        return {
          x: cx + Math.cos(angle) * (ringRadius * 0.8),
          y: cy + Math.sin(angle) * (ringRadius * 0.8),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.5,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 30 + 25,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
      }

      // Normal Doctor Strange ring spark (shooting along perimeter)
      const angle = Math.random() * Math.PI * 2;
      const tangAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 2.5 + 1.2;
      const r = ringRadius + (Math.random() - 0.5) * 12;
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: Math.cos(tangAngle) * speed + (Math.random() - 0.5) * 1,
        vy: Math.sin(tangAngle) * speed + (Math.random() - 0.5) * 1,
        size: Math.random() * 2.2 + 0.8,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 25 + 15,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    // Pre-populate sparks
    for (let i = 0; i < 40; i++) {
      sparks.push(createSpark());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotation += 0.035;

      // 1. Draw Doctor Strange Glowing Mystic Arcs
      ctx.save();
      ctx.translate(cx, cy);

      // Outer dashed spinning fiery ring (clockwise)
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 18, 25, 8, 4, 15]);
      ctx.shadowColor = '#FF8C00';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Inner counter-rotating ring
      ctx.rotate(-rotation * 2.2);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius - 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFE066';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 12, 16, 6]);
      ctx.shadowColor = '#FF5500';
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Additional mystical geometric squares
      ctx.beginPath();
      ctx.strokeRect(-ringRadius * 0.72, -ringRadius * 0.72, ringRadius * 1.44, ringRadius * 1.44);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 10]);
      ctx.stroke();

      ctx.restore();

      // 2. Spawn and animate Doctor Strange Sparks
      if (sparks.length < 90) {
        sparks.push(createSpark());
        sparks.push(createSpark());
      }

      if (explosionRef.current) {
        for (let k = 0; k < 8; k++) {
          sparks.push(createSpark(true));
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        s.alpha = 1 - s.life / s.maxLife;

        if (s.life >= s.maxLife || s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [stage, isOpen]);

  const handleOpenEnvelope = () => {
    if (stage !== 'sealed') return;

    // Trigger Doctor Strange spark explosion on canvas
    explosionRef.current = true;

    // 1. Play background song immediately
    try {
      audioManager.play();
    } catch (e) {
      console.warn('Audio play failed:', e);
    }

    // 2. Confetti sparkle blast
    try {
      confetti({
        particleCount: 50,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#B91C1C', '#FFFFFF', '#FFF59D'],
        startVelocity: 30,
        gravity: 0.7,
        ticks: 160,
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

  return (
    <AnimatePresence>
      <motion.div
        key="full-3d-envelope"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } }}
        className="fixed inset-0 z-50 w-screen h-screen overflow-hidden select-none bg-[#0D0B0A]"
        style={{ perspective: '1600px' }}
      >
        {/* Subtle Luxury Vignette & Grain */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80 pointer-events-none z-40" />

        {/* Sleek Minimalist Controls */}
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-50 pointer-events-auto">
          {/* Audio pill: sleek & minimal */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 text-[11px] font-sans tracking-widest uppercase">
            <Volume2 className="w-3 h-3 text-[#FFD700] animate-pulse" />
            <span className="opacity-90">Do 4 Love</span>
          </div>

          {/* Skip pill: sleek & minimal */}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 hover:border-[#FFD700]/50 text-white/80 hover:text-white text-[11px] font-sans tracking-widest uppercase transition-all duration-200"
            aria-label="Skip to website"
          >
            <span>Skip</span>
            <ArrowRight className="w-3 h-3 text-[#FFD700]" />
          </button>
        </div>

        {/* ================= VOLUMETRIC 3D ENVELOPE ================= */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Inner Golden Backlight: Intense glowing warm light leaking from within the crevice (like the reference video!) */}
          <div
            className="absolute z-10 w-[420px] h-[420px] sm:w-[550px] sm:h-[550px] rounded-full pointer-events-none transition-transform duration-700"
            style={{
              background: 'radial-gradient(circle, rgba(255, 220, 130, 0.95) 0%, rgba(255, 170, 40, 0.75) 30%, rgba(185, 28, 28, 0.3) 60%, transparent 75%)',
              filter: 'blur(35px)',
              transform: stage === 'opening' ? 'scale(2.5)' : 'scale(1)',
              opacity: stage === 'opening' ? 0.9 : 0.65,
            }}
          />

          {/* Envelope Envelope Container - Responsive Full-Viewport Surface */}
          <div className="relative w-full h-full overflow-hidden">

            {/* BASE PARCHMENT PAPER TEXTURE */}
            <div
              className="absolute inset-0 bg-[#F4EDE5]"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(0,0,0,0.06) 100%),
                  radial-gradient(rgba(18, 18, 18, 0.05) 0.8px, transparent 0.8px)
                `,
                backgroundSize: '100% 100%, 18px 18px',
              }}
            />

            {/* Crevice Shading from Center Flap Junction */}
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-black/25 via-transparent to-black/20" />

            {/* ================= LEFT FLAP (With 3D Embossed Botanical Relief) ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: -115, opacity: 0, transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateY: 0 }
              }
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)',
              }}
              className="absolute inset-0 z-20 bg-gradient-to-r from-[#EDE1D3] via-[#F4EDE5] to-[#DCC7B1] pointer-events-none"
            >
              {/* Deep diagonal seam drop-shadow */}
              <div className="absolute inset-0 shadow-[inset_-8px_0_24px_rgba(0,0,0,0.15)]" />

              {/* 3D Blind-Embossed Floral Garland (with Dual Highlight & Shadow Relief) */}
              <svg className="absolute inset-y-0 left-0 h-full w-2/5" viewBox="0 0 300 1000" fill="none">
                {/* Embossed Drop Shadow Layer */}
                <g filter="drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.18)) drop-shadow(-1px -1px 1px rgba(255, 255, 255, 0.85))">
                  {/* Botanical Vine */}
                  <path
                    d="M 60,50 C 130,220 180,380 90,550 C 30,680 140,820 80,950"
                    stroke="#D0BC9F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Flower Buds & Leaves along the vine */}
                  <path d="M 95,230 Q 150,250 120,300 Q 80,270 95,230 Z" fill="#E8D9C6" stroke="#D0BC9F" strokeWidth="1.5" />
                  <path d="M 125,410 Q 180,430 150,480 Q 110,450 125,410 Z" fill="#E8D9C6" stroke="#D0BC9F" strokeWidth="1.5" />
                  <path d="M 60,650 Q 120,670 90,720 Q 50,690 60,650 Z" fill="#E8D9C6" stroke="#D0BC9F" strokeWidth="1.5" />
                  
                  {/* Rosette Petals */}
                  <circle cx="125" cy="270" r="14" fill="#EADBC8" stroke="#D0BC9F" strokeWidth="1.8" />
                  <circle cx="125" cy="270" r="8" fill="#F4ECE2" stroke="#D0BC9F" strokeWidth="1.2" />
                  <circle cx="155" cy="450" r="15" fill="#EADBC8" stroke="#D0BC9F" strokeWidth="1.8" />
                  <circle cx="155" cy="450" r="9" fill="#F4ECE2" stroke="#D0BC9F" strokeWidth="1.2" />
                  <circle cx="95" cy="690" r="13" fill="#EADBC8" stroke="#D0BC9F" strokeWidth="1.8" />
                  <circle cx="95" cy="690" r="7" fill="#F4ECE2" stroke="#D0BC9F" strokeWidth="1.2" />
                </g>
              </svg>
            </motion.div>

            {/* ================= RIGHT FLAP (With 3D Embossed Botanical Relief) ================= */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={
                stage === 'opening'
                  ? { rotateY: 115, opacity: 0, transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } }
                  : { rotateY: 0 }
              }
              style={{
                transformOrigin: 'right center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(100% 0%, 50% 50%, 100% 100%)',
              }}
              className="absolute inset-0 z-20 bg-gradient-to-l from-[#EDE1D3] via-[#F4EDE5] to-[#DCC7B1] pointer-events-none"
            >
              <div className="absolute inset-0 shadow-[inset_8px_0_24px_rgba(0,0,0,0.15)]" />

              <svg className="absolute inset-y-0 right-0 h-full w-2/5" viewBox="0 0 300 1000" fill="none">
                <g filter="drop-shadow(-2px 2px 2px rgba(0, 0, 0, 0.18)) drop-shadow(1px -1px 1px rgba(255, 255, 255, 0.85))">
                  <path
                    d="M 240,50 C 170,220 120,380 210,550 C 270,680 160,820 220,950"
                    stroke="#D0BC9F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path d="M 205,230 Q 150,250 180,300 Q 220,270 205,230 Z" fill="#E8D9C6" stroke="#D0BC9F" strokeWidth="1.5" />
                  <path d="M 175,410 Q 120,430 150,480 Q 190,450 175,410 Z" fill="#E8D9C6" stroke="#D0BC9F" strokeWidth="1.5" />
                  <path d="M 240,650 Q 180,670 210,720 Q 250,690 240,650 Z" fill="#E8D9C6" stroke="#D0BC9F" strokeWidth="1.5" />

                  <circle cx="175" cy="270" r="14" fill="#EADBC8" stroke="#D0BC9F" strokeWidth="1.8" />
                  <circle cx="175" cy="270" r="8" fill="#F4ECE2" stroke="#D0BC9F" strokeWidth="1.2" />
                  <circle cx="145" cy="450" r="15" fill="#EADBC8" stroke="#D0BC9F" strokeWidth="1.8" />
                  <circle cx="145" cy="450" r="9" fill="#F4ECE2" stroke="#D0BC9F" strokeWidth="1.2" />
                  <circle cx="205" cy="690" r="13" fill="#EADBC8" stroke="#D0BC9F" strokeWidth="1.8" />
                  <circle cx="205" cy="690" r="7" fill="#F4ECE2" stroke="#D0BC9F" strokeWidth="1.2" />
                </g>
              </svg>
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
                transformOrigin: 'bottom center',
                transformStyle: 'preserve-3d',
                clipPath: 'polygon(0% 100%, 50% 50%, 100% 100%)',
              }}
              className="absolute inset-0 z-25 bg-gradient-to-t from-[#DDCBB5] via-[#EFE3D5] to-[#F7EFE6] pointer-events-none"
            >
              {/* Realistic deep pocket shadow over lower fold */}
              <div className="absolute inset-0 shadow-[0_-18px_32px_rgba(0,0,0,0.18)]" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/15 to-transparent" />
            </motion.div>

            {/* ================= TOP FLAP (Folds Downwards & Sealed by Wax Seal) ================= */}
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
              className="absolute inset-0 z-30 bg-gradient-to-b from-[#FFFDF9] via-[#F4EDE5] to-[#E3D1BE] cursor-pointer"
              onClick={handleOpenEnvelope}
            >
              {/* Heavy shadow cast by the top triangular flap onto bottom flaps */}
              <div className="absolute inset-0 shadow-[0_22px_45px_rgba(0,0,0,0.25)]" />

              {/* Edge Bevel Highlight (Simulating 300gsm fine Italian cotton paper edge) */}
              <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/40 via-transparent to-black/10 pointer-events-none" />
            </motion.div>

            {/* ================= DOCTOR STRANGE GLOW & PHOTOREALISTIC WAX SEAL ================= */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center">

              {/* Canvas: Doctor Strange Eldritch Sparks */}
              <div className="absolute pointer-events-none w-[360px] h-[360px] flex items-center justify-center">
                <canvas ref={canvasRef} className="w-[360px] h-[360px]" />
              </div>

              {/* The Wax Seal Button: 3D Molten Scarlet Wax with Pronounced M&M */}
              <motion.button
                onClick={handleOpenEnvelope}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.94 }}
                animate={
                  stage === 'opening'
                    ? {
                        scale: [1, 1.35, 0],
                        rotate: [0, 20, 50],
                        opacity: [1, 0.9, 0],
                        filter: 'brightness(2.2)',
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
                {/* 3D Wax Seal Graphic */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                  <svg
                    viewBox="0 0 180 180"
                    className="w-full h-full drop-shadow-[0_18px_36px_rgba(185,28,28,0.75)]"
                  >
                    <defs>
                      {/* Deep Rich Scarlet Red Wax Radial Lighting */}
                      <radialGradient id="photorealWaxGrad" cx="32%" cy="28%" r="72%">
                        <stop offset="0%" stopColor="#F87171" />
                        <stop offset="20%" stopColor="#DC2626" />
                        <stop offset="50%" stopColor="#B91C1C" />
                        <stop offset="78%" stopColor="#7F1D1D" />
                        <stop offset="95%" stopColor="#450A0A" />
                        <stop offset="100%" stopColor="#250404" />
                      </radialGradient>

                      {/* Glossy Beveled Rim Light */}
                      <linearGradient id="photorealRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
                        <stop offset="35%" stopColor="rgba(239, 68, 68, 0.35)" />
                        <stop offset="70%" stopColor="rgba(69, 10, 10, 0.9)" />
                        <stop offset="100%" stopColor="rgba(0, 0, 0, 0.95)" />
                      </linearGradient>

                      {/* High-Carat Gold Foil Gradient for M&M */}
                      <linearGradient id="photorealGoldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFDF0" />
                        <stop offset="20%" stopColor="#FFE58F" />
                        <stop offset="48%" stopColor="#FFC53D" />
                        <stop offset="75%" stopColor="#D48806" />
                        <stop offset="100%" stopColor="#874D00" />
                      </linearGradient>

                      {/* Deep Deboss Drop Shadow */}
                      <filter id="photorealDeboss" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="3" stdDeviation="1.8" floodColor="#2B0505" floodOpacity="0.95" />
                      </filter>
                    </defs>

                    {/* Organic Wax Outer Perimeter */}
                    <path
                      d="M 90,8
                         C 106,6 122,11 136,21
                         C 150,32 162,47 167,64
                         C 171,80 170,98 162,114
                         C 154,130 142,144 127,154
                         C 111,164 93,167 75,165
                         C 57,163 41,155 29,143
                         C 17,130 9,114 7,97
                         C 5,80 9,63 18,48
                         C 28,34 43,22 59,15
                         C 70,9 80,7 90,8 Z"
                      fill="url(#photorealWaxGrad)"
                      stroke="url(#photorealRimGrad)"
                      strokeWidth="3"
                    />

                    {/* Deep Stamped Circular Well */}
                    <circle
                      cx="90"
                      cy="90"
                      r="61"
                      fill="#8F1414"
                      stroke="#450A0A"
                      strokeWidth="4"
                    />

                    {/* Inner Gold Foil Stamped Ring */}
                    <circle
                      cx="90"
                      cy="90"
                      r="56"
                      fill="none"
                      stroke="url(#photorealGoldFoil)"
                      strokeWidth="1.4"
                      opacity="0.85"
                    />

                    {/* Highly Pronounced M&M Monogram: Bold, Deeply Debossed Calligraphy */}
                    <text
                      x="90"
                      y="104"
                      fontFamily="'Playfair Display', Georgia, serif"
                      fontSize="50"
                      fontWeight="900"
                      fontStyle="italic"
                      letterSpacing="0.04em"
                      textAnchor="middle"
                      fill="url(#photorealGoldFoil)"
                      filter="url(#photorealDeboss)"
                      stroke="#FFE89C"
                      strokeWidth="1"
                    >
                      M&M
                    </text>

                    {/* Organic Specular Top Glare */}
                    <path
                      d="M 50,40 Q 90,26 130,40"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.55)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </motion.button>

              {/* Sleek, Ultra-Minimal Whisper Prompt (No Bulky Banner!) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.2 }}
                onClick={handleOpenEnvelope}
                className="absolute top-[108%] flex flex-col items-center cursor-pointer pointer-events-auto"
              >
                <span className="font-serif italic text-xs sm:text-sm tracking-[0.25em] text-[#FFE58F] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">
                  Tap to Unseal
                </span>
              </motion.div>

            </div>

          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};
