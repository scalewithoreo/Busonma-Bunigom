import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export const Colours: FC = () => {
  const looks = [
    {
      id: 'look-1',
      src: '/assets/contemporary-palette-flatlay.jpg',
      title: 'Pantone & Palette Moodboard',
      category: 'Curated Flatlay',
      caption: 'Vintage Wine (#75074B) slip dress, Forest Green (#334a33) double-breasted blazer, and champagne gold accessories.',
    },
    {
      id: 'look-2',
      src: '/assets/contemporary-redcarpet.jpg',
      title: 'Modern Dinner Gala',
      category: 'Style Inspiration',
      caption: 'Inspiration for non-traditional, sharp tailoring and sweeping contemporary silhouettes.',
    },
    {
      id: 'look-3',
      src: '/assets/contemporary-dinner-look.jpg',
      title: 'Avant-Garde Evening',
      category: 'Silhouettes',
      caption: 'Architectural lines and refined luxury for a contemporary black-tie aesthetic.',
    },
    {
      id: 'look-4',
      src: '/assets/moodboard_trad_couple.jpg',
      title: 'Traditional Elegance & Aso Ebi',
      category: 'Cultural Attire',
      caption: 'Stunning Forest Green Agbada and Vintage Wine lace, beautifully complemented by a Champagne Gold Gele and Fila.',
    }
  ];

  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  const handleNextModal = () => {
    if (activeModalIndex !== null) {
      setActiveModalIndex((activeModalIndex + 1) % looks.length);
    }
  };

  const handlePrevModal = () => {
    if (activeModalIndex !== null) {
      setActiveModalIndex((activeModalIndex - 1 + looks.length) % looks.length);
    }
  };

  return (
    <section id="colours" className="py-24 sm:py-32 bg-brand-cream relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#75074B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#334a33]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <span className="text-[17px] font-sans tracking-[0.2em] uppercase text-brand-gold font-semibold">
              The Dress Code
            </span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif text-brand-espresso mb-8"
          >
            Colours of the Day
          </motion.h2>
          
          <p className="font-sans text-brand-muted text-[17px] sm:text-lg mt-5 leading-relaxed max-w-2xl mx-auto">
            We invite our guests to express themselves in beautiful <strong>traditional, contemporary, red carpet, or modern chic</strong> styles in shades of Vintage Wine and Forest Green with champagne gold accents.
          </p>
        </div>

        {/* Color Palette Bands */}
        <div className="flex flex-col w-full h-[500px] sm:h-[600px] mb-16 rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
          <div 
            className="w-full h-1/2 relative flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url('/assets/vintage_wine_silk.jpg')` }}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10 text-white/90 font-serif text-4xl sm:text-5xl md:text-6xl tracking-widest drop-shadow-lg"
            >
              Vintage Wine
            </motion.h3>
          </div>
          <div 
            className="w-full h-1/2 relative flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url('/assets/forest_green_silk.jpg')` }}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10 text-white/90 font-serif text-4xl sm:text-5xl md:text-6xl tracking-widest drop-shadow-lg"
            >
              Forest Green
            </motion.h3>
          </div>
        </div>

        {/* Lookbook Header */}
        <div className="text-center mt-24 mb-12">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-serif text-brand-espresso mb-3"
          >
            Style Inspiration
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-brand-muted text-[17px] sm:text-lg font-sans"
          >
            Examples of gorgeous traditional and contemporary looks we love
          </motion.p>
        </div>

        {/* 4-Column Contemporary Lookbook Grid - Borderless */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {looks.map((look, index) => (
            <motion.div
              key={look.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setActiveModalIndex(index)}
              className="group bg-white rounded-3xl p-5 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative rounded-2xl overflow-hidden shadow-md mb-4 aspect-[4/3] bg-brand-sand/20">
                  <img
                    src={look.src}
                    alt={look.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <span className="text-white text-xs font-sans tracking-wider uppercase font-semibold">
                      Click to View
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-goldDark">
                  {look.category}
                </span>
                <h3 className="font-serif text-2xl text-brand-espresso mt-1">
                  {look.title}
                </h3>
              </div>

              <p className="text-brand-muted text-xs font-sans leading-relaxed mt-3 pt-3 border-t border-brand-sand/50">
                {look.caption}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for Color Inspiration */}
      <AnimatePresence>
        {activeModalIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setActiveModalIndex(null);
              if (e.key === 'ArrowRight') handleNextModal();
              if (e.key === 'ArrowLeft') handlePrevModal();
            }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 outline-none"
          >
            {/* Close */}
            <button
              onClick={() => setActiveModalIndex(null)}
              className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev */}
            <button
              onClick={handlePrevModal}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next */}
            <button
              onClick={handleNextModal}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center text-center">
              <motion.img
                key={looks[activeModalIndex].src}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={looks[activeModalIndex].src}
                alt={looks[activeModalIndex].title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="mt-4">
                <span className="text-xs uppercase tracking-widest text-brand-gold font-sans font-bold">
                  {looks[activeModalIndex].category}
                </span>
                <h4 className="font-serif text-2xl text-brand-cream mt-0.5">
                  {looks[activeModalIndex].title}
                </h4>
                <p className="text-[17px] font-sans text-brand-sand/90 mt-1 max-w-xl mx-auto">
                  {looks[activeModalIndex].caption}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
