/**
 * Mobile-style bottom navigation (host vs guest items based on KYC / role).
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Plus, Building, MessageCircle, User, Map, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentUserData, getCurrentUserId } from '@/lib/api/auth';
import { getUIText } from '@/utils/i18n';

interface BottomNavigationProps {
  hideOnPaths?: string[];
}

export default function BottomNavigation({ hideOnPaths = [] }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isVisible, setIsVisible] = useState(true);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [checkingOwnerStatus, setCheckingOwnerStatus] = useState(true);

  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!user) {
        setIsOwnerMode(false);
        setCheckingOwnerStatus(false);
        return;
      }

      try {
        const userData = await getCurrentUserData(user.uid);

        if (!userData) {
          setIsOwnerMode(false);
          setCheckingOwnerStatus(false);
          return;
        }

        const kycSteps = userData.kyc_steps || {};

        const step1Completed = Boolean(kycSteps.step1);
        const step2Completed = Boolean(kycSteps.step2);
        const step3Completed = Boolean(kycSteps.step3);
        
        const allStepsCompleted = step1Completed && step2Completed && step3Completed;
        
        // KYC 완료 또는 owner 권한 (원장은 role 문자열 또는 isOwner 플래그)
        const isOwner =
          userData.role === 'owner' || Boolean(userData.is_owner);

        if (allStepsCompleted || isOwner) {
          setIsOwnerMode(true);
        } else {
          setIsOwnerMode(false);
        }
      } catch (error) {
        console.error('Failed to check owner status:', error);
        setIsOwnerMode(false);
      } finally {
        setCheckingOwnerStatus(false);
      }
    };

    // 사용자 상태가 변경될 때만 검증 실행
    if (user) {
      checkOwnerStatus();
    } else {
      // 사용자가 없으면 즉시 임차인 모드로 설정
      setIsOwnerMode(false);
      setCheckingOwnerStatus(false);
    }

    const onUsersCacheUpdated = () => {
      if (user) void checkOwnerStatus();
    };
    window.addEventListener('stayviet-users-updated', onUsersCacheUpdated);
    return () => {
      window.removeEventListener('stayviet-users-updated', onUsersCacheUpdated);
    };
  }, [user]);

  useEffect(() => {
    if (pathname === '/') {
      setActiveTab('home');
    } else if (pathname.startsWith('/search') || pathname.startsWith('/map')) {
      setActiveTab('search');
    } else if (pathname.startsWith('/add-property')) {
      setActiveTab('add');
    } else if (pathname.startsWith('/profile/my-properties')) {
      setActiveTab('manage');
    } else if (pathname.startsWith('/chat') || pathname.startsWith('/my-bookings') || pathname.startsWith('/host/bookings')) {
      setActiveTab('chat');
    } else if (pathname.startsWith('/profile') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
      setActiveTab('profile');
    } else if (pathname.startsWith('/wishlist')) {
      setActiveTab('wishlist');
    }
    
    // 특정 경로에서는 네비게이션 숨김
    const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));
    setIsVisible(!shouldHide);
  }, [pathname, hideOnPaths]);

  const isAppLoggedIn = Boolean(user || (typeof window !== 'undefined' && getCurrentUserId()));

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'home':
        router.push('/');
        break;
      case 'search':
        router.push('/map');
        break;
      case 'add':
        if (isAppLoggedIn) {
          router.push('/add-property');
        } else {
          router.push('/login?returnUrl=/add-property');
        }
        break;
      case 'manage':
        if (isAppLoggedIn) {
          router.push('/profile/my-properties');
        } else {
          router.push('/login?returnUrl=/profile/my-properties');
        }
        break;
      case 'chat':
        if (isAppLoggedIn) {
          if (isOwnerMode) {
            router.push('/host/bookings');
          } else {
            router.push('/my-bookings');
          }
        } else {
          router.push('/login?returnUrl=/my-bookings');
        }
        break;
      case 'wishlist':
        if (isAppLoggedIn) {
          router.push('/wishlist');
        } else {
          router.push('/login?returnUrl=/wishlist');
        }
        break;
      case 'profile':
        if (isAppLoggedIn) {
          router.push('/profile');
        } else {
          router.push('/login');
        }
        break;
    }
  };

  if (!isVisible || checkingOwnerStatus || authLoading) {
    return null;
  }

  // 베트남 스타일 컬러
  const COLORS = {
    primary: '#E63946', // Coral Red - 메인 컬러
    textMuted: '#9CA3AF', // 희미한 텍스트
    surface: '#FFFFFF', // 카드 배경
    border: '#FED7AA', // 따뜻한 오렌지 테두리
  };

  // 임대인 모드 네비게이션 아이템 (add-property 페이지와 동일한 라벨)
  const ownerNavItems = [
    {
      id: 'home',
      icon: Home,
      label: getUIText('home', currentLanguage),
    },
    {
      id: 'add',
      icon: Plus,
      label: getUIText('addProperty', currentLanguage),
    },
    {
      id: 'manage',
      icon: Building,
      label: getUIText('manageMyProperties', currentLanguage),
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: getUIText('chat', currentLanguage),
    },
    {
      id: 'profile',
      icon: User,
      label: getUIText('profile', currentLanguage),
    }
  ];

  const guestNavItems = [
    {
      id: 'home',
      icon: Home,
      label: getUIText('home', currentLanguage),
    },
    {
      id: 'search',
      icon: Map,
      label: getUIText('findPropertiesOnMap', currentLanguage),
    },
    {
      id: 'chat',
      icon: Calendar,
      label: getUIText('myBookings', currentLanguage),
    },
    {
      id: 'wishlist',
      icon: Heart,
      label: getUIText('wishlist', currentLanguage),
    },
    {
      id: 'profile',
      icon: User,
      label: getUIText('profile', currentLanguage),
    }
  ];

  const navItems = isOwnerMode ? ownerNavItems : guestNavItems;

  return (
    <nav
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-40"
      style={{
        backgroundColor: COLORS.surface,
        borderTop: `1px solid #FF6B35`,
      }}
    >
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 flex-1"
              aria-label={item.label}
              style={{
                backgroundColor: isActive ? `${COLORS.primary}15` : 'transparent',
              }}
            >
              <Icon 
                className="w-[22px] h-[22px]" 
                style={{ 
                  color: isActive ? COLORS.primary : COLORS.textMuted,
                }} 
              />
              <span
                className="text-[11px] font-semibold"
                style={{ 
                  color: isActive ? COLORS.primary : COLORS.textMuted,
                  fontWeight: isActive ? '700' : '600'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="h-1 bg-white" />
    </nav>
  );
}