import { FC } from 'react';
import { motion } from 'framer-motion';
import { Church, Utensils } from 'lucide-react';

export const Programme: FC = () => {
  const schedule = [
    {
      time: '11:00 AM',
      title: 'Church Wedding',
      subtitle: 'Holy Matrimony & Sacred Vows',
      description: 'Guests are kindly requested to be seated by 10:30 AM for the processional, exchange of vows, and nuptial blessing.',
      icon: Church,
      highlight: true,
    },
    {
      time: '2:00 PM',
      title: 'Reception & Banquet',
      subtitle: 'Feast, Speeches & Celebration',
      description: 'Grand entrance of the bridal party, couple first dance, gourmet dinner service, toasts, and cake cutting.',
      icon: Utensils,
      highlight: true,
    },
  ];

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
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative pl-8 sm:pl-10 group"
              >
                {/* Timeline node */}
                <div
                  className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform duration-300 group-hover:scale-110 ${
                    item.highlight
                      ? 'bg-brand-espresso border-brand-gold text-brand-gold'
                      : 'bg-white border-brand-sand text-brand-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Time Badge (Desktop floating left, Mobile inline) */}
                <div className="sm:absolute sm:-left-36 md:-left-44 top-1.5 mb-1 sm:mb-0">
                  <span
                    className={`inline-block font-serif text-xl sm:text-2xl font-medium tracking-tight ${
                      item.highlight ? 'text-brand-goldDark' : 'text-brand-espresso/80'
                    }`}
                  >
                    {item.time}
                  </span>
                </div>

                {/* Content Area - Clean & Minimal (No Box) */}
                <div className="pt-0.5 pb-8 sm:pb-12">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-serif text-2xl sm:text-3xl text-brand-espresso font-normal">
                      {item.title}
                    </h3>
                    {item.highlight && (
                      <span className="text-[10px] uppercase font-sans font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-goldDark">
                        Official
                      </span>
                    )}
                  </div>
                  <p className="font-serif italic text-[17px] text-brand-goldDark mt-0.5">
                    {item.subtitle}
                  </p>
                  <p className="text-brand-muted text-[17px] font-sans mt-3 leading-relaxed">
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
