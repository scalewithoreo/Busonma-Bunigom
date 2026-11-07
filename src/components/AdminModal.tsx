import { useState, useEffect, FC, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Users, Mail, MessageSquare, Trash2, Gift, KeyRound, Plus, Check, LogOut, Filter, Heart, Clock, X, Edit2, Upload, RotateCcw, XCircle, Image as ImageIcon, UploadCloud, Eye, Share2, Sparkles } from 'lucide-react';
import { 
  getStoredRsvps, deleteRsvp,
  getStoredGiftPledgesAdmin, exportGiftPledgesCsv, deleteGiftPledge,
  getInviteCodes, generateInviteCode, bulkGenerateInviteCodes, deleteInviteCodes, markInviteCodeAsShared, unmarkInviteCodeAsShared, resetInviteCode, reallocateInviteCode, InviteCode,
  getStoredWishlistItems, saveWishlistItem, deleteWishlistItem, updateWishlistItem,
  getStoredReminders, deleteReservation, markReservationFulfilled, clearMiracleMalvinDatabase,
  getStoredInvitationPosters, saveStoredInvitationPosters, uploadInvitationPoster, InvitationPostersConfig, DEFAULT_POSTERS
} from '../utils/storage';
import { sendReservationReminderEmail } from '../utils/email';
import { RsvpSubmission, GiftPledge, WishlistItem, GiftReminder } from '../types';
import { INITIAL_WISHLIST_ITEMS } from '../data/wishlistData';
import type { AdminRole } from '../pages/AdminPage';

interface AdminDashboardProps {
  isOpen: boolean; 
  onClose: () => void;
  onNotify: (title: string, message?: string) => void;
  role?: AdminRole;
}

export const AdminModal: FC<AdminDashboardProps> = ({ isOpen, onClose, onNotify, role = 'miracle' }) => {
  const [activeTab, setActiveTab] = useState<'rsvps' | 'codes' | 'gifts' | 'wishlist' | 'reservations' | 'invitations'>('rsvps');
  const [invitationPosters, setInvitationPosters] = useState<InvitationPostersConfig>(getStoredInvitationPosters);
  const [isUploadingPoster, setIsUploadingPoster] = useState<'general' | 'familyVip' | null>(null);
  const [previewPosterUrl, setPreviewPosterUrl] = useState<string | null>(null);
  const [sharingCode, setSharingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Completely pause Lenis smooth scroll while Admin Dashboard is open
  useEffect(() => {
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.stop();
    }
    return () => {
      if (lenis) lenis.start();
    };
  }, []);

  const [rsvps, setRsvps] = useState<RsvpSubmission[]>([]);
  const [pledges, setPledges] = useState<GiftPledge[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [reservations, setReservations] = useState<GiftReminder[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const getRoleCodeLimit = () => {
    if (['miracle', 'malvin'].includes(role || '')) return Infinity;
    if (role === 'custom1964') return 20;
    return 100;
  };
  const roleCodeLimit = getRoleCodeLimit();

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [bulkGenAmount, setBulkGenAmount] = useState<string>('1');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // New Wishlist Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Living & Comfort' | 'Kitchen & Dining' | 'Home & Bedding' | 'Milestone Gift'>('Living & Comfort');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [reservationStatusFilter, setReservationStatusFilter] = useState<'all' | 'active' | 'fulfilled' | 'expired'>('all');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const load = async () => {
        try {
          if (['miracle', 'malvin'].includes(role || '')) {
            const [loadedRsvps, loadedPledges, loadedCodes, loadedItems, loadedReservations] = await Promise.all([
              getStoredRsvps(),
              getStoredGiftPledgesAdmin(),
              getInviteCodes(),
              getStoredWishlistItems(),
              getStoredReminders()
            ]);
            setRsvps(loadedRsvps);
            setPledges(loadedPledges);
            setCodes(loadedCodes);
            setWishlistItems(loadedItems.length > 0 ? loadedItems : INITIAL_WISHLIST_ITEMS);
            setReservations(loadedReservations);
          } else if (['custom1964', 'groomsfamily', 'bridesfamily'].includes(role)) {
            // These roles get to see RSVPs for guests who used codes generated by them
            const [loadedRsvps, loadedCodes] = await Promise.all([
              getStoredRsvps(),
              getInviteCodes(role)
            ]);
            setCodes(loadedCodes);
            
            // Filter RSVPs to only those whose names match the 'used_by' on their invite codes
            const usedNames = loadedCodes
              .filter(c => c.is_used && c.used_by)
              .map(c => c.used_by!.trim().toLowerCase());
              
            const theirRsvps = loadedRsvps.filter(r => 
              usedNames.includes(`${r.firstName.trim()} ${r.lastName.trim()}`.toLowerCase())
            );
            setRsvps(theirRsvps);
          }
        } catch (err) {
          console.error('Failed to load dashboard data:', err);
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const totalGiftValue = pledges.reduce((acc, p) => acc + p.amount, 0);

  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [rsvpAttendanceFilter, setRsvpAttendanceFilter] = useState<'all' | 'attending' | 'declined'>('all');

  const rsvpCounts = useMemo(() => {
    let base = rsvps;
    if (['miracle', 'malvin'].includes(role || '') && creatorFilter !== 'all') {
      const creatorCodes = codes.filter(c => c.created_by === creatorFilter && c.is_used && c.used_by);
      const usedNames = creatorCodes.map(c => c.used_by!.trim().toLowerCase());
      base = base.filter(r => usedNames.includes(`${r.firstName.trim()} ${r.lastName.trim()}`.toLowerCase()));
    }
    const attending = base.filter(r => r.attendance === 'yes').length;
    const declined = base.filter(r => r.attendance === 'no').length;
    const total = base.length;
    return { attending, declined, total };
  }, [rsvps, creatorFilter, role, codes]);

  const filteredRsvps = useMemo(() => {
    let result = rsvps;
    if (['miracle', 'malvin'].includes(role || '') && creatorFilter !== 'all') {
      const creatorCodes = codes.filter(c => c.created_by === creatorFilter && c.is_used && c.used_by);
      const usedNames = creatorCodes.map(c => c.used_by!.trim().toLowerCase());
      result = result.filter(r => usedNames.includes(`${r.firstName.trim()} ${r.lastName.trim()}`.toLowerCase()));
    }
    if (rsvpAttendanceFilter === 'attending') {
      result = result.filter(r => r.attendance === 'yes');
    } else if (rsvpAttendanceFilter === 'declined') {
      result = result.filter(r => r.attendance === 'no');
    }
    return result;
  }, [rsvps, creatorFilter, role, codes, rsvpAttendanceFilter]);

  const [codeStatusFilter, setCodeStatusFilter] = useState<'all' | 'available' | 'shared' | 'used'>('all');

  const codeStats = useMemo(() => {
    const base = ['miracle', 'malvin'].includes(role || '') && creatorFilter !== 'all'
      ? codes.filter(c => c.created_by === creatorFilter)
      : codes;

    const total = base.length;
    const used = base.filter(c => c.is_used).length;
    const unused = base.filter(c => !c.is_used).length;
    const shared = base.filter(c => !c.is_used && c.is_shared).length;
    const available = base.filter(c => !c.is_used && !c.is_shared).length;

    return { total, used, unused, shared, available };
  }, [codes, creatorFilter, role]);

  const filteredCodes = useMemo(() => {
    let result = codes;
    if (['miracle', 'malvin'].includes(role || '') && creatorFilter !== 'all') {
      result = result.filter(c => c.created_by === creatorFilter);
    }
    if (codeStatusFilter === 'available') {
      result = result.filter(c => !c.is_used && !c.is_shared);
    } else if (codeStatusFilter === 'shared') {
      result = result.filter(c => !c.is_used && c.is_shared);
    } else if (codeStatusFilter === 'used') {
      result = result.filter(c => c.is_used);
    }
    return result;
  }, [codes, creatorFilter, role, codeStatusFilter]);

  const handleGenerateCode = async () => {
    let amount = parseInt(bulkGenAmount, 10);
    if (isNaN(amount) || amount < 1) amount = 1;
    if (amount > 100) amount = 100;

    if (!['miracle', 'malvin'].includes(role || '') && codes.length + amount > roleCodeLimit) {
      alert(`You can only create up to ${roleCodeLimit} codes. You have ${codes.length} already.`);
      return;
    }

    setIsGenerating(true);
    try {
      if (amount === 1) {
        const newCode = await generateInviteCode(role);
        onNotify('Code Generated', `New invite code: ${newCode}`);
      } else {
        await bulkGenerateInviteCodes(amount, role);
        onNotify('Codes Generated', `Successfully generated ${amount} new invite codes.`);
      }
      
      const updatedCodes = await getInviteCodes(role);
      setCodes(updatedCodes);
    } catch (e) {
      console.error(e);
      alert('Failed to generate codes.');
    }
    setIsGenerating(false);
  };

  const handleDeleteSelectedCodes = () => {
    if (selectedCodes.size === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Invite Codes',
      message: `Are you sure you want to permanently delete ${selectedCodes.size} selected invite code(s)?`,
      onConfirm: async () => {
        try {
          const idsToDelete = Array.from(selectedCodes);
          await deleteInviteCodes(idsToDelete);
          
          const updatedCodes = await getInviteCodes(role);
          setCodes(updatedCodes);
          setSelectedCodes(new Set()); // clear selection
          onNotify('Codes Deleted', `Successfully deleted ${idsToDelete.length} codes.`);
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to delete selected codes.');
        }
      }
    });
  };

  const toggleCodeSelection = (id: string) => {
    const next = new Set(selectedCodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCodes(next);
  };

  const toggleSelectAllCodes = () => {
    const unusedCodes = codes.filter(c => !c.is_used);
    
    // If all unused codes are currently selected, deselect all
    if (unusedCodes.length > 0 && selectedCodes.size === unusedCodes.length) {
      setSelectedCodes(new Set()); 
    } else {
      // Select all unused codes
      setSelectedCodes(new Set(unusedCodes.map(c => c.id)));
    }
  };

    const getInviteMessage = (code: string, creatorRole: string) => {
      const websiteUrl = window.location.origin;
      
      const codeSection = `📌 *YOUR EXCLUSIVE RSVP CODE* 📌
To help us finalize our guest list, please use your unique code 👉 *${code}* 👈 to RSVP online here: 
🔗 ${websiteUrl}
*(Kindly note that this code can only be used once)*
✨ *A Gentle Reminder:* As much as we love little ones, this will be an adult-only celebration. Thank you so much for understanding!`;

      if (creatorRole === 'bridesfamily') {
        return `*WEDDING INVITATION 💍*\nIt gives us immense joy to announce the forthcoming wedding of our daughter, *Miracle* and *Malvin*, taking place on *Wednesday, January 27th, 2027*!\n${codeSection}`;
      } else if (creatorRole === 'groomsfamily') {
        return `*WEDDING INVITATION 💍*\nIt gives us immense joy to announce the forthcoming wedding of our son, *Malvin* and *Miracle*, taking place on *Wednesday, January 27th, 2027*!\n${codeSection}`;
      } else if (['miracle', 'malvin'].includes(creatorRole || '')) {
        return `*WEDDING INVITATION 💍*\nWe are absolutely overjoyed to invite you to celebrate with us as we tie the knot on *Wednesday, January 27th, 2027*!\n${codeSection}`;
      }
      
      // Default for 'custom1964' or anything else
      return `*WEDDING INVITATION 💍*\nIt gives us immense joy to announce the forthcoming wedding of *Miracle* and *Malvin*, taking place on *Wednesday, January 27th, 2027*!\n${codeSection}`;
    };


  const handleShareCode = (code: string) => {
    setSharingCode(code);
  };

  const executeShare = async (code: string, tier: 'general' | 'familyVip') => {
    const targetCode = codes.find(c => c.code === code);
    const creatorRole = targetCode?.created_by || role || 'miracle';
    const text = getInviteMessage(code, creatorRole);
    const posterUrl = tier === 'familyVip' ? invitationPosters.familyVipUrl : invitationPosters.generalUrl;

    const markShared = async () => {
      setCopiedCode(code);
      if (targetCode && !targetCode.is_shared) {
        try {
          await markInviteCodeAsShared(targetCode.id);
          setCodes(prev => prev.map(c => c.id === targetCode.id ? { ...c, is_shared: true } : c));
        } catch (e) {
          console.error('Failed to save shared status to DB', e);
        }
      }
      setTimeout(() => setCopiedCode(null), 2500);
      setSharingCode(null);
    };

    let filesArray: File[] = [];
    try {
      const response = await fetch(posterUrl);
      const blob = await response.blob();
      const filename = tier === 'familyVip' ? 'Miracle_and_Malvin_VIP_Invitation.png' : 'Miracle_and_Malvin_Invitation.png';
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      filesArray = [file];
    } catch (fetchErr) {
      console.warn('Could not load IV poster image for sharing', fetchErr);
    }

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: tier === 'familyVip' ? 'Miracle & Malvin VIP Wedding Invitation' : 'Miracle & Malvin Wedding Invitation',
          text: text,
        };
        if (filesArray.length > 0 && navigator.canShare && navigator.canShare({ files: filesArray })) {
          shareData.files = filesArray;
        }
        await navigator.share(shareData);
        await markShared();
        onNotify('Invitation Shared', `${tier === 'familyVip' ? 'VIP' : 'General'} invite with code ${code} shared.`);
        return;
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.log('Share API error or cancelled', e);
        } else {
          setSharingCode(null);
          return;
        }
      }
    }

    try {
      let imageBlob: Blob | null = filesArray[0] || null;
      if (!imageBlob) {
        try {
          const response = await fetch(posterUrl);
          imageBlob = await response.blob();
        } catch (e) {
          console.warn('Could not fetch poster image for clipboard', e);
        }
      }

      if (imageBlob && navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
        try {
          const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            [imageBlob.type]: imageBlob
          });
          await navigator.clipboard.write([clipboardItem]);
          await markShared();
          onNotify('Copied to Clipboard', `${tier === 'familyVip' ? 'VIP' : 'General'} card image & invite text copied!`);
          return;
        } catch (writeError) {
          console.warn('ClipboardItem failed, copying text only', writeError);
        }
      }

      await navigator.clipboard.writeText(text);
      await markShared();
      onNotify('Copied to Clipboard', `Invitation text with code ${code} copied!`);
    } catch (e) {
      onNotify('Error', 'Failed to copy to clipboard.');
      setSharingCode(null);
    }
  };

  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>, tier: 'general' | 'familyVip') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPoster(tier);
    try {
      const url = await uploadInvitationPoster(file, tier);
      const updated: InvitationPostersConfig = {
        ...invitationPosters,
        [tier === 'general' ? 'generalUrl' : 'familyVipUrl']: url,
        [tier === 'general' ? 'generalUpdatedAt' : 'familyVipUpdatedAt']: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setInvitationPosters(updated);
      saveStoredInvitationPosters(updated);
      onNotify('Poster Updated', `${tier === 'familyVip' ? 'Family & VIP' : 'General'} invitation poster updated.`);
    } catch (err) {
      console.error(err);
      onNotify('Upload Failed', 'Failed to upload new poster.');
    } finally {
      setIsUploadingPoster(null);
      e.target.value = '';
    }
  };

  const handleResetPoster = (tier: 'general' | 'familyVip') => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Poster',
      message: `Are you sure you want to restore the default ${tier === 'familyVip' ? 'Family & VIP' : 'General'} invitation poster?`,
      onConfirm: () => {
        const updated: InvitationPostersConfig = {
          ...invitationPosters,
          [tier === 'general' ? 'generalUrl' : 'familyVipUrl']: tier === 'general' ? DEFAULT_POSTERS.generalUrl : DEFAULT_POSTERS.familyVipUrl,
          [tier === 'general' ? 'generalUpdatedAt' : 'familyVipUpdatedAt']: 'Default Asset'
        };
        setInvitationPosters(updated);
        saveStoredInvitationPosters(updated);
        onNotify('Poster Reset', `${tier === 'familyVip' ? 'Family & VIP' : 'General'} poster restored to default.`);
      }
    });
  };

  const handleReallocateRsvpCode = (rsvp: RsvpSubmission, matchingCode?: InviteCode) => {
    const guestName = `${rsvp.firstName} ${rsvp.lastName}`.trim();
    const creator = matchingCode?.created_by || (creatorFilter !== 'all' ? creatorFilter : (role || 'malvin'));
    const oldCodeStr = matchingCode ? `code ${matchingCode.code}` : `the invite code for ${guestName}`;

    setConfirmDialog({
      isOpen: true,
      title: 'Re-allocate Invite Code',
      message: `Are you sure you want to re-allocate ${oldCodeStr} (guest: ${guestName})? This will permanently delete ${oldCodeStr} so they cannot reuse it, and generate a brand new code in your Available pool for a new guest.`,
      onConfirm: async () => {
        try {
          let newCodeStr = '';
          if (matchingCode) {
            const res = await reallocateInviteCode(matchingCode.id, creator);
            newCodeStr = typeof res === 'object' && res.code ? res.code : String(res);
          } else {
            newCodeStr = await generateInviteCode(creator);
          }
          const updatedCodes = await getInviteCodes(role);
          setCodes(updatedCodes);
          onNotify(
            'Code Re-allocated',
            `Fresh code ${newCodeStr} generated and added to Available codes for a new guest.`
          );
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to re-allocate invite code.');
        }
      }
    });
  };

  const handleReallocateCode = (id: string, oldCode: string, creator: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Re-allocate Invite Code',
      message: `Are you sure you want to replace code ${oldCode} with a freshly generated code? The old code ${oldCode} will be permanently removed so previous recipients cannot use it.`,
      onConfirm: async () => {
        try {
          const newCode = await reallocateInviteCode(id, creator);
          const updatedCodes = await getInviteCodes(role);
          setCodes(updatedCodes);
          const newCodeStr = typeof newCode === 'object' && (newCode as any).code ? (newCode as any).code : String(newCode);
          onNotify('Code Re-allocated', `Old code ${oldCode} deleted. Fresh code generated: ${newCodeStr}`);
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to re-allocate invite code.');
        }
      }
    });
  };

  const handleResetCode = async (id: string) => {
    try {
      await resetInviteCode(id);
      const updatedCodes = await getInviteCodes(role);
      setCodes(updatedCodes);
      onNotify('Code Reset', 'Invite code restored to available and unshared.');
    } catch (e) {
      onNotify('Error', 'Failed to reset code.');
    }
  };

  const handleUnmarkShared = async (id: string) => {
    try {
      await unmarkInviteCodeAsShared(id);
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_shared: false } : c));
    } catch (e) {
      onNotify('Error', 'Failed to unmark shared status.');
    }
  };

  const handleDeleteRsvp = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete RSVP',
      message: 'Are you sure you want to permanently delete this RSVP from the database?',
      onConfirm: async () => {
        try {
          await deleteRsvp(id);
          setRsvps((prev) => prev.filter((r) => r.id !== id));
          onNotify('RSVP Deleted', 'The guest entry was deleted from the database.');
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to delete RSVP from database.');
        }
      }
    });
  };

  const handleDeletePledge = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Pledge',
      message: 'Are you sure you want to permanently delete this gift payment entry from the database?',
      onConfirm: async () => {
        try {
          await deleteGiftPledge(id);
          setPledges((prev) => prev.filter((p) => p.id !== id));
          onNotify('Pledge Deleted', 'The gift payment entry was deleted from the database.');
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to delete pledge from database.');
        }
      }
    });
  };

  const handleDeleteReservation = (id: string, itemId: string, guestName?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Release Reservation',
      message: `Are you sure you want to release the reservation held by ${guestName || 'this guest'}? The item will immediately become available again.`,
      onConfirm: async () => {
        try {
          await deleteReservation(id, itemId);
          setReservations((prev) => prev.filter((r) => r.id !== id));
          onNotify('Reservation Released', 'The item reservation was cancelled and released.');
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to release reservation.');
        }
      }
    });
  };


  // Helper to check if a reservation is fulfilled (either explicitly flagged, or matching pledge/wishlist funded status)
  const isReservationFulfilled = (r: GiftReminder): boolean => {
    if (r.isFulfilled) return true;
    const hasPledge = pledges.some(p => p.itemId === r.itemId || (p.giverEmail && r.email && p.giverEmail.toLowerCase() === r.email.toLowerCase()));
    const item = wishlistItems.find(w => w.id === r.itemId);
    return Boolean(hasPledge || item?.isFunded);
  };

  const handleSendReminder = async (r: GiftReminder) => {
    if (!r.email) {
      onNotify('Error', 'This reservation has no email address.');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Send Reminder Email',
      message: `Are you sure you want to send a reminder email to ${r.reservedByName || 'this guest'} at ${r.email}?`,
      onConfirm: async () => {
        try {
          const res = await sendReservationReminderEmail({
            guestName: r.reservedByName || 'Guest',
            guestEmail: r.email as string,
            itemName: r.itemName,
            itemPrice: r.itemPrice || '',
            expiresAt: r.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
          
          if (res.success) {
            onNotify('Reminder Sent', `A reminder email was sent to ${r.email}.`);
          } else {
            throw new Error('Email failed to send');
          }
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to send reminder email.');
        }
      }
    });
  };


  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize on canvas to max 1000px so storage remains fast and lightweight
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setNewItemImage(dataUrl);
        } else {
          setNewItemImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddWishlistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert('Please enter an item name.');
      return;
    }
    if (!newItemImage) {
      alert('Please upload an image from your device or provide an image link.');
      return;
    }

    const priceNum = parseInt(newItemPrice.replace(/\D/g, ''), 10) || 0;
    if (priceNum <= 0) {
      alert('Please enter a valid price greater than 0.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const formatted = priceNum.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 });
      const qty = parseInt(newItemQuantity, 10) || 1;

      if (editingItemId) {
        // Update existing item
        const updatedItem = await updateWishlistItem({
          id: editingItemId,
          name: newItemName,
          quantity: qty,
          price: priceNum,
          formattedPrice: formatted,
          category: newItemCategory,
          image: newItemImage,
          description: newItemDesc
        });

        setWishlistItems(wishlistItems.map(i => i.id === editingItemId ? updatedItem : i));
        onNotify('Item Updated', `${newItemName} was updated successfully.`);
      } else {
        // Add new item
        const newItem = await saveWishlistItem({
          name: newItemName,
          quantity: qty,
          price: priceNum,
          formattedPrice: formatted,
          category: newItemCategory,
          image: newItemImage,
          description: newItemDesc
        });

        setWishlistItems([...wishlistItems, newItem]);
        onNotify('Item Added', `${newItemName} was added to the wishlist.`);
      }
      
      // Reset form
      setNewItemName('');
      setNewItemPrice('');
      setNewItemImage('');
      setNewItemDesc('');
      setNewItemQuantity('1');
      setIsAddingItem(false);
      setEditingItemId(null);
    } catch (err) {
      console.error(err);
      alert(editingItemId ? 'Failed to update wishlist item.' : 'Failed to add wishlist item. Please verify your Supabase wishlist_items table.');
    }
    setIsSubmittingItem(false);
  };

  const handleEditWishlistItem = (item: WishlistItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemPrice(item.price.toLocaleString('en-US'));
    setNewItemQuantity(String(item.quantity));
    setNewItemImage(item.image);
    setNewItemDesc(item.description);
    setImageInputMode(item.image.startsWith('data:') ? 'upload' : 'url');
    setIsAddingItem(true);
  };

  const handleDeleteWishlistItem = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Wishlist Item',
      message: 'Are you sure you want to completely remove this item from the wishlist?',
      onConfirm: async () => {
        try {
          await deleteWishlistItem(id);
          setWishlistItems(wishlistItems.filter(i => i.id !== id));
          onNotify('Item Deleted', 'The wishlist item was removed.');
        } catch (err) {
          console.error(err);
          onNotify('Error', 'Failed to delete item.');
        }
      }
    });
  };


  return (
    <div 
      className="fixed inset-0 z-50 h-[100dvh] w-full bg-brand-ivory flex flex-col font-sans overflow-hidden"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      data-lenis-prevent="true"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Header */}
      <div className="bg-brand-espresso px-6 sm:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-md z-20">
        <div>
          <h2 className="text-2xl font-serif text-brand-goldLight">Miracle & Malvin</h2>
          <p className="text-brand-cream/70 text-xs font-sans tracking-widest uppercase mt-1.5">
            Admin Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['miracle', 'malvin'].includes(role || '') && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to completely clear the guest list and reset the database for Miracle & Malvin? This will reset all RSVPs, invite codes, and pledges.')) {
                  clearMiracleMalvinDatabase();
                  setRsvps([]);
                  setCodes([]);
                  setPledges([]);
                  setReservations([]);
                  setWishlistItems(INITIAL_WISHLIST_ITEMS);
                  onNotify('Database Cleared', 'Miracle & Malvin database has been reset fresh.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-900/60 transition-colors text-xs font-semibold tracking-wider uppercase"
              title="Reset backend database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset DB</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-brand-cream/10 rounded-xl text-brand-cream hover:bg-brand-primary hover:text-white transition-colors text-sm font-semibold tracking-wider uppercase"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 px-6 sm:px-12 pt-8 pb-0 shrink-0 overflow-x-auto bg-brand-ivory z-10 border-b border-brand-sand/50" data-lenis-prevent="true">
        {(['miracle', 'malvin'].includes(role || '') || ['custom1964', 'groomsfamily', 'bridesfamily'].includes(role)) && (
          <button
            onClick={() => setActiveTab('rsvps')}
            className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
              activeTab === 'rsvps'
                ? 'bg-brand-espresso text-brand-goldLight'
                : 'bg-white text-brand-muted hover:bg-brand-sand/50'
            }`}
          >
            <Users className="w-4 h-4" /> {!['miracle', 'malvin'].includes(role || '') ? 'My Guests RSVPs' : 'Guest RSVPs'}
          </button>
        )}
        {['miracle', 'malvin'].includes(role || '') && (
          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
              activeTab === 'gifts'
                ? 'bg-brand-espresso text-brand-goldLight'
                : 'bg-white text-brand-muted hover:bg-brand-sand/50'
            }`}
          >
            <Gift className="w-4 h-4" /> Gift Payments
          </button>
        )}

        <button
          onClick={() => setActiveTab('codes')}
          className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'codes'
              ? 'bg-brand-espresso text-brand-goldLight'
              : 'bg-white text-brand-muted hover:bg-brand-sand/50'
          }`}
        >
          <KeyRound className="w-4 h-4" /> Invite Codes
        </button>

        {['miracle', 'malvin'].includes(role || '') && (
          <>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'wishlist'
                  ? 'bg-brand-espresso text-brand-goldLight'
                  : 'bg-white text-brand-muted hover:bg-brand-sand/50'
              }`}
            >
              <Heart className="w-4 h-4" /> Wishlist
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'reservations'
                  ? 'bg-brand-espresso text-brand-goldLight'
                  : 'bg-white text-brand-muted hover:bg-brand-sand/50'
              }`}
            >
              <Clock className="w-4 h-4" /> Reservations
              {reservations.length > 0 && (
                <span className="bg-brand-primary text-white px-2 py-0.5 rounded-full text-[10px] ml-1">
                  {reservations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'invitations'
                  ? 'bg-brand-espresso text-brand-goldLight'
                  : 'bg-white text-brand-muted hover:bg-brand-sand/50'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Invitations
            </button>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-brand-ivory p-6 sm:p-12" style={{ WebkitOverflowScrolling: 'touch' }} data-lenis-prevent="true">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
              <p className="text-sm text-brand-muted font-sans tracking-wider uppercase">Loading dashboard…</p>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'rsvps' && (
              <motion.div
                key="rsvps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* RSVP Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                  <button
                    onClick={() => setRsvpAttendanceFilter(rsvpAttendanceFilter === 'attending' ? 'all' : 'attending')}
                    className={`text-left p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm transition-all border-2 ${
                      rsvpAttendanceFilter === 'attending'
                        ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'bg-white border-transparent hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-muted font-bold">Attending</p>
                      {rsvpAttendanceFilter === 'attending' && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">Filtered</span>
                      )}
                    </div>
                    <p className="text-3xl sm:text-4xl font-sans font-semibold text-emerald-700">{rsvpCounts.attending}</p>
                  </button>

                  <button
                    onClick={() => setRsvpAttendanceFilter(rsvpAttendanceFilter === 'declined' ? 'all' : 'declined')}
                    className={`text-left p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm transition-all border-2 ${
                      rsvpAttendanceFilter === 'declined'
                        ? 'bg-rose-50/70 border-rose-600 ring-2 ring-rose-500/30'
                        : 'bg-white border-transparent hover:border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-muted font-bold">Declined</p>
                      {rsvpAttendanceFilter === 'declined' && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">Filtered</span>
                      )}
                    </div>
                    <p className="text-3xl sm:text-4xl font-sans font-semibold text-rose-700">{rsvpCounts.declined}</p>
                  </button>

                  <button
                    onClick={() => setRsvpAttendanceFilter('all')}
                    className={`text-left p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm col-span-2 sm:col-span-1 transition-all border-2 ${
                      rsvpAttendanceFilter === 'all'
                        ? 'bg-brand-cream/40 border-brand-espresso ring-2 ring-brand-gold/30'
                        : 'bg-white border-transparent hover:border-brand-sand'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-muted font-bold">Total Responses</p>
                      {rsvpAttendanceFilter === 'all' && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-goldDark">All</span>
                      )}
                    </div>
                    <p className="text-3xl sm:text-4xl font-sans font-semibold text-brand-espresso">{rsvpCounts.total}</p>
                  </button>
                </div>

                {/* RSVP Actions & Table */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
                  {/* Table Header & Actions */}
                  <div className="p-6 border-b border-brand-sand/30 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                      <h3 className="font-serif text-2xl text-brand-espresso shrink-0">Guest List</h3>
                      
                      <div className="flex flex-col gap-3 w-full sm:w-auto">


                        {/* Creator Filter for Master */}
                        {['miracle', 'malvin'].includes(role || '') && (
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-brand-sand/30 rounded-xl text-brand-muted text-xs font-bold uppercase tracking-wider mr-2">
                              <Filter className="w-3.5 h-3.5" /> Creator
                            </div>
                          {(() => {
                            // Compute RSVP count per creator
                            const getCreatorRsvpCount = (creatorId: string): number => {
                              if (creatorId === 'all') return rsvps.length;
                              const creatorCodes = codes.filter(c => c.created_by === creatorId && c.is_used && c.used_by);
                              const usedNames = creatorCodes.map(c => c.used_by!.trim().toLowerCase());
                              return rsvps.filter(r => usedNames.includes(`${r.firstName.trim()} ${r.lastName.trim()}`.toLowerCase())).length;
                            };

                            return [
                              { id: 'all', label: 'All' },
                              { id: 'miracle', label: 'Miracle' },
                              { id: 'malvin', label: 'Malvin' },
                              { id: 'groomsfamily', label: "Malvin's Family" },
                              { id: 'bridesfamily', label: "Miracle's Family" },
                              { id: 'custom1964', label: 'Coordinator' }
                            ].map((f) => {
                              const count = getCreatorRsvpCount(f.id);
                              return (
                                <button
                                  key={f.id}
                                  onClick={() => setCreatorFilter(f.id)}
                                  className={`px-4 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all border ${
                                    creatorFilter === f.id 
                                      ? 'bg-brand-espresso text-brand-goldLight border-brand-espresso shadow-md' 
                                      : 'bg-white text-brand-muted border-brand-sand/50 hover:bg-brand-sand/30 hover:border-brand-sand'
                                  }`}
                                >
                                  {f.label} ({count})
                                </button>
                              );
                            });
                          })()}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (rsvps.length === 0) {
                          onNotify('Export Failed', 'No RSVPs to export');
                          return;
                        }
                        
                        try {
                          const XLSX = await import('xlsx');
                          const wb = XLSX.utils.book_new();
                          
                          const formatData = (data: typeof rsvps) => data.map(r => ({
                            'First Name': r.firstName,
                            'Last Name': r.lastName,
                            'Email': r.email || '',
                            'Attendance': r.attendance === 'yes' ? 'Attending' : 'Declined',
                            'Message': r.message || '',
                            'Submitted At': new Date(r.submittedAt).toLocaleString()
                          }));

                          if (['miracle', 'malvin'].includes(role || '')) {
                            const roles = ['miracle', 'malvin', 'groomsfamily', 'bridesfamily', 'custom1964'];
                            const roleLabels: Record<string, string> = {
                              'miracle': 'Miracle',
                              'malvin': 'Malvin',
                              'groomsfamily': "Malvin's Family",
                              'bridesfamily': "Miracle's Family",
                              'custom1964': "Coordinator"
                            };
                            
                            // Add a sheet for each creator
                            roles.forEach(creatorRole => {
                              const creatorCodes = codes.filter(c => c.created_by === creatorRole && c.is_used && c.used_by);
                              const usedNames = creatorCodes.map(c => c.used_by!.trim().toLowerCase());
                              const roleRsvps = rsvps.filter(r => usedNames.includes(`${r.firstName.trim()} ${r.lastName.trim()}`.toLowerCase()));
                              
                              if (roleRsvps.length > 0) {
                                const ws = XLSX.utils.json_to_sheet(formatData(roleRsvps));
                                XLSX.utils.book_append_sheet(wb, ws, roleLabels[creatorRole]);
                              }
                            });
                            
                            // Add an "All RSVPs" sheet for complete visibility
                            const wsAll = XLSX.utils.json_to_sheet(formatData(rsvps));
                            XLSX.utils.book_append_sheet(wb, wsAll, 'All RSVPs');
                          } else {
                            const ws = XLSX.utils.json_to_sheet(formatData(filteredRsvps));
                            XLSX.utils.book_append_sheet(wb, ws, 'My Guest List');
                          }
                          
                          XLSX.writeFile(wb, `Miracle_Malvin_Wedding_Guestlist_${new Date().toISOString().split('T')[0]}.xlsx`);
                        } catch (e) {
                          console.error('Export error:', e);
                          onNotify('Export Failed', 'There was an error generating the Excel file.');
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-espresso text-brand-goldLight text-xs font-sans uppercase tracking-wider rounded-xl hover:bg-brand-charcoal transition-colors font-bold shrink-0 w-full xl:w-auto mt-4 xl:mt-0"
                    >
                      <Download className="w-4 h-4" /> Export Excel
                    </button>
                  </div>

                  <div className="overflow-x-auto min-h-[400px]" data-lenis-prevent="true">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-cream/30 text-xs uppercase tracking-widest font-sans text-brand-muted border-b border-brand-sand/30">
                          <th className="p-6 font-semibold w-16 text-center text-brand-muted">#</th>
                          <th className="p-6 font-semibold">Guest Name</th>
                          <th className="p-6 font-semibold">Status</th>
                          <th className="p-6 font-semibold">Contact / Message</th>
                          <th className="p-6 font-semibold">Date</th>
                          <th className="p-6 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-sans text-brand-espresso">
                        {filteredRsvps.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-brand-muted text-base">
                              {rsvps.length > 0 ? 'No guests found for this filter.' : 'No RSVPs received yet.'}
                            </td>
                          </tr>
                        ) : (
                          filteredRsvps.map((rsvp, index) => (
                            <tr key={rsvp.id} className="border-b border-brand-sand/30 hover:bg-brand-cream/20 transition-colors">
                              <td className="p-6 text-center text-brand-muted/70 font-mono text-xs">
                                {index + 1}
                              </td>
                              <td className="p-6 font-semibold whitespace-nowrap text-base">
                                {rsvp.firstName} {rsvp.lastName}
                              </td>
                              <td className="p-6">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  rsvp.attendance === 'yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {rsvp.attendance === 'yes' ? 'Attending' : 'Declined'}
                                </span>
                              </td>
                              <td className="p-6 min-w-[250px]">
                                {rsvp.email && (
                                  <div className="flex items-center gap-2 text-sm text-brand-muted mb-2 font-medium">
                                    <Mail className="w-4 h-4" /> {rsvp.email}
                                  </div>
                                )}
                                {rsvp.message && (
                                  <div className="flex items-start gap-2 text-sm italic bg-brand-ivory p-3 rounded-xl">
                                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-brand-goldDark" />
                                    <span className="break-words whitespace-pre-wrap">{rsvp.message}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-6 text-sm text-brand-muted whitespace-nowrap font-medium">
                                {new Date(rsvp.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 sm:p-6 text-right whitespace-nowrap">
                                {(() => {
                                  const guestFullName = `${rsvp.firstName.trim()} ${rsvp.lastName.trim()}`.toLowerCase();
                                  const matchingCode = codes.find(c => c.is_used && c.used_by && c.used_by.trim().toLowerCase() === guestFullName);
                                  return (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleReallocateRsvpCode(rsvp, matchingCode)}
                                        className="px-2.5 py-1.5 rounded-xl bg-brand-sand/40 hover:bg-amber-100 text-brand-espresso hover:text-amber-900 border border-brand-sand/60 text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                                        title={matchingCode ? `Re-allocate code ${matchingCode.code} (Guest: ${rsvp.firstName})` : `Generate replacement code for ${rsvp.firstName}`}
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Re-allocate Code</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRsvp(rsvp.id)}
                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                                        title="Delete RSVP record"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'gifts' && (
              <motion.div
                key="gifts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Gift Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-goldDark shrink-0">
                      <Gift className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-muted font-bold mb-0.5 sm:mb-1 line-clamp-1">Gifts Paid</p>
                      <p className="text-2xl sm:text-4xl font-sans font-semibold text-brand-espresso">{pledges.length}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <span className="font-mono text-xl sm:text-2xl font-bold">₦</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-muted font-bold mb-0.5 sm:mb-1 line-clamp-1">Total Value</p>
                      <p className="text-xl sm:text-4xl font-sans font-semibold text-brand-espresso truncate">
                        {totalGiftValue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gifts Table */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-brand-sand/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                    <h3 className="font-serif text-2xl text-brand-espresso">Gift Payments</h3>
                    <button
                      onClick={exportGiftPledgesCsv}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-espresso text-brand-goldLight text-xs font-sans uppercase tracking-wider rounded-xl hover:bg-brand-charcoal transition-colors font-bold"
                    >
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto min-h-[400px]" data-lenis-prevent="true">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-cream/30 text-xs uppercase tracking-widest font-sans text-brand-muted border-b border-brand-sand/30">
                          <th className="p-6 font-semibold">Item & Amount</th>
                          <th className="p-6 font-semibold">Giver Details</th>
                          <th className="p-6 font-semibold">Note</th>
                          <th className="p-6 font-semibold">Date</th>
                          <th className="p-6 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-sans text-brand-espresso">
                        {pledges.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-brand-muted text-base">
                              No gift payments recorded yet.
                            </td>
                          </tr>
                        ) : (
                          pledges.map((p) => (
                            <tr key={p.id} className="border-b border-brand-sand/30 hover:bg-brand-cream/20 transition-colors">
                              <td className="p-6">
                                <p className="font-sans font-semibold text-base mb-1">{p.itemName}</p>
                                <p className="font-sans font-bold text-emerald-700">
                                  {(p.amount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
                                </p>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold whitespace-nowrap text-base">{p.giverName}</p>
                                  {p.giverRelation && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold/15 text-brand-goldDark">
                                      {p.giverRelation}
                                    </span>
                                  )}
                                </div>
                                {p.giverEmail && <p className="text-sm text-brand-muted mt-1 font-medium">{p.giverEmail}</p>}
                              </td>
                              <td className="p-6 min-w-[250px]">
                                {p.giverNote ? (
                                  <div className="text-sm italic bg-brand-ivory p-3 rounded-xl">
                                    {p.giverNote}
                                  </div>
                                ) : <span className="text-brand-muted/50">-</span>}
                              </td>
                              <td className="p-6 text-sm text-brand-muted whitespace-nowrap font-medium">
                                {new Date(p.pledgedAt).toLocaleDateString()}
                              </td>
                              <td className="p-6 text-right">
                                <button
                                  onClick={() => handleDeletePledge(p.id)}
                                  className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'codes' && (
              <motion.div
                key="codes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Codes Action */}
                <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="font-serif text-2xl text-brand-espresso mb-2">Generate Invite Codes</h3>
                    <p className="text-base font-sans text-brand-muted">
                      Create unique 5-digit passcodes for your guests to access the RSVP form.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="number"
                      min="1"
                      max={!['miracle', 'malvin'].includes(role || '') ? Math.max(0, roleCodeLimit - codes.length) : 100}
                      disabled={!['miracle', 'malvin'].includes(role || '') && codes.length >= roleCodeLimit}
                      value={bulkGenAmount}
                      onChange={(e) => setBulkGenAmount(e.target.value)}
                      className="w-20 px-4 py-4 bg-brand-cream/50 border border-brand-sand/50 rounded-xl text-center font-sans font-bold text-brand-espresso focus:outline-none focus:border-brand-gold disabled:opacity-50"
                      placeholder="Qty"
                    />
                    <button
                      onClick={handleGenerateCode}
                      disabled={isGenerating || (!['miracle', 'malvin'].includes(role || '') && codes.length >= roleCodeLimit)}
                      className="flex items-center gap-2 px-8 py-4 bg-brand-goldDark text-white text-sm font-sans font-bold uppercase tracking-wider rounded-2xl hover:bg-brand-espresso transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <Plus className="w-5 h-5" /> {isGenerating ? 'Wait...' : 'Generate'}
                    </button>
                  </div>
                </div>

                {/* Codes Table */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-brand-sand/30 flex flex-col gap-5 bg-white">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-2xl text-brand-espresso shrink-0">Invite Codes</h3>
                          {!['miracle', 'malvin'].includes(role || '') && (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase ${codes.length >= roleCodeLimit ? 'bg-rose-100 text-rose-700' : 'bg-brand-gold/20 text-brand-goldDark'}`}>
                              {codes.length} / {roleCodeLimit} Cap
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-muted font-sans mt-1">
                          {codeStats.available} Available • {codeStats.shared} Shared (Awaiting RSVP) • {codeStats.used} Used ({codeStats.total} Total)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {selectedCodes.size > 0 && (
                          <button
                            onClick={handleDeleteSelectedCodes}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-sans uppercase tracking-wider rounded-xl transition-colors font-bold"
                          >
                            <Trash2 className="w-4 h-4" /> Delete ({selectedCodes.size})
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (codes.length === 0) {
                              onNotify('Export Failed', 'No invite codes to export');
                              return;
                            }
                            
                            try {
                              const XLSX = await import('xlsx');
                              const wb = XLSX.utils.book_new();
                              
                              const formatData = (data: typeof codes) => data.map(c => ({
                                'Code': c.code,
                                'Status': c.is_used ? 'Used' : c.is_shared ? 'Shared' : 'Available',
                                'Used By': c.used_by || '',
                                'Created At': new Date(c.created_at).toLocaleString()
                              }));

                              if (['miracle', 'malvin'].includes(role || '')) {
                                const roles = ['miracle', 'malvin', 'groomsfamily', 'bridesfamily', 'custom1964'];
                                const roleLabels: Record<string, string> = {
                                  'miracle': 'Miracle',
                                  'malvin': 'Malvin',
                                  'groomsfamily': "Malvin's Family",
                                  'bridesfamily': "Miracle's Family",
                                  'custom1964': "Coordinator"
                                };
                                
                                roles.forEach(creatorRole => {
                                  const creatorCodes = codes.filter(c => c.created_by === creatorRole);
                                  if (creatorCodes.length > 0) {
                                    const ws = XLSX.utils.json_to_sheet(formatData(creatorCodes));
                                    XLSX.utils.book_append_sheet(wb, ws, roleLabels[creatorRole]);
                                  }
                                });
                                
                                const wsAll = XLSX.utils.json_to_sheet(formatData(codes));
                                XLSX.utils.book_append_sheet(wb, wsAll, 'All Codes');
                              } else {
                                const ws = XLSX.utils.json_to_sheet(formatData(filteredCodes));
                                XLSX.utils.book_append_sheet(wb, ws, 'My Invite Codes');
                              }
                              
                              XLSX.writeFile(wb, `Miracle_Malvin_Wedding_Codes_${new Date().toISOString().split('T')[0]}.xlsx`);
                            } catch (e) {
                              console.error('Export error:', e);
                              onNotify('Export Failed', 'There was an error generating the Excel file.');
                            }
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-brand-espresso text-brand-goldLight text-xs font-sans uppercase tracking-wider rounded-xl hover:bg-brand-charcoal transition-colors font-bold"
                        >
                          <Download className="w-4 h-4" /> Export Excel
                        </button>
                      </div>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1 pt-2 border-t border-brand-sand/20">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-sand/30 rounded-xl text-brand-muted text-xs font-bold uppercase tracking-wider mr-1">
                        <Filter className="w-3.5 h-3.5" /> Status
                      </div>
                      {[
                        { id: 'all', label: `All (${codeStats.total})` },
                        { id: 'available', label: `Available (${codeStats.available})` },
                        { id: 'shared', label: `Shared / Awaiting RSVP (${codeStats.shared})` },
                        { id: 'used', label: `Used (${codeStats.used})` }
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setCodeStatusFilter(s.id as any);
                            setSelectedCodes(new Set());
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all border ${
                            codeStatusFilter === s.id
                              ? 'bg-brand-espresso text-brand-goldLight border-brand-espresso shadow-sm'
                              : 'bg-white text-brand-muted border-brand-sand/50 hover:bg-brand-sand/30'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Creator Filters for Miracle / Malvin */}
                    {['miracle', 'malvin'].includes(role || '') && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1 border-t border-brand-sand/20 pt-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-sand/30 rounded-xl text-brand-muted text-xs font-bold uppercase tracking-wider mr-1">
                          <Users className="w-3.5 h-3.5" /> Creator
                        </div>
                        {[
                          { id: 'all', label: 'All Creators' },
                          { id: 'miracle', label: 'Miracle (1111)' },
                          { id: 'malvin', label: 'Malvin (2222)' },
                          { id: 'groomsfamily', label: "Malvin's Family (3333)" },
                          { id: 'bridesfamily', label: "Miracle's Family (4444)" },
                          { id: 'custom1964', label: 'Coordinator (1964)' }
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              setCreatorFilter(f.id);
                              setSelectedCodes(new Set());
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all border shrink-0 whitespace-nowrap ${
                              creatorFilter === f.id 
                                ? 'bg-brand-goldDark text-white border-brand-goldDark shadow-sm' 
                                : 'bg-white text-brand-muted border-brand-sand/50 hover:bg-brand-sand/30 hover:border-brand-sand'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto min-h-[400px]" data-lenis-prevent="true">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-cream/30 text-xs uppercase tracking-widest font-sans text-brand-muted border-b border-brand-sand/30">
                          <th className="p-6 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={codes.filter(c => !c.is_used).length > 0 && selectedCodes.size === codes.filter(c => !c.is_used).length}
                              onChange={toggleSelectAllCodes}
                              className="w-4 h-4 rounded text-brand-gold cursor-pointer"
                            />
                          </th>
                          <th className="p-6 font-semibold w-16 text-center text-brand-muted">#</th>
                          <th className="p-6 font-semibold">Code</th>
                          <th className="p-6 font-semibold">Status</th>
                          <th className="p-6 font-semibold">Used By</th>
                          <th className="p-6 font-semibold">Created</th>
                          <th className="p-6 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-sans text-brand-espresso">
                        {filteredCodes.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-brand-muted text-base">
                              No invite codes found for this filter.
                            </td>
                          </tr>
                        ) : (
                          filteredCodes.map((c, index) => (
                            <tr key={c.id} className="border-b border-brand-sand/30 hover:bg-brand-cream/20 transition-colors">
                              <td className="p-6 text-center">
                                <input
                                  type="checkbox"
                                  disabled={c.is_used}
                                  checked={selectedCodes.has(c.id)}
                                  onChange={() => toggleCodeSelection(c.id)}
                                  className="w-4 h-4 rounded text-brand-gold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={c.is_used ? "Used codes cannot be deleted" : "Select code"}
                                />
                              </td>
                              <td className="p-6 text-center text-brand-muted/70 font-mono text-xs">
                                {index + 1}
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-4">
                                  <span className={`font-mono font-bold text-2xl tracking-[0.2em] ${c.is_used ? 'text-brand-muted/50' : 'text-brand-espresso'}`}>
                                    {c.code}
                                  </span>
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => handleShareCode(c.code)}
                                      className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors flex items-center gap-1.5"
                                      title="Share / Copy with Poster Card"
                                    >
                                      {copiedCode === c.code ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5 text-brand-goldDark" />}
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 sm:p-6">
                                {c.is_used ? (
                                  <span className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-brand-sand text-brand-muted whitespace-nowrap">
                                    Used
                                  </span>
                                ) : c.is_shared ? (
                                  <span className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 whitespace-nowrap flex items-center gap-1.5 w-max">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    Shared • Awaiting RSVP
                                  </span>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 whitespace-nowrap flex items-center gap-1.5 w-max">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    Available
                                  </span>
                                )}
                              </td>
                              <td className="p-6 font-semibold text-base text-brand-espresso">
                                {c.used_by || '-'}
                              </td>
                              <td className="p-6 text-sm text-brand-muted font-medium">
                                {new Date(c.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-4 sm:p-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {(c.is_shared || c.is_used) ? (
                                    <>
                                      <button
                                        onClick={() => handleReallocateCode(c.id, c.code, c.created_by || role || 'malvin')}
                                        className="px-3 py-1.5 rounded-xl bg-brand-sand/40 hover:bg-amber-100 text-brand-espresso hover:text-amber-900 border border-brand-sand/60 text-xs font-sans font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
                                        title="Re-allocate (Delete old code and generate a fresh replacement)"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Re-allocate</span>
                                      </button>
                                      {c.is_shared && !c.is_used && (
                                        <button
                                          onClick={() => handleUnmarkShared(c.id)}
                                          className="p-1.5 rounded-xl hover:bg-brand-sand/50 text-brand-muted hover:text-brand-espresso transition-colors"
                                          title="Undo shared status"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {c.is_used && (
                                        <button
                                          onClick={() => handleResetCode(c.id)}
                                          className="px-2 py-1 rounded-xl bg-brand-sand/30 hover:bg-brand-sand text-brand-muted hover:text-brand-espresso text-xs font-semibold transition-colors"
                                          title="Reset code to available"
                                        >
                                          Reset
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-brand-muted/40 font-mono">-</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'wishlist' && (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Wishlist Action Header */}
                <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="font-serif text-2xl text-brand-espresso mb-2">Manage Wishlist</h3>
                    <p className="text-base font-sans text-brand-muted">
                      Add, view, edit, or remove items from the wedding registry.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItemId(null);
                      setNewItemName('');
                      setNewItemPrice('');
                      setNewItemImage('');
                      setNewItemDesc('');
                      setNewItemQuantity('1');
                      setNewItemCategory('Living & Comfort');
                      setImageInputMode('upload');
                      setIsAddingItem(true);
                    }}
                    className="flex items-center gap-2 px-8 py-4 bg-[#B91C1C] hover:bg-red-800 text-white text-sm font-sans font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg shrink-0 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" /> Add Wishlist Item
                  </button>
                </div>

                {/* Wishlist Add / Edit Modal Popup */}
                <AnimatePresence>
                  {isAddingItem && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                      <div 
                        className="fixed inset-0"
                        onClick={() => {
                          if (!isSubmittingItem) {
                            setIsAddingItem(false);
                            setEditingItemId(null);
                          }
                        }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 bg-white rounded-3xl shadow-2xl border border-brand-sand/60 w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8"
                        data-lenis-prevent="true"
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-brand-sand/30 pb-5 mb-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-[#B91C1C]/10 flex items-center justify-center text-[#B91C1C]">
                              <Gift className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-serif text-2xl text-brand-espresso">
                                {editingItemId ? 'Edit Registry Item' : 'Add New Registry Item'}
                              </h3>
                              <p className="text-xs text-brand-muted font-sans mt-0.5">
                                Upload a photo, set price, and describe what you want.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingItem(false);
                              setEditingItemId(null);
                            }}
                            className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/30 rounded-full transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleAddWishlistItem} className="space-y-5">
                          {/* Photo Upload Area */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-brand-espresso mb-2">
                              Item Photo <span className="text-red-500">*</span>
                            </label>
                            
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleImageFileChange} 
                              accept="image/*" 
                              className="hidden" 
                            />

                            {newItemImage ? (
                              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-brand-cream/40 border border-brand-sand/60">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden border border-brand-sand shadow-sm bg-white">
                                  <img src={newItemImage} alt="Uploaded item preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 flex-1">
                                  <p className="text-xs text-brand-espresso font-bold">Photo Selected</p>
                                  <p className="text-[11px] text-brand-muted">This image will appear on the guest registry card.</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      type="button"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="px-3 py-1.5 rounded-lg bg-white border border-brand-sand text-[11px] font-bold uppercase tracking-wider text-brand-espresso hover:bg-brand-sand/30 transition-colors cursor-pointer"
                                    >
                                      Change Photo
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewItemImage('')}
                                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-colors cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center p-6 sm:p-7 rounded-2xl border-2 border-dashed border-brand-sand hover:border-[#B91C1C]/70 bg-brand-cream/30 hover:bg-brand-cream/60 transition-all cursor-pointer group text-center"
                              >
                                <div className="w-12 h-12 rounded-2xl bg-[#B91C1C]/10 flex items-center justify-center text-[#B91C1C] mb-2.5 group-hover:scale-110 transition-transform">
                                  <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-brand-espresso mb-0.5">
                                  Click to upload photo from your device
                                </p>
                                <p className="text-xs text-brand-muted font-sans">
                                  Supports PNG, JPG, JPEG, WEBP from your computer or phone
                                </p>
                              </div>
                            )}

                            {/* Optional URL Fallback */}
                            <div className="mt-2 text-right">
                              <button
                                type="button"
                                onClick={() => setImageInputMode(imageInputMode === 'upload' ? 'url' : 'upload')}
                                className="text-[11px] font-sans text-brand-goldDark hover:underline cursor-pointer"
                              >
                                {imageInputMode === 'upload' ? 'Or paste an image web URL' : 'Use device photo upload instead'}
                              </button>
                            </div>

                            {imageInputMode === 'url' && (
                              <div className="mt-2">
                                <input
                                  type="url"
                                  value={newItemImage}
                                  onChange={(e) => setNewItemImage(e.target.value)}
                                  placeholder="https://example.com/product-image.jpg"
                                  className="w-full p-3 rounded-xl border border-brand-sand bg-white text-xs font-sans focus:outline-none focus:border-brand-gold"
                                />
                              </div>
                            )}
                          </div>

                          {/* Item Name & Category */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-brand-espresso mb-1.5">
                                Item Name <span className="text-red-500">*</span>
                              </label>
                              <input 
                                required 
                                value={newItemName} 
                                onChange={(e) => setNewItemName(e.target.value)} 
                                className="w-full p-3.5 rounded-xl border border-brand-sand bg-white text-sm focus:outline-none focus:border-brand-gold" 
                                placeholder="e.g. Smart 4K Television" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-brand-espresso mb-1.5">
                                Category <span className="text-red-500">*</span>
                              </label>
                              <select 
                                value={newItemCategory} 
                                onChange={(e) => setNewItemCategory(e.target.value as any)} 
                                className="w-full p-3.5 rounded-xl border border-brand-sand bg-white text-sm focus:outline-none focus:border-brand-gold"
                              >
                                <option value="Living & Comfort">Living & Comfort</option>
                                <option value="Kitchen & Dining">Kitchen & Dining</option>
                                <option value="Home & Bedding">Home & Bedding</option>
                                <option value="Milestone Gift">Milestone Gift</option>
                              </select>
                            </div>
                          </div>

                          {/* Price & Quantity */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-brand-espresso mb-1.5">
                                Price (NGN) <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-muted">₦</span>
                                <input 
                                  required 
                                  type="text"
                                  value={newItemPrice} 
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    setNewItemPrice(raw ? parseInt(raw, 10).toLocaleString('en-US') : '');
                                  }} 
                                  className="w-full pl-8 pr-3.5 py-3.5 rounded-xl border border-brand-sand bg-white text-sm font-semibold focus:outline-none focus:border-brand-gold" 
                                  placeholder="e.g. 150,000" 
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-brand-espresso mb-1.5">
                                Quantity Needed <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="number" 
                                min="1" 
                                required 
                                value={newItemQuantity} 
                                onChange={(e) => setNewItemQuantity(e.target.value)} 
                                className="w-full p-3.5 rounded-xl border border-brand-sand bg-white text-sm focus:outline-none focus:border-brand-gold" 
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-brand-espresso mb-1.5">
                              Description / Note to Guests <span className="text-red-500">*</span>
                            </label>
                            <textarea 
                              required 
                              value={newItemDesc} 
                              onChange={(e) => setNewItemDesc(e.target.value)} 
                              className="w-full p-3.5 rounded-xl border border-brand-sand bg-white text-sm focus:outline-none focus:border-brand-gold resize-none" 
                              rows={3} 
                              placeholder="Add model, specifications, or a sweet note to guests..." 
                            />
                          </div>

                          {/* Modal Footer Actions */}
                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-sand/30">
                            <button
                              type="button"
                              disabled={isSubmittingItem}
                              onClick={() => {
                                setIsAddingItem(false);
                                setEditingItemId(null);
                              }}
                              className="px-6 py-3 rounded-xl border border-brand-sand text-brand-muted text-xs font-bold uppercase tracking-wider hover:bg-brand-sand/30 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              disabled={isSubmittingItem} 
                              className="px-8 py-3 bg-[#B91C1C] hover:bg-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                            >
                              {isSubmittingItem ? 'Saving...' : editingItemId ? 'Save Changes' : 'Add to Wishlist'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Wishlist Table */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto min-h-[400px]" data-lenis-prevent="true">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-cream/30 text-xs uppercase tracking-widest font-sans text-brand-muted border-b border-brand-sand/30">
                          <th className="p-6 font-semibold">Image</th>
                          <th className="p-6 font-semibold">Details</th>
                          <th className="p-6 font-semibold">Category</th>
                          <th className="p-6 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-sans text-brand-espresso">
                        {wishlistItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-brand-muted text-base">
                              No items in the wishlist. (Did you run the SQL script?)
                            </td>
                          </tr>
                        ) : (
                          wishlistItems.map((item) => (
                            <tr key={item.id} className="border-b border-brand-sand/30 hover:bg-brand-cream/20 transition-colors">
                              <td className="p-6">
                                <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                              </td>
                              <td className="p-6">
                                <p className="font-semibold text-base mb-1">{item.name}</p>
                                <p className="text-emerald-700 font-bold">{item.formattedPrice} {item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}</p>
                              </td>
                              <td className="p-6">
                                <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-sand text-brand-muted">
                                  {item.category}
                                </span>
                              </td>
                              <td className="p-6 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEditWishlistItem(item)}
                                    className="p-2.5 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/50 rounded-xl transition-colors"
                                    title="Edit Item"
                                  >
                                    <Edit2 className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWishlistItem(item.id)}
                                    className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reservations' && (
              <motion.div
                key="reservations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
{(() => {
                  const fulfilledCount = reservations.filter(r => isReservationFulfilled(r)).length;
                  const activeCount = reservations.filter(r => !isReservationFulfilled(r) && (!r.expiresAt || new Date(r.expiresAt).getTime() > Date.now())).length;
                  const expiredCount = reservations.filter(r => !isReservationFulfilled(r) && r.expiresAt && new Date(r.expiresAt).getTime() <= Date.now()).length;

                  const displayedReservations = reservations.filter((r) => {
                    const fulfilled = isReservationFulfilled(r);
                    const expired = !fulfilled && r.expiresAt ? new Date(r.expiresAt).getTime() <= Date.now() : false;
                    if (reservationStatusFilter === 'fulfilled') return fulfilled;
                    if (reservationStatusFilter === 'active') return !fulfilled && !expired;
                    if (reservationStatusFilter === 'expired') return expired;
                    return true;
                  });

                  return (
                    <>
                      {/* Reservations Header */}
                      <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                          <h3 className="font-serif text-2xl text-brand-espresso mb-1">Item Reservations</h3>
                          <p className="text-sm font-sans text-brand-muted">
                            When a guest pays for a reserved item, it becomes Fulfilled and never expires.
                          </p>
                        </div>
                        {/* Status Badges & Interactive Filter Tabs */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setReservationStatusFilter('all')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider font-sans transition-all border cursor-pointer ${
                              reservationStatusFilter === 'all'
                                ? 'bg-brand-espresso text-brand-goldLight border-brand-espresso shadow-xs'
                                : 'bg-white text-brand-muted border-brand-sand/50 hover:bg-brand-sand/30'
                            }`}
                          >
                            All ({reservations.length})
                          </button>
                          <button
                            onClick={() => setReservationStatusFilter('active')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider font-sans transition-all border cursor-pointer ${
                              reservationStatusFilter === 'active'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            Active Hold ({activeCount})
                          </button>
                          <button
                            onClick={() => setReservationStatusFilter('fulfilled')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider font-sans transition-all border cursor-pointer flex items-center gap-1.5 ${
                              reservationStatusFilter === 'fulfilled'
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" /> Fulfilled ({fulfilledCount})
                          </button>
                          <button
                            onClick={() => setReservationStatusFilter('expired')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider font-sans transition-all border cursor-pointer ${
                              reservationStatusFilter === 'expired'
                                ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            Expired ({expiredCount})
                          </button>
                        </div>
                      </div>

                      {/* Reservations Table */}
                      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto min-h-[400px]" data-lenis-prevent="true">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-brand-cream/30 text-xs uppercase tracking-widest font-sans text-brand-muted border-b border-brand-sand/30">
                                <th className="p-6 font-semibold">Item Held</th>
                                <th className="p-6 font-semibold">Reserved By</th>
                                <th className="p-6 font-semibold">Status</th>
                                <th className="p-6 font-semibold">Key Dates</th>
                                <th className="p-6 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm font-sans text-brand-espresso">
                              {displayedReservations.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-12 text-center text-brand-muted text-base">
                                    No item reservations match the selected filter.
                                  </td>
                                </tr>
                              ) : (
                                displayedReservations.map((r) => {
                                  const fulfilled = isReservationFulfilled(r);
                                  const isExpired = !fulfilled && r.expiresAt ? new Date(r.expiresAt).getTime() <= Date.now() : false;
                                  return (
                                    <tr key={r.id} className="border-b border-brand-sand/30 hover:bg-brand-cream/20 transition-colors">
                                      <td className="p-6">
                                        <p className="font-semibold text-base text-brand-espresso">{r.itemName}</p>
                                        <p className="text-xs text-brand-muted font-mono mt-0.5">ID: {r.itemId}</p>
                                      </td>
                                      <td className="p-6">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-semibold text-base text-brand-espresso">{r.reservedByName || 'Guest'}</p>
                                          {r.relation && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold/15 text-brand-goldDark">
                                              {r.relation}
                                            </span>
                                          )}
                                          {r.isAnonymous && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-sand text-brand-muted">
                                              Anonymous on Site
                                            </span>
                                          )}
                                        </div>
                                        {r.email && (
                                          <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-1 font-sans">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span>{r.email}</span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-6">
                                        {fulfilled ? (
                                          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-max">
                                            <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                            Fulfilled
                                          </span>
                                        ) : isExpired ? (
                                          <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                            Expired
                                          </span>
                                        ) : (
                                          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 w-max">
                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                            Active Hold
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-6 text-xs text-brand-muted font-sans space-y-1">
                                        <p><strong className="text-brand-espresso">Reserved:</strong> {new Date(r.createdAt).toLocaleDateString()}</p>
                                        {fulfilled ? (
                                          <p className="text-emerald-700 font-semibold flex items-center gap-1">
                                            <Check className="w-3 h-3 text-emerald-600" /> Payment Confirmed (Never Expires)
                                          </p>
                                        ) : (
                                          <>
                                            <p><strong className="text-brand-goldDark">Reminder Due:</strong> {new Date(r.remindDate).toLocaleDateString()}</p>
                                            {r.expiresAt && <p><strong className="text-brand-espresso">Expires:</strong> {new Date(r.expiresAt).toLocaleDateString()}</p>}
                                          </>
                                        )}
                                      </td>
                                      <td className="p-6 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                          {!fulfilled && (
                                            <>
                                              <button
                                                onClick={async () => {
                                                  await markReservationFulfilled(r.id);
                                                  setReservations(prev => prev.map(item => item.id === r.id ? { ...item, isFulfilled: true, fulfilledAt: new Date().toISOString() } : item));
                                                  onNotify('Marked Fulfilled', `${r.itemName} marked as fulfilled!`);
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                                title="Mark payment received / fulfilled"
                                              >
                                                <Check className="w-3.5 h-3.5" /> Mark Paid
                                              </button>
                                              <button
                                                onClick={() => handleSendReminder(r)}
                                                className="p-2 text-brand-gold hover:text-brand-goldDark hover:bg-brand-gold/10 rounded-xl transition-colors cursor-pointer"
                                                title="Send Reminder Email"
                                              >
                                                <Mail className="w-5 h-5" />
                                              </button>
                                            </>
                                          )}
                                          <button
                                            onClick={() => handleDeleteReservation(r.id, r.itemId, r.reservedByName)}
                                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                            title={fulfilled ? "Remove completed reservation log" : "Release reservation"}
                                          >
                                            <Trash2 className="w-5 h-5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === 'invitations' && (
              <motion.div
                key="invitations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Header / Intro */}
                <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-brand-goldDark text-xs font-bold uppercase tracking-widest mb-1.5">
                      <ImageIcon className="w-4 h-4" /> Master Admin Poster Control
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-brand-espresso">Invitation Posters</h3>
                    <p className="text-xs sm:text-sm font-sans text-brand-muted mt-1 max-w-2xl leading-relaxed">
                      Upload and manage the official invitation posters for Miracle & Malvin. Whenever you share an invite code, guests will receive the updated artwork corresponding to their tier.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-brand-sand/20 rounded-2xl border border-brand-sand/40 text-xs font-medium text-brand-muted shrink-0">
                    <Sparkles className="w-4 h-4 text-brand-goldDark" />
                    <span>Auto-optimized image quality</span>
                  </div>
                </div>

                {/* Poster Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 1. General Invitation Card */}
                  <div className="bg-white rounded-3xl shadow-sm border border-brand-sand/40 overflow-hidden flex flex-col">
                    <div className="p-5 sm:p-6 border-b border-brand-sand/30 flex items-center justify-between bg-brand-cream/30">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-100 font-bold px-2.5 py-0.5 rounded-full">
                          General Guests
                        </span>
                        <h4 className="font-serif text-xl sm:text-2xl text-brand-espresso mt-1">General Invitation Card</h4>
                        <p className="text-xs text-brand-muted mt-0.5">Solemnization & Main Reception</p>
                      </div>
                      <span className="text-[11px] font-sans text-brand-muted/70 bg-white px-3 py-1 rounded-xl border border-brand-sand/40">
                        {invitationPosters.generalUpdatedAt || 'Default'}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col items-center flex-1 bg-brand-ivory/30">
                      <div className="w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden bg-brand-sand/20 border-2 border-brand-sand/50 shadow-md relative group">
                        <img
                          src={invitationPosters.generalUrl}
                          alt="General Invitation Poster"
                          className="w-full h-full object-contain bg-white"
                        />
                        <div className="absolute inset-0 bg-brand-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                          <button
                            onClick={() => setPreviewPosterUrl(invitationPosters.generalUrl)}
                            className="px-4 py-2 bg-white text-brand-espresso rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 hover:bg-brand-gold hover:text-white transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> Full View
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 border-t border-brand-sand/30 bg-white flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 px-5 py-2.5 bg-brand-espresso text-brand-goldLight rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-goldDark transition-colors cursor-pointer shadow-sm">
                        <UploadCloud className="w-4 h-4" />
                        <span>{isUploadingPoster === 'general' ? 'Uploading...' : 'Upload New Poster'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingPoster === 'general'}
                          onChange={(e) => handleUploadPoster(e, 'general')}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewPosterUrl(invitationPosters.generalUrl)}
                          className="p-2.5 rounded-xl border border-brand-sand/60 hover:bg-brand-sand/30 text-brand-muted hover:text-brand-espresso transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          title="Preview full image"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>
                        <button
                          onClick={() => handleResetPoster('general')}
                          className="p-2.5 rounded-xl border border-brand-sand/60 hover:bg-rose-50 text-brand-muted hover:text-rose-600 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          title="Reset to default artwork"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Close Family & VIP Invitation Card */}
                  <div className="bg-white rounded-3xl shadow-sm border-2 border-brand-gold/40 overflow-hidden flex flex-col">
                    <div className="p-5 sm:p-6 border-b border-brand-sand/30 flex items-center justify-between bg-gradient-to-r from-brand-gold/10 via-brand-cream/40 to-transparent">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-espresso bg-brand-gold/30 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-brand-goldDark" /> VIP & Family
                          </span>
                        </div>
                        <h4 className="font-serif text-xl sm:text-2xl text-brand-espresso mt-1">Close Family & VIP Card</h4>
                        <p className="text-xs text-brand-muted mt-0.5">Includes Engagement & Exclusive Afterparty</p>
                      </div>
                      <span className="text-[11px] font-sans text-brand-muted/70 bg-white px-3 py-1 rounded-xl border border-brand-sand/40">
                        {invitationPosters.familyVipUpdatedAt || 'Default'}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col items-center flex-1 bg-brand-ivory/30">
                      <div className="w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden bg-brand-sand/20 border-2 border-brand-gold/40 shadow-md relative group">
                        <img
                          src={invitationPosters.familyVipUrl}
                          alt="Close Family & VIP Invitation Poster"
                          className="w-full h-full object-contain bg-white"
                        />
                        <div className="absolute inset-0 bg-brand-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                          <button
                            onClick={() => setPreviewPosterUrl(invitationPosters.familyVipUrl)}
                            className="px-4 py-2 bg-white text-brand-espresso rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 hover:bg-brand-gold hover:text-white transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> Full View
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 border-t border-brand-sand/30 bg-white flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 px-5 py-2.5 bg-brand-goldDark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-espresso transition-colors cursor-pointer shadow-sm">
                        <UploadCloud className="w-4 h-4" />
                        <span>{isUploadingPoster === 'familyVip' ? 'Uploading...' : 'Upload New Poster'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingPoster === 'familyVip'}
                          onChange={(e) => handleUploadPoster(e, 'familyVip')}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewPosterUrl(invitationPosters.familyVipUrl)}
                          className="p-2.5 rounded-xl border border-brand-sand/60 hover:bg-brand-sand/30 text-brand-muted hover:text-brand-espresso transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          title="Preview full image"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>
                        <button
                          onClick={() => handleResetPoster('familyVip')}
                          className="p-2.5 rounded-xl border border-brand-sand/60 hover:bg-rose-50 text-brand-muted hover:text-rose-600 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          title="Reset to default artwork"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>

      {/* Card Selection Modal on Share */}
      <AnimatePresence>
        {sharingCode && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brand-espresso/60 backdrop-blur-sm"
            onClick={() => setSharingCode(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-brand-sand/60 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-goldDark font-bold">
                      Share Invite Code
                    </span>
                    <h3 className="text-xl font-serif text-brand-espresso font-semibold flex items-center gap-2">
                      Code <span className="font-mono text-brand-goldDark tracking-widest">{sharingCode}</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setSharingCode(null)}
                    className="w-8 h-8 rounded-full bg-brand-sand/40 hover:bg-brand-sand flex items-center justify-center text-brand-muted hover:text-brand-espresso transition-colors cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-brand-muted mt-3 mb-5 font-sans leading-relaxed">
                  Which invitation card would you like to attach for this guest?
                </p>

                <div className="space-y-3">
                  {/* Option 1: General Invitation */}
                  <button
                    onClick={() => executeShare(sharingCode, 'general')}
                    className="w-full text-left p-4 rounded-2xl border-2 border-brand-sand/60 hover:border-brand-gold bg-white hover:bg-brand-ivory/60 transition-all group flex items-start gap-4 shadow-sm cursor-pointer"
                  >
                    <div className="w-16 h-20 rounded-xl bg-brand-sand/30 overflow-hidden shrink-0 border border-brand-sand/50 shadow-inner">
                      <img
                        src={invitationPosters.generalUrl}
                        alt="General Invitation"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-semibold text-brand-espresso group-hover:text-brand-goldDark transition-colors">
                          General Invitation Card
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                          Standard
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 leading-snug">
                        Solemnization & Main Reception. Perfect for general guests.
                      </p>
                      <div className="mt-2 text-xs font-semibold text-brand-goldDark flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <Share2 className="w-3.5 h-3.5" /> Share this card
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Close Family & VIP */}
                  <button
                    onClick={() => executeShare(sharingCode, 'familyVip')}
                    className="w-full text-left p-4 rounded-2xl border-2 border-brand-gold/40 hover:border-brand-gold bg-gradient-to-br from-white to-brand-gold/5 hover:to-brand-gold/15 transition-all group flex items-start gap-4 shadow-sm cursor-pointer"
                  >
                    <div className="w-16 h-20 rounded-xl bg-brand-sand/30 overflow-hidden shrink-0 border border-brand-gold/40 shadow-inner">
                      <img
                        src={invitationPosters.familyVipUrl}
                        alt="Close Family & VIP"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-semibold text-brand-espresso group-hover:text-brand-goldDark transition-colors flex items-center gap-1.5">
                          Family & VIP Card
                          <Sparkles className="w-3.5 h-3.5 text-brand-goldDark" />
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-goldDark font-semibold shrink-0">
                          VIP
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 leading-snug">
                        Includes Engagement / Traditional ceremony & exclusive Afterparty details.
                      </p>
                      <div className="mt-2 text-xs font-semibold text-brand-goldDark flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <Share2 className="w-3.5 h-3.5" /> Share this card
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Poster Preview Lightbox */}
      <AnimatePresence>
        {previewPosterUrl && (
          <div 
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-brand-espresso/80 backdrop-blur-md"
            onClick={() => setPreviewPosterUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh] bg-transparent rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewPosterUrl(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-brand-espresso/80 text-white flex items-center justify-center hover:bg-brand-espresso transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <img
                src={previewPosterUrl}
                alt="Full Invitation Poster Preview"
                className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Overlay */}
      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-espresso/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-brand-cream w-full max-w-sm rounded-3xl shadow-2xl border border-brand-gold/20 overflow-hidden relative"
            >
              <div className="p-8">
                <h3 className="font-serif text-2xl text-brand-espresso mb-3">
                  {confirmDialog.title}
                </h3>
                <p className="font-sans text-brand-muted text-sm leading-relaxed mb-8">
                  {confirmDialog.message}
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="px-5 py-2.5 rounded-full text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/30 font-sans text-xs font-bold tracking-wider uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      confirmDialog.onConfirm();
                      setConfirmDialog(null);
                    }}
                    className="px-5 py-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 font-sans text-xs font-bold tracking-wider uppercase transition-colors shadow-md"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
