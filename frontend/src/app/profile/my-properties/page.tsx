"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getPropertiesByOwner,
  deleteProperty,
  permanentlyDeleteProperty,
} from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import { getCurrentUserData } from "@/lib/api/auth";
import { ArrowLeft, MapPin, Trash2, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "@/components/TopBar";
import Image from "next/image";
import {
  formatPrice,
  isAdvertisingProperty,
  hasAvailableBookingPeriod,
  PropertyDateRange,
} from "@/lib/utils/propertyUtils";
import { isAvailableNow, formatDateForBadge } from "@/lib/utils/dateUtils";

type PropertyFetchResult = {
  activeData: PropertyData[];
  deletedData: PropertyData[];
  visibleActiveData: PropertyData[];
  bookedDateRanges: Map<string, PropertyDateRange[]>;
  excludedFromAdvertising: Set<string>;
  reservedIds: Set<string>;
};

export default function MyPropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<
    string | null
  >(null);
  const [advertisingCount, setAdvertisingCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  // --- 기존 로직 유지 (데이터 필터링 및 페칭) ---
  const shouldShowPropertyInActiveTab = (
    property: PropertyData,
    bookedDateRanges: Map<string, PropertyDateRange[]>,
  ) => {
    if (!isAdvertisingProperty(property)) return false;
    if (!property.id) return true;
    const bookedRanges = bookedDateRanges.get(property.id) || [];
    if (bookedRanges.length === 0) return true;
    return hasAvailableBookingPeriod(property, bookedRanges);
  };

  const fetchAndFilterPropertyData = async (): Promise<PropertyFetchResult> => {
    if (!user) throw new Error("User is not authenticated");
    const [activeResult, deletedResult] = await Promise.all([
      getPropertiesByOwner(user.uid, false),
      getPropertiesByOwner(user.uid, true),
    ]);

    const excludedFromAdvertising = new Set<string>();
    const bookedDateRanges = activeResult.bookedDateRanges;

    activeResult.properties.forEach((property) => {
      if (
        property.id &&
        (!isAdvertisingProperty(property) ||
          !hasAvailableBookingPeriod(
            property,
            bookedDateRanges.get(property.id) || [],
          ))
      ) {
        excludedFromAdvertising.add(property.id);
      }
    });

    const visibleActiveData = activeResult.properties.filter((p) =>
      shouldShowPropertyInActiveTab(p, bookedDateRanges),
    );
    return {
      activeData: activeResult.properties,
      deletedData: deletedResult.properties,
      visibleActiveData,
      bookedDateRanges,
      excludedFromAdvertising,
      reservedIds: excludedFromAdvertising,
    };
  };

  const applyPropertyResult = (
    result: PropertyFetchResult,
    tab: "active" | "deleted",
  ) => {
    const excludedProperties = result.activeData.filter((p) =>
      result.excludedFromAdvertising.has(p.id!),
    );
    if (tab === "active") {
      setProperties(result.visibleActiveData);
    } else {
      setProperties([...result.deletedData, ...excludedProperties]);
    }
    setAdvertisingCount(result.visibleActiveData.length);
    setDeletedCount(result.deletedData.length + excludedProperties.length);
  };

  // 초기 데이터 로드 및 탭 변경 감지
  useEffect(() => {
    const init = async () => {
      if (!authLoading && user) {
        const userData = await getCurrentUserData(user.uid);
        if (
          !(
            userData?.kyc_steps?.step1 &&
            userData?.kyc_steps?.step2 &&
            userData?.kyc_steps?.step3
          )
        ) {
          router.push("/profile");
          return;
        }
        const tab =
          searchParams.get("tab") === "deleted" ? "deleted" : "active";
        setActiveTab(tab);
        const result = await fetchAndFilterPropertyData();
        applyPropertyResult(result, tab);
        setLoading(false);
      } else if (!authLoading && !user) {
        router.push("/login");
      }
    };
    init();
  }, [user, authLoading, searchParams]);

  // 삭제 핸들러 (기존 유지)
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProperty(id);
      const result = await fetchAndFilterPropertyData();
      applyPropertyResult(result, activeTab);
      setShowDeleteConfirm(null);
    } catch (e) {
      alert("Error deleting property");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await permanentlyDeleteProperty(id, user!.uid);
      const result = await fetchAndFilterPropertyData();
      applyPropertyResult(result, activeTab);
      setShowPermanentDeleteConfirm(null);
    } catch (e) {
      alert("Error permanently deleting property");
    } finally {
      setDeletingId(null);
    }
  };

  // --- UI 헬퍼 함수 ---
  const getStatusConfig = (status?: string) => {
    if (status === "rented") {
      return {
        borderColor: "border-green-500",
        bgColor: "bg-green-500",
        text:
          currentLanguage === "ko"
            ? "계약 완료"
            : currentLanguage === "vi"
              ? "Đã cho thuê"
              : "Rented",
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }
    return {
      borderColor: "border-red-500",
      bgColor: "bg-red-500",
      text:
        currentLanguage === "ko"
          ? "계약 전"
          : currentLanguage === "vi"
            ? "Chưa thuê"
            : "Active",
      icon: <Clock className="w-3 h-3" />,
    };
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        로딩 중...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <div className="px-5 py-6">
          {/* 헤더 부분 */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1 text-gray-500 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />{" "}
              <span>{currentLanguage === "ko" ? "뒤로" : "Back"}</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLanguage === "ko" ? "내 매물 관리" : "My Properties"}
            </h1>

            {/* 탭 디자인 개선 */}
            <div className="flex gap-2 mt-5 bg-gray-100 p-1.5 rounded-xl">
              {(["active", "deleted"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() =>
                    router.push(
                      tab === "active"
                        ? "/profile/my-properties"
                        : "?tab=deleted",
                    )
                  }
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {tab === "active"
                    ? currentLanguage === "ko"
                      ? "등록 매물"
                      : "Active"
                    : currentLanguage === "ko"
                      ? "광고 종료"
                      : "Expired"}
                  <span className="ml-1.5 opacity-60">
                    ({tab === "active" ? advertisingCount : deletedCount})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 매물 목록 */}
          <div className="space-y-5">
            {properties.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                등록된 매물이 없습니다.
              </div>
            ) : (
              properties.map((property) => {
                const config = getStatusConfig(property.status);
                const mainImage =
                  property.images?.[0] ||
                  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop";

                return (
                  <motion.div
                    layout
                    key={property.id}
                    className={`group relative rounded-2xl overflow-hidden border-[3px] shadow-md transition-all ${config.borderColor}`}
                  >
                    {/* 가로 긴 이미지 레이아웃 (16:9 비율 유지) */}
                    <div
                      className="relative w-full aspect-[16/9] cursor-pointer"
                      onClick={() =>
                        router.push(
                          activeTab === "deleted"
                            ? `/profile/my-properties/${property.id}/edit?tab=deleted`
                            : `/profile/my-properties/${property.id}`,
                        )
                      }
                    >
                      <Image
                        src={mainImage}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* 상단 오버레이 (상태 및 가격) */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg ${config.bgColor}`}
                        >
                          {config.icon} {config.text}
                        </div>
                        <div className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-right">
                          <div className="text-sm font-bold leading-none">
                            {formatPrice(property.price, property.priceUnit)}
                          </div>
                          <div className="text-[10px] text-gray-300 mt-1">
                            {currentLanguage === "ko" ? "주당 비용" : "/ week"}
                          </div>
                        </div>
                      </div>

                      {/* 하단 오버레이 (주소 정보) */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                        <div className="flex items-center gap-2 text-white">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {property.address || property.title}
                            </p>
                            {property.unitNumber && (
                              <p className="text-xs text-gray-300 opacity-80">
                                {property.unitNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 (삭제) */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {/* 계약 완료(rented)가 아닐 때만 삭제 버튼 노출 */}
                      {property.status !== "rented" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            activeTab === "active"
                              ? setShowDeleteConfirm(property.id!)
                              : setShowPermanentDeleteConfirm(property.id!);
                          }}
                          className="bg-white/90 hover:bg-red-50 text-red-500 p-2 rounded-full shadow-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* --- 삭제 확인 모달 부분 (기존 로직 유지) --- */}
        <AnimatePresence>
          {(showDeleteConfirm || showPermanentDeleteConfirm) && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {showPermanentDeleteConfirm ? "영구 삭제" : "매물 삭제"}
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {showPermanentDeleteConfirm
                    ? "이 작업은 절대 되돌릴 수 없습니다. 정말로 영구 삭제하시겠습니까?"
                    : "삭제된 매물은 [광고 종료] 탭에서 확인 및 재등록이 가능합니다."}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(null);
                      setShowPermanentDeleteConfirm(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
                  >
                    취소
                  </button>
                  <button
                    onClick={() =>
                      showPermanentDeleteConfirm
                        ? handlePermanentDelete(showPermanentDeleteConfirm)
                        : handleDelete(showDeleteConfirm!)
                    }
                    disabled={!!deletingId}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold disabled:bg-red-300"
                  >
                    {deletingId ? "처리중" : "삭제"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
