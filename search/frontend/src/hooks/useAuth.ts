/**
 * useAuth Hook (LocalStorage 버전)
 * 
 * LocalStorage 기반 인증 상태 관리
 */

import { useState, useEffect } from 'react';
import { getCurrentUserData, signOut as signOutAuth } from '@/lib/api/auth';

// Firebase User와 호환되는 형태의 인터페이스
interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 사용자 로드
    const loadUser = () => {
      try {
        const userData = getCurrentUserData();
        if (userData) {
          setUser({
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName || null,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' || e.key === 'users') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 주기적으로 확인 (같은 탭에서 변경 시)
    const interval = setInterval(loadUser, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const logout = async () => {
    try {
      await signOutAuth();
      setUser(null);
      // 페이지 새로고침하여 상태 초기화
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { user, loading, logout };
}
