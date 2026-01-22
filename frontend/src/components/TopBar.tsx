/**
 * TopBar 컴포넌트 (인기 앱 스타일)
 * 
 * Airbnb/직방 스타일의 깔끔한 헤더
 * - 좌측: 500stayviet 로고 (홈 버튼)
 * - 우측: 언어 선택 + 로그인 상태에 따라 로그인 아이콘 또는 개인정보 버튼
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, User, LogOut, Bell, MessageCircle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { SupportedLanguage } from '@/lib/api/translation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGuestBookings, getOwnerBookings, BookingData } from '@/lib/api/bookings';
import { getUnreadCountsByRole, markAllChatAsReadByRole, markAllMessagesInRoomAsRead } from '@/lib/api/chat';

interface TopBarProps {
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  hideLanguageSelector?: boolean;
}

export default function TopBar({ currentLanguage: propCurrentLanguage, onLanguageChange: propOnLanguageChange, hideLanguageSelector = false }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  
  // LanguageContext에서 직접 언어 상태 가져오기
  // props가 전달되지 않은 경우 Context 사용
  const languageContext = useLanguage();
  const currentLanguage = propCurrentLanguage ?? languageContext.currentLanguage;
  // onLanguageChange가 전달되지 않은 경우 Context의 함수 사용
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
  
  // localStorage에서 읽은 알림 ID와 알림 설정 로드
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

  // 외부 클릭 시 드롭다운 닫기
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

  // 알림 데이터 로드
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        // 임차인 예약과 임대인 예약, 읽지 않은 채팅 모두 가져오기
        const [guestBookings, ownerBookings, chatUnreads] = await Promise.all([
          getGuestBookings(user.uid),
          getOwnerBookings(user.uid),
          getUnreadCountsByRole(user.uid)
        ]);
        
        // 최근 예약만 표시 (최근 10개씩)
        const recentGuestBookings = guestBookings
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10);
        
        const recentOwnerBookings = ownerBookings
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10);
        
        setNotifications({
          asGuest: recentGuestBookings,
          asOwner: recentOwnerBookings
        });
        
        // 읽지 않은 알림 수 계산 (읽은 알림 제외)
        const savedReadIds = localStorage.getItem(`readNotifications_${user.uid}`);
        const readIds = savedReadIds ? new Set(JSON.parse(savedReadIds)) : new Set();
        
        const unreadGuestCount = recentGuestBookings.filter(b => b.id && !readIds.has(b.id)).length;
        const unreadOwnerCount = recentOwnerBookings.filter(b => b.id && !readIds.has(b.id)).length;
        
        // 채팅 알림도 포함
        setUnreadChatCounts(chatUnreads);
        setUnreadCount(unreadGuestCount + unreadOwnerCount + chatUnreads.asGuest + chatUnreads.asOwner);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    
    loadNotifications();
    
    // 5초마다 새로고침
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);
  
  // 알림 읽음 처리
  const markAsRead = (bookingId: string) => {
    if (!user || !bookingId) return;
    
    const newReadIds = new Set(readNotificationIds);
    newReadIds.add(bookingId);
    setReadNotificationIds(newReadIds);
    localStorage.setItem(`readNotifications_${user.uid}`, JSON.stringify([...newReadIds]));
    
    // 읽지 않은 알림 수 업데이트
    const allBookings = [...notifications.asGuest, ...notifications.asOwner];
    const newUnreadCount = allBookings.filter(b => b.id && !newReadIds.has(b.id)).length;
    setUnreadCount(newUnreadCount);
  };
  
  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    if (!user) return;
    
    const allBookingIds = [
      ...notifications.asGuest.map(b => b.id),
      ...notifications.asOwner.map(b => b.id)
    ].filter(Boolean) as string[];
    
    const newReadIds = new Set([...readNotificationIds, ...allBookingIds]);
    setReadNotificationIds(newReadIds);
    localStorage.setItem(`readNotifications_${user.uid}`, JSON.stringify([...newReadIds]));
    setUnreadCount(0);
  };
  
  // 알림 켜기/끄기
  const toggleNotifications = () => {
    if (!user) return;
    
    const newEnabled = !notificationsEnabled;
    setNotificationsEnabled(newEnabled);
    localStorage.setItem(`notificationsEnabled_${user.uid}`, String(newEnabled));
  };

  // 홈으로 이동
  const handleHomeClick = () => {
    router.push('/');
  };

  // 언어 옵션 (영어, 베트남어, 한국어 순서)
  const languages: { code: SupportedLanguage; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  // 언어 변경 핸들러
  const handleLanguageSelect = async (lang: SupportedLanguage) => {
    await setCurrentLanguage(lang);
    setIsLanguageMenuOpen(false);
  };

  // 로그인 아이콘 클릭
  const handleLoginClick = () => {
    router.push('/login');
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      router.push('/');
    } catch (error) {
      // Silent fail
    }
  };

  // 개인정보 페이지로 이동
  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    // TODO: 개인정보 페이지로 이동
    router.push('/profile');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
          {/* 좌측: 로고 (홈으로 이동) */}
          <button
            onClick={handleHomeClick}
            className="flex items-center"
          >
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity">
              500stayviet
            </h1>
          </button>

          {/* 우측: 언어 선택 + 로그인/개인정보 */}
          <div className="flex items-center gap-2">
            {/* 언어 선택 (홈화면에서는 숨김) */}
            {!hideLanguageSelector && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-base">{currentLang.flag}</span>
                </button>

                {/* 언어 드롭다운 */}
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                          currentLanguage === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 로그인 상태에 따른 버튼 */}
            {!loading && (
              <>
                {user ? (
                  <>
                    {/* 알림 버튼 */}
                    <div className="relative" ref={notificationRef}>
                      <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={`p-2 hover:bg-gray-50 rounded-full transition-all duration-200 relative ${
                          notificationsEnabled ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400'
                        }`}
                        aria-label="Notifications"
                      >
                        <Bell className="w-5 h-5" />
                        {notificationsEnabled && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>

                      {/* 알림 드롭다운 */}
                      {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-[70vh] overflow-y-auto">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">
                              {currentLanguage === 'ko' ? '알림' : 
                               currentLanguage === 'vi' ? 'Thông báo' : 
                               'Notifications'}
                            </h3>
                          </div>

                          {/* 채팅 알림 (임차인용 - 가장 상단) */}
                          {unreadChatCounts.asGuest > 0 && (
                            <div className="border-b border-gray-100 bg-blue-50/30">
                              <button
                                onClick={async () => {
                                  if (user) await markAllChatAsReadByRole(user.uid, 'guest');
                                  setIsNotificationOpen(false);
                                  router.push('/my-bookings?tab=confirmed');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                              >
                                <div className="p-2 bg-blue-100 rounded-full">
                                  <MessageCircle className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900">
                                    {currentLanguage === 'ko' ? '새로운 메시지 (임차인)' : 
                                     currentLanguage === 'vi' ? 'Tin nhắn mới (Khách)' : 
                                     'New Message (Guest)'}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-0.5">
                                    {currentLanguage === 'ko' ? `${unreadChatCounts.asGuest}개의 읽지 않은 메시지가 있습니다` : 
                                     currentLanguage === 'vi' ? `Có ${unreadChatCounts.asGuest} tin nhắn chưa đọc` : 
                                     `You have ${unreadChatCounts.asGuest} unread message(s)`}
                                  </p>
                                </div>
                              </button>
                            </div>
                          )}

                          {/* 채팅 알림 (임대인용 - 상단) */}
                          {unreadChatCounts.asOwner > 0 && (
                            <div className="border-b border-gray-100 bg-green-50/30">
                              <button
                                onClick={async () => {
                                  if (user) await markAllChatAsReadByRole(user.uid, 'owner');
                                  setIsNotificationOpen(false);
                                  router.push('/host/bookings?tab=confirmed');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3"
                              >
                                <div className="p-2 bg-green-100 rounded-full">
                                  <MessageCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900">
                                    {currentLanguage === 'ko' ? '새로운 메시지 (임대인)' : 
                                     currentLanguage === 'vi' ? 'Tin nhắn mới (Chủ nhà)' : 
                                     'New Message (Host)'}
                                  </p>
                                  <p className="text-xs text-green-600 mt-0.5">
                                    {currentLanguage === 'ko' ? `${unreadChatCounts.asOwner}개의 읽지 않은 메시지가 있습니다` : 
                                     currentLanguage === 'vi' ? `Có ${unreadChatCounts.asOwner} tin nhắn chưa đọc` : 
                                     `You have ${unreadChatCounts.asOwner} unread message(s)`}
                                  </p>
                                </div>
                              </button>
                            </div>
                          )}

                          {/* 임차인 알림 (파란색 섹션) */}
                          {notifications.asGuest.length > 0 && (
                            <div className="border-b border-gray-100">
                              <div className="px-4 py-2 bg-blue-50">
                                <p className="text-xs font-semibold text-blue-600">
                                  {currentLanguage === 'ko' ? '🏠 내 예약 (임차인)' : 
                                   currentLanguage === 'vi' ? '🏠 Đặt phòng của tôi' : 
                                   '🏠 My Bookings (Guest)'}
                                </p>
                              </div>
                              {notifications.asGuest.map((booking) => {
                                // 상태에 따른 탭 파라미터
                                const statusTab = booking.status === 'pending' ? 'pending' : 
                                                 booking.status === 'confirmed' ? 'confirmed' : 
                                                 booking.status === 'cancelled' ? 'cancelled' : '';
                                
                                // 베트남식 날짜/시간 포맷 (DD/MM/YYYY HH:mm)
                                const formatDateTime = (date: string | Date) => {
                                  const d = new Date(date);
                                  const day = d.getDate().toString().padStart(2, '0');
                                  const month = (d.getMonth() + 1).toString().padStart(2, '0');
                                  const year = d.getFullYear();
                                  const hours = d.getHours().toString().padStart(2, '0');
                                  const minutes = d.getMinutes().toString().padStart(2, '0');
                                  return `${day}/${month}/${year} ${hours}:${minutes}`;
                                };
                                
                                const isRead = booking.id ? readNotificationIds.has(booking.id) : false;
                                
                                return (
                                  <button
                                    key={booking.id}
                                    onClick={async () => {
                                      if (booking.id) markAsRead(booking.id);
                                      if (booking.chatRoomId) await markAllMessagesInRoomAsRead(booking.chatRoomId);
                                      setIsNotificationOpen(false);
                                      router.push(`/my-bookings${statusTab ? `?tab=${statusTab}` : ''}`);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors border-l-4 border-blue-500 ${
                                      isRead ? 'bg-gray-50 opacity-60' : ''
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className={`text-sm font-medium truncate ${isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {booking.propertyTitle || booking.propertyAddress}
                                          </p>
                                          {!isRead && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {formatDateTime(booking.checkInDate)} ~ {formatDateTime(booking.checkOutDate)}
                                        </p>
                                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {booking.status === 'pending' ? (currentLanguage === 'ko' ? '승인대기' : currentLanguage === 'vi' ? 'Chờ duyệt' : 'Pending') :
                                           booking.status === 'confirmed' ? (currentLanguage === 'ko' ? '예약확정' : currentLanguage === 'vi' ? 'Đã xác nhận' : 'Confirmed') :
                                           booking.status === 'cancelled' ? (currentLanguage === 'ko' ? '취소됨' : currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled') :
                                           booking.status}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* 임대인 알림 (초록색 섹션) */}
                          {notifications.asOwner.length > 0 && (
                            <div>
                              <div className="px-4 py-2 bg-green-50">
                                <p className="text-xs font-semibold text-green-600">
                                  {currentLanguage === 'ko' ? '🔑 받은 예약 (임대인)' : 
                                   currentLanguage === 'vi' ? '🔑 Yêu cầu đặt phòng' : 
                                   '🔑 Booking Requests (Host)'}
                                </p>
                              </div>
                              {notifications.asOwner.map((booking) => {
                                // 상태에 따른 탭 파라미터
                                const statusTab = booking.status === 'pending' ? 'pending' : 
                                                 booking.status === 'confirmed' ? 'confirmed' : 
                                                 booking.status === 'cancelled' ? 'cancelled' : '';
                                
                                // 베트남식 날짜/시간 포맷 (DD/MM/YYYY HH:mm)
                                const formatDateTime = (date: string | Date) => {
                                  const d = new Date(date);
                                  const day = d.getDate().toString().padStart(2, '0');
                                  const month = (d.getMonth() + 1).toString().padStart(2, '0');
                                  const year = d.getFullYear();
                                  const hours = d.getHours().toString().padStart(2, '0');
                                  const minutes = d.getMinutes().toString().padStart(2, '0');
                                  return `${day}/${month}/${year} ${hours}:${minutes}`;
                                };
                                
                                const isRead = booking.id ? readNotificationIds.has(booking.id) : false;
                                
                                return (
                                  <button
                                    key={booking.id}
                                    onClick={async () => {
                                      if (booking.id) markAsRead(booking.id);
                                      if (booking.chatRoomId) await markAllMessagesInRoomAsRead(booking.chatRoomId);
                                      setIsNotificationOpen(false);
                                      router.push(`/host/bookings${statusTab ? `?tab=${statusTab}` : ''}`);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-green-50/50 transition-colors border-l-4 border-green-500 ${
                                      isRead ? 'bg-gray-50 opacity-60' : ''
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className={`text-sm font-medium truncate ${isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {booking.propertyTitle || booking.propertyAddress}
                                          </p>
                                          {!isRead && (
                                            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {booking.guestName || (currentLanguage === 'ko' ? '게스트' : 'Guest')} · {formatDateTime(booking.checkInDate)}
                                        </p>
                                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {booking.status === 'pending' ? (currentLanguage === 'ko' ? '승인대기' : currentLanguage === 'vi' ? 'Chờ duyệt' : 'Pending') :
                                           booking.status === 'confirmed' ? (currentLanguage === 'ko' ? '예약확정' : currentLanguage === 'vi' ? 'Đã xác nhận' : 'Confirmed') :
                                           booking.status === 'cancelled' ? (currentLanguage === 'ko' ? '취소됨' : currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled') :
                                           booking.status}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* 알림 없음 */}
                          {notifications.asGuest.length === 0 && notifications.asOwner.length === 0 && (
                            <div className="px-4 py-8 text-center">
                              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                {currentLanguage === 'ko' ? '알림이 없습니다' : 
                                 currentLanguage === 'vi' ? 'Không có thông báo' : 
                                 'No notifications'}
                              </p>
                            </div>
                          )}
                          
                          {/* 하단 버튼: 모두 읽음 + 알림 켜기/끄기 */}
                          <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
                            <button
                              onClick={markAllAsRead}
                              disabled={unreadCount === 0}
                              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                unreadCount > 0 
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {currentLanguage === 'ko' ? '모두 읽음' : 
                               currentLanguage === 'vi' ? 'Đánh dấu đã đọc' : 
                               'Mark all read'}
                            </button>
                            <button
                              onClick={toggleNotifications}
                              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                notificationsEnabled 
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {notificationsEnabled 
                                ? (currentLanguage === 'ko' ? '알림 끄기' : 
                                   currentLanguage === 'vi' ? 'Tắt thông báo' : 
                                   'Turn off')
                                : (currentLanguage === 'ko' ? '알림 켜기' : 
                                   currentLanguage === 'vi' ? 'Bật thông báo' : 
                                   'Turn on')
                              }
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 로그인된 경우: 개인정보 버튼 */}
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-all duration-200"
                        aria-label="Profile"
                      >
                        <User className="w-5 h-5" />
                      </button>

                    {/* 사용자 메뉴 드롭다운 */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.displayName || user.email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleProfileClick}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>
                            {currentLanguage === 'ko' ? '개인정보' : 
                             currentLanguage === 'vi' ? 'Thông tin cá nhân' : 
                             'Profile'}
                          </span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>
                            {currentLanguage === 'ko' ? '로그아웃' : 
                             currentLanguage === 'vi' ? 'Đăng xuất' : 
                             'Logout'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                  </>
                ) : (
                  /* 로그인되지 않은 경우: 로그인 아이콘 */
                  <div className="relative group">
                    <button
                      onClick={handleLoginClick}
                      className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-all duration-200 cursor-pointer"
                      aria-label="Login"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    {/* 툴팁 */}
                    <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                      {currentLanguage === 'ko' ? '로그인' : 
                       currentLanguage === 'vi' ? 'Đăng nhập' : 
                       'Login'}
                      {/* 툴팁 화살표 */}
                      <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
