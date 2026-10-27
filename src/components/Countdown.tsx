import { useState, useEffect, FC } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const Countdown: FC = () => {
  // Wedding target: Dec 12, 2026 11:00 AM Lagos Time (UTC+1)
  const targetDate = new Date('2026-12-12T11:00:00+01:00').getTime();

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const difference = targetDate - now;

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
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <section id="countdown" className="py-20 sm:py-28 px-4 sm:px-6 bg-brand-cream relative overflow-hidden">
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

        {/* Countdown Grid */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 max-w-4xl mx-auto">
          {timeUnits.map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center justify-center relative group"
            >
              <span className="font-sans text-5xl sm:text-7xl md:text-8xl font-light text-brand-espresso tracking-tight tabular-nums">
                {formatNumber(unit.value)}
              </span>
              <span className="text-[10px] sm:text-[13px] uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mt-4 sm:mt-6">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Date Reminder footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 inline-flex items-center gap-2 text-xs sm:text-[17px] text-brand-muted font-sans"
        >
          <Clock className="w-4 h-4 text-brand-gold" />
          <span>Saturday, December 12, 2026</span>
        </motion.div>
      </div>
    </section>
  );
};
