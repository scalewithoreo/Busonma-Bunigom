import { useState, useEffect, useCallback, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { GalleryPhoto } from '../types';

export const Gallery: FC = () => {
  const photos: GalleryPhoto[] = [
    {
      id: '1',
      src: '/assets/0V3A8999.jpg',
      alt: 'Couple walking under the archway',
      caption: 'Our forever starts now',
      featured: false,
    },
    {
      id: '2',
      src: '/assets/0V3A8960 1.jpg',
      alt: 'Oreoluwa and Oluwadara smiling together',
      caption: 'Joy in every shared smile',
      featured: false,
    },
    {
      id: '3',
      src: '/assets/0V3A8979.jpg',
      alt: 'Couple facing the historic colonial building',
      caption: 'Two souls, one beautiful journey',
      featured: false,
    },
    {
      id: '4',
      src: '/assets/0V3A8930.jpg',
      alt: 'Oreoluwa and Oluwadara dancing along the colonnade',
      caption: 'Every love story is beautiful, but ours is our favorite',
      featured: true,
    },
    {
      id: '5',
      src: '/assets/0V3A8976.jpg',
      alt: 'Close up tender moment with engagement ring',
      caption: 'Walking into forever, hand in hand',
      featured: false,
    },
    {
      id: '6',
      src: '/assets/0V3A8914.jpg',
      alt: 'Romantic portrait of the couple',
      caption: 'In your eyes, I found my home',
      featured: false,
    },
    {
      id: '7',
      src: '/assets/0V3A8849_(2).jpg',
      alt: 'Oreoluwa and Oluwadara embracing with flowers',
      caption: 'Laughter and light filled days',
      featured: true,
    },
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleNext = useCallback(() => {
    if (activeIndex !== null) {
      setActiveIndex((activeIndex + 1) % photos.length);
    }
  }, [activeIndex, photos.length]);

  const handlePrev = useCallback(() => {
    if (activeIndex !== null) {
      setActiveIndex((activeIndex - 1 + photos.length) % photos.length);
    }
  }, [activeIndex, photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, handleNext, handlePrev]);

  const getSpanClass = (index: number) => {
    if (index === 3 || index === 6) return 'sm:col-span-2 lg:col-span-2';
    if (index === 2) return 'sm:col-span-2 lg:col-span-1';
    return 'col-span-1';
  };

  return (
    <section id="gallery" className="py-24 sm:py-32 px-4 sm:px-6 bg-brand-ivory relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mb-3"
          >
            Memories in the Making
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl text-brand-espresso font-normal"
          >
            Moments of Us
          </motion.h2>
          <p className="font-serif italic text-brand-muted text-[17px] sm:text-lg mt-2">
            A glimpse into our love and laughter
          </p>
        </div>

        {/* Desktop Masonry / Bento Style Photo Grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => {
            const spanClass = getSpanClass(index);
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                onClick={() => setActiveIndex(index)}
                className={`group relative overflow-hidden rounded-3xl cursor-pointer bg-brand-sand/30 border border-brand-sand/60 shadow-sm hover:shadow-xl transition-all duration-500 h-[420px] ${spanClass}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-espresso/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6" />

                {/* Hover Caption Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between">
                  <div>
                    <p className="font-serif italic text-brand-cream text-xl drop-shadow-md">
                      {photo.caption}
                    </p>
                    <p className="text-brand-gold text-xs uppercase tracking-widest font-sans mt-1">
                      Oreoluwa & Oluwadara
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Continuous Scrolling Ticker */}
        <div className="sm:hidden -mx-4 overflow-hidden relative pb-4">
          <motion.div
            className="flex gap-4 w-max px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
          >
            {[...photos, ...photos].map((photo, index) => (
              <div
                key={`${photo.id}-mobile-${index}`}
                onClick={() => setActiveIndex(index % photos.length)}
                className="w-[220px] h-[280px] relative overflow-hidden rounded-3xl shrink-0 cursor-pointer border border-brand-sand/40 shadow-md"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveIndex(null)}
              className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Active Image Content */}
            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
              <motion.img
                key={photos[activeIndex].src}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                src={photos[activeIndex].src}
                alt={photos[activeIndex].alt}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="text-center mt-4">
                <p className="font-serif italic text-xl text-brand-cream">
                  {photos[activeIndex].caption}
                </p>
                <p className="text-xs uppercase tracking-widest text-brand-gold mt-1 font-sans">
                  {activeIndex + 1} of {photos.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
