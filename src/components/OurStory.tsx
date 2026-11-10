import { FC } from 'react';
import { motion } from 'framer-motion';
import { useWedding } from '../context/WeddingContext';

export const OurStory: FC = () => {
  const { wedding } = useWedding();
  const story = wedding.story;

  return (
    <section id="our-story" className="py-24 sm:py-32 px-4 sm:px-6 bg-brand-cream relative border-t border-brand-espresso/10">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-xs tracking-[0.3em] uppercase text-brand-goldDark font-semibold font-sans mb-4"
          >
            {story.subtitle}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif text-brand-espresso"
          >
            {story.title}
          </motion.h2>
        </div>

        {/* Guest Welcome Note (when configured) */}
        {story.welcomeQuote && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            className="mb-16 p-6 sm:p-10 rounded-3xl bg-white/70 border border-brand-gold/30 shadow-md text-center max-w-3xl mx-auto backdrop-blur-sm"
          >
            <p className="text-xs uppercase tracking-[0.25em] font-sans font-semibold text-brand-goldDark mb-3">
              A Warm Welcome From The Couple
            </p>
            <p className="font-serif italic text-lg sm:text-2xl text-brand-espresso/90 leading-relaxed">
              "{story.welcomeQuote}"
            </p>
          </motion.div>
        )}

        {/* Story Content */}
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full md:w-1/2"
          >
            <div className="aspect-[4/5] sm:aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl relative bg-brand-espresso border border-brand-gold/20">
              <img loading="lazy" decoding="async"
                src={story.image} 
                alt={story.imageAlt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-brand-gold/10 mix-blend-multiply pointer-events-none" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full md:w-1/2 space-y-6 text-brand-espresso/80 font-sans text-base sm:text-lg leading-relaxed relative"
          >
            <div className="absolute -left-6 -top-6 text-brand-gold/20 font-serif text-9xl pointer-events-none hidden md:block">
              "
            </div>
            {story.paragraphs.map((p, idx) => (
              <p key={idx} className="relative z-10">
                {p}
              </p>
            ))}
            <div className="pt-8 relative z-10">
              <p className="font-serif italic text-2xl text-brand-goldDark">{story.signoff}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
