export interface AdminRoleConfig {
  role: string;
  label: string;
  defaultPin: string;
  isMaster: boolean;
  accessPoint?: 'super' | 'family' | 'coordinator';
  codeLimit?: number;
  relationFilter?: string;
  createdAt?: string;
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
  heroObjectPosition?: string;
  rsvpAvatarImage?: string;
  wishlistImage: string;
  wishlistAlt: string;
}

export interface EventScheduleItem {
  name: string;
  venueName: string;
  address: string;
  date?: string;
  time?: string;
  mapQuery: string;
  directionsUrl: string;
  calendar?: {
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    downloadFilename?: string;
  };
}

export interface EventInfo {
  date: string; // ISO date for countdown timer
  displayDate: string; // e.g. "Saturday, December 12, 2026"
  shortDisplayDate?: string;
  rsvpDeadline?: string;
  saveTheDateHeading?: string;
  venueImage?: string;
  saveTheDateImage?: string;
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

export type ThemePresetId =
  | 'champagne-luxury'
  | 'editorial-noir'
  | 'botanical-sage'
  | 'parisian-blush'
  | 'terracotta-earth'
  | 'royal-sapphire';

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
  preset?: ThemePresetId;
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
  welcomeQuote?: string;
  image: string;
  imageAlt: string;
  paragraphs: string[];
  signoff: string;
}

export interface AudioConfig {
  title: string;
  artist: string;
  src?: string;
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

export interface TravelRoute {
  country: string;
  airlines: string;
}

export interface TransportContact {
  name: string;
  phone: string;
}

export interface HotelOption {
  name: string;
  city: string;
  area: string;
  description: string;
  type: string;
  discountCode?: string;
  whatsapp?: string;
}

export interface ApartmentOption {
  title: string;
  city: string;
  description: string;
  contactWhatsapp?: string;
}

export interface TravelAccommodationConfig {
  travel: {
    title: string;
    subtitle: string;
    lagosFlights: {
      airport: string;
      notes: string;
      routes: TravelRoute[];
    };
    abujaFlights: {
      airport: string;
      notes: string;
    };
    transport: {
      description: string;
      contacts: TransportContact[];
      rideApps: { name: string; url: string; note: string }[];
    };
    visa: {
      title: string;
      options: { title: string; cost: string; time: string; description: string; badge?: string }[];
      requirements: string[];
      portalUrl: string;
    };
    healthAdvice: string[];
  };
  accommodations: {
    title: string;
    subtitle: string;
    discountCode: string;
    hotels: HotelOption[];
    apartments: ApartmentOption[];
    agents: TransportContact[];
  };
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
  audio?: AudioConfig;
  travelAndStay?: TravelAccommodationConfig;
}
