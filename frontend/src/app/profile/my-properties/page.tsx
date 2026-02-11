"use client";

import { useState, useEffect, Suspense } from "react"; // 1. Suspense 추가
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
import { getUIText } from "@/utils/i18n";

type PropertyFetchResult = {
  activeData: PropertyData[];
  deletedData: PropertyData[];
  visibleActiveData: PropertyData[];
  bookedDateRanges: Map<string, PropertyDateRange[]>;
  excludedFromAdvertising: Set<string>;
  reservedIds: Set<string>;
};

// --- 실제 로직을 담당하는 컴포넌트 ---
function MyPropertiesContent() {
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

  // 수정 페이지에서 뒤로 시: my-properties?open=id 로 들어오면 해당 매물 상세(인터셉팅)로 이동
  const openId = searchParams.get("open");
  useEffect(() => {
    if (!openId || !user || loading) return;
    router.replace(`/profile/my-properties/${openId}`);
  }, [openId, user, loading, router]);

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

  const getStatusConfig = (status?: string) => {
    if (status === "rented") {
      return {
        borderColor: "border-green-500",
        bgColor: "bg-green-500",
        text: getUIText('rented', currentLanguage),
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }
    return {
      borderColor: "border-red-500",
      bgColor: "bg-red-500",
      text: getUIText('notRented', currentLanguage),
      icon: <Clock className="w-3 h-3" />,
    };
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {getUIText('loading', currentLanguage)}
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
          <div className="mb-6">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1 text-gray-500 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />{" "}
              <span>{getUIText('back', currentLanguage)}</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {getUIText('myProperties', currentLanguage)}
            </h1>

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
                    ? getUIText('activeProperties', currentLanguage)
                    : getUIText('expiredProperties', currentLanguage)}
                  <span className="ml-1.5 opacity-60">
                    ({tab === "active" ? advertisingCount : deletedCount})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {properties.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                {getUIText('noProperties', currentLanguage)}
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
                    <div
                      className="relative w-full aspect-[16/9] cursor-pointer"
                      onClick={() => router.push(`/profile/my-properties/${property.id}`)}
                    >
                      <Image
                        src={mainImage}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

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

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                        <div className="flex items-center gap-2 text-white">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {property.title || property.address}
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

                    <div className="absolute top-3 right-3 flex gap-2">
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
                  {showPermanentDeleteConfirm 
                    ? getUIText('permanentDeleteConfirmTitle', currentLanguage) 
                    : getUIText('deleteConfirmTitle', currentLanguage)}
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {showPermanentDeleteConfirm
                    ? getUIText('permanentDeleteConfirmDesc', currentLanguage)
                    : getUIText('deleteConfirmDesc', currentLanguage)}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(null);
                      setShowPermanentDeleteConfirm(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
                  >
                    {getUIText('cancel', currentLanguage)}
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
                    {deletingId ? getUIText('processing', currentLanguage) : getUIText('delete', currentLanguage)}
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

// --- Next.js 빌드 에러 해결을 위한 외부 래퍼 컴포넌트 ---
export default function MyPropertiesPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          {getUIText('loading', currentLanguage)}
        </div>
      }
    >
      <MyPropertiesContent />
    </Suspense>
  );
}
