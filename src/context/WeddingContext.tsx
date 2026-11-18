import { createContext, useContext, useState, useEffect, useMemo, FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { WeddingConfig, AdminRoleConfig, ThemeColors, ThemePresetId } from '../types/wedding';
import { COUPLE_CONFIGS, ALL_COUPLES, resolveCoupleId, DEFAULT_COUPLE_ID } from '../config/couples';
import { THEME_PRESETS, ALL_THEME_PRESETS, ThemePreset } from '../config/themePresets';

interface WeddingContextValue {
  wedding: WeddingConfig;
  activeCoupleId: string;
  setCoupleId: (id: string) => void;
  availableCouples: WeddingConfig[];
  activePresetId: ThemePresetId;
  setPresetId: (id: ThemePresetId) => void;
  availablePresets: ThemePreset[];
  isMasterAdmin: (role?: string) => boolean;
  getRoleConfig: (role?: string) => AdminRoleConfig | undefined;
  guestView: 'full' | 'reception';
  setGuestView: (view: 'full' | 'reception') => void;
  isReceptionOnly: boolean;
  isCeremonyOnly: boolean;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

function detectInitialCoupleId(): string {
  if (typeof window === 'undefined') return DEFAULT_COUPLE_ID;

  // 1. URL Query Param: ?couple=miracle-malvin or ?couple=busonma-bunigom
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
    if (resolvedFromHost !== DEFAULT_COUPLE_ID) {
      return resolvedFromHost;
    }
  } catch (e) {
    // Ignore hostname errors
  }

  // 4. Default
  return DEFAULT_COUPLE_ID;
}

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '250 248 242';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r} ${g} ${b}`;
}

function updateMetaTags(wedding: WeddingConfig) {
  if (typeof document === 'undefined') return;

  const title = `${wedding.couple.title} — Wedding Celebration`;
  const description = `${wedding.event.displayDate}. Celebrating the union of ${wedding.couple.formalNames.bride} and ${wedding.couple.formalNames.groom} in ${wedding.couple.locationText}.`;
  const ogImage = wedding.id === 'miracle-malvin' ? 'https://miracle-malvin.vercel.app/assets/miracle-malvin/og-hero.jpg?v=2032' : wedding.couple.heroImage;

  document.title = title;

  const setMeta = (nameOrProp: string, value: string, isProp = false) => {
    const attr = isProp ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, nameOrProp);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  };

  setMeta('description', description);
  setMeta('og:title', title, true);
  setMeta('og:description', description, true);
  setMeta('og:image', ogImage, true);
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', ogImage);
}

function applyThemeVariables(colors: ThemeColors, title: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const mapping: Record<string, string> = {
    'primary': colors.primary,
    'primary-dark': colors.primaryDark,
    'primary-light': colors.primaryLight,
    'espresso': colors.espresso,
    'charcoal': colors.charcoal,
    'cream': colors.cream,
    'ivory': colors.ivory,
    'sand': colors.sand,
    'sand-dark': colors.sandDark,
    'gold': colors.gold,
    'gold-dark': colors.goldDark,
    'gold-light': colors.goldLight,
    'wine': colors.wine,
    'muted': colors.muted,
  };

  Object.entries(mapping).forEach(([key, hex]) => {
    root.style.setProperty(`--brand-${key}`, hex);
    root.style.setProperty(`--brand-${key}-rgb`, hexToRgb(hex));
  });

  // Update Page Title
  document.title = `${title} | Wedding Celebration`;
}

export const WeddingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCoupleId, setActiveCoupleId] = useState<string>(detectInitialCoupleId);
  const location = useLocation();

  const isMainCelebrationPath = useMemo(() => {
    try {
      const path = location.pathname.toLowerCase();
      if (path === '/main' || path.startsWith('/main/')) {
        return true;
      }
      const params = new URLSearchParams(location.search);
      const view = params.get('view') || params.get('event') || params.get('tier');
      if (view && (view.toLowerCase() === 'main' || view.toLowerCase() === 'full' || view.toLowerCase() === 'familyvip' || view.toLowerCase() === 'vip')) {
        return true;
      }
    } catch (e) {
      // Ignore URL parse errors
    }
    return false;
  }, [location.pathname, location.search]);

  const [overrideGuestView, setOverrideGuestView] = useState<'full' | 'reception' | null>(null);
  // Default for Miracle & Malvin on the original domain '/' is reception only.
  // The full celebration is accessed at '/main'.
  const defaultGuestView: 'full' | 'reception' = isMainCelebrationPath ? 'full' : 'reception';
  const guestView: 'full' | 'reception' = overrideGuestView || defaultGuestView;
  const isReceptionOnly = (activeCoupleId === 'miracle-malvin') && (guestView === 'reception');
  const isCeremonyOnly = isReceptionOnly;

  const rawWedding = useMemo(() => {
    return COUPLE_CONFIGS[activeCoupleId] || COUPLE_CONFIGS[DEFAULT_COUPLE_ID];
  }, [activeCoupleId]);

  const [activePresetId, setActivePresetId] = useState<ThemePresetId>(() => {
    return rawWedding.theme.preset || 'botanical-sage';
  });

  // Keep preset in sync when couple changes
  useEffect(() => {
    setActivePresetId(rawWedding.theme.preset || 'botanical-sage');
  }, [rawWedding]);

  // Merge active preset with wedding colors and reception view filtering
  const wedding: WeddingConfig = useMemo(() => {
    const preset = THEME_PRESETS[activePresetId] || THEME_PRESETS['botanical-sage'];
    const base: WeddingConfig = {
      ...rawWedding,
      theme: {
        ...rawWedding.theme,
        preset: activePresetId,
        colors: preset.colors,
      },
    };

    if (!isReceptionOnly) return base;

    return {
      ...base,
      story: {
        ...base.story,
        paragraphs: [
          'Around February, Malvin asked Miracle for courtship. Taking her time and praying and waiting on GOD, Miracle made him wait six months before giving him an answer. In good humor, Malvin set a deadline: "If you don’t answer me by September 20th, I will stop asking!" It didn’t take until September. On August 5th, Miracle said a wholehearted YES, and the real adventure began.',
          'A while later came the proposal, a surprise evening hangout with dearest friends that turned into an unforgettable celebration and group dinner. Together, we found the perfect balance of calm strength, joyful laughter, and deep purpose. Now, we are ready to build a lifetime of love and forever together.',
        ],
      },
      couple: {
        ...base.couple,
        dateTeaser: 'January 9, 2027',
      },
      event: {
        ...base.event,
        displayDate: 'Saturday, January 9, 2027',
        shortDisplayDate: 'Jan 9, 2027',
        saveTheDateHeading: 'Wedding Reception',
        calendar: {
          title: 'Miracle & Malvin — Wedding Reception',
          description: 'Grand Wedding Reception celebration of Miracle Princess Chibudike & Malvin Uzor Uju at Apata School, Isolo, Lagos.',
          location: 'Apata School, Plot 36/42 Godwin Omonua Street, Ire-Akari Estate, Isolo, Lagos, Nigeria',
          startDate: '20270109T100000Z',
          endDate: '20270109T170000Z',
          downloadFilename: 'miracle-malvin-reception.ics',
        },
      },
      programme: base.programme.filter(p => p.icon === 'utensils' || p.title.toLowerCase().includes('reception')),
      qa: base.qa.map(q => {
        if (q.question.includes('dates and venues') || q.question.includes('date and venue')) {
          return {
            ...q,
            question: 'What is the reception date and venue?',
            answer: 'Our Wedding Reception takes place on Saturday, January 9, 2027 starting at 11:00 AM at Apata School (Plot 36/42 Godwin Omonua Street, Ire-Akari Estate, Isolo, Lagos, Nigeria).',
          };
        }
        return q;
      }),
    };
  }, [rawWedding, activePresetId, isReceptionOnly]);

  useEffect(() => {
    applyThemeVariables(wedding.theme.colors, wedding.couple.title);
    updateMetaTags(wedding);
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

  const setGuestView = (view: 'full' | 'reception') => {
    setOverrideGuestView(view);
  };

  const setPresetId = (id: ThemePresetId) => {
    if (THEME_PRESETS[id]) {
      setActivePresetId(id);
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
        activePresetId,
        setPresetId,
        availablePresets: ALL_THEME_PRESETS,
        isMasterAdmin,
        getRoleConfig,
        guestView,
        setGuestView,
        isReceptionOnly,
        isCeremonyOnly,
      }}
    >
      {children}

      {/* Floating Developer Theme & Couple Switcher Pill (Dev / Preview Mode) */}
      {isDev && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-neutral-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-white/20 text-xs font-sans select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          
          {/* Couple Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400 font-mono uppercase">Couple:</span>
            <select
              value={activeCoupleId}
              onChange={(e) => setCoupleId(e.target.value)}
              className="bg-transparent text-white font-medium cursor-pointer focus:outline-none text-xs pr-1"
            >
              {ALL_COUPLES.map((c) => (
                <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                  {c.couple.title}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[1px] h-3 bg-white/20" />

          {/* Theme Preset Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400 font-mono uppercase">Theme:</span>
            <select
              value={activePresetId}
              onChange={(e) => setPresetId(e.target.value as ThemePresetId)}
              className="bg-transparent text-amber-300 font-medium cursor-pointer focus:outline-none text-xs pr-1"
            >
              {ALL_THEME_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
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
