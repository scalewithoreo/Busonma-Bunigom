import { useState, useEffect, useRef, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Send, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { saveRsvp, getUserActiveRsvp, verifyInviteCode, markCodeAsUsed } from '../utils/storage';
import { RsvpSubmission } from '../types';

interface RsvpFormProps {
  onNotify: (title: string, message?: string) => void;
}

export const RsvpForm: FC<RsvpFormProps> = ({ onNotify }) => {
  const [passcode, setPasscode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [attendance, setAttendance] = useState<'yes' | 'no' | ''>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState<RsvpSubmission | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    // Check if user already submitted an RSVP in this session/browser
    const existing = getUserActiveRsvp();
    if (existing) {
      setSubmittedData(existing);
      setFirstName(existing.firstName || '');
      setLastName(existing.lastName || '');
      setEmail(existing.email || '');
      setAttendance(existing.attendance);
      setMessage(existing.message || '');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter your first and last name.');
      return;
    }

    if (!passcode.trim() || passcode.trim().length !== 5) {
      setErrorMessage('Please enter your valid 5-digit invite code.');
      return;
    }

    if (!attendance) {
      setErrorMessage('Please select whether you will attend.');
      return;
    }

    setIsSubmitting(true);

    // 1. Verify the invite code in Supabase
    const inviteCodeObj = await verifyInviteCode(passcode.trim());
    if (!inviteCodeObj) {
      setErrorMessage('Invalid or already used invite code. Please check your invitation or contact the couple.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 2. Save the RSVP
      const saved = await saveRsvp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        attendance: attendance as 'yes' | 'no',
        message: message.trim() || undefined,
      });

      // 3. Mark the invite code as used
      await markCodeAsUsed(passcode.trim(), `${firstName.trim()} ${lastName.trim()}`);

      setSubmittedData(saved);
      setIsSubmitting(false);

      if (attendance === 'yes') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c5a880', '#A80A4E', '#334a33'],
        });
      }
      onNotify('RSVP Received', 'Thank you for responding!');

      // 4. Trigger Webhook and Email securely via Backend API
      const roleLabels: Record<string, string> = {
        'master': 'Master',
        'ore': 'Ore',
        'dara': 'Dara',
        'custom1964': "Ore's Dad",
        'groomsfamily': "Ore's Mum",
        'bridesfamily': "Dara's Mum"
      };
      const creatorLabel = roleLabels[inviteCodeObj.created_by || 'master'] || 'Unknown';

      fetch('/api/submit-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          attendance: attendance === 'yes' ? 'Attending' : 'Declined',
          message: message.trim() || undefined,
          code: passcode.trim(),
          creator: creatorLabel,
          websiteUrl: window.location.origin
        })
      }).catch(err => console.error('Backend tasks failed:', err));

    } catch (e) {
      console.error(e);
      onNotify('Error', 'Failed to save RSVP. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <section id="rsvp" className="py-24 sm:py-32 px-4 sm:px-6 bg-brand-ivory relative">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 flex flex-col items-center">
          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden mb-8 shadow-lg relative border-4 border-white">
            <img loading="lazy" decoding="async" src="/assets/0V3A8979.jpg" alt="Oreoluwa & Oluwadara" className="w-full h-full object-cover object-[center_30%]" />
            <div className="absolute inset-0 bg-brand-espresso/10"></div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mb-3"
          >
            Join Our Celebration
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl text-brand-espresso font-normal"
          >
            RSVP
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-serif italic text-2xl sm:text-3xl text-brand-goldDark mt-2"
          >
            Confirm Your Attendance
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 inline-block border-t border-brand-gold/30 pt-4"
          >
            <p className="font-sans text-brand-muted text-[17px] sm:text-lg">
              Kindly RSVP by <span className="font-semibold text-brand-espresso">October 31st, 2026</span>
            </p>
          </motion.div>
        </div>

        {/* Form or Submitted Confirmation State */}
        <AnimatePresence mode="wait">
          {submittedData ? (
            /* Success Card */
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-cream/80 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-brand-gold/40 shadow-xl text-center"
            >
              {/* Animated icon */}
              <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-brand-gold/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-brand-gold/50"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.4, delay: 0.4, ease: "easeInOut" }}
                />
                <motion.div
                  className="w-14 h-14 rounded-full bg-brand-gold/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                >
                  <motion.span
                    className="text-3xl"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  >
                    💍
                  </motion.span>
                </motion.div>
              </div>

              <h3 className="font-serif text-3xl sm:text-4xl text-brand-espresso font-normal">
                {submittedData.attendance === 'yes' ? 'We Can’t Wait to See You!' : 'Thank You For Letting Us Know'}
              </h3>

              <p className="font-serif italic text-xl text-brand-goldDark mt-2">
                {submittedData.firstName} {submittedData.lastName}
              </p>

              <div className="my-6 p-6 rounded-2xl bg-white/70 border border-brand-sand text-left font-sans text-[17px] space-y-2 max-w-md mx-auto">
                <div className="flex justify-between py-1 border-b border-brand-sand/40">
                  <span className="text-brand-muted">Status:</span>
                  <span className="font-semibold text-brand-espresso">
                    {submittedData.attendance === 'yes' ? 'Attending 🎉' : 'Regretfully Declined'}
                  </span>
                </div>
                {submittedData.email && (
                  <div className="flex justify-between py-1 border-b border-brand-sand/40">
                    <span className="text-brand-muted">Email:</span>
                    <span className="text-brand-espresso">{submittedData.email}</span>
                  </div>
                )}
                {submittedData.message && (
                  <div className="pt-2">
                    <span className="text-brand-muted text-xs block">Your Note:</span>
                    <p className="italic text-brand-espresso mt-1">"{submittedData.message}"</p>
                  </div>
                )}
              </div>

              {/* Note confirming response is finalized */}
              <div className="mt-8 pt-4 border-t border-brand-sand/40 text-center">
                <p className="text-xs font-sans text-brand-muted italic">
                  Your response has been saved. If you need to make any changes, please reach out to the couple directly.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Interactive RSVP Form */
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="bg-brand-cream/80 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-xl space-y-8"
            >

              {/* 5-Digit Invite Code */}
              <div className="p-5 rounded-2xl bg-white border border-brand-gold/30 shadow-sm">
                <label htmlFor="passcode" className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-2">
                  5-Digit Invite Code <span className="text-brand-goldDark">*</span>
                </label>
                <div className="relative">
                  <input
                    id="passcode"
                    type="text"
                    maxLength={5}
                    required
                    placeholder="e.g. 74921"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.trim().toUpperCase())}
                    className="w-full px-4 py-3.5 pl-12 rounded-xl bg-brand-cream/30 border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-mono text-xl tracking-[0.25em] font-bold uppercase transition-all"
                  />
                  <KeyRound className="w-5 h-5 text-brand-goldDark absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-brand-muted mt-2 font-sans">
                  Please enter the unique 5-digit passcode provided with your invitation.
                </p>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-2">
                    First Name <span className="text-brand-goldDark">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    placeholder="e.g. Adewale"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-2">
                    Last Name <span className="text-brand-goldDark">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    placeholder="e.g. Bakare"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-2">
                  Email <span className="text-brand-goldDark">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. adewale@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all"
                />
              </div>



              {/* Will you attend? */}
              <div>
                <label className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-3">
                  Will you attend? <span className="text-brand-goldDark">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAttendance('yes')}
                    className={`p-4 rounded-2xl border-2 font-sans text-[17px] font-medium flex items-center justify-between transition-all duration-200 ${
                      attendance === 'yes'
                        ? 'border-brand-gold bg-brand-gold/15 text-brand-espresso shadow-sm'
                        : 'border-brand-sand bg-white/80 text-brand-muted hover:border-brand-gold/40'
                    }`}
                  >
                    <span>Yes, I’ll be there</span>
                    {attendance === 'yes' && <CheckCircle2 className="w-5 h-5 text-brand-gold" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendance('no')}
                    className={`p-4 rounded-2xl border-2 font-sans text-[17px] font-medium flex items-center justify-between transition-all duration-200 ${
                      attendance === 'no'
                        ? 'border-brand-gold bg-brand-gold/15 text-brand-espresso shadow-sm'
                        : 'border-brand-sand bg-white/80 text-brand-muted hover:border-brand-gold/40'
                    }`}
                  >
                    <span>No, I can’t make it</span>
                    {attendance === 'no' && <CheckCircle2 className="w-5 h-5 text-brand-gold" />}
                  </button>
                </div>
              </div>

              {/* Message for the couple */}
              <div>
                <label htmlFor="message" className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-2">
                  Message for the couple <span className="text-brand-muted font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Share a sweet note, prayers, or well wishes for Oreoluwa & Oluwadara..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all resize-none"
                />
              </div>

              {/* Submit Button & Error Message */}
              <div className="space-y-4 pt-4">
                <p className="text-center text-sm font-sans text-brand-muted pb-2 border-b border-brand-sand/50 mb-2">
                  Please note that this is strictly an <span className="font-semibold text-brand-espresso">adult-only</span> event (No children).
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-brand-gold hover:bg-brand-goldDark text-brand-espresso hover:text-white font-sans text-[17px] font-semibold tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-pulse">Verifying Code & Submitting...</span>
                  ) : (
                    <>
                      <span>Submit RSVP</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Error Notification */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      ref={errorRef}
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden pt-1"
                    >
                      <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border border-red-200 text-red-600 flex items-center gap-3.5 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-sm sm:text-[15px] font-sans font-semibold text-red-600 leading-relaxed">
                          {errorMessage}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
