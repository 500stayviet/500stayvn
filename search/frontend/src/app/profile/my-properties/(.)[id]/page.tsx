/**
 * 인터셉팅 라우트: 내 매물 관리 목록에서 카드 클릭 시 모달처럼 표시
 * 반드시 PropertyDetailView(편지지 스타일)만 사용. MyPropertyDetailContent 사용 금지.
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

export default function InterceptedMyPropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || !user) {
      setLoading(false);
      return;
    }
    const fetchProperty = async () => {
      try {
        const data = await getProperty(propertyId);
        if (data && data.ownerId === user.uid) setProperty(data);
        else setProperty(null);
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId, user]);

  const handleBack = () => router.back();

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
        {/* 편지지 스타일(라벨 좌·내용 우, 점선 구분) — PropertyDetailView 전용 */}
        <PropertyDetailView
          property={property}
          currentLanguage={currentLanguage as SupportedLanguage}
          mode="owner"
          onBack={handleBack}
          onEdit={() => {
            const q = typeof window !== 'undefined' && window.location.search.includes('tab=deleted') ? 'tab=deleted&from=modal' : 'from=modal';
            router.push(`/profile/my-properties/${property.id}/edit?${q}`);
          }}
        />
      </AppBox>
    </div>
  );
}
