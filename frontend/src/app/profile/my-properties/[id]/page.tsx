/**
 * 매물 상세 페이지 (직접 URL 접근 시)
 * - my-properties 목록에서 카드 클릭 시에는 모달로 상세 표시
 * - /profile/my-properties/[id] 직접 접근 시 이 페이지 사용
 */

"use client";

import { useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import TopBar from "@/components/TopBar";
import PropertyDetailView from "@/components/PropertyDetailView";
import type { SupportedLanguage } from "@/lib/api/translation";
import { useMyPropertyDetailPageState } from "./hooks/useMyPropertyDetailPageState";

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const handleRedirectToList = useCallback(() => {
    router.push("/profile/my-properties");
  }, [router]);

  const { property, loading } = useMyPropertyDetailPageState({
    propertyId,
    user: user ? { uid: user.uid } : null,
    authLoading,
    onRedirectToList: handleRedirectToList,
  });

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === "ko"
            ? "로딩 중..."
            : currentLanguage === "vi"
              ? "Đang tải..."
              : "Loading..."}
        </div>
      </div>
    );
  }

  if (!property || !user) {
    return null;
  }

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
          mode="owner"
          onBack={() => router.push("/profile/my-properties")}
          onEdit={() => router.push(`/profile/my-properties/${propertyId}/edit`)}
        />
      </div>
    </div>
  );
}
