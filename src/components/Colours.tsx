import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export const Colours: FC = () => {
  const looks = [
    {
      id: 'look-1',
      src: '/assets/miracle-marvin-3.jpg',
      title: 'Editorial Noir & Scarlet Red Draping',
      category: 'Black Tie Editorial',
      caption: 'A striking statement: sweeping scarlet crimson gown paired with sharp midnight black tailoring for a high-contrast editorial entrance.',
    },
    {
      id: 'look-2',
      src: '/assets/miracle-marvin-2.jpg',
      title: 'Velvet Burgundy & Crimson Florals',
      category: 'Regal Contemporary',
      caption: 'Bespoke deep burgundy velvet dinner jacket and sculptural architectural bridal couture with rich crimson garden accents.',
    },
    {
      id: 'look-3',
      src: '/assets/miracle-marvin-1.jpg',
      title: 'Chic Daytime Contemporary',
      category: 'Modern Elegance',
      caption: 'Sophisticated champagne silk and cream linen textures elevated by subtle ruby and gold fine jewelry.',
    },
    {
      id: 'look-4',
      src: '/assets/story-couple.jpg',
      title: 'Evening Romance & Velvet Accents',
      category: 'Intimate Luxury',
      caption: 'Moody candlelight luxury with crimson silk accessories and understated red carpet glamour.',
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
      {/* Editorial Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
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
            Our dress code is <strong>High-Fashion Editorial & Contemporary Black-Tie</strong>. Think timeless architectural black and warm cream, electrified by <strong>bold touches and accents of scarlet and crimson red</strong>.
          </p>
        </div>

        {/* Color Palette Bands - High Contrast Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
          {/* Editorial Noir */}
          <div className="h-48 md:h-80 bg-neutral-900 text-white flex flex-col justify-end p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="relative z-10">
              <span className="text-xs tracking-widest uppercase font-mono text-neutral-400 block mb-1">Base Neutral</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-neutral-100">Editorial Noir</h3>
              <p className="text-xs text-neutral-400 mt-1 font-mono">#121212 • Black-Tie</p>
            </div>
          </div>

          {/* Statement Red */}
          <div className="h-48 md:h-80 bg-red-700 text-white flex flex-col justify-end p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 to-transparent" />
            <div className="relative z-10">
              <span className="text-xs tracking-widest uppercase font-mono text-red-200 block mb-1">Signature Accent</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-white">Scarlet & Crimson</h3>
              <p className="text-xs text-red-200 mt-1 font-mono">#B91C1C • Dramatic Red Touches</p>
            </div>
          </div>

          {/* Warm Champagne Alabaster */}
          <div className="h-48 md:h-80 bg-[#f5ede4] text-brand-espresso flex flex-col justify-end p-8 relative overflow-hidden group border border-brand-sand/50">
            <div className="absolute inset-0 bg-gradient-to-t from-[#ebe0d4]/80 to-transparent" />
            <div className="relative z-10">
              <span className="text-xs tracking-widest uppercase font-mono text-brand-goldDark block mb-1">Warm Foundation</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-brand-espresso">Warm Alabaster</h3>
              <p className="text-xs text-brand-muted mt-1 font-mono">#F5EDE4 • Champagne Cream</p>
            </div>
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
            Style & Editorial Inspiration
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-brand-muted text-[17px] sm:text-lg font-sans"
          >
            Curated silhouettes featuring editorial tailoring and striking red statements
          </motion.p>
        </div>

        {/* Lookbook Grid */}
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
                    <span className="px-2.5 py-1 rounded-full bg-red-600/80 text-white text-[11px] font-sans font-medium tracking-wide">
                      {look.category}
                    </span>
                  </div>
                </div>

                <h4 className="font-serif text-xl sm:text-2xl text-brand-espresso group-hover:text-red-700 transition-colors">
                  {look.title}
                </h4>
                <p className="text-brand-muted text-sm font-sans mt-2 leading-relaxed">
                  {look.caption}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lookbook Modal */}
      <AnimatePresence>
        {activeModalIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <button
              onClick={() => setActiveModalIndex(null)}
              className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={handlePrevModal}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextModal}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center text-center">
              <img
                src={looks[activeModalIndex].src}
                alt={looks[activeModalIndex].title}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl mb-4"
              />
              <span className="text-red-400 text-xs uppercase tracking-widest font-sans font-bold mb-1">
                {looks[activeModalIndex].category}
              </span>
              <h3 className="font-serif text-2xl text-white">
                {looks[activeModalIndex].title}
              </h3>
              <p className="text-neutral-300 text-sm max-w-lg mt-2 font-sans">
                {looks[activeModalIndex].caption}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
