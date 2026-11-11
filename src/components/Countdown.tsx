import { useState, useEffect, FC } from 'react';
import { motion } from 'framer-motion';
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

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <section id="countdown" className="py-20 sm:py-28 px-4 sm:px-6 bg-brand-cream relative overflow-hidden border-t border-brand-sand/30">
      {/* Decorative subtle flourish */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />

      <div className="max-w-4xl mx-auto text-center">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mb-3">
            The Journey Begins
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-brand-espresso font-light">
            Event Starts In
          </h2>
          <p className="font-serif italic text-brand-muted text-[17px] sm:text-lg mt-2">
            Counting down every second until we say “I Do”
          </p>
        </motion.div>

        {/* Countdown Grid - Strictly Guaranteed Single Horizontal Line on Every Screen Size */}
        <div className="grid grid-cols-4 w-full max-w-3xl mx-auto gap-1 xs:gap-2 sm:gap-6 md:gap-12 items-center justify-between">
          {timeUnits.map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center justify-center min-w-0 px-0.5"
            >
              <span className="font-sans text-2xl xs:text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-brand-espresso tracking-tight tabular-nums leading-none">
                {unit.label === 'Days' ? unit.value : formatNumber(unit.value)}
              </span>
              <span className="text-[8px] xs:text-[10px] sm:text-[13px] uppercase tracking-[0.14em] sm:tracking-[0.25em] font-sans font-semibold text-brand-goldDark mt-1.5 sm:mt-4 whitespace-nowrap">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
