/**
 * 인터셉팅 라우트: /search 에서 /properties/[id] 로 이동 시 모달처럼 표시
 * URL은 /properties/[id] 로 바뀌고, 뒤로가기 시 /search 로 복귀
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProperty } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';
import PropertyDetailView from '@/components/PropertyDetailView';
import AppBox from '@/components/AppBox';
import type { SupportedLanguage } from '@/lib/api/translation';

export default function InterceptedPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    const fetchProperty = async () => {
      try {
        const data = await getProperty(propertyId);
        setProperty(data);
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  const handleBack = () => router.back();
  const isOwner = user && property?.ownerId === user.uid;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={handleBack}>
        <div className="text-white" onClick={(e) => e.stopPropagation()}>
          {currentLanguage === 'ko' ? '로딩 중...' : currentLanguage === 'vi' ? 'Đang tải...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={handleBack}>
        <div className="bg-white rounded-2xl p-6 max-w-[430px] text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-500 mb-4">
            {currentLanguage === 'ko' ? '매물을 찾을 수 없습니다.' : currentLanguage === 'vi' ? 'Không tìm thấy.' : 'Not found.'}
          </p>
          <button onClick={handleBack} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#E63946' }}>
            {currentLanguage === 'ko' ? '뒤로' : currentLanguage === 'vi' ? 'Quay lại' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={handleBack}>
      <AppBox
        className="modal-app-box w-full max-w-[430px] rounded-2xl shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <PropertyDetailView
          property={property}
          currentLanguage={currentLanguage as SupportedLanguage}
          mode={isOwner ? 'owner' : 'tenant'}
          onBack={handleBack}
          onClose={handleBack}
          onEdit={
            isOwner && property.id
              ? () => router.push(`/profile/my-properties/${property.id}/edit`)
              : undefined
          }
        />
      </AppBox>
    </div>
  );
}
