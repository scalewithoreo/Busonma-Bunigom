import { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, AlertCircle, ArrowLeft, ShieldAlert, Settings, RefreshCw, CheckCircle2, X, Lock } from 'lucide-react';
import { AdminModal } from '../components/AdminModal';
import { useNavigate } from 'react-router-dom';
import {
  AdminRole,
  hashPin,
  verifyEnteredPin,
  getStoredPin,
  saveCustomPin,
  resetRolePinToDefault,
  INITIAL_ADMIN_ROLES,
  MASTER_EMERGENCY_PIN
} from '../config/adminConfig';

export type { AdminRole } from '../config/adminConfig';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const LOCKOUT_STORAGE_KEY = 'mm_admin_lockout_until';
const ATTEMPTS_STORAGE_KEY = 'mm_admin_attempts';

export const AdminPage: FC<{ onNotify: (title: string, message?: string) => void }> = ({ onNotify }) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [authenticatedRole, setAuthenticatedRole] = useState<AdminRole | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const navigate = useNavigate();

  // Reset Modal Form State
  const [targetRole, setTargetRole] = useState<AdminRole>('miracle');
  const [currentOrMasterPin, setCurrentOrMasterPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Check lockout state on mount and set up countdown
  useEffect(() => {
    const checkLockout = () => {
      const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_STORAGE_KEY) || '0', 10);
      const remaining = lockoutUntil - Date.now();
      if (remaining > 0) {
        setLockoutRemaining(Math.ceil(remaining / 1000));
      } else {
        setLockoutRemaining(0);
        localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global key listener so they don't have to click the input
  useEffect(() => {
    if (authenticatedRole || lockoutRemaining > 0 || isResetModalOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (/^\d$/.test(e.key)) {
        setPin(prev => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Enter' && pin.length === 4) {
        const form = document.getElementById('admin-login-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authenticatedRole, lockoutRemaining, pin, isResetModalOpen]);

  const handlePinSubmit = async (e: Event | React.FormEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (lockoutRemaining > 0) return;

    setPinError('');

    // 1. Fast local check (allows immediate operation without serverless/Supabase dependencies)
    const localCheck = verifyEnteredPin(pin);
    if (localCheck.success && localCheck.role) {
      localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
      localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      const pinHash = await hashPin(pin);
      localStorage.setItem('admin_pin_hash', pinHash);
      setAuthenticatedRole(localCheck.role);
      onNotify('Admin Unlocked', `Welcome ${localCheck.label || localCheck.role}!`);
      return;
    }

    // 2. Fallback to API verify if deployed
    try {
      const enteredHash = await hashPin(pin);
      const res = await fetch('/api/admin-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinHash: enteredHash, action: 'verifyPin' })
      });
      
      const json = await res.json();
      if (res.ok && json.success && json.data?.role) {
        localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
        localStorage.removeItem(LOCKOUT_STORAGE_KEY);
        localStorage.setItem('admin_pin_hash', enteredHash);
        setAuthenticatedRole(json.data.role as AdminRole);
        return;
      } else {
        throw new Error('Invalid PIN');
      }
    } catch {
      const attempts = parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0', 10) + 1;
      localStorage.setItem(ATTEMPTS_STORAGE_KEY, attempts.toString());

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        localStorage.setItem(LOCKOUT_STORAGE_KEY, lockoutUntil.toString());
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setPinError(`Too many failed attempts. Security lockout active for 5 minutes.`);
      } else {
        setPinError(`Incorrect PIN. ${MAX_FAILED_ATTEMPTS - attempts} attempt(s) remaining.`);
      }
      setPin('');
    }
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const activeCurrentPin = getStoredPin(targetRole);

    // Verify current PIN or emergency override
    if (currentOrMasterPin.trim() !== activeCurrentPin && currentOrMasterPin.trim() !== MASTER_EMERGENCY_PIN) {
      setResetError('Authorization failed. Please enter the current PIN for this role or the Master Recovery Code (0000).');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setResetError('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setResetError('New PIN and confirmation do not match.');
      return;
    }

    const saved = saveCustomPin(targetRole, newPin);
    if (saved) {
      setResetSuccess(`PIN updated successfully! You can now log in with ${newPin}.`);
      onNotify('PIN Updated', `New PIN for ${targetRole.toUpperCase()} saved.`);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setCurrentOrMasterPin('');
        setNewPin('');
        setConfirmNewPin('');
        setResetSuccess('');
        setResetError('');
      }, 1500);
    } else {
      setResetError('Failed to save PIN.');
    }
  };

  const handleRestoreDefaults = () => {
    INITIAL_ADMIN_ROLES.forEach(r => resetRolePinToDefault(r.role));
    setResetSuccess('All PINs restored to default values.');
    onNotify('Defaults Restored', 'Miracle: 1111 | Marvin: 2222');
    setTimeout(() => {
      setIsResetModalOpen(false);
      setResetSuccess('');
    }, 1200);
  };

  if (authenticatedRole) {
    return (
      <AdminModal
        isOpen={true}
        onClose={() => {
          localStorage.removeItem('admin_pin_hash');
          setAuthenticatedRole(null);
          setPin('');
        }}
        onNotify={onNotify}
        role={authenticatedRole}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-espresso flex items-center justify-center p-4 relative">
      {/* Background watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      <motion.form
        id="admin-login-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handlePinSubmit}
        className="bg-brand-cream/95 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-2xl text-center max-w-sm w-full relative z-10 border border-brand-gold/20"
      >
        <div className="w-16 h-16 rounded-full bg-brand-gold/15 flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-brand-goldDark" />
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl text-brand-espresso mb-1">Miracle & Marvin</h1>
        <p className="text-xs uppercase tracking-widest text-brand-goldDark font-semibold mb-4">
          Admin Dashboard
        </p>

        <p className="text-sm font-sans text-brand-muted mb-6">
          Enter your 4-digit admin PIN to continue.
        </p>

        <div className="space-y-4">
          {lockoutRemaining > 0 ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-sm font-sans flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-rose-600 animate-pulse" />
              <p className="font-bold">Security Lockout Active</p>
              <p className="text-xs text-rose-600">
                Too many failed attempts. Try again in {Math.floor(lockoutRemaining / 60)}m {lockoutRemaining % 60}s.
              </p>
            </div>
          ) : (
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              className="w-full text-center text-3xl font-mono tracking-[0.6em] px-4 py-4 rounded-xl border border-brand-sand bg-white/60 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:tracking-[0.3em] placeholder:text-brand-muted/30"
              autoFocus
            />
          )}

          {pinError && lockoutRemaining === 0 && (
            <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{pinError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4 || lockoutRemaining > 0}
            className="w-full py-4 rounded-xl bg-brand-espresso text-brand-cream text-xs font-sans font-bold tracking-widest uppercase hover:bg-brand-charcoal transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Unlock Dashboard
          </button>

          {/* Quick PIN Info & Reset Action */}
          <div className="pt-2 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="text-xs font-sans text-brand-goldDark hover:text-brand-espresso font-semibold tracking-wider flex items-center gap-1.5 transition-colors py-1"
            >
              <Settings className="w-3.5 h-3.5" /> Change / Reset Admin PIN
            </button>

            <div className="text-[11px] font-mono text-brand-muted/80 bg-brand-sand/20 rounded-lg px-2.5 py-1.5 w-full text-center">
              Defaults: Miracle (1111) • Marvin (2222) • Master (0000)
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl text-brand-muted text-xs font-sans font-medium tracking-wider uppercase hover:text-brand-espresso transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </button>
        </div>
      </motion.form>

      {/* Interactive PIN Reset Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-cream rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-gold/30 text-left relative"
            >
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-brand-muted hover:text-brand-espresso transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-goldDark">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-brand-espresso">Reset / Change PIN</h2>
                  <p className="text-xs text-brand-muted font-sans">Set a new 4-digit code for any admin role</p>
                </div>
              </div>

              {resetError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{resetError}</p>
                </div>
              )}

              {resetSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-sans flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <p>{resetSuccess}</p>
                </div>
              )}

              <form onSubmit={handleResetPinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-semibold text-brand-espresso uppercase tracking-wider mb-1.5">
                    Select Admin Profile
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as AdminRole)}
                    className="w-full px-4 py-3 rounded-xl border border-brand-sand bg-white text-brand-espresso font-sans text-sm focus:border-brand-gold outline-none"
                  >
                    {INITIAL_ADMIN_ROLES.map(r => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-sans font-semibold text-brand-espresso uppercase tracking-wider mb-1.5">
                    Current PIN (or Master Code: 0000)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentOrMasterPin}
                    onChange={(e) => setCurrentOrMasterPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter current PIN or 0000"
                    className="w-full px-4 py-3 rounded-xl border border-brand-sand bg-white text-brand-espresso font-mono text-center tracking-widest text-lg focus:border-brand-gold outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-sans font-semibold text-brand-espresso uppercase tracking-wider mb-1.5">
                      New 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 5678"
                      className="w-full px-4 py-3 rounded-xl border border-brand-sand bg-white text-brand-espresso font-mono text-center tracking-widest text-lg focus:border-brand-gold outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-semibold text-brand-espresso uppercase tracking-wider mb-1.5">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Confirm"
                      className="w-full px-4 py-3 rounded-xl border border-brand-sand bg-white text-brand-espresso font-mono text-center tracking-widest text-lg focus:border-brand-gold outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-brand-goldDark text-white text-xs font-sans font-bold tracking-widest uppercase hover:bg-brand-espresso transition-colors shadow-md"
                  >
                    Save New PIN
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="w-full py-2.5 rounded-xl text-brand-muted hover:text-rose-700 text-xs font-sans font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Restore Default PINs
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
