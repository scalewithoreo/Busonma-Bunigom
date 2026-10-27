export interface RsvpSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  attendance: 'yes' | 'no';
  relation?: string;
  message?: string;
  submittedAt: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'error';
}

export interface ScheduleItem {
  time: string;
  title: string;
  description: string;
  location: string;
  tag?: string;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
  featured?: boolean;
}

export interface WishlistItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  formattedPrice: string;
  category: 'Living & Comfort' | 'Kitchen & Dining' | 'Home & Bedding' | 'Milestone Gift';
  image: string;
  description: string;
  isFunded?: boolean;
  fundedBy?: string;
  isReserved?: boolean;
  reservedUntil?: string;
  reservedByEmail?: string;
  reservedByName?: string;
  isAnonymousReservation?: boolean;
}

export interface GiftReminder {
  id: string;
  itemId: string;
  itemName: string;
  itemPrice?: string;
  email: string;
  reservedByName?: string;
  relation?: string;
  isAnonymous?: boolean;
  remindDate: string;
  expiresAt?: string;
  createdAt: string;
}

export interface GiftPledge {
  id: string;
  itemId: string;
  itemName: string;
  amount: number;
  giverName: string;
  giverEmail?: string;
  giverNote?: string;
  giverRelation?: string;
  pledgedAt: string;
}
