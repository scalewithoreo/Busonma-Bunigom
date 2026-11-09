export interface AdminRoleConfig {
  role: string;
  label: string;
  defaultPin: string;
  isMaster: boolean;
  relationFilter?: string;
}

export interface CoupleInfo {
  names: {
    bride: string;
    groom: string;
  };
  formalNames: {
    bride: string;
    groom: string;
  };
  title: string;
  hashtag: string;
  locationText: string;
  dateTeaser: string;
  logoImage: string;
  heroImage: string;
  wishlistImage: string;
  wishlistAlt: string;
}

export interface EventScheduleItem {
  name: string;
  venueName: string;
  address: string;
  mapQuery: string;
  directionsUrl: string;
}

export interface EventInfo {
  date: string; // ISO date for countdown timer
  displayDate: string; // e.g. "Saturday, December 12, 2026"
  church: EventScheduleItem;
  reception: EventScheduleItem;
  confettiColors: string[];
  calendar: {
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
  };
}

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  espresso: string;
  charcoal: string;
  cream: string;
  ivory: string;
  sand: string;
  sandDark: string;
  gold: string;
  goldDark: string;
  goldLight: string;
  wine: string;
  muted: string;
}

export interface ColorLookItem {
  id: string;
  src: string;
  title: string;
  category: string;
  caption: string;
}

export interface ColorBandItem {
  name: string;
  hex: string;
  subtitle: string;
  bgImage?: string;
  tag?: string;
}

export interface ThemeConfig {
  introStyle: 'none' | 'envelope';
  envelope?: {
    monogram: string;
    waxSealImage: string;
    paperTextureImage: string;
  };
  colors: ThemeColors;
  dressCodeDescription: string;
  paletteBands: ColorBandItem[];
  paletteLayout: 'bands' | 'grid';
  looks: ColorLookItem[];
}

export interface StoryConfig {
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  paragraphs: string[];
  signoff: string;
}

export interface ProgrammeItem {
  time: string;
  title: string;
  subtitle: string;
  description: string;
  icon: 'church' | 'utensils' | 'music' | 'camera';
  highlight?: boolean;
}

export interface QandAItem {
  question: string;
  answer: string;
  contacts?: { name: string; phone: string }[];
}

export interface BankAccount {
  accountName: string;
  bankName: string;
  accountNumber: string;
}

export interface AdminSecurityConfig {
  roles: AdminRoleConfig[];
  pinSalt: string;
  emergencyPin: string;
}

export interface DatabaseConfig {
  type: 'supabase' | 'turso' | 'local';
  storagePrefix: string;
  turso?: {
    url: string;
    authToken: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  featured?: boolean;
}

export interface WeddingConfig {
  id: string;
  slug: string;
  domains: string[];
  couple: CoupleInfo;
  event: EventInfo;
  theme: ThemeConfig;
  story: StoryConfig;
  programme: ProgrammeItem[];
  qa: QandAItem[];
  bankAccounts: BankAccount[];
  admin: AdminSecurityConfig;
  gallery: GalleryItem[];
  database: DatabaseConfig;
}
