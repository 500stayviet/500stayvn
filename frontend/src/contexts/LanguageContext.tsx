/**
 * Language Context
 * 
 * 전역 언어 상태 관리
 * - 모든 페이지에서 동일한 언어 상태 공유
 * - 사용자의 preferredLanguage 자동 로드
 * - 언어 변경 시 Firestore에 저장
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage } from '@/lib/api/translation';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUserData, updateUserLanguage } from '@/lib/api/auth';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setCurrentLanguage: (lang: SupportedLanguage) => Promise<void>;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'stayviet_language';

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>('en');
  const [loading, setLoading] = useState(true);

  // 초기 언어 로드 (localStorage 또는 사용자 데이터)
  useEffect(() => {
    const loadInitialLanguage = () => {
      // 1순위: localStorage에서 언어 가져오기 (비로그인 사용자용)
      if (typeof window !== 'undefined') {
        const storedLanguage = localStorage.getItem(STORAGE_KEY);
        if (storedLanguage && ['en', 'ko', 'vi'].includes(storedLanguage)) {
          setCurrentLanguageState(storedLanguage as SupportedLanguage);
          setLoading(false);
          return;
        }
      }
      // 기본값: 영어
      setCurrentLanguageState('en');
      setLoading(false);
    };

    loadInitialLanguage();
  }, []);

  // 사용자 언어 로드 (로그인 시)
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (authLoading) return;

      if (user) {
        // 로그인된 경우: 사용자의 preferredLanguage 가져오기
        try {
          const userData = await getCurrentUserData(user.uid);
          if (userData?.preferredLanguage) {
            const userLang = userData.preferredLanguage as SupportedLanguage;
            setCurrentLanguageState(userLang);
            // localStorage에도 저장 (다음 로그인 전까지 유지)
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, userLang);
            }
          } else {
            // preferredLanguage가 없으면 localStorage의 언어 사용
            if (typeof window !== 'undefined') {
              const storedLanguage = localStorage.getItem(STORAGE_KEY);
              if (storedLanguage && ['en', 'ko', 'vi'].includes(storedLanguage)) {
                setCurrentLanguageState(storedLanguage as SupportedLanguage);
              }
            }
          }
        } catch (error) {
          console.error('Error loading user language:', error);
        }
      }
    };

    if (!loading) {
      loadUserLanguage();
    }
  }, [user, authLoading, loading]);

  // 언어 변경 핸들러 (localStorage 및 Firestore에 저장)
  const setCurrentLanguage = async (lang: SupportedLanguage) => {
    setCurrentLanguageState(lang);
    
    // localStorage에 저장 (비로그인 사용자도 언어 선택 유지)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    
    // 로그인된 사용자인 경우 Firestore에도 저장
    if (user) {
      try {
        await updateUserLanguage(user.uid, lang);
      } catch (error) {
        console.error('Error updating user language:', error);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Language Context 사용 훅
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
