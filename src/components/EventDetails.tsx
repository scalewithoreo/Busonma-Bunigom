import { useState, FC } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, CalendarPlus, ChevronDown, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getGoogleCalendarUrl, getOutlookCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { useWedding } from '../context/WeddingContext';

interface EventDetailsProps {
  onNotify: (title: string, message?: string) => void;
}

export const EventDetails: FC<EventDetailsProps> = ({ onNotify }) => {
  const { wedding } = useWedding();
  const [activeCalendar, setActiveCalendar] = useState<'church' | 'reception' | 'unified' | null>(null);

  const hasSeparateCalendars = Boolean(
    wedding.event.church.calendar &&
    wedding.event.reception.calendar &&
    wedding.event.church.venueName !== wedding.event.reception.venueName
  );

  const churchCalendarData = wedding.event.church.calendar
    ? {
        title: wedding.event.church.calendar.title,
        description: wedding.event.church.calendar.description,
        location: wedding.event.church.calendar.location,
        startDate: wedding.event.church.calendar.startDate,
        endDate: wedding.event.church.calendar.endDate,
        downloadFilename: wedding.event.church.calendar.downloadFilename || `${wedding.slug}-solemnization.ics`,
      }
    : null;

  const receptionCalendarData = wedding.event.reception.calendar
    ? {
        title: wedding.event.reception.calendar.title,
        description: wedding.event.reception.calendar.description,
        location: wedding.event.reception.calendar.location,
        startDate: wedding.event.reception.calendar.startDate,
        endDate: wedding.event.reception.calendar.endDate,
        downloadFilename: wedding.event.reception.calendar.downloadFilename || `${wedding.slug}-reception.ics`,
      }
    : null;

  const unifiedCalendarData = {
    title: wedding.event.calendar.title,
    description: wedding.event.calendar.description,
    location: wedding.event.calendar.location,
    startDate: wedding.event.calendar.startDate,
    endDate: wedding.event.calendar.endDate,
    downloadFilename: `${wedding.slug}-wedding.ics`,
  };

  const handleDownloadSpecificIcs = (
    data: {
      title: string;
      description: string;
      location: string;
      startDate: string;
      endDate: string;
      downloadFilename?: string;
    },
    eventLabel: string
  ) => {
    downloadIcsFile(data);
    setActiveCalendar(null);
    onNotify('Calendar File Downloaded', `Open the downloaded .ics file to add ${eventLabel} to Apple Calendar or Outlook.`);
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
            {wedding.event.saveTheDateHeading || (wedding.event.displayDate.includes('&') ? 'These Days' : 'This Day')}
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
                    colors: wedding.event.confettiColors || ['#c5a880', '#faf8f2', '#141210'],
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
                <div className="w-1.5 h-full bg-brand-primary shadow-[0_0_12px_var(--brand-primary)]" />
              </motion.div>

              {/* Right Curtain */}
              <motion.div
                initial={{ width: '50%' }}
                whileInView={{ width: '0%' }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.77, 0, 0.175, 1] }}
                className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-brand-espresso via-brand-espresso to-brand-gold/90 z-20 shadow-2xl flex items-center justify-start overflow-hidden"
              >
                <div className="w-1.5 h-full bg-brand-primary shadow-[0_0_12px_var(--brand-primary)]" />
              </motion.div>

              {/* Revealed Date Text */}
              <span className="font-serif italic text-2xl sm:text-4xl md:text-5xl text-brand-goldDark select-none block">
                {wedding.event.displayDate}
              </span>
            </motion.div>
          </div>
        </div>

        {/* 2-Column Grid: Schedule cards & Venue Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Events Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-brand-espresso rounded-3xl p-8 sm:p-12 shadow-2xl text-center flex flex-col justify-center h-full items-center border border-white/10 relative overflow-hidden">
              {/* Background Image Layer - 100% Vibrant Full Color */}
              <div className="absolute inset-0 z-0">
                <img 
                  loading="lazy" 
                  decoding="async" 
                  src={wedding.event.saveTheDateImage || '/assets/busonma-bunigom/gallery-3.jpg'} 
                  alt={wedding.couple.title} 
                  className="w-full h-full object-cover object-center opacity-75" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/75 pointer-events-none" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center w-full">
                <CalendarPlus className="w-10 h-10 text-brand-gold mb-5 drop-shadow-lg" />
                <h3 className="font-serif text-3xl sm:text-4xl text-white drop-shadow-md mb-3">Save the Date</h3>
                <p className="text-brand-cream/90 font-sans text-[17px] mb-8 max-w-md leading-relaxed font-normal drop-shadow-sm">
                   We are so excited to celebrate our special day with you. Add the wedding to your calendar to stay updated!
                </p>
                {/* Add to Calendar Action */}
                {hasSeparateCalendars && churchCalendarData && receptionCalendarData ? (
                  <div className="w-full max-w-sm flex flex-col gap-3">
                    {/* Event 1 Calendar Button */}
                    <div className="relative w-full text-left">
                      <button
                        onClick={() => setActiveCalendar(activeCalendar === 'church' ? null : 'church')}
                        className="w-full py-3 px-5 rounded-2xl bg-brand-espresso/90 hover:bg-brand-charcoal text-brand-cream flex items-center justify-between transition-all duration-300 shadow-md border border-brand-gold/30 hover:border-brand-gold"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <CalendarPlus className="w-5 h-5 text-brand-gold shrink-0" />
                          <div>
                            <span className="block text-[11px] uppercase tracking-wider text-brand-gold font-semibold">
                              {wedding.event.church.name}
                            </span>
                            <span className="block text-sm font-sans text-brand-cream">
                              {wedding.event.church.date || 'Thursday, Jan 7, 2027'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-brand-sand transition-transform duration-300 ${activeCalendar === 'church' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeCalendar === 'church' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl p-3 shadow-2xl z-30 flex flex-col gap-1 animate-fade-in border border-brand-sand/20">
                          <a
                            href={getGoogleCalendarUrl(churchCalendarData)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setActiveCalendar(null)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-cream text-brand-espresso text-sm font-sans transition-colors"
                          >
                            <span>Google Calendar ({wedding.event.church.date ? wedding.event.church.date.split(',')[0] : 'Jan 7'})</span>
                            <ExternalLink className="w-4 h-4 text-brand-muted" />
                          </a>
                          <a
                            href={getOutlookCalendarUrl(churchCalendarData)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setActiveCalendar(null)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-cream text-brand-espresso text-sm font-sans transition-colors"
                          >
                            <span>Outlook Calendar ({wedding.event.church.date ? wedding.event.church.date.split(',')[0] : 'Jan 7'})</span>
                            <ExternalLink className="w-4 h-4 text-brand-muted" />
                          </a>
                          <button
                            onClick={() => handleDownloadSpecificIcs(churchCalendarData, wedding.event.church.name)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-cream text-brand-espresso text-sm font-sans transition-colors text-left"
                          >
                            <span>Apple Calendar / iCal (.ics)</span>
                            <Check className="w-4 h-4 text-brand-gold" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Event 2 Calendar Button */}
                    <div className="relative w-full text-left">
                      <button
                        onClick={() => setActiveCalendar(activeCalendar === 'reception' ? null : 'reception')}
                        className="w-full py-3 px-5 rounded-2xl bg-brand-espresso/90 hover:bg-brand-charcoal text-brand-cream flex items-center justify-between transition-all duration-300 shadow-md border border-brand-gold/30 hover:border-brand-gold"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <CalendarPlus className="w-5 h-5 text-brand-gold shrink-0" />
                          <div>
                            <span className="block text-[11px] uppercase tracking-wider text-brand-gold font-semibold">
                              {wedding.event.reception.name}
                            </span>
                            <span className="block text-sm font-sans text-brand-cream">
                              {wedding.event.reception.date || 'Saturday, Jan 9, 2027'}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-brand-sand transition-transform duration-300 ${activeCalendar === 'reception' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeCalendar === 'reception' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl p-3 shadow-2xl z-30 flex flex-col gap-1 animate-fade-in border border-brand-sand/20">
                          <a
                            href={getGoogleCalendarUrl(receptionCalendarData)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setActiveCalendar(null)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-cream text-brand-espresso text-sm font-sans transition-colors"
                          >
                            <span>Google Calendar ({wedding.event.reception.date ? wedding.event.reception.date.split(',')[0] : 'Jan 9'})</span>
                            <ExternalLink className="w-4 h-4 text-brand-muted" />
                          </a>
                          <a
                            href={getOutlookCalendarUrl(receptionCalendarData)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setActiveCalendar(null)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-cream text-brand-espresso text-sm font-sans transition-colors"
                          >
                            <span>Outlook Calendar ({wedding.event.reception.date ? wedding.event.reception.date.split(',')[0] : 'Jan 9'})</span>
                            <ExternalLink className="w-4 h-4 text-brand-muted" />
                          </a>
                          <button
                            onClick={() => handleDownloadSpecificIcs(receptionCalendarData, wedding.event.reception.name)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-cream text-brand-espresso text-sm font-sans transition-colors text-left"
                          >
                            <span>Apple Calendar / iCal (.ics)</span>
                            <Check className="w-4 h-4 text-brand-gold" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full max-w-sm text-left">
                    <button
                      onClick={() => setActiveCalendar(activeCalendar === 'unified' ? null : 'unified')}
                      className="w-full py-4 px-6 rounded-2xl bg-brand-espresso hover:bg-brand-charcoal text-brand-cream flex items-center justify-between transition-all duration-300 shadow-md"
                    >
                      <span className="flex items-center gap-3 font-sans text-[17px] tracking-wider uppercase font-medium">
                        <CalendarPlus className="w-5 h-5 text-brand-gold" />
                        Add Wedding to Calendar
                      </span>
                      <ChevronDown className={`w-5 h-5 text-brand-sand transition-transform duration-300 ${activeCalendar === 'unified' ? 'rotate-180' : ''}`} />
                    </button>

                    {activeCalendar === 'unified' && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl p-3 shadow-2xl z-20 flex flex-col gap-1 animate-fade-in">
                        <a
                          href={getGoogleCalendarUrl(unifiedCalendarData)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveCalendar(null)}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cream text-brand-espresso text-[17px] font-sans transition-colors"
                        >
                          <span>Google Calendar</span>
                          <ExternalLink className="w-4 h-4 text-brand-muted" />
                        </a>
                        <a
                          href={getOutlookCalendarUrl(unifiedCalendarData)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveCalendar(null)}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cream text-brand-espresso text-[17px] font-sans transition-colors"
                        >
                          <span>Outlook Calendar</span>
                          <ExternalLink className="w-4 h-4 text-brand-muted" />
                        </a>
                        <button
                          onClick={() => handleDownloadSpecificIcs(unifiedCalendarData, 'Wedding')}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-cream text-brand-espresso text-[17px] font-sans transition-colors text-left"
                        >
                          <span>Apple Calendar / iCal (.ics)</span>
                          <Check className="w-4 h-4 text-brand-gold" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
              <img 
                loading="lazy" 
                decoding="async" 
                src={wedding.event.venueImage || '/assets/celebr8-center.jpg'} 
                alt={wedding.event.church.venueName} 
                className="w-full h-full object-cover opacity-50 mix-blend-luminosity hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-espresso via-brand-espresso/65 to-black/25" />
            </div>

            {/* Background texture watermark */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none z-0" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-brand-gold text-xs uppercase tracking-[0.25em] font-sans font-semibold mb-4">
                <MapPin className="w-4 h-4" />
                <span>Venue & Location</span>
              </div>

              {wedding.event.church.venueName === wedding.event.reception.venueName ? (
                /* Unified Single Day Celebration Venue (e.g. Busonma & Bunigom at Admiralty Conference Centre) */
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-brand-gold font-semibold block mb-1">
                      Ceremony &amp; Celebration &bull; 1:00 PM WAT
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl text-brand-ivory font-light leading-tight drop-shadow-md">
                      {wedding.event.church.venueName}
                    </h3>
                  </div>
                  <p className="text-brand-sand text-[17px] font-sans leading-relaxed drop-shadow-sm">
                    {wedding.event.church.address}
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/10 text-brand-sand text-xs font-sans tracking-wider uppercase border border-white/10">
                      Dress Code: {wedding.theme.dressCodeDescription?.includes('Luxury Traditional') ? 'Luxury Traditional Attire' : 'Formal / Traditional'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Split Venues (Church + Reception) */
                <div className="space-y-6">
                  {/* Church / Solemnization */}
                  <div className="border-l-2 border-brand-primary pl-4 py-1">
                    <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-brand-gold font-semibold block mb-1">
                      {wedding.event.church.date || 'Thursday, January 7, 2027'} {wedding.event.church.time ? `• ${wedding.event.church.time}` : ''}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-brand-cream/70 font-sans font-medium block">
                      {wedding.event.church.name}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl text-brand-ivory font-light leading-tight drop-shadow-md mt-1">
                      {wedding.event.church.venueName}
                    </h3>
                    <p className="text-brand-sand text-[15px] font-sans leading-relaxed drop-shadow-sm mt-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-gold shrink-0 inline" />
                      <span>{wedding.event.church.address}</span>
                    </p>
                  </div>

                  {/* Reception */}
                  <div className="border-l-2 border-brand-primary pl-4 py-1">
                    <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-brand-gold font-semibold block mb-1">
                      {wedding.event.reception.date || 'Saturday, January 9, 2027'} {wedding.event.reception.time ? `• ${wedding.event.reception.time}` : ''}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-brand-cream/70 font-sans font-medium block">
                      {wedding.event.reception.name}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl text-brand-ivory font-light leading-tight drop-shadow-md mt-1">
                      {wedding.event.reception.venueName}
                    </h3>
                    <p className="text-brand-sand text-[15px] font-sans leading-relaxed drop-shadow-sm mt-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-gold shrink-0 inline" />
                      <span>{wedding.event.reception.address}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
              {wedding.event.church.venueName === wedding.event.reception.venueName ? (
                <a
                  href={wedding.event.church.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 shadow-lg hover:scale-105"
                >
                  <span>Get Venue Directions (Google Maps)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <>
                  <a
                    href={wedding.event.church.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-brand-cream text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 backdrop-blur-sm"
                  >
                    <span>{wedding.event.church.name.includes('Solemnization') ? 'Solemnization Directions (Maps)' : 'Church Directions (Maps)'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={wedding.event.reception.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 shadow-md"
                  >
                    <span>Reception Directions (Maps)</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
