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
                src="/assets/0V3A8914.jpg" 
                alt="Ore and Dara"
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
              We met through a friend at church. I used to drive to church with my friend, Jemima Kponu, and one Sunday, Jemima brought Dara to tag along. We were introduced, exchanged pleasantries, and went in for the service.
            </p>
            <p className="relative z-10">
              After the service ended, Dara walked up to me and asked for my name. I told her my name, and she simply replied, <span className="italic font-serif">"okay..."</span> and was about to walk away.
            </p>
            <p className="relative z-10">
              Thankfully, I wasn't going to just let her leave like that. I asked, <span className="italic font-serif font-medium text-brand-espresso">"Is that all?"</span> and told her to sit down. 
            </p>
            <p className="relative z-10">
              We ended up talking, and that simple moment was the beginning of a truly beautiful friendship. From that day on, we built a bond that grew stronger with time, leading us to this very moment—ready to spend the rest of our lives together.
            </p>
            <div className="pt-8 relative z-10">
              <p className="font-serif italic text-2xl text-brand-goldDark">— Ore</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
