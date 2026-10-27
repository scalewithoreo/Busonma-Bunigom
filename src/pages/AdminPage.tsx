import { useState, useEffect, FC } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { AdminModal } from '../components/AdminModal';
import { useNavigate } from 'react-router-dom';

// Cryptographic salt to prevent precomputed rainbow table lookups
const PIN_SALT = 'OreDara_Wedding_2026_Salt_';


export type AdminRole = 'ore' | 'dara' | 'groomsfamily' | 'bridesfamily' | 'custom1964';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const LOCKOUT_STORAGE_KEY = 'ore_dara_admin_lockout_until';
const ATTEMPTS_STORAGE_KEY = 'ore_dara_admin_attempts';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(PIN_SALT + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const AdminPage: FC<{ onNotify: (title: string, message?: string) => void }> = ({ onNotify }) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [authenticatedRole, setAuthenticatedRole] = useState<AdminRole | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const navigate = useNavigate();

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
    if (authenticatedRole || lockoutRemaining > 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if they are holding modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // Ignore if they are typing directly inside the input field to prevent double-entry
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (/^\d$/.test(e.key)) {
        setPin(prev => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Enter' && pin.length === 4) {
        // We can't easily trigger the synthetic event here, but the form handles its own Enter if focused.
        // If not focused, we can programmatically submit
        const form = document.getElementById('admin-login-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authenticatedRole, lockoutRemaining, pin]);

  const handlePinSubmit = async (e: Event | React.FormEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (lockoutRemaining > 0) return;

    setPinError('');
    const enteredHash = await hashPin(pin);
    
    try {
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
      } else {
        throw new Error('Invalid PIN');
      }
    } catch (err) {
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

        <h1 className="font-serif text-2xl text-brand-espresso mb-2">Admin Access</h1>
        <p className="text-sm font-sans text-brand-muted mb-8">
          Enter the 4-digit admin PIN to continue.
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

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl text-brand-muted text-xs font-sans font-medium tracking-wider uppercase hover:text-brand-espresso transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </button>
        </div>
      </motion.form>
    </div>
  );
};
