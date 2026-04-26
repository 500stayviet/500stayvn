'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SupportedLanguage } from '@/lib/api/translation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGuestBookings, getOwnerBookings, type BookingData } from '@/lib/api/bookings';
import {
  getUnreadCountsByRole,
  markAllChatAsReadByRole,
  markAllMessagesInRoomAsRead,
  subscribeChatUnreadUpdates,
  refreshChatUnreadSnapshot,
} from '@/lib/api/chat';
import type { TopBarProps } from './types';

const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export function useTopBarState({
  currentLanguage: propCurrentLanguage,
  onLanguageChange: propOnLanguageChange,
  hideLanguageSelector = false,
}: TopBarProps) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const languageContext = useLanguage();
  const currentLanguage = propCurrentLanguage ?? languageContext.currentLanguage;
  const setCurrentLanguage = propOnLanguageChange ?? languageContext.setCurrentLanguage;

  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<{
    asGuest: BookingData[];
    asOwner: BookingData[];
  }>({ asGuest: [], asOwner: [] });
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCounts, setUnreadChatCounts] = useState({ asGuest: 0, asOwner: 0 });
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (user) {
      const savedReadIds = localStorage.getItem(`readNotifications_${user.uid}`);
      if (savedReadIds) {
        setReadNotificationIds(new Set(JSON.parse(savedReadIds)));
      }
      const savedEnabled = localStorage.getItem(`notificationsEnabled_${user.uid}`);
      if (savedEnabled !== null) {
        setNotificationsEnabled(savedEnabled === 'true');
      }
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isLanguageMenuOpen || isUserMenuOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen, isUserMenuOpen, isNotificationOpen]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;

      try {
        const [guestBookings, ownerBookings] = await Promise.all([
          getGuestBookings(user.uid),
          getOwnerBookings(user.uid),
        ]);

        const recentGuestBookings = guestBookings
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10);

        const recentOwnerBookings = ownerBookings
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10);

        setNotifications({
          asGuest: recentGuestBookings,
          asOwner: recentOwnerBookings,
        });

        const savedReadIds = localStorage.getItem(`readNotifications_${user.uid}`);
        const readIds = savedReadIds ? new Set(JSON.parse(savedReadIds)) : new Set();

        const unreadGuestCount = recentGuestBookings.filter((b) => b.id && !readIds.has(b.id)).length;
        const unreadOwnerCount = recentOwnerBookings.filter((b) => b.id && !readIds.has(b.id)).length;

        const chatUnreads = await getUnreadCountsByRole(user.uid);
        setUnreadChatCounts(chatUnreads);
        setUnreadCount(unreadGuestCount + unreadOwnerCount + chatUnreads.asGuest + chatUnreads.asOwner);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    void loadNotifications();

    const interval = setInterval(() => {
      void loadNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const reload = () => {
      const roomIds = [
        ...notifications.asGuest.map((b) => b.chatRoomId || ''),
        ...notifications.asOwner.map((b) => b.chatRoomId || ''),
      ].filter(Boolean);
      void refreshChatUnreadSnapshot(user.uid, roomIds).then((snap) => {
        setUnreadChatCounts({ asGuest: snap.asGuest, asOwner: snap.asOwner });
        const bookingUnread = [...notifications.asGuest, ...notifications.asOwner].filter(
          (b) => b.id && !readNotificationIds.has(b.id),
        ).length;
        setUnreadCount(bookingUnread + snap.asGuest + snap.asOwner);
      });
    };
    const unsub = subscribeChatUnreadUpdates(user.uid, (snapshot) => {
      if (snapshot) {
        setUnreadChatCounts({ asGuest: snapshot.asGuest, asOwner: snapshot.asOwner });
        const bookingUnread = [...notifications.asGuest, ...notifications.asOwner].filter(
          (b) => b.id && !readNotificationIds.has(b.id),
        ).length;
        setUnreadCount(bookingUnread + snapshot.asGuest + snapshot.asOwner);
        return;
      }
      reload();
    });
    return () => unsub();
  }, [user, notifications, readNotificationIds]);

  const markAsRead = (bookingId: string) => {
    if (!user || !bookingId) return;

    const newReadIds = new Set(readNotificationIds);
    newReadIds.add(bookingId);
    setReadNotificationIds(newReadIds);
    localStorage.setItem(`readNotifications_${user.uid}`, JSON.stringify([...newReadIds]));

    const allBookings = [...notifications.asGuest, ...notifications.asOwner];
    const newUnreadCount = allBookings.filter((b) => b.id && !newReadIds.has(b.id)).length;
    setUnreadCount(newUnreadCount);
  };

  const markAllAsRead = () => {
    if (!user) return;

    const allBookingIds = [
      ...notifications.asGuest.map((b) => b.id),
      ...notifications.asOwner.map((b) => b.id),
    ].filter(Boolean) as string[];

    const newReadIds = new Set([...readNotificationIds, ...allBookingIds]);
    setReadNotificationIds(newReadIds);
    localStorage.setItem(`readNotifications_${user.uid}`, JSON.stringify([...newReadIds]));
    setUnreadCount(0);
  };

  const toggleNotifications = () => {
    if (!user) return;

    const newEnabled = !notificationsEnabled;
    setNotificationsEnabled(newEnabled);
    localStorage.setItem(`notificationsEnabled_${user.uid}`, String(newEnabled));
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  const currentLang = LANGUAGES.find((lang) => lang.code === currentLanguage) ?? LANGUAGES[0];

  const handleLanguageSelect = async (lang: SupportedLanguage) => {
    await setCurrentLanguage(lang);
    setIsLanguageMenuOpen(false);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      router.push('/');
    } catch {
      // Silent fail
    }
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    router.push('/profile');
  };

  const toggleLanguageMenu = () => setIsLanguageMenuOpen((o) => !o);
  const toggleUserMenu = () => setIsUserMenuOpen((o) => !o);
  const toggleNotificationOpen = () => setIsNotificationOpen((o) => !o);

  const onGuestChatBannerClick = async () => {
    if (user) await markAllChatAsReadByRole(user.uid, 'guest');
    setIsNotificationOpen(false);
    router.push('/my-bookings?tab=confirmed');
  };

  const onOwnerChatBannerClick = async () => {
    if (user) await markAllChatAsReadByRole(user.uid, 'owner');
    setIsNotificationOpen(false);
    router.push('/host/bookings?tab=confirmed');
  };

  const onGuestBookingClick = async (booking: BookingData) => {
    if (booking.id) markAsRead(booking.id);
    if (booking.chatRoomId) await markAllMessagesInRoomAsRead(booking.chatRoomId);
    setIsNotificationOpen(false);
    const statusTab =
      booking.status === 'pending'
        ? 'pending'
        : booking.status === 'confirmed'
          ? 'confirmed'
          : booking.status === 'cancelled'
            ? 'cancelled'
            : '';
    router.push(`/my-bookings${statusTab ? `?tab=${statusTab}` : ''}`);
  };

  const onOwnerBookingClick = async (booking: BookingData) => {
    if (booking.id) markAsRead(booking.id);
    if (booking.chatRoomId) await markAllMessagesInRoomAsRead(booking.chatRoomId);
    setIsNotificationOpen(false);
    const statusTab =
      booking.status === 'pending'
        ? 'pending'
        : booking.status === 'confirmed'
          ? 'confirmed'
          : booking.status === 'cancelled'
            ? 'cancelled'
            : '';
    router.push(`/host/bookings${statusTab ? `?tab=${statusTab}` : ''}`);
  };

  return {
    user,
    loading,
    hideLanguageSelector,
    menuRef,
    userMenuRef,
    notificationRef,
    isLanguageMenuOpen,
    toggleLanguageMenu,
    isUserMenuOpen,
    toggleUserMenu,
    isNotificationOpen,
    toggleNotificationOpen,
    notifications,
    unreadCount,
    unreadChatCounts,
    readNotificationIds,
    notificationsEnabled,
    currentLanguage,
    languages: LANGUAGES,
    currentLang,
    handleLanguageSelect,
    handleHomeClick,
    handleLoginClick,
    handleLogout,
    handleProfileClick,
    markAllAsRead,
    toggleNotifications,
    onGuestChatBannerClick,
    onOwnerChatBannerClick,
    onGuestBookingClick,
    onOwnerBookingClick,
  };
}
