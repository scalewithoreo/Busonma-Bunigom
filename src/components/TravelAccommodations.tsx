import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  Building2, 
  Car, 
  ShieldCheck, 
  HeartPulse, 
  Copy, 
  Check, 
  ExternalLink, 
  Tag, 
  MapPin, 
  Info,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Images,
  Phone,
  MessageCircle,
  X
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

interface TravelAccommodationsProps {
  onNotify: (title: string, message?: string) => void;
}

export const TravelAccommodations: FC<TravelAccommodationsProps> = ({ onNotify }) => {
  const { wedding } = useWedding();
  const travelAndStay = wedding.travelAndStay;
  const [activeTab, setActiveTab] = useState<'travel' | 'stay'>('stay');
  const [copiedCode, setCopiedCode] = useState(false);
  const [hotelImageIndices, setHotelImageIndices] = useState<Record<number, number>>({});
  const [lightboxHotel, setLightboxHotel] = useState<{ hotelIndex: number; imageIndex: number } | null>(null);

  if (!travelAndStay) return null;

  const { travel, accommodations } = travelAndStay;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onNotify('Discount Code Copied!', `Use code "${code}" when booking your accommodation.`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleNextHotelImage = (hotelIdx: number, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHotelImageIndices(prev => ({
      ...prev,
      [hotelIdx]: ((prev[hotelIdx] || 0) + 1) % total
    }));
  };

  const handlePrevHotelImage = (hotelIdx: number, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHotelImageIndices(prev => ({
      ...prev,
      [hotelIdx]: ((prev[hotelIdx] || 0) - 1 + total) % total
    }));
  };

  const openHotelLightbox = (hotelIdx: number, imgIdx: number) => {
    setLightboxHotel({ hotelIndex: hotelIdx, imageIndex: imgIdx });
  };

  const handleNextLightbox = () => {
    if (!lightboxHotel) return;
    const hotel = accommodations.hotels[lightboxHotel.hotelIndex];
    const total = hotel?.images?.length || 1;
    setLightboxHotel(prev => prev ? {
      ...prev,
      imageIndex: (prev.imageIndex + 1) % total
    } : null);
  };

  const handlePrevLightbox = () => {
    if (!lightboxHotel) return;
    const hotel = accommodations.hotels[lightboxHotel.hotelIndex];
    const total = hotel?.images?.length || 1;
    setLightboxHotel(prev => prev ? {
      ...prev,
      imageIndex: (prev.imageIndex - 1 + total) % total
    } : null);
  };

  return (
    <section id="travel" className="py-24 sm:py-32 bg-brand-cream/60 relative overflow-hidden border-t border-brand-sand/40">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <span className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark">
              Guest Travel Guide
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif text-brand-espresso mb-5"
          >
            Travel &amp; Where to Stay
          </motion.h2>
          <p className="font-sans text-brand-muted text-base sm:text-lg leading-relaxed">
            Everything you need for a comfortable trip to celebrate with us in Lagos and Abuja.
          </p>

          {/* Tab Selector */}
          <div className="inline-flex p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-brand-sand/50 shadow-md mt-8">
            <button
              onClick={() => setActiveTab('stay')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-sans font-semibold tracking-wider uppercase transition-all duration-300 ${
                activeTab === 'stay'
                  ? 'bg-brand-espresso text-brand-cream shadow-md'
                  : 'text-brand-muted hover:text-brand-espresso'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Where to Stay</span>
            </button>
            <button
              onClick={() => setActiveTab('travel')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-sans font-semibold tracking-wider uppercase transition-all duration-300 ${
                activeTab === 'travel'
                  ? 'bg-brand-espresso text-brand-cream shadow-md'
                  : 'text-brand-muted hover:text-brand-espresso'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Travel &amp; Flights</span>
            </button>
          </div>
        </div>

        {/* ===================== WHERE TO STAY TAB ===================== */}
        {activeTab === 'stay' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {/* Promo Discount Banner */}
            <div className="bg-gradient-to-r from-brand-espresso via-brand-charcoal to-brand-espresso text-brand-cream rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-brand-gold/30 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center shrink-0 border border-brand-gold/30 mx-auto md:mx-0">
                  <Tag className="w-6 h-6 text-brand-gold" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-brand-gold block font-semibold mb-1">
                    Special Wedding Guest Discount
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-brand-ivory font-light">
                    Use Discount Code: <span className="font-mono font-bold text-white tracking-wider ml-1">{accommodations.discountCode}</span>
                  </h3>
                  <p className="text-brand-sand/80 text-xs sm:text-sm font-sans mt-1 max-w-xl">
                    Quote this code when making your reservation at partner properties in Lagos &amp; Abuja.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCopyCode(accommodations.discountCode)}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-gold hover:bg-brand-goldDark text-brand-espresso font-sans text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-md hover:scale-105 w-full sm:w-auto"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Hotel Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-brand-espresso">Recommended Hotels</h3>
                  <p className="text-xs sm:text-sm font-sans text-brand-muted mt-1">
                    Handpicked hotels in Lagos &amp; Abuja with special guest provisions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accommodations.hotels.map((hotel, idx) => {
                  const hotelImgs = hotel.images || (hotel.image ? [hotel.image] : []);
                  const curImgIdx = (hotelImageIndices[idx] || 0) % (hotelImgs.length || 1);
                  const currentImage = hotelImgs[curImgIdx];

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-sand/50 flex flex-col justify-between group"
                    >
                      {/* Hotel Photo Gallery Preview */}
                      {hotelImgs.length > 0 && (
                        <div className="relative aspect-[16/10] overflow-hidden bg-brand-espresso select-none">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={currentImage}
                            alt={`${hotel.name} photo`}
                            onClick={() => openHotelLightbox(idx, curImgIdx)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                          {/* Image Count Badge */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-espresso/80 backdrop-blur-md text-brand-cream text-[11px] font-sans font-medium border border-white/10">
                            <Images className="w-3.5 h-3.5 text-brand-gold" />
                            <span>{curImgIdx + 1} / {hotelImgs.length}</span>
                          </div>

                          {/* Lightbox Trigger Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openHotelLightbox(idx, curImgIdx);
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all hover:scale-105"
                            title="View Full Photos"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Chevron Controls (if multiple images) */}
                          {hotelImgs.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handlePrevHotelImage(idx, hotelImgs.length, e)}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/10 transition-all hover:scale-110"
                                aria-label="Previous photo"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleNextHotelImage(idx, hotelImgs.length, e)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/10 transition-all hover:scale-110"
                                aria-label="Next photo"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              {/* Dot Indicators */}
                              <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
                                {hotelImgs.map((_, dotIdx) => (
                                  <span
                                    key={dotIdx}
                                    className={`h-1.5 rounded-full transition-all ${
                                      dotIdx === curImgIdx ? 'w-5 bg-brand-gold' : 'w-1.5 bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-brand-cream text-brand-goldDark font-sans text-[10px] sm:text-xs font-semibold uppercase tracking-wide border border-brand-sand/40 whitespace-nowrap shrink-0">
                              <MapPin className="w-3 h-3 text-brand-goldDark shrink-0" />
                              <span>{hotel.city} &bull; {hotel.area}</span>
                            </span>
                            <span className="text-[10px] sm:text-xs font-sans text-brand-muted uppercase tracking-wider text-right truncate">
                              {hotel.type}
                            </span>
                          </div>

                          <h4 className="font-serif text-2xl text-brand-espresso group-hover:text-brand-primary transition-colors">
                            {hotel.name}
                          </h4>
                          <p className="text-brand-muted font-sans text-sm sm:text-[15px] leading-relaxed mt-2.5">
                            {hotel.description}
                          </p>

                          {/* Detailed Address & Contact Section */}
                          <div className="mt-4 pt-3.5 border-t border-brand-sand/40 space-y-2.5">
                            {hotel.address && (
                              <div className="flex items-start gap-2.5 text-xs sm:text-[13px] text-brand-espresso/85 font-sans bg-brand-cream/40 p-2.5 rounded-xl border border-brand-sand/30">
                                <MapPin className="w-4 h-4 text-brand-goldDark shrink-0 mt-0.5" />
                                <div className="leading-snug">
                                  <span className="font-semibold text-brand-espresso text-[11px] uppercase tracking-wider block text-brand-muted mb-0.5">Address</span>
                                  <span>{hotel.address}</span>
                                </div>
                              </div>
                            )}

                            {(hotel.contact || hotel.phone || hotel.whatsapp) && (
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-[13px] text-brand-espresso/85 font-sans bg-brand-cream/40 p-2.5 rounded-xl border border-brand-sand/30">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Phone className="w-4 h-4 text-brand-goldDark shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-semibold text-brand-espresso text-[11px] uppercase tracking-wider block text-brand-muted mb-0.5">Contact</span>
                                    <span className="font-medium text-brand-espresso">{hotel.contact || hotel.phone}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 ml-auto">
                                  {hotel.phone && (
                                    <a
                                      href={`tel:${hotel.phone.replace(/[^0-9+]/g, '')}`}
                                      className="p-1.5 rounded-lg bg-white hover:bg-brand-sand/50 text-brand-espresso border border-brand-sand/60 transition-colors shadow-2xs"
                                      title="Call Phone Number"
                                    >
                                      <Phone className="w-3.5 h-3.5 text-brand-goldDark" />
                                    </a>
                                  )}
                                  {hotel.whatsapp && (
                                    <a
                                      href={`https://wa.me/${hotel.whatsapp.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 transition-colors shadow-2xs"
                                      title="Chat on WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="mt-5 pt-4 border-t border-brand-sand/30 flex flex-wrap items-center justify-between gap-3">
                          {(hotel.googleMapsUrl || hotel.mapUrl) ? (
                            <a
                              href={hotel.googleMapsUrl || hotel.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-espresso hover:bg-brand-primary text-brand-cream text-xs font-sans font-medium transition-all hover:scale-[1.02] shadow-2xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-brand-gold" />
                              <span>View on Google Maps</span>
                            </a>
                          ) : <div />}

                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[11px] font-sans uppercase tracking-wider text-brand-muted">Guest Code:</span>
                            <button
                              onClick={() => handleCopyCode(hotel.discountCode || accommodations.discountCode)}
                              className="font-mono text-xs font-bold text-brand-espresso bg-brand-sand/40 hover:bg-brand-sand/70 px-2.5 py-1 rounded-lg border border-brand-sand/50 flex items-center gap-1.5 transition-colors"
                              title="Copy discount code"
                            >
                              <span>{hotel.discountCode || accommodations.discountCode}</span>
                              <Copy className="w-3 h-3 text-brand-goldDark" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Serviced Apartments & Support */}
            <div className="bg-white/80 rounded-3xl p-8 sm:p-10 border border-brand-sand/50 shadow-sm">
              <div className="max-w-3xl">
                <span className="text-xs uppercase tracking-widest font-sans font-semibold text-brand-goldDark block mb-2">
                  Prefer More Space?
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-brand-espresso mb-3">
                  Serviced Apartments &amp; Short-Stay Rentals
                </h3>
                <p className="text-brand-muted font-sans text-sm sm:text-base leading-relaxed mb-6">
                  If you are travelling with family, children, or friends, serviced apartments provide extra privacy, full kitchens, and living space. Our designated accommodation contacts in Lagos and Abuja are available to arrange bookings on your behalf.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {accommodations.apartments.map((apt, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-brand-cream/40 border border-brand-sand/30">
                      <span className="text-xs font-sans font-semibold text-brand-primary uppercase tracking-wider block mb-1">
                        {apt.city}
                      </span>
                      <h4 className="font-serif text-lg text-brand-espresso mb-1">{apt.title}</h4>
                      <p className="text-xs text-brand-muted leading-relaxed">{apt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===================== TRAVEL & FLIGHTS TAB ===================== */}
        {activeTab === 'travel' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {/* Airports & Flight Routes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Lagos Airport (Trad Wedding) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-sand/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-goldDark text-xs uppercase tracking-widest font-sans font-semibold mb-3">
                    <Plane className="w-4 h-4 text-brand-gold" />
                    <span>Traditional Wedding Flight Hub</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-brand-espresso">
                    {travel.lagosFlights.airport}
                  </h3>
                  <p className="text-brand-muted font-sans text-sm leading-relaxed mt-2 mb-6">
                    {travel.lagosFlights.notes}
                  </p>

                  <div className="space-y-3">
                    {travel.lagosFlights.routes.map((route, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-brand-cream/50 border border-brand-sand/30 gap-1 sm:gap-4 text-sm"
                      >
                        <span className="font-sans font-semibold text-brand-espresso shrink-0">
                          {route.country}
                        </span>
                        <span className="font-sans text-xs sm:text-sm text-brand-muted sm:text-right">
                          {route.airlines}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Abuja Airport & Transport (Civil Wedding) */}
              <div className="flex flex-col gap-6">
                {/* Abuja Airport */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-sand/50">
                  <div className="flex items-center gap-2 text-brand-goldDark text-xs uppercase tracking-widest font-sans font-semibold mb-3">
                    <Plane className="w-4 h-4 text-brand-gold" />
                    <span>Civil Wedding Flight Hub</span>
                  </div>
                  <h3 className="font-serif text-2xl text-brand-espresso">
                    {travel.abujaFlights.airport}
                  </h3>
                  <p className="text-brand-muted font-sans text-sm leading-relaxed mt-2">
                    {travel.abujaFlights.notes}
                  </p>
                </div>

                {/* Airport Pickup & Local Transport */}
                <div className="bg-brand-espresso text-brand-cream rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10">
                  <div className="flex items-center gap-2 text-brand-gold text-xs uppercase tracking-widest font-sans font-semibold mb-3">
                    <Car className="w-4 h-4" />
                    <span>Airport Pick-Up &amp; Local Rides</span>
                  </div>
                  <h3 className="font-serif text-2xl text-brand-ivory mb-2">
                    Need Airport or Event Transportation?
                  </h3>
                  <p className="text-brand-sand text-sm leading-relaxed mb-5">
                    {travel.transport.description}
                  </p>

                  {/* Ride App Suggestions */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                    {travel.transport.rideApps.map((app, idx) => (
                      <a
                        key={idx}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-center flex flex-col items-center justify-center gap-1 group"
                      >
                        <span className="text-sm font-sans font-semibold text-white group-hover:text-brand-gold flex items-center gap-1">
                          {app.name} <ExternalLink className="w-3 h-3" />
                        </span>
                        <span className="text-[11px] text-brand-sand/70">{app.note}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Visa Processing & Health Guidance */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-brand-sand/50">
              <div className="max-w-3xl mb-8">
                <div className="flex items-center gap-2 text-brand-goldDark text-xs uppercase tracking-widest font-sans font-semibold mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entry &amp; Documentation</span>
                </div>
                <h3 className="font-serif text-3xl text-brand-espresso mb-3">
                  {travel.visa.title}
                </h3>
                <p className="text-brand-muted font-sans text-sm sm:text-base leading-relaxed">
                  International travelers will need a valid Nigerian visa before departure. Two options are available:
                </p>
              </div>

              {/* Visa Options Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {travel.visa.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-6 border transition-all ${
                      opt.badge === 'Recommended'
                        ? 'bg-brand-cream/60 border-brand-gold/50 shadow-md ring-1 ring-brand-gold/30'
                        : 'bg-white border-brand-sand/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-brand-goldDark">
                        {opt.time}
                      </span>
                      {opt.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-primary text-white text-[10px] font-sans font-semibold uppercase tracking-wider">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-xl text-brand-espresso mb-1">{opt.title}</h4>
                    <p className="text-xs font-mono font-semibold text-brand-primary mb-3">{opt.cost}</p>
                    <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{opt.description}</p>
                  </div>
                ))}
              </div>

              {/* Travel Checklist & Health Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-sand/40">
                {/* Documentation Requirements */}
                <div>
                  <h4 className="font-serif text-lg text-brand-espresso mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-primary" />
                    <span>Travel Documentation Checklist</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-brand-muted">
                    {travel.visa.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <a
                      href={travel.visa.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-brand-primary hover:underline uppercase tracking-wider"
                    >
                      <span>Official eVisa Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Health & Safety */}
                <div>
                  <h4 className="font-serif text-lg text-brand-espresso mb-3 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-brand-primary" />
                    <span>Health &amp; Wellness Advice</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-brand-muted">
                    {travel.healthAdvice.map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <span>{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Hotel Photo Lightbox Modal */}
      <AnimatePresence>
        {lightboxHotel !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxHotel(null)}
              className="absolute inset-0"
            />

            {(() => {
              const hotel = accommodations.hotels[lightboxHotel.hotelIndex];
              const hotelImgs = hotel?.images || (hotel?.image ? [hotel.image] : []);
              const currentImg = hotelImgs[lightboxHotel.imageIndex];
              if (!hotel || !currentImg) return null;

              return (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative z-10 max-w-4xl w-full bg-brand-espresso text-brand-cream rounded-3xl overflow-hidden shadow-2xl border border-brand-gold/30 flex flex-col max-h-[92vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-black/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-sans uppercase tracking-widest text-brand-gold font-semibold">
                          {hotel.city} &bull; {hotel.area}
                        </span>
                        <span className="text-white/40">&bull;</span>
                        <span className="text-xs text-white/70">{hotel.type}</span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl text-white mt-0.5">{hotel.name}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-brand-gold">
                        Photo {lightboxHotel.imageIndex + 1} of {hotelImgs.length}
                      </span>
                      <button
                        onClick={() => setLightboxHotel(null)}
                        className="p-2 rounded-full hover:bg-white/10 text-brand-cream transition-colors"
                        aria-label="Close photo preview"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Photo Display */}
                  <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] max-h-[68vh] overflow-hidden">
                    <img
                      src={currentImg}
                      alt={hotel.name}
                      className="max-h-[68vh] w-auto max-w-full object-contain mx-auto"
                    />

                    {hotelImgs.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevLightbox}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all border border-white/10"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleNextLightbox}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all border border-white/10"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 max-w-xl">
                      <p className="text-brand-sand/90 font-sans">{hotel.description}</p>
                      {hotel.address && (
                        <p className="text-white/70 font-sans text-[11px] flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-brand-gold shrink-0" />
                          <span>{hotel.address}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0 ml-auto">
                      {(hotel.googleMapsUrl || hotel.mapUrl) && (
                        <a
                          href={hotel.googleMapsUrl || hotel.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-brand-gold text-xs flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10"
                        >
                          <ExternalLink className="w-3 h-3 text-brand-gold" />
                          <span>Maps</span>
                        </a>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-brand-muted uppercase tracking-wider text-[11px]">Guest Code:</span>
                        <button
                          onClick={() => handleCopyCode(hotel.discountCode || accommodations.discountCode)}
                          className="font-mono font-bold text-white bg-brand-gold/20 border border-brand-gold/40 px-3 py-1 rounded-full hover:bg-brand-gold hover:text-brand-espresso transition-colors flex items-center gap-1.5"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{hotel.discountCode || accommodations.discountCode}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
