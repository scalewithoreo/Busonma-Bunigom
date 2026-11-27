import { useState, useEffect, useRef, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Send, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { 
  saveRsvp, 
  getUserActiveRsvp, 
  markCodeAsUsed, 
  checkInviteCodeStatus, 
  InviteCodeValidationResult 
} from '../utils/storage';
import { RsvpSubmission } from '../types';
import { useWedding } from '../context/WeddingContext';

interface RsvpFormProps {
  onNotify: (title: string, message?: string) => void;
}

export const RsvpForm: FC<RsvpFormProps> = ({ onNotify }) => {
  const { wedding, isReceptionOnly, isCeremonyOnly } = useWedding();
  const isSingleReception = isReceptionOnly || isCeremonyOnly;
  const [passcode, setPasscode] = useState('');
  const [codeStatus, setCodeStatus] = useState<InviteCodeValidationResult | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [attendance, setAttendance] = useState<'yes' | 'no' | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    isSingleReception ? 'Saturday, Jan 9, 2027 (Wedding Reception)' : 'Both Dates (Jan 7 & Jan 9)'
  );
  const [attendingDates, setAttendingDates] = useState<string[]>(
    isSingleReception ? ['2027-01-09'] : ['2027-01-07', '2027-01-09']
  );
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formError, setFormError] = useState<{
    title: string;
    message: string;
    detail?: string;
    type: 'already_used' | 'not_found' | 'incomplete' | 'general';
  } | null>(null);
  const [submittedData, setSubmittedData] = useState<RsvpSubmission | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSingleReception) {
      setSelectedDate('Saturday, Jan 9, 2027 (Wedding Reception)');
      setAttendingDates(['2027-01-09']);
    }
  }, [isSingleReception]);

  // Read ?code= or ?passcode= from URL if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('passcode') || params.get('invite');
      if (urlCode && urlCode.trim()) {
        const clean = urlCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
        if (clean) {
          setPasscode(clean);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Real-time verification when user enters 5 digits
  useEffect(() => {
    const clean = passcode.trim();
    if (clean.length === 5) {
      let isMounted = true;
      setIsValidatingCode(true);
      checkInviteCodeStatus(clean, wedding.couple.title)
        .then((res) => {
          if (!isMounted) return;
          setIsValidatingCode(false);
          setCodeStatus(res);
          // If code is valid, and assigned_to exists, and first/last name are empty, prefill names
          if (res.isValid && res.assignedTo) {
            const parts = res.assignedTo.trim().split(/\s+/);
            setFirstName(prev => prev || parts[0] || '');
            setLastName(prev => prev || parts.slice(1).join(' ') || '');
          }
        })
        .catch(() => {
          if (isMounted) setIsValidatingCode(false);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setCodeStatus(null);
      setIsValidatingCode(false);
    }
  }, [passcode, wedding.couple.title]);

  useEffect(() => {
    if (errorMessage || formError) {
      const timer = setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, formError]);

  useEffect(() => {
    // Check if user already submitted an RSVP in this session/browser
    const existing = getUserActiveRsvp();
    if (existing) {
      setSubmittedData(existing);
      setFirstName(existing.firstName || '');
      setLastName(existing.lastName || '');
      setEmail(existing.email || '');
      setAttendance(existing.attendance);
      if (existing.selectedDate) setSelectedDate(existing.selectedDate);
      if (existing.attendingDates) setAttendingDates(existing.attendingDates);
      setMessage(existing.message || '');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      const err = {
        title: 'Name Required',
        message: 'Please enter your first and last name so we can record your RSVP.',
        type: 'incomplete' as const,
      };
      setFormError(err);
      setErrorMessage(err.message);
      return;
    }

    if (!passcode.trim() || passcode.trim().length !== 5) {
      const err = {
        title: 'Passcode Incomplete',
        message: 'Please enter your complete 5-digit invitation passcode before submitting.',
        detail: 'Every invitation is paired with an exclusive 5-digit passcode (e.g. 74921).',
        type: 'incomplete' as const,
      };
      setFormError(err);
      setErrorMessage(err.message);
      return;
    }

    if (!attendance) {
      const err = {
        title: 'Attendance Required',
        message: 'Please select whether you will attend.',
        type: 'incomplete' as const,
      };
      setFormError(err);
      setErrorMessage(err.message);
      return;
    }

    if (attendance === 'yes' && wedding.id === 'miracle-malvin' && !selectedDate) {
      const err = {
        title: 'Celebration Date Selection',
        message: 'Please choose which celebration date(s) you will attend.',
        type: 'incomplete' as const,
      };
      setFormError(err);
      setErrorMessage(err.message);
      return;
    }

    setIsSubmitting(true);

    // 1. Verify the invite code with detailed status
    const validation = await checkInviteCodeStatus(passcode.trim(), wedding.couple.title);
    if (!validation.isValid) {
      if (validation.status === 'already_used') {
        const err = {
          title: 'Invitation Code Already Redeemed',
          message: validation.message,
          detail: validation.detail,
          type: 'already_used' as const,
        };
        setFormError(err);
        setErrorMessage(validation.message);
      } else if (validation.status === 'not_found') {
        const err = {
          title: 'Invitation Code Not Recognized',
          message: validation.message,
          detail: validation.detail,
          type: 'not_found' as const,
        };
        setFormError(err);
        setErrorMessage(validation.message);
      } else {
        const err = {
          title: 'Invalid Passcode',
          message: validation.message,
          detail: validation.detail,
          type: 'incomplete' as const,
        };
        setFormError(err);
        setErrorMessage(validation.message);
      }
      setIsSubmitting(false);
      return;
    }

    const inviteCodeObj = validation.codeObj!;

    try {
      // 2. Save the RSVP
      const saved = await saveRsvp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        attendance: attendance as 'yes' | 'no',
        selectedDate: attendance === 'yes' ? selectedDate : undefined,
        attendingDates: attendance === 'yes' ? attendingDates : undefined,
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
          colors: wedding.event.confettiColors || ['#B91C1C', '#991B1B', '#121212', '#F5EDE4'],
        });
      }
      onNotify('RSVP Received', 'Thank you for responding!');

      // 4. Trigger Webhook and Email securely via Backend API
      const roleLabels: Record<string, string> = { 'master': 'Master Admin' };
      wedding.admin.roles.forEach(r => {
        roleLabels[r.role] = r.label;
      });
      const creatorLabel = roleLabels[inviteCodeObj.created_by || 'master'] || 'Unknown';

      fetch('/api/submit-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          attendance: attendance === 'yes' ? 'Attending' : 'Declined',
          selectedDate: attendance === 'yes' ? selectedDate : undefined,
          message: message.trim() || undefined,
          code: passcode.trim(),
          creator: creatorLabel,
          websiteUrl: window.location.origin,
          coupleId: wedding.id
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
          <div className="w-44 h-44 sm:w-60 sm:h-60 rounded-full overflow-hidden mb-8 shadow-xl relative border-4 border-white bg-brand-sand/30">
            <img 
              loading="lazy" 
              decoding="async" 
              src={wedding.couple.rsvpAvatarImage || wedding.couple.heroImage} 
              alt={wedding.couple.title} 
              className="w-full h-full object-cover object-center" 
            />
            <div className="absolute inset-0 bg-brand-espresso/5 pointer-events-none"></div>
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
              Kindly RSVP by <span className="font-semibold text-brand-espresso">{wedding.event.rsvpDeadline || (wedding.id === 'miracle-malvin' ? 'December 17th, 2026' : 'February 27th, 2027')}</span>
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
                {submittedData.selectedDate && submittedData.attendance === 'yes' && (
                  <div className="flex justify-between py-1 border-b border-brand-sand/40">
                    <span className="text-brand-muted">Celebration Date:</span>
                    <span className="font-semibold text-brand-espresso text-right text-sm sm:text-base">{submittedData.selectedDate}</span>
                  </div>
                )}
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
              <div className="p-5 rounded-2xl bg-white border border-brand-gold/30 shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="passcode" className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso">
                    5-Digit Invite Code <span className="text-brand-goldDark">*</span>
                  </label>
                  {isValidatingCode && (
                    <span className="text-[11px] font-sans text-brand-muted animate-pulse flex items-center gap-1 font-medium">
                      Verifying passcode...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="passcode"
                    type="text"
                    maxLength={5}
                    required
                    placeholder="e.g. 74921"
                    value={passcode}
                    onChange={(e) => {
                      const val = e.target.value.trim().toUpperCase().slice(0, 5);
                      setPasscode(val);
                      if (formError) setFormError(null);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className={`w-full px-4 py-3.5 pl-12 rounded-xl bg-brand-cream/30 border outline-none font-mono text-xl tracking-[0.25em] font-bold uppercase transition-all ${
                      codeStatus?.isValid
                        ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-emerald-950 bg-emerald-50/20'
                        : codeStatus?.status === 'already_used'
                        ? 'border-amber-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-amber-950 bg-amber-50/20'
                        : codeStatus?.status === 'not_found'
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-950 bg-red-50/20'
                        : 'border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-brand-espresso'
                    }`}
                  />
                  <KeyRound className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    codeStatus?.isValid
                      ? 'text-emerald-600'
                      : codeStatus?.status === 'already_used'
                      ? 'text-amber-600'
                      : codeStatus?.status === 'not_found'
                      ? 'text-red-500'
                      : 'text-brand-goldDark'
                  }`} />
                </div>

                {/* Real-time Inline Status Feedback */}
                {codeStatus && (
                  <div className="mt-3">
                    {codeStatus.isValid ? (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold block text-emerald-950">{codeStatus.message}</span>
                          {codeStatus.assignedTo ? (
                            <span className="text-[12px] text-emerald-800">
                              Invitation reserved for <span className="font-semibold underline">{codeStatus.assignedTo}</span>.
                            </span>
                          ) : (
                            <span className="text-[12px] text-emerald-800">You may proceed with your RSVP details below.</span>
                          )}
                        </div>
                      </div>
                    ) : codeStatus.status === 'already_used' ? (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-sans">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold block text-amber-950">Code Already Redeemed</span>
                          <span className="leading-relaxed block text-amber-900 mt-0.5">{codeStatus.message}</span>
                          {codeStatus.detail && (
                            <span className="text-[11px] text-amber-800/90 block mt-1 pt-1 border-t border-amber-200/60 leading-normal">
                              {codeStatus.detail}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : codeStatus.status === 'not_found' ? (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-950 text-xs font-sans">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold block text-red-950">Code Not Recognized</span>
                          <span className="leading-relaxed block text-red-900 mt-0.5">{codeStatus.message}</span>
                          {codeStatus.detail && (
                            <span className="text-[11px] text-red-800/90 block mt-1 pt-1 border-t border-red-200/60 leading-normal">
                              {codeStatus.detail}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {!codeStatus && (
                  <p className="text-xs text-brand-muted mt-2 font-sans">
                    Please enter the unique 5-digit passcode provided with your invitation.
                  </p>
                )}
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

              {/* Date Availability Selection (for Miracle and Malvin) */}
              {wedding.id === 'miracle-malvin' && attendance === 'yes' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 pt-2"
                >
                  {isSingleReception ? (
                    /* Wedding Reception Only Info Card */
                    <div className="bg-brand-gold/15 border border-brand-gold/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-brand-goldDark font-bold block mb-0.5">
                          Wedding Reception Celebration
                        </span>
                        <h4 className="font-serif text-base text-brand-espresso font-semibold">
                          Apata School, Isolo, Lagos
                        </h4>
                        <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                          Saturday, January 9, 2027 • 11:00 AM WAT<br />
                          Plot 36/42 Godwin Omonua Street, Ire-Akari Estate, Isolo, Lagos, Nigeria
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Full Celebration Multi-Date Selector */
                    <>
                      <label className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-1">
                        Which celebration date(s) will you attend? <span className="text-brand-goldDark">*</span>
                      </label>
                      <p className="text-xs text-brand-muted font-sans mb-3">
                        Please indicate your availability so we can prepare your seating and reception details:
                      </p>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          {
                            id: 'both',
                            value: 'Both Dates (Jan 7 & Jan 9)',
                            dates: ['2027-01-07', '2027-01-09'],
                            title: 'Both Celebrations (Jan 7 & Jan 9)',
                            subtitle: 'Solemnization (Jan 7 at Anglican Church) & Reception (Jan 9 at Apata School)',
                          },
                          {
                            id: 'solemnization',
                            value: 'Thursday, Jan 7, 2027 (Solemnization & White Wedding)',
                            dates: ['2027-01-07'],
                            title: 'Thursday, January 7, 2027 Only',
                            subtitle: 'Solemnization & White Wedding (11:00 AM at Anglican Church of the Pentecost Okota)'
                          },
                          {
                            id: 'reception',
                            value: 'Saturday, Jan 9, 2027 (Wedding Reception)',
                            dates: ['2027-01-09'],
                            title: 'Saturday, January 9, 2027 Only',
                            subtitle: 'Wedding Reception (11:00 AM at Apata School, Isolo)'
                          }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedDate(opt.value);
                              setAttendingDates(opt.dates);
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between ${
                              selectedDate === opt.value
                                ? 'border-brand-gold bg-brand-gold/15 text-brand-espresso shadow-sm'
                                : 'border-brand-sand bg-white/80 text-brand-muted hover:border-brand-gold/40'
                            }`}
                          >
                            <div className="pr-3">
                              <span className="font-sans font-bold text-[15px] sm:text-base text-brand-espresso block">
                                {opt.title}
                              </span>
                              <p className="text-xs text-brand-muted mt-0.5">{opt.subtitle}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedDate === opt.value ? 'border-brand-gold bg-brand-gold' : 'border-brand-sand'
                            }`}>
                              {selectedDate === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Message for the couple */}
              <div>
                <label htmlFor="message" className="block text-xs uppercase tracking-widest font-sans font-bold text-brand-espresso mb-2">
                  Message for the couple <span className="text-brand-muted font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder={`Share a sweet note, prayers, or well wishes for ${wedding.couple.title}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-brand-sand focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none text-brand-espresso font-sans text-[17px] transition-all resize-none"
                />
              </div>

              {/* Submit Button & Error Message */}
              <div className="space-y-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-brand-primary hover:bg-brand-primaryDark text-white font-sans text-[17px] font-semibold tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-50"
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
                  {(formError || errorMessage) && (
                    <motion.div
                      ref={errorRef}
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden pt-1"
                    >
                      <div
                        role="alert"
                        className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-colors ${
                          formError?.type === 'already_used'
                            ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                            : formError?.type === 'not_found'
                            ? 'bg-red-50/95 border-red-300 text-red-950'
                            : 'bg-red-50/95 border-red-200 text-red-900'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              formError?.type === 'already_used'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="text-xs sm:text-sm font-sans font-bold tracking-wider uppercase text-brand-espresso">
                              {formError?.title || 'Notice'}
                            </h4>
                            <p className="text-sm sm:text-[15px] font-sans font-medium leading-relaxed">
                              {formError?.message || errorMessage}
                            </p>
                            {formError?.detail && (
                              <p className="text-xs sm:text-[13px] font-sans opacity-85 leading-relaxed pt-2 border-t border-black/5 mt-1.5">
                                {formError.detail}
                              </p>
                            )}
                          </div>
                        </div>
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
