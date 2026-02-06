'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUserData } from '@/lib/api/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { SupportedLanguage } from '@/lib/api/translation';
import TopBar from '@/components/TopBar';
import HeroSection from '@/components/HeroSection';
import PopularStays from '@/components/PopularStays';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage, loading: languageLoading } = useLanguage();
  const [userPreferredLanguage, setUserPreferredLanguage] = useState<SupportedLanguage | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);

  useEffect(() => {
    const loadUserLanguage = async () => {
      if (authLoading || languageLoading) return;

      if (user) {
        setLoadingUserData(true);
        try {
          const userData = await getCurrentUserData(user.uid);
          if (userData?.preferredLanguage) {
            setUserPreferredLanguage(userData.preferredLanguage as SupportedLanguage);
          } else {
            setUserPreferredLanguage(null);
          }
        } catch (error) {
          // Silent fail
        } finally {
          setLoadingUserData(false);
        }
      } else {
        setUserPreferredLanguage(null);
      }
    };

    loadUserLanguage();
  }, [user, authLoading, languageLoading]);

  const shouldShowLanguageSelector = !user || !userPreferredLanguage;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col">
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={!shouldShowLanguageSelector}
        />

        <div className="flex-1 pb-4">
          <HeroSection currentLanguage={currentLanguage} />
          <PopularStays currentLanguage={currentLanguage} />
        </div>
      </div>
    </div>
  );
}
