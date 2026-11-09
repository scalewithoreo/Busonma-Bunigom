import { useState, useEffect, FC } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const Countdown: FC = () => {
  const { wedding } = useWedding();
  const targetTimestamp = new Date(wedding.event.date).getTime();

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const difference = targetTimestamp - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isPast: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [wedding.event.date]);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <section id="countdown" className="py-20 sm:py-24 px-4 sm:px-6 bg-brand-espresso text-brand-cream relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c5a880_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-4 text-brand-gold text-xs uppercase tracking-[0.25em] font-sans font-semibold"
        >
          <Clock className="w-4 h-4" />
          <span>Counting Down</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-serif text-3xl sm:text-5xl md:text-6xl text-brand-cream font-light mb-12"
        >
          Until We Say "I Do"
        </motion.h2>

        {/* Countdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
          {timeUnits.map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center shadow-lg"
            >
              <span className="font-serif text-4xl sm:text-6xl text-brand-gold font-light tabular-nums leading-none mb-2">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.2em] text-brand-sand/70">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
