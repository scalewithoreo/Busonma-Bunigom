import { createContext, useContext, useState, useEffect, useMemo, FC, ReactNode } from 'react';
import { WeddingConfig, AdminRoleConfig } from '../types/wedding';
import { COUPLE_CONFIGS, ALL_COUPLES, resolveCoupleId, DEFAULT_COUPLE_ID } from '../config/couples';

interface WeddingContextValue {
  wedding: WeddingConfig;
  activeCoupleId: string;
  setCoupleId: (id: string) => void;
  availableCouples: WeddingConfig[];
  isMasterAdmin: (role?: string) => boolean;
  getRoleConfig: (role?: string) => AdminRoleConfig | undefined;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

function detectInitialCoupleId(): string {
  if (typeof window === 'undefined') return DEFAULT_COUPLE_ID;

  // 1. URL Query Param: ?couple=miracle-malvin or ?couple=ore-dara
  try {
    const params = new URLSearchParams(window.location.search);
    const coupleParam = params.get('couple');
    if (coupleParam) {
      const resolved = resolveCoupleId(coupleParam);
      localStorage.setItem('active_wedding_couple', resolved);
      return resolved;
    }
  } catch (e) {
    // Ignore URL parse errors
  }

  // 2. Local Storage preference
  try {
    const stored = localStorage.getItem('active_wedding_couple');
    if (stored && COUPLE_CONFIGS[stored]) {
      return stored;
    }
  } catch (e) {
    // Ignore storage errors
  }

  // 3. Hostname domain detection
  try {
    const hostname = window.location.hostname.toLowerCase();
    const resolvedFromHost = resolveCoupleId(hostname);
    if (resolvedFromHost !== DEFAULT_COUPLE_ID || hostname.includes('ore') || hostname.includes('dara')) {
      return resolvedFromHost;
    }
  } catch (e) {
    // Ignore hostname errors
  }

  // 4. Default
  return DEFAULT_COUPLE_ID;
}

function applyThemeVariables(wedding: WeddingConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const colors = wedding.theme.colors;

  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-primary-dark', colors.primaryDark);
  root.style.setProperty('--brand-primary-light', colors.primaryLight);
  root.style.setProperty('--brand-espresso', colors.espresso);
  root.style.setProperty('--brand-charcoal', colors.charcoal);
  root.style.setProperty('--brand-cream', colors.cream);
  root.style.setProperty('--brand-ivory', colors.ivory);
  root.style.setProperty('--brand-sand', colors.sand);
  root.style.setProperty('--brand-sand-dark', colors.sandDark);
  root.style.setProperty('--brand-gold', colors.gold);
  root.style.setProperty('--brand-gold-dark', colors.goldDark);
  root.style.setProperty('--brand-gold-light', colors.goldLight);
  root.style.setProperty('--brand-wine', colors.wine);
  root.style.setProperty('--brand-muted', colors.muted);

  // Update Page Title
  document.title = `${wedding.couple.title} | Wedding Celebration`;
}

export const WeddingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCoupleId, setActiveCoupleId] = useState<string>(detectInitialCoupleId);

  const wedding = useMemo(() => {
    return COUPLE_CONFIGS[activeCoupleId] || COUPLE_CONFIGS[DEFAULT_COUPLE_ID];
  }, [activeCoupleId]);

  useEffect(() => {
    applyThemeVariables(wedding);
  }, [wedding]);

  const setCoupleId = (id: string) => {
    const resolved = resolveCoupleId(id);
    setActiveCoupleId(resolved);
    try {
      localStorage.setItem('active_wedding_couple', resolved);
      const url = new URL(window.location.href);
      url.searchParams.set('couple', resolved);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      // Ignore URL state errors
    }
  };

  const isMasterAdmin = (role?: string): boolean => {
    if (!role) return false;
    if (role === 'master' || role === 'admin') return true;
    const roleConfig = wedding.admin.roles.find(r => r.role.toLowerCase() === role.toLowerCase());
    return roleConfig ? roleConfig.isMaster : false;
  };

  const getRoleConfig = (role?: string): AdminRoleConfig | undefined => {
    if (!role) return undefined;
    return wedding.admin.roles.find(r => r.role.toLowerCase() === role.toLowerCase());
  };

  const isDev = import.meta.env.DEV || (typeof window !== 'undefined' && window.location.search.includes('dev=true'));

  return (
    <WeddingContext.Provider
      value={{
        wedding,
        activeCoupleId,
        setCoupleId,
        availableCouples: ALL_COUPLES,
        isMasterAdmin,
        getRoleConfig,
      }}
    >
      {children}

      {/* Floating Developer Couple Switcher Pill (Dev / Preview Mode) */}
      {isDev && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-white/20 text-xs font-sans select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-neutral-400 font-mono">CORE:</span>
          <select
            value={activeCoupleId}
            onChange={(e) => setCoupleId(e.target.value)}
            className="bg-transparent text-white font-medium cursor-pointer focus:outline-none text-xs pr-1"
          >
            {ALL_COUPLES.map((c) => (
              <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                {c.couple.title} ({c.id})
              </option>
            ))}
          </select>
        </div>
      )}
    </WeddingContext.Provider>
  );
};

export function useWedding(): WeddingContextValue {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
}
