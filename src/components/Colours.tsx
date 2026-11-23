import { FC, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2, GalleryHorizontal, LayoutGrid } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

export const Colours: FC = () => {
  const { wedding } = useWedding();
  const theme = wedding.theme;
  const looks = theme.looks || [];
  const runwayRef = useRef<HTMLDivElement>(null);
  
  const categories = useMemo(() => {
    const set = new Set<string>();
    looks.forEach(l => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set);
  }, [looks]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeLookId, setActiveLookId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'runway' | 'grid'>('runway');
  const [activeRunwayIndex, setActiveRunwayIndex] = useState<number>(0);

  const filteredLooks = useMemo(() => {
    if (selectedCategory === 'All') return looks;
    return looks.filter(l => l.category === selectedCategory);
  }, [looks, selectedCategory]);

  const activeLookIndex = filteredLooks.findIndex(l => l.id === activeLookId);
  const activeLook = activeLookIndex >= 0 ? filteredLooks[activeLookIndex] : null;

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setActiveRunwayIndex(0);
    if (runwayRef.current) {
      runwayRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollRunway = (direction: 'left' | 'right') => {
    if (!runwayRef.current) return;
    const container = runwayRef.current;
    const card = container.querySelector('[data-runway-card]') as HTMLElement | null;
    const scrollAmount = card ? card.offsetWidth + 16 : 320;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const scrollToLookIndex = (index: number) => {
    if (!runwayRef.current) return;
    const cards = runwayRef.current.querySelectorAll('[data-runway-card]');
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      setActiveRunwayIndex(index);
    }
  };

  const handleRunwayScroll = () => {
    if (!runwayRef.current) return;
    const container = runwayRef.current;
    const center = container.scrollLeft + container.offsetWidth / 2;
    const cards = Array.from(container.querySelectorAll('[data-runway-card]')) as HTMLElement[];
    let closestIndex = 0;
    let minDistance = Infinity;
    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });
    setActiveRunwayIndex(closestIndex);
  };

  const handleNextModal = () => {
    if (activeLookIndex >= 0 && filteredLooks.length > 0) {
      const nextIdx = (activeLookIndex + 1) % filteredLooks.length;
      setActiveLookId(filteredLooks[nextIdx].id);
    }
  };

  const handlePrevModal = () => {
    if (activeLookIndex >= 0 && filteredLooks.length > 0) {
      const prevIdx = (activeLookIndex - 1 + filteredLooks.length) % filteredLooks.length;
      setActiveLookId(filteredLooks[prevIdx].id);
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
        {theme.paletteLayout === 'bands' ? (
          /* Stacked Silk Bands (e.g. Ore & Dara presentation) */
          <div className="flex flex-col w-full h-[540px] sm:h-[640px] mb-16 rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto border border-black/10">
            {theme.paletteBands.map((band) => (
              <div
                key={band.name}
                className="w-full flex-1 relative flex items-center justify-center bg-cover bg-center group overflow-hidden"
                style={{
                  backgroundImage: band.bgImage ? `url('${band.bgImage}')` : undefined,
                  backgroundColor: band.hex,
                }}
              >
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-500"></div>
                <div className="relative z-10 text-center px-4">
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-white/95 font-serif text-3xl sm:text-4xl md:text-5xl tracking-widest drop-shadow-lg uppercase"
                  >
                    {band.name}
                  </motion.h3>
                  {band.subtitle && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 }}
                      className="text-white/80 font-sans text-xs sm:text-sm tracking-[0.25em] uppercase mt-2 drop-shadow font-medium"
                    >
                      {band.subtitle}
                    </motion.p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : theme.paletteLayout === 'grid' ? (
          /* High Contrast Editorial Grid */
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
          /* 4-Swatch Fabric Presentation (e.g. Busonma & Bunigom Colors of the Day Card) */
          <div className="mb-16 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {theme.paletteBands.map((band, idx) => (
                <motion.div
                  key={band.name}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-md hover:shadow-2xl transition-all duration-300 border border-brand-sand/50 flex flex-col group hover:-translate-y-1"
                >
                  {/* Draped Fabric Swatch */}
                  <div 
                    className="w-full aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden relative shadow-inner bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
                    style={{
                      backgroundImage: band.bgImage ? `url('${band.bgImage}')` : undefined,
                      backgroundColor: band.hex,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  </div>
                  {/* Swatch Typography */}
                  <div className="text-center pt-3 pb-1">
                    <h3 className="font-serif text-sm sm:text-base font-bold tracking-wider text-brand-espresso uppercase">
                      {band.name}
                    </h3>
                    <p className="font-mono text-xs text-brand-goldDark font-semibold tracking-wider uppercase mt-1">
                      {band.hex}
                    </p>
                    {band.tag && (
                      <span className="inline-block text-[10px] tracking-[0.18em] uppercase font-sans text-brand-muted mt-0.5">
                        {band.tag}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Lookbook Header */}
        <div className="text-center mt-20 sm:mt-28 mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 mb-3"
          >
            <span className="text-[11px] font-sans tracking-[0.25em] uppercase text-brand-goldDark font-semibold">
              Curated Style Guide
            </span>
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-brand-espresso mb-3"
          >
            Style Inspiration & Lookbook
          </motion.h3>
          <p className="font-sans text-brand-muted text-base sm:text-lg max-w-xl mx-auto">
            Curated silhouettes and styling details to guide your wedding celebration attire.
          </p>

          {/* Controls Bar: Category Tabs & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 max-w-5xl mx-auto px-1">
            {/* Category Filter Tabs */}
            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar w-full sm:w-auto justify-start sm:justify-center">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('All')}
                  className={`px-4 py-2 rounded-full text-xs font-sans font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === 'All'
                      ? 'bg-brand-espresso text-brand-cream shadow-md scale-105'
                      : 'bg-white/80 text-brand-muted hover:text-brand-espresso hover:bg-white border border-brand-sand/50'
                  }`}
                >
                  All Looks ({looks.length})
                </button>
                {categories.map((cat) => {
                  const count = looks.filter(l => l.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-sans font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                        selectedCategory === cat
                          ? 'bg-brand-espresso text-brand-cream shadow-md scale-105'
                          : 'bg-white/80 text-brand-muted hover:text-brand-espresso hover:bg-white border border-brand-sand/50'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* View Mode Toggle Pill */}
            <div className="inline-flex p-1 rounded-full bg-white/90 border border-brand-sand/60 shadow-sm shrink-0 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('runway')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold tracking-wider uppercase transition-all duration-300 ${
                  viewMode === 'runway'
                    ? 'bg-brand-espresso text-brand-cream shadow-sm'
                    : 'text-brand-muted hover:text-brand-espresso'
                }`}
                title="Swipeable Runway Carousel"
              >
                <GalleryHorizontal className="w-3.5 h-3.5" />
                <span>Runway</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold tracking-wider uppercase transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-brand-espresso text-brand-cream shadow-sm'
                    : 'text-brand-muted hover:text-brand-espresso'
                }`}
                title="Compact Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: RUNWAY (Horizontal Swipeable Track with Filmstrip) */}
        {viewMode === 'runway' && (
          <div className="relative max-w-6xl mx-auto">
            {/* Runway Controls */}
            {filteredLooks.length > 1 && (
              <div className="hidden md:flex items-center justify-between pointer-events-none absolute -top-12 right-0 gap-2 z-20">
                <button
                  type="button"
                  onClick={() => scrollRunway('left')}
                  className="pointer-events-auto p-2 rounded-full bg-white/90 hover:bg-white text-brand-espresso shadow-md border border-brand-sand/60 transition-all hover:scale-105"
                  aria-label="Previous look"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRunway('right')}
                  className="pointer-events-auto p-2 rounded-full bg-white/90 hover:bg-white text-brand-espresso shadow-md border border-brand-sand/60 transition-all hover:scale-105"
                  aria-label="Next look"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Horizontal Runway Track */}
            <div
              ref={runwayRef}
              onScroll={handleRunwayScroll}
              className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-4 px-2 sm:px-4 no-scrollbar scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {filteredLooks.map((look, index) => (
                <div
                  key={look.id}
                  data-runway-card
                  onClick={() => setActiveLookId(look.id)}
                  className="w-[82vw] sm:w-[340px] md:w-[360px] shrink-0 snap-center group cursor-pointer flex flex-col bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-brand-sand/40 hover:-translate-y-1.5"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-brand-espresso">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={look.src}
                      alt={look.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-5">
                      <span className="text-white text-xs font-sans uppercase tracking-widest flex items-center gap-1.5">
                        <Maximize2 className="w-4 h-4 text-brand-gold" />
                        Enlarge Look
                      </span>
                    </div>
                    {look.category && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-brand-espresso/80 backdrop-blur-md text-brand-cream text-[11px] font-sans uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-sm">
                          {look.category}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/10">
                        {index + 1} / {filteredLooks.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-white">
                    <div>
                      <h4 className="font-serif text-lg sm:text-xl text-brand-espresso mb-1.5 group-hover:text-brand-primary transition-colors line-clamp-1">
                        {look.title}
                      </h4>
                      <p className="font-sans text-brand-muted text-xs sm:text-sm leading-relaxed line-clamp-2">
                        {look.caption}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-brand-sand/40 flex items-center justify-between text-xs font-sans text-brand-goldDark font-semibold tracking-wider uppercase">
                      <span>View Full Look</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Glance Thumbnail Scrubber Filmstrip */}
            <div className="mt-4 pt-2 border-t border-brand-sand/30">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-sans uppercase tracking-widest text-brand-goldDark font-semibold">
                  Quick Selector ({filteredLooks.length} Styles)
                </span>
                <span className="text-[11px] font-sans text-brand-muted">
                  Slide or tap thumbnail
                </span>
              </div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 px-2 no-scrollbar scroll-smooth">
                {filteredLooks.map((look, idx) => (
                  <button
                    key={look.id}
                    type="button"
                    onClick={() => scrollToLookIndex(idx)}
                    className={`group relative shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                      activeRunwayIndex === idx
                        ? 'border-brand-gold scale-105 shadow-md ring-2 ring-brand-gold/30 opacity-100'
                        : 'border-brand-sand/50 opacity-60 hover:opacity-100 hover:border-brand-gold/60'
                    }`}
                    title={look.title}
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      src={look.src}
                      alt={look.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-black/60 text-[8px] font-mono text-brand-cream">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View Mode: COMPACT GRID (2 columns on mobile, 3 columns on desktop) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-6xl mx-auto">
            {filteredLooks.map((look, index) => (
              <motion.div
                key={look.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
                onClick={() => setActiveLookId(look.id)}
                className="group cursor-pointer relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-sand/40 bg-brand-espresso"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={look.src}
                  alt={look.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-3 sm:p-5">
                  <div className="flex items-center justify-between">
                    {look.category ? (
                      <span className="bg-brand-espresso/80 backdrop-blur-md text-brand-cream text-[9px] sm:text-[11px] font-sans uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/10">
                        {look.category}
                      </span>
                    ) : <span />}
                    <span className="bg-black/50 text-white/80 text-[10px] font-mono px-2 py-0.5 rounded-full">
                      {index + 1}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif text-sm sm:text-lg text-white font-medium line-clamp-1 mb-1 drop-shadow-md group-hover:text-brand-gold transition-colors">
                      {look.title}
                    </h4>
                    <p className="hidden sm:block text-white/70 font-sans text-xs line-clamp-2 leading-relaxed mb-2">
                      {look.caption}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs font-sans text-brand-gold uppercase tracking-wider font-semibold">
                      <Maximize2 className="w-3 h-3" />
                      <span>Tap to enlarge</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lookbook Lightbox Modal */}
      <AnimatePresence>
        {activeLook !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLookId(null)}
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
                onClick={() => setActiveLookId(null)}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Prev / Next Modal Buttons */}
              {filteredLooks.length > 1 && (
                <>
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
                </>
              )}

              {/* Modal Image */}
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden aspect-[3/4] md:aspect-auto">
                <img loading="lazy" decoding="async" 
                  src={activeLook.src} 
                  alt={activeLook.title}
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Modal Info */}
              <div className="w-full md:w-2/5 p-8 sm:p-10 flex flex-col justify-between overflow-y-auto">
                <div>
                  {activeLook.category && (
                    <span className="text-xs uppercase tracking-[0.25em] text-brand-gold font-sans font-semibold block mb-3">
                      {activeLook.category}
                    </span>
                  )}
                  <h3 className="font-serif text-3xl sm:text-4xl text-brand-cream mb-4 leading-tight">
                    {activeLook.title}
                  </h3>
                  <div className="w-12 h-0.5 bg-brand-gold/40 mb-6" />
                  <p className="font-sans text-brand-sand/90 text-base leading-relaxed">
                    {activeLook.caption}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-brand-sand/60 font-sans">
                  <span>Look {activeLookIndex + 1} of {filteredLooks.length}</span>
                  <button
                    onClick={() => setActiveLookId(null)}
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
