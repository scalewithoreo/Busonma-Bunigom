import { useState, useEffect, FC, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Users, Mail, MessageSquare, Trash2, Gift, KeyRound, Plus, Check, LogOut, Filter, Heart, Clock, X, Edit2, Upload, RotateCcw, XCircle, Image as ImageIcon, UploadCloud, Eye, Share2, Sparkles, Save, Smartphone, Search, ShieldCheck, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  getStoredRsvps, deleteRsvp,
  getStoredGiftPledgesAdmin, exportGiftPledgesCsv, deleteGiftPledge,
  getInviteCodes, generateInviteCode, bulkGenerateInviteCodes, deleteInviteCodes, markInviteCodeAsShared, unmarkInviteCodeAsShared, resetInviteCode, reallocateInviteCode, assignInviteCode, exportInviteCodesCsv, InviteCode,
  getStoredWishlistItems, saveWishlistItem, deleteWishlistItem, updateWishlistItem,
  getStoredReminders, deleteReservation, markReservationFulfilled,
  getStoredInvitationPosters, getLocalInvitationPosters, saveStoredInvitationPosters, uploadInvitationPoster, InvitationPostersConfig, DEFAULT_INVITATION_MESSAGES, formatInviteMessage,
  toggleRsvpCheckIn, saveAdminPin
} from '../utils/storage';
import { sendReservationReminderEmail } from '../utils/email';
import { RsvpSubmission, GiftPledge, WishlistItem, GiftReminder } from '../types';
import { INITIAL_WISHLIST_ITEMS } from '../data/wishlistData';
import { useWedding } from '../context/WeddingContext';
import type { AdminRole } from '../config/adminConfig';
import { getStoredPin, saveCustomPin, hashPin } from '../config/adminConfig';
import { AdminRoleConfig } from '../types/wedding';

interface AdminDashboardProps {
  isOpen: boolean; 
  onClose: () => void;
  onNotify: (title: string, message?: string) => void;
  role?: AdminRole;
  onOpenResetPin?: () => void;
}

export const AdminModal: FC<AdminDashboardProps> = ({ isOpen, onClose, onNotify, role, onOpenResetPin }) => {
  const { wedding, isMasterAdmin, addCustomRole, removeCustomRole } = useWedding();
  const currentRoleConfig = wedding.admin.roles.find(
    r => r.role.toLowerCase() === (role || '').toLowerCase()
  );
  const isMaster = isMasterAdmin(role);
  const accessPoint: 'super' | 'family' | 'coordinator' = 
    currentRoleConfig?.accessPoint || (isMaster ? 'super' : 'family');
  const isSuperAdmin = accessPoint === 'super' || isMaster;
  const isCoordinator = accessPoint === 'coordinator';
  const isFamilyAdmin = accessPoint === 'family' && !isSuperAdmin;

  const [activeTab, setActiveTab] = useState<'rsvps' | 'codes' | 'gifts' | 'wishlist' | 'reservations' | 'invitations' | 'admins'>('rsvps');
  const [invitationPosters, setInvitationPosters] = useState<InvitationPostersConfig>(getLocalInvitationPosters);
  const [isUploadingPoster, setIsUploadingPoster] = useState<'general' | 'familyVip' | null>(null);
  const [previewPosterUrl, setPreviewPosterUrl] = useState<string | null>(null);
  const [sharingCode, setSharingCode] = useState<string | null>(null);
  const [sharingRecipientName, setSharingRecipientName] = useState<string>('');
  const [editingRecipientCodeId, setEditingRecipientCodeId] = useState<string | null>(null);
  const [editingRecipientValue, setEditingRecipientValue] = useState<string>('');
  const [codeSearchQuery, setCodeSearchQuery] = useState<string>('');
  const [guestSearchQuery, setGuestSearchQuery] = useState<string>('');

  // Enforce access point tab restrictions
  useEffect(() => {
    if (isCoordinator && activeTab !== 'rsvps') {
      setActiveTab('rsvps');
    } else if (isFamilyAdmin && activeTab !== 'rsvps' && activeTab !== 'codes') {
      setActiveTab('rsvps');
    }
  }, [isCoordinator, isFamilyAdmin, activeTab]);

  // Admin Management State
  const [adminFormOpen, setAdminFormOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminAccessPoint, setNewAdminAccessPoint] = useState<'super' | 'family' | 'coordinator'>('family');
  const [newAdminCodeLimit, setNewAdminCodeLimit] = useState<string>('50');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [adminFormError, setAdminFormError] = useState('');
  const [revealedPins, setRevealedPins] = useState<Set<string>>(new Set());

  // Super Admin Change PIN State
  const [pinModalAdmin, setPinModalAdmin] = useState<AdminRoleConfig | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinModalError, setPinModalError] = useState('');
  const [pinModalSuccess, setPinModalSuccess] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [, setPinVersion] = useState(0);

  const handleOpenChangePinModal = (adminRole: AdminRoleConfig) => {
    setPinModalAdmin(adminRole);
    setNewPinValue('');
    setConfirmPinValue('');
    setPinModalError('');
    setPinModalSuccess('');
  };

  const handleSavePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalAdmin) return;
    setPinModalError('');
    setPinModalSuccess('');

    const targetPin = newPinValue.trim();
    const targetConfirm = confirmPinValue.trim();

    if (!/^\d{4}$/.test(targetPin)) {
      setPinModalError('PIN must be exactly 4 numeric digits (e.g. 1234).');
      return;
    }

    if (targetPin !== targetConfirm) {
      setPinModalError('PINs do not match. Please verify and re-enter.');
      return;
    }

    setIsSavingPin(true);
    try {
      await saveAdminPin(pinModalAdmin.role, targetPin, wedding.id);

      // If current logged-in role is the target admin, update active session hash
      if (role === pinModalAdmin.role) {
        const newHash = await hashPin(targetPin, wedding.admin.pinSalt);
        localStorage.setItem('admin_pin_hash', newHash);
      }

      setPinVersion(v => v + 1);
      setPinModalSuccess(`PIN for ${pinModalAdmin.label} updated to ${targetPin}!`);
      onNotify('PIN Updated', `Successfully updated PIN for ${pinModalAdmin.label} to ${targetPin}.`);

      setTimeout(() => {
        setPinModalAdmin(null);
        setIsSavingPin(false);
      }, 1200);
    } catch (err) {
      setPinModalError('Failed to save new PIN. Please try again.');
      setIsSavingPin(false);
    }
  };

  const toggleRevealPin = (roleKey: string) => {
    setRevealedPins(prev => {
      const next = new Set(prev);
      if (next.has(roleKey)) next.delete(roleKey);
      else next.add(roleKey);
      return next;
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError('');

    if (!newAdminName.trim()) {
      setAdminFormError('Please enter an admin name or title.');
      return;
    }

    if (!/^\d{4}$/.test(newAdminPin.trim())) {
      setAdminFormError('Password / PIN must be exactly 4 numeric digits.');
      return;
    }

    const baseSlug = newAdminName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'admin';
    let roleSlug = baseSlug;
    if (wedding.admin.roles.some(r => r.role.toLowerCase() === roleSlug.toLowerCase())) {
      roleSlug = baseSlug + '_' + Date.now().toString(36).slice(-4);
    }

    let codeLimitNum: number | undefined = undefined;
    if (newAdminAccessPoint === 'family') {
      codeLimitNum = parseInt(newAdminCodeLimit, 10);
      if (isNaN(codeLimitNum) || codeLimitNum < 1) {
        setAdminFormError('Please enter a valid positive number for the invite/couple cap (e.g. 20, 50).');
        return;
      }
    }

    const roleConfig: AdminRoleConfig = {
      role: roleSlug,
      label: newAdminName.trim(),
      defaultPin: newAdminPin.trim(),
      isMaster: newAdminAccessPoint === 'super',
      accessPoint: newAdminAccessPoint,
      codeLimit: codeLimitNum,
      relationFilter: newAdminName.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await addCustomRole(roleConfig);
      saveCustomPin(roleSlug, newAdminPin.trim());
      setNewAdminName('');
      setNewAdminPin('');
      setNewAdminAccessPoint('family');
      setNewAdminCodeLimit('50');
      setAdminFormOpen(false);
      onNotify('Admin Created', roleConfig.label + ' added with ' + (roleConfig.accessPoint ? roleConfig.accessPoint.toUpperCase() : 'ADMIN') + ' access (PIN: ' + roleConfig.defaultPin + ').');
    } catch (err) {
      setAdminFormError('Failed to save new admin.');
    }
  };

  const handleDeleteAdminRole = (roleConfig: AdminRoleConfig) => {
    const isPermanent = wedding.id === 'busonma-bunigom'
      ? (roleConfig.role === 'busonma' || roleConfig.role === 'bunigom')
      : (roleConfig.role === 'miracle' || roleConfig.role === 'malvin');

    if (isPermanent) {
      const names = wedding.id === 'busonma-bunigom' ? 'Bunigom and Busonma' : 'Miracle and Malvin';
      onNotify('Protected', `${names} are the permanent creators and cannot be removed.`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Remove Admin Access',
      message: 'Are you sure you want to remove ' + roleConfig.label + ' (' + roleConfig.role + ')? Their login PIN and dashboard access will be permanently revoked.',
      onConfirm: async () => {
        try {
          await removeCustomRole(roleConfig.role);
          onNotify('Admin Removed', roleConfig.label + ' was removed.');
        } catch (err) {
          onNotify('Error', 'Failed to remove admin role.');
        }
      }
    });
  };

  const handleToggleCheckIn = async (rsvp: RsvpSubmission) => {
    const newStatus = !rsvp.isCheckedIn;
    const now = new Date().toISOString();
    try {
      await toggleRsvpCheckIn(rsvp.id, newStatus);
      setRsvps(prev => prev.map(r => r.id === rsvp.id ? { ...r, isCheckedIn: newStatus, checkedInAt: newStatus ? now : undefined } : r));
      onNotify(
        newStatus ? 'Guest Checked In' : 'Check-In Reverted',
        rsvp.firstName + ' ' + rsvp.lastName + ' marked as ' + (newStatus ? 'Arrived / Checked In' : 'Not Checked In') + '.'
      );
    } catch (e) {
      onNotify('Error', 'Failed to update check-in status.');
    }
  };
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generalMsgDraft, setGeneralMsgDraft] = useState(invitationPosters.generalMessage || DEFAULT_INVITATION_MESSAGES.general);
  const [familyVipMsgDraft, setFamilyVipMsgDraft] = useState(invitationPosters.familyVipMessage || DEFAULT_INVITATION_MESSAGES.familyVip);
  const [isSavingMessage, setIsSavingMessage] = useState<'general' | 'familyVip' | null>(null);
  const [previewTab, setPreviewTab] = useState<{ general: 'editor' | 'preview'; familyVip: 'editor' | 'preview' }>({
    general: 'editor',
    familyVip: 'editor'
  });

  useEffect(() => {
    setGeneralMsgDraft(invitationPosters.generalMessage || DEFAULT_INVITATION_MESSAGES.general);
    setFamilyVipMsgDraft(invitationPosters.familyVipMessage || DEFAULT_INVITATION_MESSAGES.familyVip);
  }, [invitationPosters.generalMessage, invitationPosters.familyVipMessage]);

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
    if (isSuperAdmin) return Infinity;
    if (currentRoleConfig?.codeLimit) return currentRoleConfig.codeLimit;
    if (isCoordinator) return 0;
    return 50;
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
          if (isSuperAdmin) {
            const [loadedRsvps, loadedPledges, loadedCodes, loadedItems, loadedReservations, loadedPosters] = await Promise.all([
              getStoredRsvps(),
              getStoredGiftPledgesAdmin(),
              getInviteCodes(),
              getStoredWishlistItems(),
              getStoredReminders(),
              getStoredInvitationPosters()
            ]);
            setRsvps(loadedRsvps);
            setPledges(loadedPledges);
            setCodes(loadedCodes);
            setWishlistItems(loadedItems.length > 0 ? loadedItems : INITIAL_WISHLIST_ITEMS);
            setReservations(loadedReservations);
            setInvitationPosters(loadedPosters);
          } else if (isCoordinator) {
            // Event Coordinator: Full guest list alone
            const [loadedRsvps, loadedCodes] = await Promise.all([
              getStoredRsvps(),
              getInviteCodes()
            ]);
            setRsvps(loadedRsvps);
            setCodes(loadedCodes);
          } else {
            // Family admin: only see RSVPs for guests who used codes generated by them, and their own codes
            const [loadedRsvps, loadedCodes, loadedPosters] = await Promise.all([
              getStoredRsvps(),
              getInviteCodes(role),
              getStoredInvitationPosters()
            ]);
            setCodes(loadedCodes);
            setInvitationPosters(loadedPosters);
            
            const usedNames = loadedCodes
              .filter(c => c.is_used && c.used_by)
              .map(c => c.used_by!.trim().toLowerCase());
              
            const theirRsvps = loadedRsvps.filter(r => 
              usedNames.includes((r.firstName.trim() + ' ' + r.lastName.trim()).toLowerCase())
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
  }, [isOpen, role, isSuperAdmin, isCoordinator]);

  if (!isOpen) return null;

  const totalGiftValue = pledges.reduce((acc, p) => acc + p.amount, 0);

  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [rsvpAttendanceFilter, setRsvpAttendanceFilter] = useState<'all' | 'attending' | 'declined'>('all');

  const rsvpCounts = useMemo(() => {
    let base = rsvps;
    if (isSuperAdmin && creatorFilter !== 'all') {
      const creatorCodes = codes.filter(c => c.created_by === creatorFilter && c.is_used && c.used_by);
      const usedNames = creatorCodes.map(c => c.used_by!.trim().toLowerCase());
      base = base.filter(r => usedNames.includes((r.firstName.trim() + ' ' + r.lastName.trim()).toLowerCase()));
    }
    const attending = base.filter(r => r.attendance === 'yes').length;
    const declined = base.filter(r => r.attendance === 'no').length;
    const checkedIn = base.filter(r => r.isCheckedIn).length;
    const total = base.length;
    return { attending, declined, checkedIn, total };
  }, [rsvps, creatorFilter, isSuperAdmin, codes]);

  const filteredRsvps = useMemo(() => {
    let result = rsvps;
    if (isSuperAdmin && creatorFilter !== 'all') {
      const creatorCodes = codes.filter(c => c.created_by === creatorFilter && c.is_used && c.used_by);
      const usedNames = creatorCodes.map(c => c.used_by!.trim().toLowerCase());
      result = result.filter(r => usedNames.includes((r.firstName.trim() + ' ' + r.lastName.trim()).toLowerCase()));
    }
    if (rsvpAttendanceFilter === 'attending') {
      result = result.filter(r => r.attendance === 'yes');
    } else if (rsvpAttendanceFilter === 'declined') {
      result = result.filter(r => r.attendance === 'no');
    }
    if (guestSearchQuery.trim()) {
      const q = guestSearchQuery.trim().toLowerCase();
      result = result.filter(r => 
        (r.firstName + ' ' + r.lastName).toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.message && r.message.toLowerCase().includes(q)) ||
        (r.selectedDate && r.selectedDate.toLowerCase().includes(q))
      );
    }
    return result;
  }, [rsvps, creatorFilter, isSuperAdmin, codes, rsvpAttendanceFilter, guestSearchQuery]);

  const [codeStatusFilter, setCodeStatusFilter] = useState<'all' | 'available' | 'shared' | 'used'>('all');

  const codeStats = useMemo(() => {
    const base = isSuperAdmin && creatorFilter !== 'all'
      ? codes.filter(c => c.created_by === creatorFilter)
      : codes;

    const total = base.length;
    const used = base.filter(c => c.is_used).length;
    const unused = base.filter(c => !c.is_used).length;
    const shared = base.filter(c => !c.is_used && c.is_shared).length;
    const available = base.filter(c => !c.is_used && !c.is_shared).length;

    return { total, used, unused, shared, available };
  }, [codes, creatorFilter, isSuperAdmin]);

  const filteredCodes = useMemo(() => {
    let result = codes;
    if (isMaster && creatorFilter !== 'all') {
      result = result.filter(c => c.created_by === creatorFilter);
    }
    if (codeStatusFilter === 'available') {
      result = result.filter(c => !c.is_used && !c.is_shared);
    } else if (codeStatusFilter === 'shared') {
      result = result.filter(c => !c.is_used && c.is_shared);
    } else if (codeStatusFilter === 'used') {
      result = result.filter(c => c.is_used);
    }
    if (codeSearchQuery.trim()) {
      const q = codeSearchQuery.trim().toLowerCase();
      result = result.filter(c => 
        c.code.toLowerCase().includes(q) ||
        (c.assigned_to && c.assigned_to.toLowerCase().includes(q)) ||
        (c.used_by && c.used_by.toLowerCase().includes(q))
      );
    }
    return result;
  }, [codes, creatorFilter, role, codeStatusFilter, codeSearchQuery]);

  const handleGenerateCode = async () => {
    let amount = parseInt(bulkGenAmount, 10);
    if (isNaN(amount) || amount < 1) amount = 1;
    if (amount > 100) amount = 100;

    if (!isMaster && codes.length + amount > roleCodeLimit) {
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

    const getInviteMessage = (code: string, creatorRole: string, tier: 'general' | 'familyVip' = 'general') => {
      const baseOrigin = window.location.origin;
      const websiteUrl = wedding.id === 'miracle-malvin' && tier === 'familyVip'
        ? `${baseOrigin}/main`
        : baseOrigin;
      const template = tier === 'familyVip' ? invitationPosters.familyVipMessage : invitationPosters.generalMessage;
      return formatInviteMessage(template, code, websiteUrl, creatorRole, tier, wedding.couple.title, wedding.event.displayDate);
    };


  const handleShareCode = (code: string) => {
    const target = codes.find(c => c.code === code);
    setSharingRecipientName(target?.assigned_to || '');
    setSharingCode(code);
  };

  const handleSaveRecipientOnly = async (codeId: string, recipientName: string) => {
    try {
      await assignInviteCode(codeId, recipientName);
      setCodes(prev => prev.map(c => c.id === codeId ? { ...c, assigned_to: recipientName.trim() || undefined } : c));
      setEditingRecipientCodeId(null);
      onNotify('Recipient Updated', recipientName.trim() ? `Assigned code to ${recipientName.trim()}` : 'Recipient cleared.');
      if (sharingCode) setSharingCode(null);
    } catch (e) {
      onNotify('Error', 'Failed to update recipient name.');
    }
  };

  const executeShare = async (code: string, tier: 'general' | 'familyVip') => {
    const targetCode = codes.find(c => c.code === code);
    const creatorRole = targetCode?.created_by || role || '';
    const text = getInviteMessage(code, creatorRole, tier);
    const posterUrl = tier === 'familyVip' ? invitationPosters.familyVipUrl : invitationPosters.generalUrl;

    const markShared = async () => {
      setCopiedCode(code);
      const recipient = sharingRecipientName.trim();
      if (targetCode) {
        try {
          await markInviteCodeAsShared(targetCode.id, recipient || undefined);
          setCodes(prev => prev.map(c => c.id === targetCode.id ? { 
            ...c, 
            is_shared: true,
            assigned_to: recipient || c.assigned_to 
          } : c));
        } catch (e) {
          console.error('Failed to save shared status to DB', e);
        }
      }
      setTimeout(() => setCopiedCode(null), 2500);
      setSharingCode(null);
    };

    let filesArray: File[] = [];
    if (posterUrl) {
      try {
        const response = await fetch(posterUrl);
        const blob = await response.blob();
        const ext = blob.type?.includes('jpeg') || blob.type?.includes('jpg') ? 'jpg' : 'png';
        const filename = `${wedding.slug}_${tier === 'familyVip' ? 'VIP_' : ''}Invitation.${ext}`;
        const file = new File([blob], filename, { type: blob.type || 'image/png' });
        filesArray = [file];
      } catch (fetchErr) {
        console.warn('Could not load IV poster image for sharing', fetchErr);
      }
    }

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: tier === 'familyVip' ? `${wedding.couple.title} VIP Wedding Invitation` : `${wedding.couple.title} Wedding Invitation`,
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
      if (!imageBlob && posterUrl) {
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
      await saveStoredInvitationPosters(updated);
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
      title: 'Remove Invitation Card',
      message: `Are you sure you want to remove the ${tier === 'familyVip' ? 'Family & VIP' : 'General'} invitation card?`,
      onConfirm: async () => {
        const updated: InvitationPostersConfig = {
          ...invitationPosters,
          [tier === 'general' ? 'generalUrl' : 'familyVipUrl']: '',
          [tier === 'general' ? 'generalUpdatedAt' : 'familyVipUpdatedAt']: undefined
        };
        setInvitationPosters(updated);
        await saveStoredInvitationPosters(updated);
        onNotify('Card Removed', `${tier === 'familyVip' ? 'Family & VIP' : 'General'} card removed.`);
      }
    });
  };

  const handleSaveMessage = async (tier: 'general' | 'familyVip') => {
    setIsSavingMessage(tier);
    try {
      const draft = tier === 'general' ? generalMsgDraft : familyVipMsgDraft;
      const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const updated: InvitationPostersConfig = {
        ...invitationPosters,
        [tier === 'general' ? 'generalMessage' : 'familyVipMessage']: draft,
        [tier === 'general' ? 'generalMessageUpdatedAt' : 'familyVipMessageUpdatedAt']: `Edited ${nowStr}`
      };
      setInvitationPosters(updated);
      await saveStoredInvitationPosters(updated);
      onNotify('Message Saved', `${tier === 'familyVip' ? 'Family & VIP' : 'General'} invitation message saved and synced across all devices.`);
    } catch (err) {
      console.error('Failed to save invitation message:', err);
      onNotify('Error', 'Failed to save invitation message.');
    } finally {
      setIsSavingMessage(null);
    }
  };

  const handleResetMessage = (tier: 'general' | 'familyVip') => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Message to Default',
      message: `Are you sure you want to restore the default ${tier === 'familyVip' ? 'Family & VIP' : 'General'} invitation message? Any unsaved edits will be discarded.`,
      onConfirm: async () => {
        const defaultText = tier === 'general' ? DEFAULT_INVITATION_MESSAGES.general : DEFAULT_INVITATION_MESSAGES.familyVip;
        if (tier === 'general') setGeneralMsgDraft(defaultText);
        else setFamilyVipMsgDraft(defaultText);

        const updated: InvitationPostersConfig = {
          ...invitationPosters,
          [tier === 'general' ? 'generalMessage' : 'familyVipMessage']: defaultText,
          [tier === 'general' ? 'generalMessageUpdatedAt' : 'familyVipMessageUpdatedAt']: 'Default Template'
        };
        setInvitationPosters(updated);
        await saveStoredInvitationPosters(updated);
        onNotify('Message Reset', `${tier === 'familyVip' ? 'Family & VIP' : 'General'} invitation message restored to default template.`);
      }
    });
  };

  const handleInsertPlaceholder = (tier: 'general' | 'familyVip', tag: '{code}' | '{link}') => {
    if (tier === 'general') {
      setGeneralMsgDraft(prev => prev ? `${prev} ${tag}` : tag);
    } else {
      setFamilyVipMsgDraft(prev => prev ? `${prev} ${tag}` : tag);
    }
    onNotify('Placeholder Added', `Added ${tag} to ${tier === 'familyVip' ? 'Family & VIP' : 'General'} message draft.`);
  };

  const handleReallocateRsvpCode = (rsvp: RsvpSubmission, matchingCode?: InviteCode) => {
    const guestName = `${rsvp.firstName} ${rsvp.lastName}`.trim();
    const defaultAdmin = wedding.id === 'busonma-bunigom' ? 'busonma' : 'malvin';
    const creator = matchingCode?.created_by || (creatorFilter !== 'all' ? creatorFilter : (role || defaultAdmin));
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
          <h2 className="text-2xl font-serif text-brand-goldLight">{wedding.couple.title}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-brand-cream/70 text-xs font-sans tracking-widest uppercase">
              Admin Dashboard
            </span>
            <span className="w-1 h-1 rounded-full bg-brand-gold/60" />
            <span className="text-brand-goldLight text-xs font-sans font-bold uppercase tracking-wider">
              {currentRoleConfig?.label || (isSuperAdmin ? 'Super Admin' : (isCoordinator ? 'Event Coordinator' : 'Family Admin'))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && onOpenResetPin && (
            <button
              onClick={onOpenResetPin}
              className="flex items-center gap-2 px-3.5 py-2 bg-brand-gold/15 border border-brand-gold/30 rounded-xl text-brand-goldLight hover:bg-brand-gold/25 transition-colors text-xs font-semibold tracking-wider"
              title="Change or reset admin PINs (Master Admin Only)"
            >
              <KeyRound className="w-4 h-4 text-brand-gold" />
              <span>Change / Reset Admin PIN</span>
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
        <button
          onClick={() => setActiveTab('rsvps')}
          className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'rsvps'
              ? 'bg-brand-espresso text-brand-goldLight'
              : 'bg-white text-brand-muted hover:bg-brand-sand/50'
          }`}
        >
          <Users className="w-4 h-4" /> {isFamilyAdmin ? 'My Guests RSVPs' : 'Guest RSVPs'}
        </button>

        {!isCoordinator && (
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
              activeTab === 'codes'
                ? 'bg-brand-espresso text-brand-goldLight'
                : 'bg-white text-brand-muted hover:bg-brand-sand/50'
            }`}
          >
            <KeyRound className="w-4 h-4" /> {isFamilyAdmin ? 'My Invite Codes' : 'Invite Codes'}
          </button>
        )}

        {isSuperAdmin && (
          <>
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

            <button
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-3 rounded-t-2xl text-xs font-sans font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'admins'
                  ? 'bg-brand-espresso text-brand-goldLight'
                  : 'bg-white text-brand-muted hover:bg-brand-sand/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admins & Roles
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


                        {/* Guest Search Bar */}
                        <div className="relative w-full sm:w-72">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search guest name or email..."
                            value={guestSearchQuery}
                            onChange={(e) => setGuestSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-brand-cream/30 border border-brand-sand/50 rounded-xl text-xs font-sans text-brand-espresso placeholder:text-brand-muted/70 focus:outline-none focus:ring-1 focus:ring-brand-gold/60"
                          />
                          {guestSearchQuery && (
                            <button
                              onClick={() => setGuestSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-espresso"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Creator Filter for Super Admin (Miracle & Malvin and added family admins, excluding coordinators) */}
                        {isSuperAdmin && (
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-brand-sand/30 rounded-xl text-brand-muted text-xs font-bold uppercase tracking-wider mr-2">
                              <Filter className="w-3.5 h-3.5" /> Creator
                            </div>
                          {(() => {
                            const getCreatorRsvpCount = (creatorId: string): number => {
                              if (creatorId === 'all') return rsvps.length;
                              const creatorCodes = codes.filter(c => c.created_by === creatorId && c.is_used && c.used_by);
                              const usedNames = creatorCodes.map(c => c.used_by!.trim().toLowerCase());
                              return rsvps.filter(r => usedNames.includes((r.firstName.trim() + ' ' + r.lastName.trim()).toLowerCase())).length;
                            };

                            return [
                              { id: 'all', label: 'All' },
                              ...wedding.admin.roles
                                .filter(r => r.accessPoint !== 'coordinator')
                                .map(r => ({
                                  id: r.role,
                                  label: r.label.split('(')[0].trim()
                                }))
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
                            'Attendance': r.attendance === 'yes' ? 'Attending' : 'Declined',
                            'Checked In': r.isCheckedIn ? 'Yes' : 'No',
                            'Check-In Time': r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString() : '',
                            'Selected Date': r.selectedDate || (r.attendingDates ? r.attendingDates.join(' & ') : (r.attendance === 'yes' ? 'Both Dates' : 'N/A')),
                            'Email': r.email || '',
                            'Message': r.message || '',
                            'Submitted At': new Date(r.submittedAt).toLocaleString()
                          }));

                          if (isSuperAdmin || isCoordinator) {
                            const roles = wedding.admin.roles.map(r => r.role);
                            const roleLabels: Record<string, string> = wedding.admin.roles.reduce((acc, r) => {
                              acc[r.role] = r.label.split('(')[0].trim();
                              return acc;
                            }, {} as Record<string, string>);
                            
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
                          
                          XLSX.writeFile(wb, `${wedding.slug}_Guestlist_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                          <th className="p-6 font-semibold">Day-Of Check-In</th>
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
                                <div className="flex flex-col items-start gap-1.5">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    rsvp.attendance === 'yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {rsvp.attendance === 'yes' ? 'Attending' : 'Declined'}
                                  </span>
                                  {rsvp.attendance === 'yes' && (
                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-brand-gold/15 text-brand-espresso border border-brand-gold/30">
                                      {rsvp.selectedDate || 'Both Dates (Jan 7 & 9)'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex flex-col items-start gap-1">
                                  <button
                                    onClick={() => handleToggleCheckIn(rsvp)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                      rsvp.isCheckedIn
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-brand-sand/40 hover:bg-emerald-100 text-brand-espresso hover:text-emerald-900 border border-brand-sand/60'
                                    }`}
                                    title={rsvp.isCheckedIn ? 'Click to mark as not arrived' : 'Click to check in guest'}
                                  >
                                    <Check className={`w-3.5 h-3.5 ${rsvp.isCheckedIn ? 'text-white' : 'text-emerald-700'}`} />
                                    <span>{rsvp.isCheckedIn ? 'Checked In' : 'Check In'}</span>
                                  </button>
                                  {rsvp.isCheckedIn && rsvp.checkedInAt && (
                                    <span className="text-[10px] text-brand-muted font-mono">
                                      {new Date(rsvp.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
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
                                  if (isCoordinator) {
                                    return (
                                      <div className="text-right text-xs text-brand-muted font-mono">
                                        {matchingCode ? ('Code: ' + matchingCode.code) : 'Guest Verified'}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleReallocateRsvpCode(rsvp, matchingCode)}
                                        className="px-2.5 py-1.5 rounded-xl bg-brand-sand/40 hover:bg-amber-100 text-brand-espresso hover:text-amber-900 border border-brand-sand/60 text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                                        title={matchingCode ? ('Re-allocate code ' + matchingCode.code + ' (Guest: ' + rsvp.firstName + ')') : ('Generate replacement code for ' + rsvp.firstName)}
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
                      onClick={() => exportGiftPledgesCsv(wedding.slug)}
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
                      max={!isMaster ? Math.max(0, roleCodeLimit - codes.length) : 100}
                      disabled={!isMaster && codes.length >= roleCodeLimit}
                      value={bulkGenAmount}
                      onChange={(e) => setBulkGenAmount(e.target.value)}
                      className="w-20 px-4 py-4 bg-brand-cream/50 border border-brand-sand/50 rounded-xl text-center font-sans font-bold text-brand-espresso focus:outline-none focus:border-brand-gold disabled:opacity-50"
                      placeholder="Qty"
                    />
                    <button
                      onClick={handleGenerateCode}
                      disabled={isGenerating || (!isMaster && codes.length >= roleCodeLimit)}
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
                          {!isMaster && (
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
                                'Sent To (Assigned)': c.assigned_to || '',
                                'Used By (RSVP)': c.used_by || '',
                                'Created At': new Date(c.created_at).toLocaleString()
                              }));

                              if (isMaster) {
                                const roles = wedding.admin.roles.map(r => r.role);
                                const roleLabels: Record<string, string> = wedding.admin.roles.reduce((acc, r) => {
                                  acc[r.role] = r.label.split('(')[0].trim();
                                  return acc;
                                }, {} as Record<string, string>);
                                
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
                              
                              XLSX.writeFile(wb, `${wedding.slug}_Codes_${new Date().toISOString().split('T')[0]}.xlsx`);
                            } catch (e) {
                              console.error('Export error:', e);
                              onNotify('Export Failed', 'There was an error generating the Excel file.');
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-brand-espresso text-brand-goldLight text-xs font-sans uppercase tracking-wider rounded-xl hover:bg-brand-charcoal transition-colors font-bold"
                        >
                          <Download className="w-4 h-4" /> Export Excel
                        </button>
                        <button
                          onClick={() => exportInviteCodesCsv(isMaster && creatorFilter !== 'all' ? creatorFilter : (!isMaster ? role : undefined), wedding.slug)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-sand/60 text-brand-espresso text-xs font-sans uppercase tracking-wider rounded-xl hover:bg-brand-sand/30 transition-colors font-bold"
                        >
                          <Download className="w-4 h-4 text-brand-goldDark" /> Export CSV
                        </button>
                      </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-brand-sand/20">
                      {/* Status Filter Tabs */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-sand/30 rounded-xl text-brand-muted text-xs font-bold uppercase tracking-wider mr-1 shrink-0">
                          <Filter className="w-3.5 h-3.5" /> Status
                        </div>
                        {[
                          { id: 'all', label: `All (${codeStats.total})` },
                          { id: 'available', label: `Available (${codeStats.available})` },
                          { id: 'shared', label: `Shared (${codeStats.shared})` },
                          { id: 'used', label: `Used (${codeStats.used})` }
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setCodeStatusFilter(s.id as any);
                              setSelectedCodes(new Set());
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all border shrink-0 whitespace-nowrap ${
                              codeStatusFilter === s.id
                                ? 'bg-brand-espresso text-brand-goldLight border-brand-espresso shadow-sm'
                                : 'bg-white text-brand-muted border-brand-sand/50 hover:bg-brand-sand/30'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Search Bar for Code or Recipient / Used By */}
                      <div className="relative w-full md:w-64 shrink-0">
                        <input
                          type="text"
                          placeholder="Search code or guest..."
                          value={codeSearchQuery}
                          onChange={(e) => setCodeSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-7 py-1.5 rounded-xl border border-brand-sand/60 bg-brand-cream/10 text-xs font-sans text-brand-espresso placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-goldDark"
                        />
                        <Search className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        {codeSearchQuery && (
                          <button
                            onClick={() => setCodeSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-espresso"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Creator Filters for Active Wedding Roles */}
                    {isMaster && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1 border-t border-brand-sand/20 pt-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-sand/30 rounded-xl text-brand-muted text-xs font-bold uppercase tracking-wider mr-1 shrink-0">
                          <Users className="w-3.5 h-3.5" /> Creator
                        </div>
                        {[
                          { id: 'all', label: 'All Creators' },
                          ...wedding.admin.roles.map(r => ({
                            id: r.role,
                            label: `${r.label.split('(')[0].trim()} (${r.defaultPin})`
                          }))
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
                          <th className="p-6 font-semibold">Sent To (Guest)</th>
                          <th className="p-6 font-semibold">Used By (RSVP)</th>
                          <th className="p-6 font-semibold">Created</th>
                          <th className="p-6 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-sans text-brand-espresso">
                        {filteredCodes.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-12 text-center text-brand-muted text-base">
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
                              <td className="p-4 sm:p-6">
                                {editingRecipientCodeId === c.id ? (
                                  <div className="flex items-center gap-1.5 min-w-[170px]" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      autoFocus
                                      value={editingRecipientValue}
                                      onChange={(e) => setEditingRecipientValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveRecipientOnly(c.id, editingRecipientValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingRecipientCodeId(null);
                                        }
                                      }}
                                      placeholder="Recipient name..."
                                      className="px-2.5 py-1 text-xs rounded-lg border border-brand-goldDark focus:outline-none bg-white text-brand-espresso w-full font-sans shadow-sm"
                                    />
                                    <button
                                      onClick={() => handleSaveRecipientOnly(c.id, editingRecipientValue)}
                                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
                                      title="Save recipient"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingRecipientCodeId(null)}
                                      className="p-1.5 rounded-lg bg-brand-sand/40 hover:bg-brand-sand text-brand-muted transition-colors shrink-0"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : c.assigned_to ? (
                                  <div className="flex items-center gap-1.5 group max-w-[200px]">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-sand/30 text-brand-espresso border border-brand-sand/60 truncate" title={c.assigned_to}>
                                      <Users className="w-3 h-3 text-brand-goldDark shrink-0" />
                                      <span className="truncate">{c.assigned_to}</span>
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingRecipientCodeId(c.id);
                                        setEditingRecipientValue(c.assigned_to || '');
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-brand-sand/40 rounded-lg text-brand-muted hover:text-brand-espresso transition-all shrink-0"
                                      title="Edit recipient name"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingRecipientCodeId(c.id);
                                      setEditingRecipientValue('');
                                    }}
                                    className="text-xs text-brand-muted/70 hover:text-brand-goldDark flex items-center gap-1 border border-dashed border-brand-sand/80 hover:border-brand-goldDark px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                                    title="Track who this code was given or sent to"
                                  >
                                    <Plus className="w-3 h-3" /> Add Guest
                                  </button>
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
                                        onClick={() => handleReallocateCode(c.id, c.code, c.created_by || role || (wedding.id === 'busonma-bunigom' ? 'busonma' : 'malvin'))}
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
                      Upload and manage the official invitation posters for {wedding.couple.title}. Whenever you share an invite code, guests will receive the updated artwork corresponding to their tier.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-brand-sand/20 rounded-2xl border border-brand-sand/40 text-xs font-medium text-brand-muted shrink-0">
                    <Sparkles className="w-4 h-4 text-brand-goldDark" />
                    <span>Auto-optimized image quality</span>
                  </div>
                </div>

                                {/* 2-Column Suite: General Guests on Left, Close Family & VIP on Right (Stacked on Mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Column 1: General Guests Suite (Poster + Accompanying Message) */}
                  <div className="flex flex-col gap-6">
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
                          {invitationPosters.generalUrl ? (invitationPosters.generalUpdatedAt || 'Uploaded') : 'Empty'}
                        </span>
                      </div>
  
                      <div className="p-5 sm:p-6 flex flex-col items-center flex-1 bg-brand-ivory/30">
                        {invitationPosters.generalUrl ? (
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
                        ) : (
                          <div className="w-full max-w-sm aspect-[4/5] rounded-2xl border-2 border-dashed border-brand-sand/70 flex flex-col items-center justify-center p-6 text-center bg-white/70">
                            <div className="w-16 h-16 rounded-full bg-brand-cream border border-brand-sand/50 flex items-center justify-center mb-3.5 text-brand-muted">
                              <ImageIcon className="w-8 h-8 text-brand-goldDark" />
                            </div>
                            <p className="font-serif text-xl text-brand-espresso font-medium mb-1.5">No Invitation Card</p>
                            <p className="font-sans text-xs text-brand-muted max-w-[220px] leading-relaxed">
                              Upload the official general guests invitation card for {wedding.couple.title}.
                            </p>
                          </div>
                        )}
                      </div>
  
                      <div className="p-5 sm:p-6 border-t border-brand-sand/30 bg-white flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 px-5 py-2.5 bg-brand-espresso text-brand-goldLight rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-goldDark transition-colors cursor-pointer shadow-sm">
                          <UploadCloud className="w-4 h-4" />
                          <span>{isUploadingPoster === 'general' ? 'Uploading...' : (invitationPosters.generalUrl ? 'Replace Poster' : 'Upload Card')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingPoster === 'general'}
                            onChange={(e) => handleUploadPoster(e, 'general')}
                            className="hidden"
                          />
                        </label>
  
                        {invitationPosters.generalUrl && (
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
                              title="Remove card"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* General Message Card */}
                      <div className="bg-brand-cream/20 rounded-3xl border border-brand-sand/40 overflow-hidden flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-brand-sand/30 flex items-center justify-between bg-white">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-100 font-bold px-2.5 py-0.5 rounded-full">
                              General Guests
                            </span>
                            <h4 className="font-serif text-xl sm:text-2xl text-brand-espresso mt-1">General Message</h4>
                            <p className="text-xs text-brand-muted mt-0.5">Sent with General Invitation Card</p>
                          </div>
                          <span className="text-[11px] font-sans text-brand-muted/70 bg-brand-ivory px-3 py-1 rounded-xl border border-brand-sand/40">
                            {invitationPosters.generalMessageUpdatedAt || 'Default Template'}
                          </span>
                        </div>
  
                        {/* Toolbar */}
                        <div className="px-5 py-3 bg-brand-ivory/60 border-b border-brand-sand/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-brand-muted font-semibold uppercase tracking-wider mr-1">Insert:</span>
                            <button
                              type="button"
                              onClick={() => handleInsertPlaceholder('general', '{code}')}
                              className="px-2.5 py-1 rounded-lg bg-white border border-brand-sand/60 hover:bg-brand-gold/10 hover:border-brand-gold text-brand-espresso text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
                              title="Insert unique guest RSVP code tag"
                            >
                              + {`{code}`}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertPlaceholder('general', '{link}')}
                              className="px-2.5 py-1 rounded-lg bg-white border border-brand-sand/60 hover:bg-brand-gold/10 hover:border-brand-gold text-brand-espresso text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
                              title="Insert website RSVP link tag"
                            >
                              + {`{link}`}
                            </button>
                          </div>
  
                          {/* Toggle Editor vs Live Phone Preview */}
                          <div className="flex items-center gap-1 bg-brand-sand/30 p-0.5 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setPreviewTab(prev => ({ ...prev, general: 'editor' }))}
                              className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                                previewTab.general === 'editor'
                                  ? 'bg-white text-brand-espresso shadow-xs'
                                  : 'text-brand-muted hover:text-brand-espresso'
                              }`}
                            >
                              <Edit2 className="w-3 h-3 inline mr-1" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewTab(prev => ({ ...prev, general: 'preview' }))}
                              className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                                previewTab.general === 'preview'
                                  ? 'bg-white text-brand-espresso shadow-xs'
                                  : 'text-brand-muted hover:text-brand-espresso'
                              }`}
                            >
                              <Smartphone className="w-3 h-3 inline mr-1" /> Preview
                            </button>
                          </div>
                        </div>
  
                        {/* Content Area */}
                        <div className="p-5 flex-1 flex flex-col bg-white">
                          {previewTab.general === 'editor' ? (
                            <div className="flex-1 flex flex-col">
                              <textarea
                                value={generalMsgDraft}
                                onChange={(e) => setGeneralMsgDraft(e.target.value)}
                                rows={11}
                                className="w-full flex-1 p-4 rounded-2xl border border-brand-sand/60 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 font-sans text-xs sm:text-sm text-brand-espresso leading-relaxed resize-y min-h-[220px]"
                                placeholder="Write the accompanying general invitation message..."
                              />
                              <div className="flex items-center justify-between mt-2 text-[11px] text-brand-muted">
                                <span>Formatting: *bold*, _italic_</span>
                                <span>{generalMsgDraft.length} characters</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="bg-[#EFEAE2] p-4 sm:p-5 rounded-2xl border border-brand-sand/40 shadow-inner">
                                <div className="text-[11px] font-mono text-emerald-800 font-bold mb-2 flex items-center gap-1">
                                  <Smartphone className="w-3.5 h-3.5" /> Sample WhatsApp Message Preview
                                </div>
                                <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm text-xs sm:text-sm text-brand-espresso whitespace-pre-wrap leading-relaxed font-sans border border-brand-sand/30">
                                  {formatInviteMessage(generalMsgDraft, '84722', window.location.origin, role, 'general', wedding.couple.title, wedding.event.displayDate)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
  
                        {/* Footer Actions */}
                        <div className="p-5 border-t border-brand-sand/30 bg-brand-cream/30 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveMessage('general')}
                            disabled={isSavingMessage === 'general'}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-espresso text-brand-goldLight rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-charcoal transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            <span>{isSavingMessage === 'general' ? 'Saving...' : 'Save Message'}</span>
                          </button>
  
                          <button
                            type="button"
                            onClick={() => handleResetMessage('general')}
                            className="p-2.5 rounded-xl border border-brand-sand/60 hover:bg-rose-50 text-brand-muted hover:text-rose-600 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            title="Restore default message template"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset Default</span>
                          </button>
                        </div>
                  </div>

                  {/* Column 2: Close Family & VIP Suite (Poster + Accompanying Message) */}
                  <div className="flex flex-col gap-6">
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
                          {invitationPosters.familyVipUrl ? (invitationPosters.familyVipUpdatedAt || 'Uploaded') : 'Empty'}
                        </span>
                      </div>
  
                      <div className="p-5 sm:p-6 flex flex-col items-center flex-1 bg-brand-ivory/30">
                        {invitationPosters.familyVipUrl ? (
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
                        ) : (
                          <div className="w-full max-w-sm aspect-[4/5] rounded-2xl border-2 border-dashed border-brand-gold/60 flex flex-col items-center justify-center p-6 text-center bg-white/70">
                            <div className="w-16 h-16 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center mb-3.5 text-brand-goldDark">
                              <Sparkles className="w-8 h-8 text-brand-goldDark" />
                            </div>
                            <p className="font-serif text-xl text-brand-espresso font-medium mb-1.5">No VIP Card</p>
                            <p className="font-sans text-xs text-brand-muted max-w-[220px] leading-relaxed">
                              Upload the special Close Family & VIP invitation card for {wedding.couple.title}.
                            </p>
                          </div>
                        )}
                      </div>
  
                      <div className="p-5 sm:p-6 border-t border-brand-sand/30 bg-white flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 px-5 py-2.5 bg-brand-goldDark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-espresso transition-colors cursor-pointer shadow-sm">
                          <UploadCloud className="w-4 h-4" />
                          <span>{isUploadingPoster === 'familyVip' ? 'Uploading...' : (invitationPosters.familyVipUrl ? 'Replace Poster' : 'Upload Card')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingPoster === 'familyVip'}
                            onChange={(e) => handleUploadPoster(e, 'familyVip')}
                            className="hidden"
                          />
                        </label>
  
                        {invitationPosters.familyVipUrl && (
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
                              title="Remove card"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                      {/* Close Family & VIP Message Card */}
                      <div className="bg-brand-cream/20 rounded-3xl border-2 border-brand-gold/40 overflow-hidden flex flex-col">
                        <div className="p-5 sm:p-6 border-b border-brand-sand/30 flex items-center justify-between bg-gradient-to-r from-brand-gold/10 via-brand-cream/40 to-transparent">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-espresso bg-brand-gold/30 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-brand-goldDark" /> VIP & Family
                              </span>
                            </div>
                            <h4 className="font-serif text-xl sm:text-2xl text-brand-espresso mt-1">VIP & Family Message</h4>
                            <p className="text-xs text-brand-muted mt-0.5">Includes Engagement & Exclusive Afterparty</p>
                          </div>
                          <span className="text-[11px] font-sans text-brand-muted/70 bg-white px-3 py-1 rounded-xl border border-brand-sand/40">
                            {invitationPosters.familyVipMessageUpdatedAt || 'Default Template'}
                          </span>
                        </div>
  
                        {/* Toolbar */}
                        <div className="px-5 py-3 bg-brand-ivory/60 border-b border-brand-sand/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-brand-muted font-semibold uppercase tracking-wider mr-1">Insert:</span>
                            <button
                              type="button"
                              onClick={() => handleInsertPlaceholder('familyVip', '{code}')}
                              className="px-2.5 py-1 rounded-lg bg-white border border-brand-sand/60 hover:bg-brand-gold/10 hover:border-brand-gold text-brand-espresso text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
                              title="Insert unique guest RSVP code tag"
                            >
                              + {`{code}`}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertPlaceholder('familyVip', '{link}')}
                              className="px-2.5 py-1 rounded-lg bg-white border border-brand-sand/60 hover:bg-brand-gold/10 hover:border-brand-gold text-brand-espresso text-xs font-mono font-medium transition-colors cursor-pointer shadow-2xs"
                              title="Insert website RSVP link tag"
                            >
                              + {`{link}`}
                            </button>
                          </div>
  
                          {/* Toggle Editor vs Live Phone Preview */}
                          <div className="flex items-center gap-1 bg-brand-sand/30 p-0.5 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setPreviewTab(prev => ({ ...prev, familyVip: 'editor' }))}
                              className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                                previewTab.familyVip === 'editor'
                                  ? 'bg-white text-brand-espresso shadow-xs'
                                  : 'text-brand-muted hover:text-brand-espresso'
                              }`}
                            >
                              <Edit2 className="w-3 h-3 inline mr-1" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewTab(prev => ({ ...prev, familyVip: 'preview' }))}
                              className={`px-3 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                                previewTab.familyVip === 'preview'
                                  ? 'bg-white text-brand-espresso shadow-xs'
                                  : 'text-brand-muted hover:text-brand-espresso'
                              }`}
                            >
                              <Smartphone className="w-3 h-3 inline mr-1" /> Preview
                            </button>
                          </div>
                        </div>
  
                        {/* Content Area */}
                        <div className="p-5 flex-1 flex flex-col bg-white">
                          {previewTab.familyVip === 'editor' ? (
                            <div className="flex-1 flex flex-col">
                              <textarea
                                value={familyVipMsgDraft}
                                onChange={(e) => setFamilyVipMsgDraft(e.target.value)}
                                rows={11}
                                className="w-full flex-1 p-4 rounded-2xl border border-brand-sand/60 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 font-sans text-xs sm:text-sm text-brand-espresso leading-relaxed resize-y min-h-[220px]"
                                placeholder="Write the accompanying VIP & family invitation message..."
                              />
                              <div className="flex items-center justify-between mt-2 text-[11px] text-brand-muted">
                                <span>Formatting: *bold*, _italic_</span>
                                <span>{familyVipMsgDraft.length} characters</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="bg-[#EFEAE2] p-4 sm:p-5 rounded-2xl border border-brand-sand/40 shadow-inner">
                                <div className="text-[11px] font-mono text-emerald-800 font-bold mb-2 flex items-center gap-1">
                                  <Smartphone className="w-3.5 h-3.5" /> Sample WhatsApp Message Preview
                                </div>
                                <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm text-xs sm:text-sm text-brand-espresso whitespace-pre-wrap leading-relaxed font-sans border border-brand-sand/30">
                                  {formatInviteMessage(familyVipMsgDraft, '84722', window.location.origin, role, 'familyVip', wedding.couple.title, wedding.event.displayDate)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
  
                        {/* Footer Actions */}
                        <div className="p-5 border-t border-brand-sand/30 bg-brand-cream/30 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveMessage('familyVip')}
                            disabled={isSavingMessage === 'familyVip'}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-goldDark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-espresso transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            <span>{isSavingMessage === 'familyVip' ? 'Saving...' : 'Save Message'}</span>
                          </button>
  
                          <button
                            type="button"
                            onClick={() => handleResetMessage('familyVip')}
                            className="p-2.5 rounded-xl border border-brand-sand/60 hover:bg-rose-50 text-brand-muted hover:text-rose-600 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            title="Restore default message template"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset Default</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'admins' && isSuperAdmin && (
              <motion.div
                key="admins"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Header Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-sand/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand-muted font-bold">Super Admins</p>
                      <p className="text-2xl font-sans font-semibold text-brand-espresso">
                        {wedding.admin.roles.filter(r => (r.accessPoint === 'super' || r.isMaster)).length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-sand/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand-muted font-bold">Family Admins</p>
                      <p className="text-2xl font-sans font-semibold text-brand-espresso">
                        {wedding.admin.roles.filter(r => r.accessPoint === 'family').length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-sand/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand-muted font-bold">Event Coordinators</p>
                      <p className="text-2xl font-sans font-semibold text-brand-espresso">
                        {wedding.admin.roles.filter(r => r.accessPoint === 'coordinator').length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Management Container */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col border border-brand-sand/30">
                  <div className="p-6 border-b border-brand-sand/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-cream/10">
                    <div>
                      <h3 className="font-serif text-2xl text-brand-espresso">Admin Roster & Access Control</h3>
                      <p className="text-xs text-brand-muted mt-1 font-sans">
                        Manage who can access the dashboard, assign 4-digit PINs, and grant access points.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminFormOpen(true);
                        setAdminFormError('');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-espresso text-brand-goldLight rounded-xl text-xs font-sans font-bold tracking-wider uppercase hover:bg-brand-charcoal transition-colors shadow-md cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Add New Admin</span>
                    </button>
                  </div>

                  {/* Create New Admin Modal Popup */}
                  <AnimatePresence>
                    {adminFormOpen && (
                      <div
                        className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-brand-espresso/70 backdrop-blur-sm"
                        onClick={() => setAdminFormOpen(false)}
                        data-lenis-prevent="true"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 15 }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-brand-sand/50 relative overflow-hidden flex flex-col max-h-[92vh]"
                        >
                          {/* Modal Header */}
                          <div className="flex items-center justify-between border-b border-brand-sand/30 pb-4 mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 text-brand-goldDark flex items-center justify-center shrink-0">
                                <UserPlus className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-serif text-xl sm:text-2xl text-brand-espresso">Create New Admin</h4>
                                <p className="text-xs text-brand-muted font-sans mt-0.5">
                                  Set credentials, access point, and invite quotas
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAdminFormOpen(false)}
                              className="p-2 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/30 rounded-xl transition-colors cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Modal Form Scrollable Body */}
                          <form onSubmit={handleCreateAdmin} className="space-y-4 overflow-y-auto pr-1">
                            {adminFormError && (
                              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                                {adminFormError}
                              </div>
                            )}

                            {/* Admin Name */}
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2 font-sans">
                                Admin Name / Title *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Groom's Family, Auntie Helen, Lead Coordinator"
                                value={newAdminName}
                                onChange={(e) => setNewAdminName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-brand-cream/30 border border-brand-sand/60 rounded-xl text-sm font-sans text-brand-espresso placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Access Point Selection */}
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2 font-sans">
                                  Access Point *
                                </label>
                                <select
                                  value={newAdminAccessPoint}
                                  onChange={(e) => setNewAdminAccessPoint(e.target.value as any)}
                                  className="w-full px-4 py-2.5 bg-brand-cream/30 border border-brand-sand/60 rounded-xl text-sm font-sans text-brand-espresso focus:outline-none focus:ring-2 focus:ring-brand-gold/40 cursor-pointer"
                                >
                                  <option value="family">Family Admin (Personal Guests & Codes)</option>
                                  <option value="coordinator">Event Coordinator (Full Guest List Alone)</option>
                                  <option value="super">Super Admin (Full Access to Everything)</option>
                                </select>
                              </div>

                              {/* 4-Digit PIN */}
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2 font-sans">
                                  4-Digit PIN / Password *
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={4}
                                  placeholder="e.g. 5555"
                                  value={newAdminPin}
                                  onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  className="w-full px-4 py-2.5 bg-brand-cream/30 border border-brand-sand/60 rounded-xl text-sm font-mono tracking-widest text-brand-espresso placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                                  required
                                />
                                <p className="text-[11px] text-brand-muted mt-1 font-sans">
                                  Must be exactly 4 digits.
                                </p>
                              </div>
                            </div>

                            {/* Capped Number of Couples / Codes (Family Admin Only) */}
                            {newAdminAccessPoint === 'family' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-4 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 font-sans">
                                    Invite Cap (Max Couples / Codes) *
                                  </label>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                    Cap Enforced
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  min="1"
                                  max="500"
                                  placeholder="e.g. 20, 50, 100"
                                  value={newAdminCodeLimit}
                                  onChange={(e) => setNewAdminCodeLimit(e.target.value)}
                                  className="w-full px-4 py-2.5 bg-white border border-emerald-400/80 rounded-xl text-sm font-sans font-semibold text-brand-espresso focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                  required
                                />
                                <p className="text-[11px] text-emerald-900 font-sans leading-relaxed">
                                  This family admin will be strictly capped to creating a maximum of <strong>{newAdminCodeLimit || '...'}</strong> invite codes / couples.
                                </p>
                              </motion.div>
                            )}

                            {/* Access Point Explanation Note */}
                            <div className="p-3.5 bg-brand-ivory rounded-2xl border border-brand-sand/40 text-xs text-brand-espresso/80 font-sans leading-relaxed">
                              <span className="font-bold text-brand-espresso">Access Point Details: </span>
                              {newAdminAccessPoint === 'family' && (
                                <span>
                                  <strong>Family Admin:</strong> Restricts this user strictly to guests who RSVP'd using their assigned invite codes, and allows them to generate & share codes up to their assigned cap. All financial and registry details are hidden.
                                </span>
                              )}
                              {newAdminAccessPoint === 'coordinator' && (
                                <span>
                                  <strong>Event Coordinator:</strong> Gives full visibility into the entire wedding guest list with real-time arrival check-in buttons and Excel export. Financial gifts, invite codes, and admin settings are strictly restricted.
                                </span>
                              )}
                              {newAdminAccessPoint === 'super' && (
                                <span>
                                  <strong>Super Admin:</strong> Full permissions across the entire platform, including all guest lists, all invite codes, monetary gifts, wishlist, invitations, and admin roster management.
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-sand/30">
                              <button
                                type="button"
                                onClick={() => setAdminFormOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-brand-muted hover:text-brand-espresso text-xs font-sans font-bold uppercase tracking-wider hover:bg-brand-sand/30 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-6 py-2.5 bg-brand-espresso text-brand-goldLight rounded-xl text-xs font-sans font-bold uppercase tracking-wider hover:bg-brand-charcoal transition-colors shadow-md cursor-pointer"
                              >
                                Save & Create Admin
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Admin Roster Table */}
                  <div className="overflow-x-auto" data-lenis-prevent="true">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-cream/30 text-xs uppercase tracking-widest font-sans text-brand-muted border-b border-brand-sand/30">
                          <th className="p-6 font-semibold w-16 text-center">#</th>
                          <th className="p-6 font-semibold">Admin / Creator</th>
                          <th className="p-6 font-semibold">Access Point</th>
                          <th className="p-6 font-semibold">4-Digit PIN</th>
                          <th className="p-6 font-semibold">Created</th>
                          <th className="p-6 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-sans text-brand-espresso">
                        {wedding.admin.roles.map((adminRole, idx) => {
                          const isPermanent = wedding.id === 'busonma-bunigom'
                            ? (adminRole.role === 'busonma' || adminRole.role === 'bunigom')
                            : (adminRole.role === 'miracle' || adminRole.role === 'malvin');
                          const roleAccess: 'super' | 'family' | 'coordinator' = adminRole.accessPoint || (adminRole.isMaster ? 'super' : 'family');
                          const activePin = getStoredPin(adminRole.role, adminRole.defaultPin);
                          const isRevealed = revealedPins.has(adminRole.role);

                          return (
                            <tr key={adminRole.role} className="border-b border-brand-sand/30 hover:bg-brand-cream/20 transition-colors">
                              <td className="p-6 text-center text-brand-muted font-mono text-xs">
                                {idx + 1}
                              </td>
                              <td className="p-6">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-base text-brand-espresso flex items-center gap-2">
                                    {adminRole.label}
                                    {isPermanent && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wider uppercase border border-amber-300">
                                        Creator
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-brand-muted font-mono mt-0.5">
                                    Role ID: {adminRole.role}
                                  </span>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex flex-col items-start gap-1">
                                  {roleAccess === 'super' && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/60 inline-flex items-center gap-1.5">
                                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Super Admin
                                    </span>
                                  )}
                                  {roleAccess === 'family' && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300/60 inline-flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-emerald-700" /> Family Admin
                                    </span>
                                  )}
                                  {roleAccess === 'coordinator' && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-300/60 inline-flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-indigo-700" /> Event Coordinator
                                    </span>
                                  )}
                                  <span className="text-[11px] text-brand-muted font-sans">
                                    {roleAccess === 'family' ? ('Cap: ' + (adminRole.codeLimit || 50) + ' couples') : (roleAccess === 'super' ? 'Unlimited access' : 'Full guest list alone')}
                                  </span>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm tracking-widest bg-brand-cream/60 px-2.5 py-1 rounded-lg border border-brand-sand/40">
                                    {isRevealed ? activePin : '••••'}
                                  </span>
                                  <button
                                    onClick={() => toggleRevealPin(adminRole.role)}
                                    className="p-1.5 text-brand-muted hover:text-brand-espresso hover:bg-brand-sand/30 rounded-lg transition-colors cursor-pointer"
                                    title={isRevealed ? 'Hide PIN' : 'Reveal PIN'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-brand-goldDark" />}
                                  </button>
                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => handleOpenChangePinModal(adminRole)}
                                      className="px-2.5 py-1 rounded-lg bg-brand-sand/40 hover:bg-brand-gold/20 text-brand-espresso hover:text-brand-goldDark text-xs font-semibold flex items-center gap-1 transition-all border border-brand-sand/60 cursor-pointer shadow-2xs"
                                      title={'Change PIN for ' + adminRole.label}
                                    >
                                      <KeyRound className="w-3 h-3 text-brand-goldDark" />
                                      <span>Change</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-6 text-xs text-brand-muted">
                                {adminRole.createdAt ? new Date(adminRole.createdAt).toLocaleDateString() : 'Initial Setup'}
                              </td>
                              <td className="p-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => handleOpenChangePinModal(adminRole)}
                                      className="px-3 py-1.5 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/30 text-brand-goldDark font-bold text-xs flex items-center gap-1.5 transition-all border border-brand-gold/30 shadow-2xs cursor-pointer"
                                      title={'Change PIN for ' + adminRole.label}
                                    >
                                      <KeyRound className="w-3.5 h-3.5" />
                                      <span>Change PIN</span>
                                    </button>
                                  )}
                                  {!isPermanent && (
                                    <button
                                      onClick={() => handleDeleteAdminRole(adminRole)}
                                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                      title={'Delete admin ' + adminRole.label}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>

      
      {/* Super Admin Change PIN Modal */}
      <AnimatePresence>
        {pinModalAdmin && (
          <div
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-brand-espresso/70 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSavingPin) setPinModalAdmin(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-brand-cream rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-gold/30 text-left relative"
            >
              <button
                onClick={() => {
                  if (!isSavingPin) setPinModalAdmin(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-brand-muted hover:text-brand-espresso transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-amber-800 shadow-sm shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-espresso">
                    Change Admin PIN
                  </h3>
                  <p className="text-xs text-brand-muted font-sans mt-0.5">
                    {role === pinModalAdmin.role ? 'Update your personal 4-digit PIN' : ('Set a new 4-digit PIN for ' + pinModalAdmin.label)}
                  </p>
                </div>
              </div>

              <div className="p-3.5 mb-5 rounded-2xl bg-white/80 border border-brand-sand/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-brand-muted font-sans uppercase tracking-wider font-semibold">Target Admin</p>
                  <p className="text-sm font-bold text-brand-espresso mt-0.5">{pinModalAdmin.label}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-brand-sand/30 text-brand-espresso text-xs font-mono font-medium">
                  Role: {pinModalAdmin.role}
                </span>
              </div>

              {pinModalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{pinModalError}</p>
                </div>
              )}

              {pinModalSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-sans flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <p>{pinModalSuccess}</p>
                </div>
              )}

              <form onSubmit={handleSavePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-semibold text-brand-espresso uppercase tracking-wider mb-1.5">
                    New 4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    disabled={isSavingPin}
                    value={newPinValue}
                    onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="e.g. 5678"
                    className="w-full px-4 py-3 bg-white border border-brand-sand/60 rounded-xl font-mono text-center tracking-[0.5em] text-lg text-brand-espresso placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold shadow-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-semibold text-brand-espresso uppercase tracking-wider mb-1.5">
                    Confirm New 4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    disabled={isSavingPin}
                    value={confirmPinValue}
                    onChange={(e) => setConfirmPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Re-enter 4-digit PIN"
                    className="w-full px-4 py-3 bg-white border border-brand-sand/60 rounded-xl font-mono text-center tracking-[0.5em] text-lg text-brand-espresso placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold shadow-sm"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSavingPin}
                    onClick={() => setPinModalAdmin(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-brand-sand/60 text-brand-muted hover:text-brand-espresso hover:bg-white text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPin || newPinValue.length !== 4 || confirmPinValue.length !== 4}
                    className="flex-1 py-3 px-4 rounded-xl bg-brand-espresso hover:bg-brand-espresso/90 text-brand-goldLight text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSavingPin ? 'Saving...' : 'Update PIN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

                <div className="mt-4 mb-5 bg-brand-cream/40 p-3.5 rounded-2xl border border-brand-sand/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-espresso flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-goldDark" />
                      Recipient / Guest Name
                    </label>
                    {sharingRecipientName.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = codes.find(c => c.code === sharingCode);
                          if (target) handleSaveRecipientOnly(target.id, sharingRecipientName);
                        }}
                        className="text-[10px] text-brand-goldDark hover:underline font-bold"
                      >
                        Save Only
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Uncle John, Chiamaka Obi (Optional)"
                    value={sharingRecipientName}
                    onChange={(e) => setSharingRecipientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-brand-sand bg-white text-brand-espresso placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-goldDark font-sans shadow-inner"
                  />
                  <p className="text-[10px] text-brand-muted mt-1 font-sans">
                    Track who this code was given to in your guest list.
                  </p>
                </div>

                <p className="text-xs text-brand-muted mb-3 font-sans leading-relaxed">
                  Choose which card to share:
                </p>

                <div className="space-y-3">
                  {/* Option 1: General Invitation */}
                  <button
                    onClick={() => executeShare(sharingCode, 'general')}
                    className="w-full text-left p-4 rounded-2xl border-2 border-brand-sand/60 hover:border-brand-gold bg-white hover:bg-brand-ivory/60 transition-all group flex items-start gap-4 shadow-sm cursor-pointer"
                  >
                    <div className="w-16 h-20 rounded-xl bg-brand-sand/30 overflow-hidden shrink-0 border border-brand-sand/50 shadow-inner flex items-center justify-center">
                      {invitationPosters.generalUrl ? (
                        <img
                          src={invitationPosters.generalUrl}
                          alt="General Invitation"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-brand-muted/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-semibold text-brand-espresso group-hover:text-brand-goldDark transition-colors">
                          {wedding.id === 'miracle-malvin' ? 'Wedding Reception Only' : 'General Invitation Card'}
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                          {wedding.id === 'miracle-malvin' ? 'Reception Only' : 'Standard'}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 leading-snug">
                        {wedding.id === 'miracle-malvin'
                          ? 'Saturday, Jan 9 at Apata School Isolo. Links directly to the original domain (/).'
                          : 'Solemnization & Main Reception. Perfect for general guests.'}
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
                    <div className="w-16 h-20 rounded-xl bg-brand-sand/30 overflow-hidden shrink-0 border border-brand-gold/40 shadow-inner flex items-center justify-center">
                      {invitationPosters.familyVipUrl ? (
                        <img
                          src={invitationPosters.familyVipUrl}
                          alt="Close Family & VIP"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Sparkles className="w-6 h-6 text-brand-goldDark/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-semibold text-brand-espresso group-hover:text-brand-goldDark transition-colors flex items-center gap-1.5">
                          {wedding.id === 'miracle-malvin' ? 'Full Wedding Celebration' : 'Family & VIP Card'}
                          <Sparkles className="w-3.5 h-3.5 text-brand-goldDark" />
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-goldDark font-semibold shrink-0">
                          {wedding.id === 'miracle-malvin' ? 'All Details (VIP)' : 'VIP'}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 leading-snug">
                        {wedding.id === 'miracle-malvin'
                          ? 'Both White Wedding (Jan 7) & Reception (Jan 9). Links directly to /main.'
                          : 'Includes Engagement / Traditional ceremony & exclusive Afterparty details.'}
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
