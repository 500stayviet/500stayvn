"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getPropertiesByOwner,
  getAvailableProperties,
  hostEndAdvertisingProperty,
  hostDeletePropertySoft,
} from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import { getCurrentUserData } from "@/lib/api/auth";
import { ArrowLeft, MapPin, Trash2, CheckCircle2, Clock, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "@/components/TopBar";
import Image from "next/image";
import { formatPrice } from "@/lib/utils/propertyUtils";
import { getUIText } from "@/utils/i18n";

type HostInventoryTab = "live" | "pending" | "ended";

function parseHostTab(s: string | null): HostInventoryTab {
  if (s === "pending" || s === "ended") return s;
  if (s === "hidden") return "ended"; // legacy: hidden -> ended
  return "live";
}

type InventoryBuckets = {
  liveList: PropertyData[];
  pendingList: PropertyData[];
  endedList: PropertyData[];
};

function MyPropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [inventory, setInventory] = useState<InventoryBuckets | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HostInventoryTab>("live");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchInventory = async (): Promise<InventoryBuckets> => {
    if (!user) throw new Error("User is not authenticated");
    await getAvailableProperties();
    const [activeResult] = await Promise.all([getPropertiesByOwner(user.uid, false)]);
    const rows = activeResult.properties.filter((p) => !p.deleted);

    const isManualEnded = (p: PropertyData) =>
      !!p.history?.some((h) => h.action === "HOST_MANUAL_END_AD");

    return {
      liveList: rows.filter((p) => !p.hidden && p.status === "active"),
      pendingList: rows.filter(
        (p) => !p.hidden && p.status === "INACTIVE_SHORT_TERM" && !isManualEnded(p),
      ),
      endedList: rows.filter(
        (p) =>
          p.hidden ||
          p.status === "closed" ||
          (p.status === "INACTIVE_SHORT_TERM" && isManualEnded(p)),
      ),
    };
  };

  const properties = useMemo(() => {
    if (!inventory) return [];
    switch (activeTab) {
      case "live":
        return inventory.liveList;
      case "pending":
        return inventory.pendingList;
      case "ended":
        return inventory.endedList;
      default:
        return [];
    }
  }, [inventory, activeTab]);

  useEffect(() => {
    setActiveTab(parseHostTab(searchParams.get("tab")));
  }, [searchParams]);

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
        const inv = await fetchInventory();
        setInventory(inv);
        setLoading(false);
      } else if (!authLoading && !user) {
        router.push("/login");
      }
    };
    init();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || authLoading) return;
    const onInventoryChange = () => {
      fetchInventory().then(setInventory);
    };
    window.addEventListener("propertiesUpdated", onInventoryChange);
    return () => window.removeEventListener("propertiesUpdated", onInventoryChange);
  }, [user, authLoading]);

  const openId = searchParams.get("open");
  useEffect(() => {
    if (!openId || !user || loading) return;
    router.replace(`/profile/my-properties/${openId}`);
  }, [openId, user, loading, router]);

  const goTab = (t: HostInventoryTab) => {
    setActiveTab(t);
    if (t === "live") router.push("/profile/my-properties");
    else router.push(`/profile/my-properties?tab=${t}`);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await hostDeletePropertySoft(id, user!.uid);
      setInventory(await fetchInventory());
      setShowDeleteConfirm(null);
    } catch (e) {
      alert("Error deleting property");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEndAd = async (propertyId: string) => {
    await hostEndAdvertisingProperty(propertyId, user!.uid);
    setActiveTab("ended");
    router.push(`/profile/my-properties?tab=ended`);
    setInventory(await fetchInventory());
  };

  const getStatusConfig = (property: PropertyData) => {
    if (property.hidden) {
      return {
        borderColor: "border-orange-500",
        bgColor: "bg-orange-500",
        text: getUIText("adminHiddenProperty", currentLanguage),
        icon: <Clock className="w-3 h-3" />,
      };
    }
    if (property.status === "INACTIVE_SHORT_TERM" || property.status === "closed") {
      return {
        borderColor: "border-orange-500",
        bgColor: "bg-orange-500",
        text: getUIText("adPausedByRule", currentLanguage),
        icon: <Clock className="w-3 h-3" />,
      };
    }
    if (property.status === "rented") {
      return {
        borderColor: "border-green-500",
        bgColor: "bg-green-500",
        text: getUIText("rented", currentLanguage),
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }
    return {
      borderColor: "border-emerald-500",
      bgColor: "bg-emerald-500",
      text: getUIText("listingLive", currentLanguage),
      icon: <CheckCircle2 className="w-3 h-3" />,
    };
  };

  const tabItems = [
    { id: "live" as const, labelKey: "tabAdvertLive" as const },
    { id: "pending" as const, labelKey: "tabAdvertPending" as const },
    { id: "ended" as const, labelKey: "tabAdvertSuspended" as const },
  ];

  const tabCount = (t: HostInventoryTab) => {
    if (!inventory) return 0;
    switch (t) {
      case "live":
        return inventory.liveList.length;
      case "pending":
        return inventory.pendingList.length;
      case "ended":
        return inventory.endedList.length;
      default:
        return 0;
    }
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {getUIText("loading", currentLanguage)}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

        <div className="px-5 py-6">
          <div className="mb-6">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1 text-gray-500 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> <span>{getUIText("back", currentLanguage)}</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{getUIText("myProperties", currentLanguage)}</h1>

            <div className="grid grid-cols-2 gap-2 mt-5 sm:grid-cols-4">
              {tabItems.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goTab(id)}
                  className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === id ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {getUIText(labelKey, currentLanguage)}
                  <span className="ml-1 tabular-nums opacity-80">({tabCount(id)})</span>
                </button>
              ))}
            </div>

            {activeTab === "pending" ? (
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">{getUIText("minRentablePeriodHint", currentLanguage)}</p>
            ) : null}
          </div>

          <div className="space-y-5">
            {properties.length === 0 ? (
              <div className="text-center py-20 text-gray-400">{getUIText("noProperties", currentLanguage)}</div>
            ) : (
              properties.map((property) => {
                const config = getStatusConfig(property);
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
                          <div className="text-sm font-bold leading-none">{formatPrice(property.price, property.priceUnit)}</div>
                          <div className="text-[10px] text-gray-300 mt-1">
                            {currentLanguage === "ko" ? "주당 비용" : "/ week"}
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                        <div className="flex items-center gap-2 text-white">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{property.title || property.address}</p>
                            {property.unitNumber && (
                              <p className="text-xs text-gray-300 opacity-80">{property.unitNumber}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-2">
                      {property.status !== "rented" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!property.id) return;
                            if (activeTab === "ended") {
                              setShowDeleteConfirm(property.id);
                              return;
                            }
                            if (activeTab === "pending") {
                              router.push(`/profile/my-properties/${property.id}/edit?extend=1`);
                              return;
                            }
                            void handleEndAd(property.id);
                          }}
                          className={`bg-white/90 p-2 rounded-full shadow-xl transition-colors ${
                            activeTab === "ended"
                              ? "hover:bg-red-50 text-red-500"
                              : activeTab === "pending"
                                ? "hover:bg-blue-50 text-blue-600"
                                : "hover:bg-orange-50 text-orange-600"
                          }`}
                        >
                          {activeTab === "pending" ? (
                            <Pencil className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
          {showDeleteConfirm ? (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {getUIText("deleteConfirmTitle", currentLanguage)}
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {getUIText("deleteConfirmDesc", currentLanguage)}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
                  >
                    {getUIText("cancel", currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(showDeleteConfirm!)}
                    disabled={!!deletingId}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold disabled:bg-red-300"
                  >
                    {deletingId ? getUIText("processing", currentLanguage) : getUIText("delete", currentLanguage)}
                  </button>
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MyPropertiesPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          {getUIText("loading", currentLanguage)}
        </div>
      }
    >
      <MyPropertiesContent />
    </Suspense>
  );
}
