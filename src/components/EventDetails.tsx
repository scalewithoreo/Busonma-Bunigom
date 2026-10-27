import { useState, FC } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, CalendarPlus, ChevronDown, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getGoogleCalendarUrl, getOutlookCalendarUrl, downloadIcsFile } from '../utils/calendar';

interface EventDetailsProps {
  onNotify: (title: string, message?: string) => void;
}

export const EventDetails: FC<EventDetailsProps> = ({ onNotify }) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDownloadIcs = () => {
    downloadIcsFile();
    setCalendarOpen(false);
    onNotify('Calendar File Downloaded', 'Open the downloaded .ics file to add to Apple Calendar or Outlook.');
  };

  return (
    <section id="details" className="py-24 sm:py-32 px-4 sm:px-6 bg-brand-ivory relative">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mb-3"
          >
            Save The Date
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl text-brand-espresso font-normal"
          >
            This Day
          </motion.h2>
          {/* Date Reveal with Theater Curtain & Confetti */}
          <div className="mt-6 relative inline-block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: 0.2 }}
              onViewportEnter={() => {
                setTimeout(() => {
                  confetti({
                    particleCount: 65,
                    spread: 80,
                    origin: { y: 0.45 },
                    colors: ['#c5a880', '#75074B', '#334a33', '#ffffff', '#e6ca65'],
                    disableForReducedMotion: true
                  });
                }, 700);
              }}
              className="relative overflow-hidden px-6 sm:px-10 py-3 sm:py-4 rounded-2xl bg-white/70 shadow-md border border-brand-gold/30"
            >
              {/* Left Curtain */}
              <motion.div
                initial={{ width: '50%' }}
                whileInView={{ width: '0%' }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.77, 0, 0.175, 1] }}
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-brand-espresso via-brand-espresso to-brand-gold/90 z-20 shadow-2xl flex items-center justify-end overflow-hidden"
              >
                <div className="w-1.5 h-full bg-brand-gold shadow-[0_0_12px_#c5a880]" />
              </motion.div>

              {/* Right Curtain */}
              <motion.div
                initial={{ width: '50%' }}
                whileInView={{ width: '0%' }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.77, 0, 0.175, 1] }}
                className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-brand-espresso via-brand-espresso to-brand-gold/90 z-20 shadow-2xl flex items-center justify-start overflow-hidden"
              >
                <div className="w-1.5 h-full bg-brand-gold shadow-[0_0_12px_#c5a880]" />
              </motion.div>

              {/* Revealed Date Text */}
              <span className="font-serif italic text-2xl sm:text-4xl md:text-5xl text-brand-goldDark select-none block">
                Saturday, December 12, 2026
              </span>
            </motion.div>
          </div>
        </div>

        {/* 2-Column Grid: Schedule cards & Venue Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Events Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-brand-cream/80 rounded-3xl p-8 sm:p-12 shadow-sm text-center flex flex-col justify-center h-full items-center border border-brand-sand/30 relative overflow-hidden">
                {/* Faint Background Image */}
                <div className="absolute inset-0 z-0 opacity-15">
                  <img loading="lazy" decoding="async" src="/assets/hero-image-new.jpg" alt="Couple" className="w-full h-full object-cover object-top mix-blend-luminosity grayscale" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center w-full">
                  <CalendarPlus className="w-10 h-10 text-brand-goldDark mb-5 opacity-80" />
                  <h3 className="font-serif text-3xl sm:text-4xl text-brand-espresso mb-3">Save the Date</h3>
                  <p className="text-brand-muted font-sans text-[17px] mb-8 max-w-md leading-relaxed font-medium">
                     We are so excited to celebrate our special day with you. Add the wedding to your calendar to stay updated!
                  </p>
                  {/* Add to Calendar Action */}
                  <div className="relative w-full max-w-sm text-left">
              <button
                onClick={() => setCalendarOpen(!calendarOpen)}
                className="w-full py-4 px-6 rounded-2xl bg-brand-espresso hover:bg-brand-charcoal text-brand-cream flex items-center justify-between transition-all duration-300 shadow-md"
              >
                <span className="flex items-center gap-3 font-sans text-[17px] tracking-wider uppercase font-medium">
                  <CalendarPlus className="w-5 h-5 text-brand-gold" />
                  Add Wedding to Calendar
                </span>
                <ChevronDown className={`w-5 h-5 text-brand-sand transition-transform duration-300 ${calendarOpen ? 'rotate-180' : ''}`} />
              </button>

              {calendarOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl p-3 shadow-2xl z-20 flex flex-col gap-1 animate-fade-in">
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setCalendarOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cream text-brand-espresso text-[17px] font-sans transition-colors"
                  >
                    <span>Google Calendar</span>
                    <ExternalLink className="w-4 h-4 text-brand-muted" />
                  </a>
                  <a
                    href={getOutlookCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setCalendarOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cream text-brand-espresso text-[17px] font-sans transition-colors"
                  >
                    <span>Outlook Calendar</span>
                    <ExternalLink className="w-4 h-4 text-brand-muted" />
                  </a>
                  <button
                    onClick={handleDownloadIcs}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cream text-brand-espresso text-[17px] font-sans transition-colors text-left"
                  >
                    <span>Apple Calendar / iCal (.ics)</span>
                    <Check className="w-4 h-4 text-brand-gold" />
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Location / Venue Right Column (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 bg-brand-espresso text-brand-cream rounded-3xl p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl"
          >
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
              <img loading="lazy" decoding="async" src="/assets/celebr8-center.jpg" alt="Celebr8 Center" className="w-full h-full object-cover opacity-15 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-espresso via-brand-espresso/70 to-transparent" />
            </div>

            {/* Background texture watermark */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none z-0" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-brand-gold text-xs uppercase tracking-[0.25em] font-sans font-semibold mb-4">
                <MapPin className="w-4 h-4" />
                <span>Venue & Location</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-brand-ivory font-light leading-tight drop-shadow-md">
                Church
              </h3>
              <p className="text-brand-sand text-[17px] font-sans leading-relaxed drop-shadow-sm mt-1 mb-6">
                Celebration Church Int'l (Celebr8 Centre HQ), Vori Close, off Acme Road, Ogba, Lagos
              </p>
              
              <h3 className="font-serif text-2xl sm:text-3xl text-brand-ivory font-light leading-tight drop-shadow-md">
                Reception
              </h3>
              <p className="text-brand-sand text-[17px] font-sans leading-relaxed drop-shadow-sm mt-1">
                Celebration Church Int'l (Celebr8 Centre HQ) (Annex 2), Vori Close, off Acme Road, Ogba, Lagos
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
              <a
                href="https://maps.google.com/?q=Celebration+Church+Int'l+(Celebr8+Centre+HQ),+Vori+Close,+off+Acme+Road,+Ogba,+Lagos"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-brand-cream text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 backdrop-blur-sm"
              >
                <span>Church Directions (Maps)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://maps.google.com/?q=Celebration+Church+Int'l+(Celebr8+Centre+HQ),+Vori+Close,+off+Acme+Road,+Ogba,+Lagos"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-brand-gold hover:bg-brand-cream text-brand-espresso text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 shadow-md"
              >
                <span>Reception Directions (Maps)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
