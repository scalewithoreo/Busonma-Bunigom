import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingRSVPProps {
  onRSVPClick: () => void;
}

export const FloatingRSVP: FC<FloatingRSVPProps> = ({ onRSVPClick }) => {
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
          className="fixed bottom-6 left-1/2 z-50"
        >
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-full p-1.5 flex items-center gap-4 sm:gap-6 border border-brand-sand/30 hover:scale-105 transition-transform duration-300">
            <span className="pl-4 sm:pl-6 text-[15px] sm:text-lg font-sans font-medium tracking-wide text-brand-espresso whitespace-nowrap">
              Saturday, Dec 12th
            </span>
            <button 
              onClick={onRSVPClick}
              className="bg-brand-charcoal text-brand-goldLight hover:bg-brand-espresso transition-colors px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-sans font-bold tracking-[0.2em] uppercase shadow-md"
            >
              RSVP
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
