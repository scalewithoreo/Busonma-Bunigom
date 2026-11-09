import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

export const QandA: FC = () => {
  const { wedding } = useWedding();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = wedding.qa;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="qa" className="py-24 sm:py-32 bg-white relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <span className="text-[17px] font-sans tracking-[0.2em] uppercase text-brand-gold font-semibold">
              Q & A
            </span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif text-brand-espresso mb-6"
          >
            Questions & Answers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-brand-muted text-[17px] sm:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            If you have any questions, please check our Q & A section first!
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-brand-sand/30 rounded-2xl overflow-hidden bg-brand-cream/30"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus-visible:bg-brand-sand/20 hover:bg-brand-cream/50 transition-colors"
              >
                <span className="font-sans font-bold text-brand-espresso pr-4 text-base sm:text-lg">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-brand-gold shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-2 font-sans text-brand-muted text-[15px] sm:text-base leading-relaxed border-t border-brand-sand/20">
                      {faq.contacts && faq.contacts.length > 0 ? (
                        <>
                          For any further inquiries or assistance, please feel free to contact our coordinators:<br />
                          {faq.contacts.map((c, i) => (
                            <span key={i}>
                              <strong>{c.name}:</strong> {c.phone}<br />
                            </span>
                          ))}
                        </>
                      ) : (
                        faq.answer
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
