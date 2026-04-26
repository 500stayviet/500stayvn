'use client';

import { Globe, User, LogOut, Bell, MessageCircle } from 'lucide-react';
import { getUIText } from '@/utils/i18n';
import type { useTopBarState } from './useTopBarState';

type TopBarViewProps = ReturnType<typeof useTopBarState>;

const BRAND = {
  primary: '#E63946',
  primaryLight: '#E6394615',
  text: '#1F2937',
  muted: '#9CA3AF',
  surface: '#FFFFFF',
  border: '#F3F4F6',
};

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function TopBarView(p: TopBarViewProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: `${BRAND.surface}F2`, borderColor: BRAND.border }}>
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 max-w-7xl mx-auto">
          <button
            onClick={p.handleHomeClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            type="button"
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill={BRAND.primary} />
              <path d="M8 20L16 10L24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 20V24H20V20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-extrabold tracking-tight" style={{ color: BRAND.primary }}>
                500
              </span>
              <span className="text-lg font-bold tracking-tight" style={{ color: BRAND.text }}>
                stay
              </span>
              <span className="text-lg font-bold tracking-tight" style={{ color: BRAND.primary }}>
                viet
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {!p.hideLanguageSelector && (
              <div className="relative" ref={p.menuRef}>
                <button
                  type="button"
                  onClick={p.toggleLanguageMenu}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-full transition-all duration-200"
                  style={{ color: BRAND.muted }}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-base">{p.currentLang.flag}</span>
                </button>

                {p.isLanguageMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl py-2 z-50"
                    style={{ border: `1px solid ${BRAND.border}` }}
                  >
                    {p.languages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => p.handleLanguageSelect(lang.code)}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors"
                        style={{
                          backgroundColor: p.currentLanguage === lang.code ? BRAND.primaryLight : 'transparent',
                          color: p.currentLanguage === lang.code ? BRAND.primary : BRAND.text,
                          fontWeight: p.currentLanguage === lang.code ? 600 : 400,
                        }}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!p.loading && (
              <>
                {p.user ? (
                  <>
                    <div className="relative" ref={p.notificationRef}>
                      <button
                        type="button"
                        onClick={p.toggleNotificationOpen}
                        className="p-2 rounded-full transition-all duration-200 relative"
                        style={{ color: p.notificationsEnabled ? BRAND.text : BRAND.muted }}
                        aria-label="Notifications"
                      >
                        <Bell className="w-5 h-5" />
                        {p.notificationsEnabled && p.unreadCount > 0 && (
                          <span
                            className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold"
                            style={{ backgroundColor: BRAND.primary }}
                          >
                            {p.unreadCount > 9 ? '9+' : p.unreadCount}
                          </span>
                        )}
                      </button>

                      {p.isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 max-h-[70vh] overflow-y-auto">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">
                              {getUIText('notifications', p.currentLanguage)}
                            </h3>
                          </div>

                          {p.unreadChatCounts.asGuest > 0 && (
                            <div className="border-b border-gray-100 bg-blue-50/30">
                              <button
                                type="button"
                                onClick={() => p.onGuestChatBannerClick()}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                              >
                                <div className="p-2 bg-blue-100 rounded-full">
                                  <MessageCircle className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900">
                                    {getUIText('newMessagesGuest', p.currentLanguage)}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-0.5">
                                    {p.currentLanguage === 'ko'
                                      ? `${p.unreadChatCounts.asGuest}${getUIText('unreadMessages', p.currentLanguage)}`
                                      : `${p.unreadChatCounts.asGuest} ${getUIText('unreadMessages', p.currentLanguage)}`}
                                  </p>
                                </div>
                              </button>
                            </div>
                          )}

                          {p.unreadChatCounts.asOwner > 0 && (
                            <div className="border-b border-gray-100 bg-green-50/30">
                              <button
                                type="button"
                                onClick={() => p.onOwnerChatBannerClick()}
                                className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3"
                              >
                                <div className="p-2 bg-green-100 rounded-full">
                                  <MessageCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900">
                                    {getUIText('newMessagesHost', p.currentLanguage)}
                                  </p>
                                  <p className="text-xs text-green-600 mt-0.5">
                                    {p.currentLanguage === 'ko'
                                      ? `${p.unreadChatCounts.asOwner}${getUIText('unreadMessages', p.currentLanguage)}`
                                      : `${p.unreadChatCounts.asOwner} ${getUIText('unreadMessages', p.currentLanguage)}`}
                                  </p>
                                </div>
                              </button>
                            </div>
                          )}

                          {p.notifications.asGuest.length > 0 && (
                            <div className="border-b border-gray-100">
                              <div className="px-4 py-2 bg-blue-50">
                                <p className="text-xs font-semibold text-blue-600">
                                  {getUIText('myBookingsGuest', p.currentLanguage)}
                                </p>
                              </div>
                              {p.notifications.asGuest.map((booking) => {
                                const isRead = booking.id ? p.readNotificationIds.has(booking.id) : false;
                                return (
                                  <button
                                    key={booking.id}
                                    type="button"
                                    onClick={() => p.onGuestBookingClick(booking)}
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
                                          {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {formatDateTime(booking.checkInDate)} ~ {formatDateTime(booking.checkOutDate)}
                                        </p>
                                        <span
                                          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                            booking.status === 'pending'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : booking.status === 'confirmed'
                                                ? 'bg-green-100 text-green-700'
                                                : booking.status === 'cancelled'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {booking.status === 'pending'
                                            ? getUIText('pending', p.currentLanguage)
                                            : booking.status === 'confirmed'
                                              ? getUIText('confirmed', p.currentLanguage)
                                              : booking.status === 'cancelled'
                                                ? getUIText('cancelled', p.currentLanguage)
                                                : booking.status}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {p.notifications.asOwner.length > 0 && (
                            <div>
                              <div className="px-4 py-2 bg-green-50">
                                <p className="text-xs font-semibold text-green-600">
                                  {getUIText('bookingRequestsHost', p.currentLanguage)}
                                </p>
                              </div>
                              {p.notifications.asOwner.map((booking) => {
                                const isRead = booking.id ? p.readNotificationIds.has(booking.id) : false;
                                return (
                                  <button
                                    key={booking.id}
                                    type="button"
                                    onClick={() => p.onOwnerBookingClick(booking)}
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
                                          {!isRead && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {booking.guestName || getUIText('guest', p.currentLanguage)} · {formatDateTime(booking.checkInDate)}
                                        </p>
                                        <span
                                          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                            booking.status === 'pending'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : booking.status === 'confirmed'
                                                ? 'bg-green-100 text-green-700'
                                                : booking.status === 'cancelled'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {booking.status === 'pending'
                                            ? getUIText('pending', p.currentLanguage)
                                            : booking.status === 'confirmed'
                                              ? getUIText('confirmed', p.currentLanguage)
                                              : booking.status === 'cancelled'
                                                ? getUIText('cancelled', p.currentLanguage)
                                                : booking.status}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {p.notifications.asGuest.length === 0 && p.notifications.asOwner.length === 0 && (
                            <div className="px-4 py-8 text-center">
                              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                {getUIText('noProperties', p.currentLanguage)}
                              </p>
                            </div>
                          )}

                          <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={p.markAllAsRead}
                              disabled={p.unreadCount === 0}
                              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                p.unreadCount > 0
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {getUIText('markAllRead', p.currentLanguage)}
                            </button>
                            <button
                              type="button"
                              onClick={p.toggleNotifications}
                              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                p.notificationsEnabled
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {p.notificationsEnabled
                                ? getUIText('turnOffNotifications', p.currentLanguage)
                                : getUIText('turnOnNotifications', p.currentLanguage)}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative" ref={p.userMenuRef}>
                      <button
                        type="button"
                        onClick={p.toggleUserMenu}
                        className="p-2 rounded-full transition-all duration-200"
                        style={{ color: BRAND.text }}
                        aria-label="Profile"
                      >
                        <User className="w-5 h-5" />
                      </button>

                      {p.isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {p.user.displayName || p.user.email}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{p.user.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={p.handleProfileClick}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>{getUIText('profile', p.currentLanguage)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={p.handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{getUIText('logout', p.currentLanguage)}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={p.handleLoginClick}
                      className="p-2 rounded-full transition-all duration-200 cursor-pointer"
                      style={{ color: BRAND.muted }}
                      aria-label="Login"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                      {getUIText('login', p.currentLanguage)}
                      <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
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
