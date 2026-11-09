import { FC } from 'react';
import { motion } from 'framer-motion';
import { Church, Utensils, Music, Camera } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

export const Programme: FC = () => {
  const { wedding } = useWedding();
  const schedule = wedding.programme;

  const getIcon = (type: string) => {
    switch (type) {
      case 'church':
        return Church;
      case 'utensils':
        return Utensils;
      case 'music':
        return Music;
      case 'camera':
        return Camera;
      default:
        return Church;
    }
  };

  return (
    <section id="programme" className="py-24 sm:py-32 px-4 sm:px-6 bg-brand-cream relative">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mb-3"
          >
            Order of the Day
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl text-brand-espresso font-normal"
          >
            Programme
          </motion.h2>
          <p className="font-serif italic text-brand-muted text-[17px] sm:text-lg mt-2">
            Schedule of our wedding celebration
          </p>
        </div>

        {/* Timeline */}
        <div className="relative border-l-2 border-brand-gold/30 ml-4 sm:ml-32 md:ml-40 space-y-12 pb-4">
          {schedule.map((item, idx) => {
            const Icon = getIcon(item.icon);
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative pl-8 sm:pl-10 group"
              >
                {/* Node marker */}
                <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-brand-espresso border-2 border-brand-gold flex items-center justify-center text-brand-gold shadow-md group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>

                {/* Time Indicator (Desktop Left Side Callout) */}
                <div className="sm:absolute sm:-left-36 md:-left-44 top-1 text-left sm:text-right w-32 hidden sm:block">
                  <span className="font-serif text-2xl text-brand-goldDark font-semibold block leading-none">
                    {item.time}
                  </span>
                </div>

                {/* Card Content */}
                <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-brand-sand/50 shadow-sm hover:shadow-md transition-shadow">
                  {/* Mobile Time */}
                  <span className="sm:hidden inline-block text-xs uppercase font-mono tracking-wider px-3 py-1 bg-brand-gold/15 text-brand-goldDark rounded-full mb-3 font-semibold">
                    {item.time}
                  </span>

                  <h3 className="font-serif text-2xl sm:text-3xl text-brand-espresso font-light mb-1">
                    {item.title}
                  </h3>
                  <p className="font-serif italic text-sm text-brand-goldDark mb-3">
                    {item.subtitle}
                  </p>
                  <p className="font-sans text-brand-muted text-[15px] sm:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
