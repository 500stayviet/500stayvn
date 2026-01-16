/**
 * TopBar 컴포넌트 (인기 앱 스타일)
 * 
 * Airbnb/직방 스타일의 깔끔한 헤더
 * - 좌측: 500stayviet 로고 (홈 버튼)
 * - 우측: 언어 선택 + 로그인 상태에 따라 로그인 아이콘 또는 개인정보 버튼
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, User, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { SupportedLanguage } from '@/lib/api/translation';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  hideLanguageSelector?: boolean;
}

export default function TopBar({ currentLanguage, onLanguageChange, hideLanguageSelector = false }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isLanguageMenuOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen, isUserMenuOpen]);

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
  const handleLanguageSelect = (lang: SupportedLanguage) => {
    onLanguageChange(lang);
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
                  /* 로그인된 경우: 개인정보 버튼 */
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
