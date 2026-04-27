'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import TopBar from '@/components/TopBar';
import PropertyDetailView from '@/components/PropertyDetailView';
import type { SupportedLanguage } from '@/lib/api/translation';
import type { PropertyDetailPageViewModel } from '../hooks/usePropertyDetailPage';
import { getUIText } from '@/utils/i18n';

type Props = { vm: PropertyDetailPageViewModel };

/** 공개 매물 상세 라우트 UI */
export function PropertyDetailRouteView({ vm }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const { property, loading } = vm;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="text-gray-500">
          {getUIText('loading', currentLanguage)}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            {currentLanguage === 'ko' ? '매물을 찾을 수 없습니다.' : currentLanguage === 'vi' ? 'Không tìm thấy bất động sản.' : 'Property not found.'}
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-white hover:opacity-90"
            style={{ backgroundColor: '#E63946' }}
          >
            {getUIText('back', currentLanguage)}
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && property.ownerId === user.uid;

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: '#FFF8F0' }}>
      <div className="w-full max-w-[430px] min-h-screen shadow-2xl flex flex-col relative">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} hideLanguageSelector={false} />
        <PropertyDetailView
          property={property}
          currentLanguage={currentLanguage as SupportedLanguage}
          mode={isOwner ? 'owner' : 'tenant'}
          onBack={() => router.back()}
          onEdit={isOwner && property.id ? () => router.push(`/profile/my-properties/${property.id}/edit`) : undefined}
        />
      </div>
    </div>
  );
}
