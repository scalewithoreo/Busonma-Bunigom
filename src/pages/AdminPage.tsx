export type { AdminRole } from '../config/adminConfig';
import React, { useState, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ShieldAlert, ArrowLeft, Settings, X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminModal } from '../components/AdminModal';
import { 
  AdminRole, 
  hashPin, 
  verifyEnteredPin, 
  getStoredPin, 
  saveCustomPin, 
  resetRolePinToDefault, 
  MASTER_EMERGENCY_PIN 
} from '../config/adminConfig';
import { useWedding } from '../context/WeddingContext';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const LOCKOUT_STORAGE_KEY = 'wedding_admin_lockout_until';
const ATTEMPTS_STORAGE_KEY = 'wedding_admin_attempts';

export const AdminPage: FC<{ onNotify: (title: string, message?: string) => void }> = ({ onNotify }) => {
  const { wedding } = useWedding();
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [authenticatedRole, setAuthenticatedRole] = useState<AdminRole | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const navigate = useNavigate();

  // Reset Modal Form State
  const [targetRole, setTargetRole] = useState<AdminRole>(() => wedding.admin.roles[0]?.role || 'master');
  const [selectedLoginRole, setSelectedLoginRole] = useState<string>('auto');
  const [currentOrMasterPin, setCurrentOrMasterPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Update targetRole if wedding switches
  useEffect(() => {
    if (wedding.admin.roles.length > 0) {
      setTargetRole(wedding.admin.roles[0].role);
    }
  }, [wedding]);

  // Check lockout state on mount and set up countdown
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
      localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      setLockoutRemaining(0);
      return;
    }

    const checkLockout = () => {
      const lockoutUntil = localStorage.getItem(LOCKOUT_STORAGE_KEY);
      if (lockoutUntil) {
        const remaining = Math.max(0, Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 1000));
        setLockoutRemaining(remaining);
        if (remaining === 0) {
          localStorage.removeItem(LOCKOUT_STORAGE_KEY);
          localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const getFailedAttempts = (): number => {
    return parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0', 10);
  };

  const recordFailedAttempt = (): number => {
    const newCount = getFailedAttempts() + 1;
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, newCount.toString());
    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_STORAGE_KEY, lockoutTime.toString());
      setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
    }
    return newCount;
  };

  const resetFailedAttempts = () => {
    localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);
    setLockoutRemaining(0);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    if (pin.length !== 4) {
      setPinError('Please enter a 4-digit PIN');
      return;
    }

    // Secure verification
    const verification = verifyEnteredPin(pin, wedding.admin.roles, wedding.admin.emergencyPin, selectedLoginRole);

    if (verification.success && verification.role) {
      resetFailedAttempts();
      const pinHash = await hashPin(pin, wedding.admin.pinSalt);
      localStorage.setItem('admin_pin_hash', pinHash);
      setAuthenticatedRole(verification.role);
      onNotify('Admin Access Granted', `Welcome back, ${verification.label}!`);
    } else {
      const attempts = recordFailedAttempt();
      if (attempts >= MAX_FAILED_ATTEMPTS) {
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

    const activeRoleConfig = wedding.admin.roles.find(r => r.role === targetRole);
    const activeCurrentPin = getStoredPin(targetRole, activeRoleConfig?.defaultPin);

    // Verify current PIN or emergency override
    if (currentOrMasterPin.trim() !== activeCurrentPin && currentOrMasterPin.trim() !== wedding.admin.emergencyPin && currentOrMasterPin.trim() !== MASTER_EMERGENCY_PIN) {
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
    wedding.admin.roles.forEach(r => resetRolePinToDefault(r.role));
    setResetSuccess('All PINs restored to default values.');
    const summary = wedding.admin.roles.filter(r => r.isMaster).map(r => `${r.label.split(' ')[0]}: ${r.defaultPin}`).join(' | ');
    onNotify('Defaults Restored', summary);
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

  const masterDefaultsText = wedding.admin.roles
    .filter(r => r.isMaster)
    .map(r => `${r.label.split(' ')[0]} (${r.defaultPin})`)
    .join(' • ') + ' • Emergency (0000)';

  return (
    <div className="min-h-screen bg-brand-espresso flex items-center justify-center p-4 relative">
      {/* Background watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Form */}
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handlePinSubmit}
        className="bg-brand-cream/95 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-2xl text-center max-w-sm w-full relative z-10 border border-brand-gold/20"
      >
        <div className="w-16 h-16 rounded-full bg-brand-gold/15 flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-brand-goldDark" />
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl text-brand-espresso mb-1">{wedding.couple.title}</h1>
        <p className="text-xs uppercase tracking-widest text-brand-goldDark font-semibold mb-4">
          Admin Dashboard
        </p>

        <p className="text-sm font-sans text-brand-muted mb-6">
          Enter your 4-digit admin PIN to continue.
        </p>

        <div className="space-y-4">
          {/* Optional Role Scoping Selector */}
          {wedding.admin.roles.length > 1 && lockoutRemaining === 0 && (
            <div className="text-left mb-2">
              <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-brand-muted mb-1.5">
                Logging in as:
              </label>
              <select
                value={selectedLoginRole}
                onChange={(e) => setSelectedLoginRole(e.target.value)}
                className="w-full text-xs font-sans px-3 py-2.5 rounded-xl border border-brand-sand bg-white/80 text-brand-espresso focus:border-brand-gold outline-none"
              >
                <option value="auto">Auto-Detect Role (By PIN)</option>
                {wedding.admin.roles.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              Defaults: {masterDefaultsText}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl text-brand-muted text-xs font-sans font-medium tracking-wider uppercase hover:text-brand-espresso transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Website
          </button>
        </div>
      </motion.form>

      {/* PIN Reset / Change Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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
                    {wedding.admin.roles.map(r => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-sans font-semibold text-brand-espresso uppercase tracking-wider mb-1.5">
                    Current PIN (or Emergency Override: 0000)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentOrMasterPin}
                    onChange={(e) => setCurrentOrMasterPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter current 4-digit code"
                    className="w-full px-4 py-3 rounded-xl border border-brand-sand bg-white text-brand-espresso font-mono tracking-widest text-sm focus:border-brand-gold outline-none"
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
                      placeholder="e.g. 5555"
                      className="w-full px-4 py-3 rounded-xl border border-brand-sand bg-white text-brand-espresso font-mono tracking-widest text-sm focus:border-brand-gold outline-none"
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
                      placeholder="e.g. 5555"
                      className="w-full px-4 py-3 rounded-xl border border-brand-sand bg-white text-brand-espresso font-mono tracking-widest text-sm focus:border-brand-gold outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-brand-espresso text-brand-cream text-xs font-sans font-bold tracking-widest uppercase hover:bg-brand-charcoal transition-all shadow-md"
                  >
                    Save New PIN
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="w-full py-2.5 rounded-xl border border-brand-sand/60 text-brand-muted hover:text-brand-espresso text-xs font-sans font-medium tracking-wider uppercase transition-colors"
                  >
                    Restore All Defaults
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
