import { FC, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { audioManager } from '../utils/audio';

export const MusicPlayer: FC = () => {
  const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);

  useEffect(() => {
    audioManager.init();
    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.isPlaying);
      setIsMuted(audioManager.isMuted);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="hidden md:block fixed bottom-6 left-6 z-40">
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => audioManager.toggle()}
        aria-label={isMuted || !isPlaying ? 'Unmute / Play wedding song' : 'Mute wedding song'}
        className="flex items-center gap-3 px-5 py-3 rounded-full bg-brand-espresso/95 text-brand-cream shadow-2xl backdrop-blur-md hover:bg-black border border-brand-gold/30 hover:border-brand-gold transition-all duration-300 group"
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-brand-gold/15 text-brand-gold shrink-0">
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-brand-muted" />
          ) : (
            <div className="flex items-end justify-center gap-0.5 h-3.5 w-3.5">
              <span className="w-0.5 bg-brand-gold rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-full" />
              <span className="w-0.5 bg-brand-gold rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-2/3" />
              <span className="w-0.5 bg-brand-gold rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-4/5" />
            </div>
          )}
        </div>

        <div className="text-left flex flex-col pr-1">
          <span className="text-[11px] font-sans font-semibold tracking-wider text-brand-cream uppercase flex items-center gap-1.5 whitespace-nowrap">
            Do 4 Love &bull; Snoh Aalegra
          </span>
          <span className="text-[9px] font-sans text-brand-goldLight tracking-widest uppercase">
            {isMuted ? 'Muted • Tap to Play' : 'Playing • Tap to Mute'}
          </span>
        </div>

        <div className="flex items-center text-brand-muted group-hover:text-brand-gold transition-colors">
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4 text-brand-gold" />
          )}
        </div>
      </motion.button>
    </div>
  );
};

