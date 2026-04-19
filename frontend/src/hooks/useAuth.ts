/**
 * useAuth Hook (LocalStorage + NextAuth 세션)
 *
 * 이메일 로그인은 `currentUser`에 uid가 들어가고,
 * Google/Facebook 등 OAuth는 NextAuth 세션만 있을 수 있어 세션의 user.id로 앱 액터를 맞춥니다.
 */

import { useState, useEffect } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import {
  bootstrapUsersFromServer,
  ensureUsersLoadedForApp,
  getCurrentUserData,
  getCurrentUserId,
  setAppSessionUserId,
  signOut as signOutAuth,
  syncAppActorUidCookieFromStorage,
} from '@/lib/api/auth';

// 앱 내부에서 쓰는 최소 user 형태
interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status: sessionStatus } = useSession();
  const sessionUserId = session?.user?.id ?? null;

  useEffect(() => {
    if (sessionStatus === 'loading') {
      setLoading(true);
      return;
    }

    const applyLocal = () => {
      try {
        const uid = getCurrentUserId();
        const userData = getCurrentUserData();
        if (userData) {
          setUser({
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName || null,
          });
          return;
        }
        /** currentUser만 있고 users 캐시가 아직 비어 있으면(부트스트랩 직전) API는 되는데 UI만 비로그인으로 보이는 문제 방지 */
        if (uid) {
          setUser({
            uid,
            email: null,
            displayName: null,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      }
    };

    const run = async () => {
      if (sessionStatus === 'authenticated' && sessionUserId) {
        const mismatch = getCurrentUserId() !== sessionUserId;
        if (mismatch) {
          setAppSessionUserId(sessionUserId);
        }
        if (mismatch || !getCurrentUserData()) {
          try {
            await bootstrapUsersFromServer();
          } catch {
            /* ignore */
          }
          void import('@/lib/api/properties').then((m) =>
            m.bootstrapPropertiesFromServer().catch(() => {}),
          );
          void import('@/lib/api/bookings').then((m) =>
            m.bootstrapBookingsFromServer().catch(() => {}),
          );
        }
      } else if (getCurrentUserId() && !getCurrentUserData()) {
        try {
          await ensureUsersLoadedForApp();
        } catch {
          /* ignore */
        }
      }
      applyLocal();
      syncAppActorUidCookieFromStorage();
      setLoading(false);
    };

    void run();

    const loadUser = () => {
      applyLocal();
      syncAppActorUidCookieFromStorage();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' || e.key === 'users') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('stayviet-users-updated', loadUser);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stayviet-users-updated', loadUser);
    };
  }, [sessionStatus, sessionUserId]);

  const logout = async () => {
    try {
      await signOutAuth();
      await nextAuthSignOut({ redirect: false });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { user, loading, logout };
}
