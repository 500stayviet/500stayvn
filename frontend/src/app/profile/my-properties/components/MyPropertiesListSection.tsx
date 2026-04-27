import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import type { PropertyData } from "@/types/property";
import { formatPrice } from "@/lib/utils/propertyUtils";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { HostInventoryTab } from "../hooks/useMyPropertiesPageState";

interface MyPropertiesListSectionProps {
  properties: PropertyData[];
  activeTab: HostInventoryTab;
  currentLanguage: SupportedLanguage;
  onOpenProperty: (propertyId: string) => void;
  onEndAd: (propertyId: string) => void;
  onEditPending: (property: PropertyData) => void;
  onMovePendingToEnded: (propertyId: string) => void;
  onEditEnded: (property: PropertyData) => void;
  onDeleteEnded: (propertyId: string) => void;
}

const getStatusConfig = (property: PropertyData, currentLanguage: SupportedLanguage) => {
  if (property.hidden) {
    return {
      borderColor: "border-orange-500",
      bgColor: "bg-orange-500",
      text: getUIText("adminHiddenProperty", currentLanguage),
      icon: <Clock className="w-3 h-3" />,
    };
  }
  if (property.status === "pending") {
    return {
      borderColor: "border-blue-500",
      bgColor: "bg-blue-500",
      text: getUIText("tabAdvertPending", currentLanguage),
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

export default function MyPropertiesListSection({
  properties,
  activeTab,
  currentLanguage,
  onOpenProperty,
  onEndAd,
  onEditPending,
  onMovePendingToEnded,
  onEditEnded,
  onDeleteEnded,
}: MyPropertiesListSectionProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        {getUIText("noProperties", currentLanguage)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {properties.map((property) => {
        const config = getStatusConfig(property, currentLanguage);
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
              onClick={() => property.id && onOpenProperty(property.id)}
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
                    {getUIText("weeklyCostLabel", currentLanguage)}
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
                <>
                  {activeTab === "live" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!property.id) return;
                        onEndAd(property.id);
                      }}
                      className="my-properties-card-icon-btn bg-white/90 rounded-full shadow-xl transition-colors hover:bg-orange-50 text-orange-600"
                      aria-label="end-ad"
                    >
                      <Trash2 />
                    </button>
                  )}

                  {activeTab === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPending(property);
                        }}
                        className="bg-white/90 p-2 rounded-full shadow-xl transition-colors hover:bg-blue-50 text-blue-600"
                        aria-label="edit-pending"
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!property.id) return;
                          onMovePendingToEnded(property.id);
                        }}
                        className="my-properties-card-icon-btn bg-white/90 rounded-full shadow-xl transition-colors hover:bg-orange-50 text-orange-600"
                        aria-label="pending-to-ended"
                      >
                        <Trash2 />
                      </button>
                    </>
                  )}

                  {activeTab === "ended" && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEnded(property);
                        }}
                        className="my-properties-card-icon-btn bg-white/90 rounded-full shadow-xl transition-colors hover:bg-blue-50 text-blue-600"
                        aria-label="edit-ended"
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!property.id) return;
                          onDeleteEnded(property.id);
                        }}
                        className="my-properties-card-icon-btn bg-white/90 rounded-full shadow-xl transition-colors hover:bg-red-50 text-red-500"
                        aria-label="permanent-delete"
                      >
                        <Trash2 />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
