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
    const width = (canvas.width = 380);
    const height = (canvas.height = 380);
    const cx = width / 2;
    const cy = height / 2;
    const ringRadius = 88; // Perfectly hugs the photorealistic wax seal rim

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
    const colors = ['#FFF9A6', '#FFD700', '#FFA500', '#FF7700', '#FF3300', '#FFFFFF'];
    let rotation = 0;

    const createSpark = (fromCenter = false) => {
      if (fromCenter) {
        // Burst spark on tap
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 4;
        return {
          x: cx + Math.cos(angle) * (ringRadius * 0.7),
          y: cy + Math.sin(angle) * (ringRadius * 0.7),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 1.5,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 35 + 25,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
      }

      // Orbital Doctor Strange fiery sparks
      const angle = Math.random() * Math.PI * 2;
      const tangAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.45;
      const speed = Math.random() * 2.8 + 1.4;
      const r = ringRadius + (Math.random() - 0.5) * 16;
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: Math.cos(tangAngle) * speed + (Math.random() - 0.5) * 1.2,
        vy: Math.sin(tangAngle) * speed + (Math.random() - 0.5) * 1.2,
        size: Math.random() * 2.5 + 0.8,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 26 + 16,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    // Pre-populate sparks
    for (let i = 0; i < 45; i++) {
      sparks.push(createSpark());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotation += 0.032;

      // 1. Draw Doctor Strange Rotating Mystic Mandala Arcs
      ctx.save();
      ctx.translate(cx, cy);

      // Outer dashed spinning fiery ring (clockwise)
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 2.8;
      ctx.setLineDash([14, 20, 28, 8, 4, 16]);
      ctx.shadowColor = '#FF8C00';
      ctx.shadowBlur = 16;
      ctx.stroke();

      // Inner counter-rotating ring
      ctx.rotate(-rotation * 2.2);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius - 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFE066';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 14, 18, 6]);
      ctx.shadowColor = '#FF5500';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Mystical geometric square
      ctx.beginPath();
      ctx.strokeRect(-ringRadius * 0.72, -ringRadius * 0.72, ringRadius * 1.44, ringRadius * 1.44);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 12]);
      ctx.stroke();

      ctx.restore();

      // 2. Spawn and update Doctor Strange Sparks
      if (sparks.length < 100) {
        sparks.push(createSpark());
        sparks.push(createSpark());
      }

      if (explosionRef.current) {
        for (let k = 0; k < 12; k++) {
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
        ctx.shadowBlur = 10;
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
        particleCount: 55,
        spread: 95,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#B91C1C', '#FFFFFF', '#FFF59D'],
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
    }, 950);
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
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/25 to-black/80 pointer-events-none z-40" />

        {/* Sleek Minimalist Controls */}
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-50 pointer-events-auto">
          {/* Audio pill: sleek & minimal */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-white/85 text-[11px] font-sans tracking-widest uppercase shadow-md">
            <Volume2 className="w-3 h-3 text-[#FFD700] animate-pulse" />
            <span className="opacity-90">Do 4 Love &bull; Snoh Aalegra</span>
          </div>

          {/* Skip pill: sleek & minimal */}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md border border-white/10 hover:border-[#FFD700]/50 text-white/80 hover:text-white text-[11px] font-sans tracking-widest uppercase transition-all duration-200 shadow-md"
            aria-label="Skip to website"
          >
            <span>Skip</span>
            <ArrowRight className="w-3 h-3 text-[#FFD700]" />
          </button>
        </div>

        {/* ================= VOLUMETRIC 3D ENVELOPE ================= */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Inner Golden Backlight: Intense warm illumination glowing from inside the crevice */}
          <div
            className="absolute z-10 w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] rounded-full pointer-events-none transition-transform duration-700"
            style={{
              background: 'radial-gradient(circle, rgba(255, 225, 140, 0.95) 0%, rgba(255, 175, 45, 0.75) 30%, rgba(185, 28, 28, 0.3) 60%, transparent 75%)',
              filter: 'blur(40px)',
              transform: stage === 'opening' ? 'scale(2.5)' : 'scale(1)',
              opacity: stage === 'opening' ? 0.95 : 0.7,
            }}
          />

          {/* Envelope Body Container - Covers Full Viewport Responsively */}
          <div className="relative w-full h-full overflow-hidden">

            {/* BASE COTTON PAPER SURFACE (Beneath flaps) */}
            <div
              className="absolute inset-0"
              style={paperTextureStyle}
            />

            {/* Crevice Shading from Center Flap Junction */}
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-black/20 via-transparent to-black/15" />

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
              className="absolute inset-0 z-25 pointer-events-none flex flex-col justify-end items-center pb-12 sm:pb-16"
            >
              {/* Realistic deep pocket shadow over lower fold */}
              <div className="absolute inset-0 shadow-[0_-20px_36px_rgba(0,0,0,0.2)]" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/15 to-transparent" />

              {/* Romantic Bottom Flap Calligraphy (like the reference image!) */}
              <div className="relative z-30 text-center px-4 mb-2">
                <p className="font-serif italic text-sm sm:text-base text-[#6E6358] tracking-wider leading-relaxed">
                  Romantic storytelling through devotion & purpose
                </p>
                <p className="text-[10px] sm:text-[11px] font-sans tracking-[0.25em] uppercase text-[#8C7D6E] mt-1 font-medium">
                  Wednesday, January 27, 2027 &bull; Lagos
                </p>
              </div>
            </motion.div>

            {/* ================= TOP FLAP (With Fine-Art Monogram Stamp & Sealed by Wax) ================= */}
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

              {/* Top Flap High-End Monogram Branding (Matching Reference Architecture!) */}
              <div className="relative z-35 flex flex-col items-center text-center px-4 pointer-events-none">
                {/* Arch / Curvature Tagline */}
                <p className="text-[10px] sm:text-[11px] font-sans tracking-[0.3em] uppercase text-[#8C7D6E] mb-1 font-semibold">
                  EST. 2027 &bull; LAGOS
                </p>

                {/* Elegant Fine-Art Typography */}
                <h1 className="font-serif text-3xl sm:text-5xl text-[#2C241E] tracking-[0.18em] uppercase font-light drop-shadow-sm my-0.5">
                  MIRACLE & MALVIN
                </h1>

                {/* Subtitle */}
                <p className="text-[10px] sm:text-[11px] font-sans tracking-[0.28em] uppercase text-[#8C7D6E] font-medium mt-1">
                  FINE ART WEDDING CELEBRATION
                </p>
              </div>
            </motion.div>

            {/* ================= DOCTOR STRANGE GLOW & PHOTOREALISTIC WAX SEAL ================= */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center">

              {/* Canvas: Doctor Strange Eldritch Sparks */}
              <div className="absolute pointer-events-none w-[380px] h-[380px] flex items-center justify-center">
                <canvas ref={canvasRef} className="w-[380px] h-[380px]" />
              </div>

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
                {/* Genuine Photographic 3D Wax Seal Asset (with Organic Molten Edges & Debossed M&M) */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                  <img
                    src="/assets/wax-seal-mm.png"
                    alt="Miracle & Malvin 3D Wax Seal"
                    className="w-full h-full object-contain filter drop-shadow-[0_16px_32px_rgba(185,28,28,0.65)] drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)] transition-transform duration-200 select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
              </motion.button>

              {/* Sleek, Ultra-Minimal Whisper Prompt */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.65, 1, 0.65] }}
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
