/**
 * BottomNavigation 컴포넌트
 * 
 * 모바일 앱 스타일의 하단 네비게이션 바
 * - 임대인 모드: 홈 / 매물 등록 / 매물관리 / 채팅 / 프로필
 * - 임차인 모드: 홈 / 지도로 검색 / 예약 / 찜 / 프로필
 * - KYC 1~3단계 완료 여부에 따라 임대인 모드 활성화
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Plus, Building, MessageCircle, User, Map, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentUserData } from '@/lib/api/auth';
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

  // KYC 상태 확인 및 임대인 모드 설정 (캐싱 및 안전성 강화)
  useEffect(() => {
    const checkOwnerStatus = async () => {
      // 사용자가 없으면 임차인 모드로 설정
      if (!user) {
        setIsOwnerMode(false);
        setCheckingOwnerStatus(false);
        return;
      }

      try {
        // 사용자 데이터 가져오기
        const userData = await getCurrentUserData(user.uid);
        
        if (!userData) {
          // 사용자 데이터가 없으면 임차인 모드
          setIsOwnerMode(false);
          setCheckingOwnerStatus(false);
          return;
        }

        // KYC 1~3단계 토큰이 모두 있어야 임대인 모드 활성화
        // 사용자 요구사항: "코인3개가 되면 다 사용가능한거야"
        const kycSteps = userData.kyc_steps || {};
        
        // 안전한 boolean 검증 (null/undefined 방지)
        const step1Completed = Boolean(kycSteps.step1);
        const step2Completed = Boolean(kycSteps.step2);
        const step3Completed = Boolean(kycSteps.step3);
        
        const allStepsCompleted = step1Completed && step2Completed && step3Completed;
        
        // KYC 완료 또는 owner 권한이 있으면 임대인 모드
        // 안전한 boolean 검증 사용
        const isOwner = Boolean(userData.is_owner);
        
        if (allStepsCompleted || isOwner) {
          setIsOwnerMode(true);
        } else {
          setIsOwnerMode(false);
        }
      } catch (error) {
        console.error('Failed to check owner status:', error);
        // 에러 발생 시 안전하게 임차인 모드로 설정
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
  }, [user]);

  // 현재 경로에 따라 활성 탭 설정
  useEffect(() => {
    // 경로에 따라 활성 탭 설정
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

  // 네비게이션 아이템 클릭 핸들러
  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'home':
        router.push('/');
        break;
      case 'search':
        // 지도 검색 페이지로 이동
        router.push('/map');
        break;
      case 'add':
        // 로그인 확인 후 숙소 등록 페이지로 이동
        if (user) {
          router.push('/add-property');
        } else {
          router.push('/login?returnUrl=/add-property');
        }
        break;
      case 'manage':
        // 로그인 확인 후 매물 관리 페이지로 이동
        if (user) {
          router.push('/profile/my-properties');
        } else {
          router.push('/login?returnUrl=/profile/my-properties');
        }
        break;
      case 'chat':
        // 로그인 확인 후 채팅/예약 페이지로 이동
        if (user) {
          // 사용자 역할에 따라 다른 페이지로 이동
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
        // 로그인 확인 후 찜 목록 페이지로 이동
        if (user) {
          router.push('/wishlist');
        } else {
          router.push('/login?returnUrl=/wishlist');
        }
        break;
      case 'profile':
        // 로그인 확인 후 프로필 페이지로 이동
        if (user) {
          router.push('/profile');
        } else {
          router.push('/login');
        }
        break;
    }
  };

  // 네비게이션 숨김 여부 확인
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
      label: currentLanguage === "ko" ? "홈" : 
             currentLanguage === "vi" ? "Trang chủ" :
             currentLanguage === "ja" ? "ホーム" :
             currentLanguage === "zh" ? "首页" : "Home",
    },
    {
      id: 'add',
      icon: Plus,
      label: currentLanguage === "ko" ? "매물등록" : 
             currentLanguage === "vi" ? "Đăng ký" :
             currentLanguage === "ja" ? "物件登録" :
             currentLanguage === "zh" ? "物业注册" : "Add",
    },
    {
      id: 'manage',
      icon: Building,
      label: currentLanguage === "ko" ? "매물관리" : 
             currentLanguage === "vi" ? "Quản lý" :
             currentLanguage === "ja" ? "物件管理" :
             currentLanguage === "zh" ? "物业管理" : "Manage",
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: currentLanguage === "ko" ? "채팅" : 
             currentLanguage === "vi" ? "Trò chuyện" :
             currentLanguage === "ja" ? "チャット" :
             currentLanguage === "zh" ? "聊天" : "Chat",
    },
    {
      id: 'profile',
      icon: User,
      label: currentLanguage === "ko" ? "프로필" : 
             currentLanguage === "vi" ? "Hồ sơ" :
             currentLanguage === "ja" ? "プロフィール" :
             currentLanguage === "zh" ? "个人资料" : "Profile",
    }
  ];

  // 임차인 모드 네비게이션 아이템 (add-property 페이지와 동일한 라벨)
  const guestNavItems = [
    {
      id: 'home',
      icon: Home,
      label: currentLanguage === "ko" ? "홈" : 
             currentLanguage === "vi" ? "Trang chủ" :
             currentLanguage === "ja" ? "ホーム" :
             currentLanguage === "zh" ? "首页" : "Home",
    },
    {
      id: 'search',
      icon: Map,
      label: currentLanguage === "ko" ? "지도로 검색" : 
             currentLanguage === "vi" ? "Tìm kiếm bản đồ" :
             currentLanguage === "ja" ? "地図検索" :
             currentLanguage === "zh" ? "地图搜索" : "Map Search",
    },
    {
      id: 'chat',
      icon: Calendar,
      label: currentLanguage === "ko" ? "예약" : 
             currentLanguage === "vi" ? "Đặt chỗ" :
             currentLanguage === "ja" ? "予約" :
             currentLanguage === "zh" ? "预订" : "Bookings",
    },
    {
      id: 'wishlist',
      icon: Heart,
      label: currentLanguage === "ko" ? "찜" : 
             currentLanguage === "vi" ? "Yêu thích" :
             currentLanguage === "ja" ? "お気に入り" :
             currentLanguage === "zh" ? "收藏" : "Wishlist",
    },
    {
      id: 'profile',
      icon: User,
      label: currentLanguage === "ko" ? "프로필" : 
             currentLanguage === "vi" ? "Hồ sơ" :
             currentLanguage === "ja" ? "プロフィール" :
             currentLanguage === "zh" ? "个人资料" : "Profile",
    }
  ];

  const navItems = isOwnerMode ? ownerNavItems : guestNavItems;

  return (
    <nav
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-40"
      style={{
        backgroundColor: COLORS.surface,
        borderTop: `3px solid #FF6B35`,
      }}
    >
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAddButton = item.id === 'add';
          
          return (
            <button
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