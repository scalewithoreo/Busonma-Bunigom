import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Check, Copy, CreditCard, X, Heart, 
  CheckCircle2, ShieldCheck, Clock
} from 'lucide-react';
import { INITIAL_WISHLIST_ITEMS } from '../data/wishlistData';
import { WishlistItem, GiftPledge } from '../types';
import { getStoredGiftPledges, saveGiftPledge, saveReminder, getActiveReservations, getStoredWishlistItems } from '../utils/storage';
import { sendReservationConfirmationEmail, sendGiftNotificationEmail } from '../utils/email';

interface GiftWishlistProps {
  onNotify: (title: string, message?: string) => void;
}

export const GiftWishlist: FC<GiftWishlistProps> = ({ onNotify }) => {
  const [items, setItems] = useState<WishlistItem[]>(INITIAL_WISHLIST_ITEMS);

  const [activeItem, setActiveItem] = useState<WishlistItem | null>(null);
  
  // Checkout Modal State
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [cashGiftAmount, setCashGiftAmount] = useState<number>(0);
  const [customCashAmount, setCustomCashAmount] = useState<string>('');
  const [giverName, setGiverName] = useState('');
  const [giverEmail, setGiverEmail] = useState('');
  const [giverRelation, setGiverRelation] = useState('');
  const [giverNote, setGiverNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justGifted, setJustGifted] = useState<GiftPledge | null>(null);

  // Reservation Modal State
  const [reminderItem, setReminderItem] = useState<WishlistItem | null>(null);
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderName, setReminderName] = useState('');
  const [reminderRelation, setReminderRelation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  // Isolate scroll so background page cannot scroll when any modal is open
  const isAnyModalOpen = activeItem !== null || reminderItem !== null;
  useEffect(() => {
    if (isAnyModalOpen) {
      const lenis = (window as any).lenis;
      if (lenis) lenis.stop();

      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        if (lenis) lenis.start();
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isAnyModalOpen]);

  // Bank account details for gifts
  const bankAccounts = [
    {
      accountName: 'Oreoluwa Okunade',
      bankName: 'Zenith Bank',
      accountNumber: '2209775057',
    },
    {
      accountName: 'Oluwadara Alao',
      bankName: 'Providus Bank',
      accountNumber: '6506945948',
    }
  ];

  useEffect(() => {
    // Load any existing pledges and active reservations from Supabase
    const loadData = async () => {
      const [pledges, activeReservations, dbItems] = await Promise.all([
        getStoredGiftPledges(),
        getActiveReservations(),
        getStoredWishlistItems()
      ]);

      // Deduplicate: if an item with the same name exists in dbItems, use the dbItem version
      const baseItems = dbItems.length === 0 
        ? INITIAL_WISHLIST_ITEMS 
        : [
            ...dbItems,
            ...INITIAL_WISHLIST_ITEMS.filter(init => !dbItems.some(db => db.name.toLowerCase() === init.name.toLowerCase()))
          ];

      setItems(
        baseItems.map((item) => {
          const pledgeMatch = pledges.find((p) => p.itemId === item.id || p.itemName.toLowerCase() === item.name.toLowerCase());
          const reservationMatch = activeReservations.find((r) => r.itemId === item.id || r.itemName.toLowerCase() === item.name.toLowerCase());

          return {
            ...item,
            isFunded: item.price === 0 ? false : !!pledgeMatch,
            fundedBy: item.price === 0 ? undefined : pledgeMatch?.giverName,
            isReserved: item.price === 0 ? false : (!pledgeMatch && !!reservationMatch),
            reservedUntil: item.price === 0 ? undefined : reservationMatch?.expiresAt,
            reservedByEmail: item.price === 0 ? undefined : reservationMatch?.email,
            reservedByName: item.price === 0 ? undefined : reservationMatch?.reservedByName,
            isAnonymousReservation: item.price === 0 ? undefined : reservationMatch?.isAnonymous
          };
        })
      );
    };
    loadData();
  }, []);

  const formatShortDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onNotify('Copied to Clipboard', `${label} has been copied.`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSetReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderItem || !reminderEmail.trim() || !reminderName.trim()) return;

    setIsSubmitting(true);
    try {
      const saved = await saveReminder({
        itemId: reminderItem.id,
        itemName: reminderItem.name,
        itemPrice: reminderItem.formattedPrice,
        email: reminderEmail.trim(),
        guestName: reminderName.trim(),
        relation: reminderRelation || undefined,
        isAnonymous: isAnonymous,
      });

      // Update local item status so it instantly turns to Reserved
      setItems((prev) =>
        prev.map((it) =>
          it.id === reminderItem.id
            ? {
                ...it,
                isReserved: true,
                reservedUntil: saved.expiresAt,
                reservedByEmail: reminderEmail.trim(),
                reservedByName: reminderName.trim(),
                isAnonymousReservation: isAnonymous,
              }
            : it
        )
      );

      setReminderSaved(true);
      
      // Send luxury confirmation email with bank details directly to guest
      sendReservationConfirmationEmail({
        guestName: reminderName.trim(),
        guestEmail: reminderEmail.trim(),
        itemName: reminderItem.name,
        itemPrice: reminderItem.formattedPrice,
        expiresAt: saved.expiresAt,
      }).catch((err) => console.error('Error sending confirmation email:', err));

      onNotify('Gift Saved With Love 💛', `We have set this aside for you! A confirmation with bank details has been sent to ${reminderEmail.trim()}.`);
    } catch (e) {
      console.error(e);
      onNotify('Error', 'Failed to reserve item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeReminderModal = () => {
    setReminderItem(null);
    setReminderEmail('');
    setReminderName('');
    setReminderRelation('');
    setIsAnonymous(false);
    setReminderSaved(false);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (!giverName.trim()) {
      onNotify('Error', 'Please enter your name so the couple knows who to thank!');
      return;
    }

    setIsSubmitting(true);

    try {
      const isCashGift = activeItem.price === 0;
      const finalAmount = isCashGift 
        ? (cashGiftAmount === -1 ? parseInt(customCashAmount.replace(/\D/g, '') || '0', 10) : cashGiftAmount)
        : activeItem.price * purchaseQuantity;

      if (isCashGift && finalAmount < 1000) {
        onNotify('Error', 'Please enter a valid cash gift amount (Minimum ₦1,000)');
        setIsSubmitting(false);
        return;
      }

      const pledge = await saveGiftPledge({
        itemId: activeItem.id,
        itemName: isCashGift ? 'Cash Gift' : (purchaseQuantity > 1 ? `${activeItem.name} (Qty: ${purchaseQuantity})` : activeItem.name),
        amount: finalAmount,
        giverName: giverName.trim(),
        giverEmail: giverEmail.trim() || undefined,
        giverRelation: giverRelation || undefined,
        giverNote: giverNote.trim() || undefined,
      });

      // Update item in state
      setItems((prev) =>
        prev.map((it) =>
          it.id === activeItem.id
            ? { ...it, isFunded: it.price === 0 ? false : true, fundedBy: it.price === 0 ? undefined : giverName.trim() }
            : it
        )
      );

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#c5a880', '#A80A4E', '#334a33', '#ffd700'],
        });
      } catch (err) {}

      // Notify the couple via email (fire-and-forget)
      sendGiftNotificationEmail({
        giverName: giverName.trim(),
        giverEmail: giverEmail.trim() || undefined,
        giverRelation: giverRelation || undefined,
        giverNote: giverNote.trim() || undefined,
        itemName: isCashGift ? 'Cash Gift' : activeItem.name,
        amount: finalAmount,
      }).catch((err) => console.error('Failed to send gift notification email:', err));

      setIsSubmitting(false);
      setJustGifted(pledge);
      onNotify('Gift Recorded!', `Thank you ${giverName.trim()} for blessing Oreoluwa & Oluwadara!`);
    } catch (e) {
      console.error(e);
      onNotify('Error', 'Failed to save pledge. Please try again.');
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setActiveItem(null);
    setJustGifted(null);
    setGiverName('');
    setGiverEmail('');
    setGiverRelation('');
    setGiverNote('');
    setCopiedField(null);
  };

  return (
    <section id="wishlist" className="py-24 sm:py-32 px-2 sm:px-6 bg-brand-ivory relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header with Couple Portrait */}
        <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-16 mb-16 sm:mb-20 bg-white/50 rounded-3xl p-6 sm:p-10 border border-brand-sand/50 shadow-sm backdrop-blur-sm">
          {/* Couple Image Focus */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full md:w-1/3 aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border-4 border-white relative group shrink-0"
          >
            <div className="absolute inset-0 bg-brand-espresso/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
            <img loading="lazy" decoding="async" 
              src="/assets/0V3A8999.jpg" 
              alt="Oreoluwa & Oluwadara - Our forever starts now"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>

          {/* Content & Category Tabs */}
          <div className="text-center md:text-left flex-1">
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mb-3"
            >
              Curated Wedding Registry
            </motion.p>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-espresso font-normal leading-tight"
            >
              Wishlist Items
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-sans text-brand-muted text-[16px] sm:text-lg mt-4 leading-relaxed max-w-xl"
            >
              To help us start our new home together, we have handpicked items we need most. You can select any item below to pay for it and bless our union directly.
            </motion.p>


          </div>
        </div>

        {/* 14 Items Grid - Borderless */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="min-w-0 bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-brand-cream">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {!item.isFunded && item.isReserved && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-espresso/85 backdrop-blur-xs text-brand-cream text-[10px] font-sans font-semibold tracking-wider flex items-center gap-1 shadow-sm">
                    <Clock className="w-3 h-3 text-brand-gold" />
                    Reserved
                  </span>
                )}

                {item.isFunded && (
                  <div className="absolute inset-0 bg-brand-cream/50 backdrop-blur-[3px] flex items-center justify-center p-2 sm:p-4 z-10">
                    <div className="bg-white/95 px-2 py-3 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl shadow-xl border border-brand-sand flex flex-col items-center w-full max-w-[90%] sm:max-w-[200px] transform transition-transform hover:scale-105">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-gold/15 flex items-center justify-center mb-1.5 sm:mb-2 shrink-0">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-brand-goldDark fill-brand-goldDark" />
                      </div>
                      <span className="font-serif italic text-sm sm:text-lg text-brand-espresso mb-0.5 text-center leading-tight">Gifted with love</span>
                      <span className="text-[8px] sm:text-[10px] font-sans font-bold uppercase tracking-widest text-brand-muted text-center line-clamp-1 w-full mt-1">
                        By {item.fundedBy || 'Cherished Guest'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col">
                <span className="text-[8px] sm:text-[10px] uppercase tracking-widest font-sans font-semibold text-brand-goldDark mb-1">
                  {item.category}
                </span>
                <h3 className="font-serif text-sm sm:text-lg text-brand-espresso font-normal leading-snug line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-brand-muted text-[10px] sm:text-xs font-sans mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed flex-1">
                  {item.description}
                </p>

                {/* Price & Quantity */}
                {item.price > 0 && (
                  <div className="mt-2 sm:mt-4 mb-2 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="font-mono text-base sm:text-2xl font-bold text-brand-espresso">
                      {item.formattedPrice}
                    </span>
                    {item.quantity > 1 && (
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-brand-gold/40 text-brand-espresso text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider self-start sm:self-auto">
                        Qty: {item.quantity} Needed
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 sm:space-y-2.5 border-t border-brand-sand/40 pt-2.5 sm:pt-4">
                  <button
                    onClick={() => {
                      setActiveItem(item);
                      setPurchaseQuantity(1);
                    }}
                    className={`w-full py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-sans font-bold tracking-widest uppercase transition-all duration-200 shadow-sm flex items-center justify-center gap-1 sm:gap-2 ${
                      item.isFunded
                        ? 'bg-brand-sand/50 text-brand-muted hover:bg-brand-sand'
                        : 'bg-brand-espresso hover:bg-brand-gold hover:text-brand-espresso text-brand-cream'
                    }`}
                  >
                    <CreditCard className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span>{item.price === 0 ? 'Give' : (item.isFunded ? 'Gift Again' : 'Pay for Item')}</span>
                  </button>

                  {!item.isFunded && (
                    item.isReserved ? (
                      <div className="w-full relative overflow-hidden rounded-xl border border-brand-espresso/10 bg-gradient-to-r from-brand-sand/40 to-brand-sand/10 p-2 sm:p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10 gap-1 sm:gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-brand-sand/60">
                              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-goldDark fill-brand-goldDark" />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-[9px] sm:text-[10px] font-sans font-bold tracking-wider text-brand-goldDark uppercase leading-tight">
                                Reserved
                              </span>
                              <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-brand-espresso leading-tight mt-0.5 truncate w-full sm:max-w-[150px]" title={item.isAnonymousReservation ? 'a guest' : (item.reservedByName || 'a guest')}>
                                By {item.isAnonymousReservation ? 'a guest' : (item.reservedByName || 'a guest')}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 mt-1 sm:mt-0">
                            <span className="text-[8px] sm:text-[9px] uppercase font-sans font-bold tracking-wider text-brand-muted">Held till</span>
                            <span className="text-[10px] sm:text-xs font-sans font-bold text-brand-espresso mt-0 sm:mt-0.5 whitespace-nowrap ml-1 sm:ml-0">
                              {formatShortDate(item.reservedUntil)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      item.price !== 0 && (
                        <button
                          onClick={() => setReminderItem(item)}
                          className="w-full py-1.5 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-sans font-semibold tracking-wider transition-all duration-200 border border-brand-sand bg-white text-brand-espresso hover:border-brand-gold/60 hover:bg-brand-cream/30 flex items-center justify-center gap-1 sm:gap-1.5"
                        >
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-goldDark" />
                          <span className="uppercase tracking-widest text-[9px] sm:text-[11px]">Reserve</span>
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Checkout / Pay Immediately Modal */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onClick={closeModal}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeModal();
            }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              data-lenis-prevent
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-cream border border-brand-gold/40 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto overscroll-contain"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-brand-sand bg-white flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-goldDark">
                    Gift Checkout & Direct Payment
                  </span>
                  <h3 className="font-serif text-2xl text-brand-espresso">
                    Bless the Couple With This Gift
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-brand-sand/50 text-brand-espresso transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div data-lenis-prevent className="p-6 overflow-y-auto overscroll-contain space-y-6">
                {justGifted ? (
                  /* Success Confirmation Screen */
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="font-serif text-3xl text-brand-espresso">
                      Thank You, {justGifted.giverName}!
                    </h4>
                    <p className="font-serif italic text-lg text-brand-goldDark">
                      Your gift of <span className="font-semibold">{justGifted.itemName}</span> ({(justGifted.amount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}) has been recorded with love.
                    </p>
                    <p className="text-brand-muted text-xs sm:text-[17px] font-sans max-w-md mx-auto leading-relaxed">
                      Oreoluwa & Oluwadara deeply appreciate your kindness, generosity, and prayers as they build their new home together.
                    </p>
                    <button
                      onClick={closeModal}
                      className="mt-6 px-8 py-3 rounded-full bg-brand-espresso text-brand-cream text-xs font-sans font-semibold tracking-widest uppercase hover:bg-brand-charcoal"
                    >
                      Close & Return to Wishlist
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Item Snapshot with Quantity Selector */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white border border-brand-sand">
                      <img loading="lazy" decoding="async"
                        src={activeItem.image}
                        alt={activeItem.name}
                        className="w-24 h-24 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0 w-full">
                        <span className="text-[10px] uppercase font-sans font-bold text-brand-goldDark">
                          {activeItem.category} • {activeItem.quantity > 1 ? `Target Qty: ${activeItem.quantity}` : '1 Needed'}
                        </span>
                        <h4 className="font-serif text-lg text-brand-espresso font-semibold line-clamp-2">
                          {activeItem.name}
                        </h4>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-3">
                          {activeItem.price === 0 ? (
                            <div className="w-full flex flex-col gap-3">
                              <span className="text-[10px] uppercase text-brand-muted font-sans font-semibold">Select Amount:</span>
                              <div className="grid grid-cols-3 gap-2">
                                {[10000, 20000, 50000, 100000, 500000].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setCashGiftAmount(amt)}
                                    className={`py-2 px-1 rounded-lg text-xs font-sans font-semibold transition-colors border ${
                                      cashGiftAmount === amt
                                        ? 'bg-brand-espresso text-brand-cream border-brand-espresso'
                                        : 'bg-white text-brand-espresso border-brand-sand/60 hover:border-brand-gold'
                                    }`}
                                  >
                                    ₦{(amt / 1000).toFixed(0)}k
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setCashGiftAmount(-1)}
                                  className={`py-2 px-1 rounded-lg text-xs font-sans font-semibold transition-colors border ${
                                    cashGiftAmount === -1
                                      ? 'bg-brand-espresso text-brand-cream border-brand-espresso'
                                      : 'bg-white text-brand-espresso border-brand-sand/60 hover:border-brand-gold'
                                  }`}
                                >
                                  Custom
                                </button>
                              </div>
                              {cashGiftAmount === -1 && (
                                <div className="mt-2">
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-lg text-brand-espresso">₦</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      autoFocus
                                      value={customCashAmount}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCustomCashAmount(val ? parseInt(val, 10).toLocaleString('en-NG') : '');
                                      }}
                                      placeholder="e.g. 25,000"
                                      className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-brand-gold/50 rounded-xl font-mono text-lg font-semibold text-brand-espresso focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 placeholder:text-brand-muted/40 placeholder:font-normal"
                                    />
                                  </div>
                                  <p className="text-[10px] text-brand-muted font-sans mt-1.5 pl-1">Minimum: ₦1,000</p>
                                </div>
                              )}
                              <div className="flex flex-col items-end mt-2">
                                <span className="text-[10px] uppercase text-brand-muted font-sans font-semibold">Total Gift:</span>
                                <span className="font-mono text-xl font-bold text-brand-espresso">
                                  {(cashGiftAmount === -1 ? parseInt(customCashAmount.replace(/\D/g, '') || '0', 10) : cashGiftAmount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 bg-brand-sand/30 rounded-lg p-1.5 w-max">
                                <button 
                                  type="button"
                                  onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                                  className="w-11 h-11 flex items-center justify-center rounded-md bg-white text-brand-espresso shadow-sm hover:bg-brand-sand transition-colors disabled:opacity-50 text-xl"
                                  disabled={purchaseQuantity <= 1}
                                >
                                  -
                                </button>
                                <span className="font-sans font-semibold text-sm w-4 text-center">{purchaseQuantity}</span>
                                <button 
                                  type="button"
                                  onClick={() => setPurchaseQuantity(Math.min(activeItem.quantity, purchaseQuantity + 1))}
                                  className="w-11 h-11 flex items-center justify-center rounded-md bg-white text-brand-espresso shadow-sm hover:bg-brand-sand transition-colors disabled:opacity-50 text-xl"
                                  disabled={purchaseQuantity >= activeItem.quantity}
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex flex-col items-start sm:items-end">
                                <span className="text-[10px] uppercase text-brand-muted font-sans font-semibold">Total Cost:</span>
                                <span className="font-mono text-xl font-bold text-brand-espresso">
                                  {(activeItem.price * purchaseQuantity).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Bank Payment Details Card - Borderless */}
                    <div className="bg-brand-cream/60 text-brand-espresso rounded-3xl p-5 sm:p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-brand-goldDark" />
                          <span className="text-xs uppercase tracking-wider font-sans font-bold text-brand-espresso">
                            Instant Bank Transfer
                          </span>
                        </div>
                        <span className="text-[10px] font-sans font-semibold px-2.5 py-0.5 rounded-full bg-white text-brand-goldDark shadow-sm">
                          Zero Fees
                        </span>
                      </div>

                      <div className="space-y-6">
                        {bankAccounts.map((account, index) => (
                          <div key={index} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[17px] font-sans px-2">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-brand-muted block font-semibold mb-0.5">
                                  Bank Name
                                </span>
                                <span className="text-brand-espresso font-medium">
                                  {account.bankName}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-brand-muted block font-semibold mb-0.5">
                                  Account Name
                                </span>
                                <span className="text-brand-espresso font-medium">
                                  {account.accountName}
                                </span>
                              </div>
                            </div>
                            
                            {/* Account Number with Quick Copy */}
                            <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-brand-muted block font-semibold mb-0.5">
                                  Account Number
                                </span>
                                <span className="font-mono text-xl text-brand-espresso font-bold tracking-wider">
                                  {account.accountNumber}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(account.accountNumber, `Account Number (${account.bankName})`)}
                                className="px-4 py-2 rounded-xl bg-brand-sand/30 text-brand-espresso text-xs font-sans font-semibold tracking-wider uppercase flex items-center gap-1.5 hover:bg-brand-gold hover:text-brand-cream transition-colors"
                              >
                                {copiedField === `Account Number (${account.bankName})` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Transfer Reference Note */}
                      <div className="bg-white p-4 rounded-2xl flex items-center justify-between text-xs font-sans shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] mt-2">
                        <div>
                          <span className="text-brand-muted block font-semibold mb-0.5">Transfer Narration / Remark:</span>
                          <span className="font-semibold text-brand-espresso">
                            Gift: {activeItem.name.substring(0, 22)} {purchaseQuantity > 1 ? `(x${purchaseQuantity})` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(`Gift: ${activeItem.name} ${purchaseQuantity > 1 ? `(x${purchaseQuantity})` : ''}`, 'Narration')}
                          className="text-brand-goldDark font-semibold hover:underline px-2"
                        >
                          {copiedField === 'Narration' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Confirm & Notify Couple */}
                    <form onSubmit={handleConfirmPayment} className="space-y-4 pt-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-goldDark" />
                        <span className="text-xs uppercase tracking-wider font-sans font-bold text-brand-espresso">
                          Confirm Your Gift After Transfer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-sans font-semibold text-brand-espresso mb-1">
                            Your Full Name <span className="text-brand-goldDark">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Auntie Bolanle"
                            value={giverName}
                            onChange={(e) => setGiverName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-brand-sand text-[17px] font-sans text-brand-espresso outline-none focus:border-brand-gold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-sans font-semibold text-brand-espresso mb-1">
                            Your Email <span className="text-brand-goldDark">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. bolanle@example.com"
                            value={giverEmail}
                            onChange={(e) => setGiverEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-brand-sand text-[17px] font-sans text-brand-espresso outline-none focus:border-brand-gold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-sans font-semibold text-brand-espresso mb-1">
                          Relationship with Couple <span className="text-brand-goldDark">*</span>
                        </label>
                        <select
                          required
                          value={giverRelation}
                          onChange={(e) => setGiverRelation(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-brand-sand text-[17px] font-sans text-brand-espresso outline-none focus:border-brand-gold appearance-none cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a8a29e\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                        >
                          <option value="" disabled>Select your connection</option>
                          <option value="groom">The Groom</option>
                          <option value="bride">The Bride</option>
                          <option value="groomsfamily">Groom's Family</option>
                          <option value="bridefamily">Bride's Family</option>
                          <option value="both">Both (Groom & Bride)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-sans font-semibold text-brand-espresso mb-1">
                          Message / Blessing for the Couple <span className="text-brand-muted font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Wishing you marital bliss and unending joy in your new home!"
                          value={giverNote}
                          onChange={(e) => setGiverNote(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-brand-sand text-[17px] font-sans text-brand-espresso outline-none focus:border-brand-gold"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-full bg-brand-gold hover:bg-brand-goldDark text-brand-espresso hover:text-white text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>Recording Gift...</span>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 fill-current" />
                            <span>I Have Transferred & Paid For This Item</span>
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder Modal */}
      <AnimatePresence>
        {reminderItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeReminderModal();
            }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
            onClick={closeReminderModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              data-lenis-prevent
              onClick={(e) => e.stopPropagation()}
              className="bg-brand-cream rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-brand-gold/30 max-h-[92vh] flex flex-col overflow-hidden my-auto overscroll-contain"
            >
              {reminderSaved ? (
                /* Success State */
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-16 h-16 rounded-full bg-brand-gold/20 mx-auto flex items-center justify-center"
                  >
                    <Heart className="w-8 h-8 text-brand-goldDark fill-brand-goldDark" />
                  </motion.div>
                  <h4 className="font-serif text-2xl text-brand-espresso">Saved With Love</h4>
                  <p className="text-brand-muted text-[15px] font-sans leading-relaxed">
                    Thank you so much! We’ve set aside <strong>{reminderItem.name}</strong> for you.
                  </p>
                  <div className="p-4 rounded-2xl bg-white border border-brand-sand text-left text-xs font-sans space-y-2.5 text-brand-espresso">
                    <div className="flex items-center justify-between">
                      <span className="text-brand-muted">Held for you until:</span>
                      <span className="font-semibold text-brand-espresso">
                        {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-muted">Gentle reminder note:</span>
                      <span className="font-semibold text-brand-goldDark">
                        {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-muted">Email address:</span>
                      <span className="font-semibold text-brand-espresso truncate max-w-[180px]">{reminderEmail}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-brand-muted font-sans italic">
                    Oreoluwa & Oluwadara deeply appreciate your love and prayers!
                  </p>
                  <button
                    onClick={closeReminderModal}
                    className="mt-2 px-6 py-3.5 rounded-full bg-brand-espresso text-brand-cream text-xs font-sans font-semibold tracking-widest uppercase hover:bg-brand-charcoal transition-colors w-full"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Form State */
                <div data-lenis-prevent className="overflow-y-auto overscroll-contain pr-1 -mr-1">
                  <form onSubmit={handleSetReminder} className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-brand-goldDark fill-brand-goldDark/30" />
                        </div>
                        <div>
                          <h4 className="font-serif text-xl text-brand-espresso">Reserve</h4>
                          <p className="text-xs text-brand-muted font-sans">We'll gladly set this aside for you</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={closeReminderModal}
                        className="p-2 rounded-full hover:bg-brand-sand/50 text-brand-muted transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Item preview */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-brand-sand">
                      <img loading="lazy" decoding="async"
                        src={reminderItem.image}
                        alt={reminderItem.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-[17px] text-brand-espresso font-medium truncate">{reminderItem.name}</p>
                        <p className="font-mono text-lg font-bold text-brand-goldDark">
                          {reminderItem.price === 0 ? null : reminderItem.formattedPrice}
                        </p>
                      </div>
                    </div>

                    {/* Gracious Explainer */}
                    <div className="p-4 rounded-2xl bg-brand-cream/80 border border-brand-sand text-xs font-sans text-brand-espresso space-y-2.5 leading-relaxed">
                      <p className="font-serif text-[15px] text-brand-espresso font-normal flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-brand-goldDark fill-brand-goldDark" />
                        <span>Thank you so much for thinking of us!</span>
                      </p>
                      <ul className="space-y-2 text-brand-muted text-[13px]">
                        <li className="flex items-start gap-2">
                          <span className="text-brand-goldDark font-bold mt-0.5">•</span>
                          <span>
                            <strong className="text-brand-espresso font-semibold">Take your time:</strong> We’ll gladly save this gift for you for 7 days (until{' '}
                            <span className="font-medium text-brand-espresso underline underline-offset-2">
                              {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            ) so nobody else selects it.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-goldDark font-bold mt-0.5">•</span>
                          <span>
                            <strong className="text-brand-espresso font-semibold">Gentle reminder:</strong> We’ll send a friendly email with the couple’s account details on{' '}
                            <span className="font-medium text-brand-espresso underline underline-offset-2">
                              {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            , just in case it slips your mind.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-goldDark font-bold mt-0.5">•</span>
                          <span>
                            <strong className="text-brand-espresso font-semibold">No pressure at all:</strong> If you change your mind or prefer another gift, it simply returns to the wishlist after a week for other guests.
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-1.5">
                          Your Full Name <span className="text-brand-goldDark">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Adewale"
                          value={reminderName}
                          onChange={(e) => setReminderName(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all"
                        />
                        <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 rounded border-brand-sand text-brand-goldDark focus:ring-brand-gold/30 accent-brand-goldDark cursor-pointer"
                          />
                          <span className="text-xs font-sans text-brand-muted group-hover:text-brand-espresso transition-colors">
                            Reserve anonymously <span className="text-[11px] text-brand-muted/70">(hide my name from the public registry)</span>
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-1.5">
                          Where should we send your reminder? <span className="text-brand-goldDark">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. adewale@example.com"
                          value={reminderEmail}
                          onChange={(e) => setReminderEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all"
                        />
                        <span className="text-[11px] text-brand-muted font-sans mt-1.5 block">
                          We'll only use this to send your reminder note with the couple's transfer details.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-1.5">
                          Relationship with Couple <span className="text-brand-goldDark">*</span>
                        </label>
                        <select
                          required
                          value={reminderRelation}
                          onChange={(e) => setReminderRelation(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all appearance-none cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a8a29e\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                        >
                          <option value="" disabled>Select your connection</option>
                          <option value="groom">The Groom</option>
                          <option value="bride">The Bride</option>
                          <option value="groomsfamily">Groom's Family</option>
                          <option value="bridefamily">Bride's Family</option>
                          <option value="both">Both (Groom & Bride)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-full bg-brand-gold hover:bg-brand-goldDark text-brand-espresso hover:text-white text-xs font-sans font-bold tracking-widest uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      <span>{isSubmitting ? 'Reserving...' : 'Reserve'}</span>
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
