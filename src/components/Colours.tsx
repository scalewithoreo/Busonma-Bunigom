import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

export const Colours: FC = () => {
  const { wedding } = useWedding();
  const theme = wedding.theme;
  const looks = theme.looks;
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
      {/* Editorial Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <span className="text-[17px] font-sans tracking-[0.2em] uppercase text-brand-goldDark font-semibold">
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
            {theme.dressCodeDescription}
          </p>
        </div>

        {/* Color Palette Display */}
        {theme.paletteLayout === 'grid' ? (
          /* High Contrast Editorial Grid (e.g. Miracle & Malvin) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
            {theme.paletteBands.map((band) => (
              <div
                key={band.name}
                className="h-48 md:h-80 flex flex-col justify-end p-8 relative overflow-hidden group"
                style={{ backgroundColor: band.hex }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="relative z-10">
                  {band.tag && (
                    <span className="text-xs tracking-widest uppercase font-mono text-neutral-300 block mb-1">
                      {band.tag}
                    </span>
                  )}
                  <h3 className="font-serif text-2xl sm:text-3xl text-white">{band.name}</h3>
                  <p className="text-xs text-neutral-300 mt-1 font-mono">{band.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Stacked Silk Silk Bands (e.g. Ore & Dara) */
          <div className="flex flex-col w-full h-[500px] sm:h-[600px] mb-16 rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
            {theme.paletteBands.map((band) => (
              <div
                key={band.name}
                className="w-full h-1/2 relative flex items-center justify-center bg-cover bg-center"
                style={{
                  backgroundImage: band.bgImage ? `url('${band.bgImage}')` : undefined,
                  backgroundColor: band.hex,
                }}
              >
                <div className="absolute inset-0 bg-black/15"></div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative z-10 text-white/95 font-serif text-4xl sm:text-5xl md:text-6xl tracking-widest drop-shadow-lg"
                >
                  {band.name}
                </motion.h3>
              </div>
            ))}
          </div>
        )}

        {/* Lookbook Header */}
        <div className="text-center mt-24 mb-12">
          <motion.h3 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-serif text-brand-espresso mb-3"
          >
            Style Inspiration & Lookbook
          </motion.h3>
          <p className="font-sans text-brand-muted text-[17px] max-w-xl mx-auto">
            Curated silhouettes and styling details to guide your wedding celebration attire.
          </p>
        </div>

        {/* Looks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {looks.map((look, index) => (
            <motion.div
              key={look.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              onClick={() => setActiveModalIndex(index)}
              className="group cursor-pointer flex flex-col bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-brand-sand/40 hover:-translate-y-1.5"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-brand-espresso">
                <img loading="lazy" decoding="async" 
                  src={look.src} 
                  alt={look.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-6">
                  <span className="text-white text-xs font-sans uppercase tracking-widest flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-brand-gold" />
                    Enlarge Look
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-espresso/80 backdrop-blur-md text-brand-cream text-[11px] font-sans uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                    {look.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between bg-white">
                <div>
                  <h4 className="font-serif text-xl sm:text-2xl text-brand-espresso mb-2 group-hover:text-brand-primary transition-colors">
                    {look.title}
                  </h4>
                  <p className="font-sans text-brand-muted text-sm leading-relaxed line-clamp-3">
                    {look.caption}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-brand-sand/40 flex items-center justify-between text-xs font-sans text-brand-goldDark font-semibold tracking-wider uppercase">
                  <span>View Details</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lookbook Lightbox Modal */}
      <AnimatePresence>
        {activeModalIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalIndex(null)}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full bg-brand-espresso text-brand-cream rounded-3xl overflow-hidden shadow-2xl border border-white/10 z-10 flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModalIndex(null)}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Prev / Next Modal Buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevModal();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Previous Look"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextModal();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 md:right-[42%] z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Next Look"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Modal Image */}
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden aspect-[3/4] md:aspect-auto">
                <img loading="lazy" decoding="async" 
                  src={looks[activeModalIndex].src} 
                  alt={looks[activeModalIndex].title}
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Modal Info */}
              <div className="w-full md:w-2/5 p-8 sm:p-10 flex flex-col justify-between overflow-y-auto">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-sans font-semibold block mb-3">
                    {looks[activeModalIndex].category}
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl text-brand-cream mb-4 leading-tight">
                    {looks[activeModalIndex].title}
                  </h3>
                  <div className="w-12 h-0.5 bg-brand-gold/40 mb-6" />
                  <p className="font-sans text-brand-sand/90 text-base leading-relaxed">
                    {looks[activeModalIndex].caption}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-brand-sand/60 font-sans">
                  <span>Look {activeModalIndex + 1} of {looks.length}</span>
                  <button
                    onClick={() => setActiveModalIndex(null)}
                    className="hover:text-brand-gold transition-colors"
                  >
                    Close Lookbook
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
