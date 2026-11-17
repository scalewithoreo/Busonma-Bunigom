import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWedding } from '../context/WeddingContext';

interface FloatingRSVPProps {
  onRSVPClick: () => void;
}

export const FloatingRSVP: FC<FloatingRSVPProps> = ({ onRSVPClick }) => {
  const { wedding } = useWedding();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const detailsEl = document.getElementById('details');
      const footerEl = document.querySelector('footer');
      
      if (detailsEl) {
        const detailsRect = detailsEl.getBoundingClientRect();
        let isAboveFooter = true;
        
        // Check if footer is scrolling into view
        if (footerEl) {
          const footerRect = footerEl.getBoundingClientRect();
          // Hide it when the footer top enters the viewport
          if (footerRect.top <= window.innerHeight) {
            isAboveFooter = false;
          }
        }

        // Visible once the bottom of the "This Day" section has scrolled up into/past the viewport
        // AND we haven't reached the footer yet
        if (detailsRect.bottom <= window.innerHeight && isAboveFooter) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 40, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 40, x: '-50%' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-5 sm:bottom-6 left-1/2 z-50 max-w-[92vw] w-max pointer-events-auto"
        >
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-full p-1.5 sm:p-2 flex items-center gap-2.5 sm:gap-6 border border-brand-sand/40 hover:scale-[1.02] transition-transform duration-300 max-w-full">
            <span className="pl-3 sm:pl-6 text-xs sm:text-base font-sans font-semibold tracking-wide text-brand-espresso whitespace-nowrap truncate max-w-[210px] sm:max-w-none">
              <span className="sm:hidden">{wedding.event.shortDisplayDate || wedding.event.displayDate}</span>
              <span className="hidden sm:inline">{wedding.event.displayDate}</span>
            </span>
            <button 
              onClick={onRSVPClick}
              className="bg-brand-primary text-white hover:bg-brand-primaryDark transition-all px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-sans font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase shadow-md shrink-0 active:scale-95"
            >
              RSVP
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
