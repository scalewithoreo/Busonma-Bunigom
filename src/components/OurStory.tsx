import { FC } from 'react';
import { motion } from 'framer-motion';

export const OurStory: FC = () => {
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
            How It All Began
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif text-brand-espresso"
          >
            Our Story
          </motion.h2>
        </div>

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
                src="/assets/story-couple.jpg" 
                alt="Miracle and Marvin"
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
            <p className="relative z-10">
              Our journey began on a memorable Sunday at Celebration Church in Ikeja. We were introduced through mutual friends right after service in the church lobby, exchanging warm greetings before the rush of the crowd.
            </p>
            <p className="relative z-10">
              A spontaneous conversation over lunch soon turned into hours of laughing, sharing our visions, talking through faith, creativity, and the dreams we carried for the future. From that day on, every conversation felt effortless, peaceful, and filled with genuine joy.
            </p>
            <p className="relative z-10">
              What started as an instant connection steadily blossomed into an unbreakable partnership anchored in love and purpose. We quickly realized we didn't just want to do life in the same circles—we wanted to build forever together.
            </p>
            <p className="relative z-10">
              On January 27th, we stand before God and our dearest loved ones to celebrate the beginning of that forever.
            </p>
            <div className="pt-8 relative z-10">
              <p className="font-serif italic text-2xl text-brand-goldDark">— Marvin & Miracle</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
