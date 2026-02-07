/**
 * 매물 상세 페이지 - /properties/[id]
 * 직접 접근 시 전체 페이지로 PropertyDetailView 표시
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProperty } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';
import TopBar from '@/components/TopBar';
import PropertyDetailView from '@/components/PropertyDetailView';
import type { SupportedLanguage } from '@/lib/api/translation';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="text-gray-500">
          {currentLanguage === 'ko' ? '로딩 중...' : currentLanguage === 'vi' ? 'Đang tải...' : 'Loading...'}
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
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-white hover:opacity-90"
            style={{ backgroundColor: '#E63946' }}
          >
            {currentLanguage === 'ko' ? '뒤로' : currentLanguage === 'vi' ? 'Quay lại' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && property.ownerId === user.uid;

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: '#FFF8F0' }}>
      <div className="w-full max-w-[430px] min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />
        <PropertyDetailView
          property={property}
          currentLanguage={currentLanguage as SupportedLanguage}
          mode={isOwner ? 'owner' : 'tenant'}
          onBack={() => router.back()}
          onEdit={
            isOwner && property.id
              ? () => router.push(`/profile/my-properties/${property.id}/edit`)
              : undefined
          }
        />
      </div>
    </div>
  );
}
