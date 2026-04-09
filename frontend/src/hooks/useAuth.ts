/**
 * useAuth Hook (LocalStorage 버전)
 * 
 * LocalStorage 기반 인증 상태 관리
 */

import { useState, useEffect } from 'react';
import { getCurrentUserData, signOut as signOutAuth } from '@/lib/api/auth';

// 앱 내부에서 쓰는 최소 user 형태
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

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' || e.key === 'users') {
        loadUser();
      }
    };

    const handleUsersUpdated = () => loadUser();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('stayviet-users-updated', handleUsersUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stayviet-users-updated', handleUsersUpdated);
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
