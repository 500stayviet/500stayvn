import { useEffect, useMemo, useState } from "react";
import { Check, MapPin, X } from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

type RegionCity = {
  id: string;
  name: string;
  nameKo: string;
  nameVi: string;
  nameJa?: string;
  nameZh?: string;
};
type RegionDistrict = {
  id: string;
  name: string;
  nameKo: string;
  nameVi: string;
  nameJa?: string;
  nameZh?: string;
};

interface EditPropertyAddressSectionProps {
  currentLanguage: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  selectedCityId: string;
  selectedDistrictId: string;
  buildingNumber: string;
  roomNumber: string;
  setSelectedDistrictId: (value: string) => void;
  setBuildingNumber: (value: string) => void;
  setRoomNumber: (value: string) => void;
  onOpenAddressModal: () => void;
  onClearAddress: () => void;
}

export default function EditPropertyAddressSection({
  currentLanguage,
  address,
  coordinates,
  selectedCityId,
  selectedDistrictId,
  buildingNumber,
  roomNumber,
  setSelectedDistrictId,
  setBuildingNumber,
  setRoomNumber,
  onOpenAddressModal,
  onClearAddress,
}: EditPropertyAddressSectionProps) {
  const lang = currentLanguage as SupportedLanguage;
  const [cities, setCities] = useState<RegionCity[]>([]);
  const [districts, setDistricts] = useState<RegionDistrict[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { VIETNAM_CITIES } = await import("@/lib/data/vietnam-regions");
      if (!cancelled) {
        setCities(VIETNAM_CITIES as RegionCity[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedCityId) {
        setDistricts([]);
        return;
      }
      const { getDistrictsByCityId } = await import("@/lib/data/vietnam-regions");
      if (!cancelled) {
        setDistricts(getDistrictsByCityId(selectedCityId) as RegionDistrict[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCityId]);

  const selectedCityLabel = useMemo(() => {
    if (!(address && coordinates && selectedCityId)) return null;
    const city = cities.find((c) => c.id === selectedCityId);
    if (!city) return "—";
    const langMap: Record<string, string> = {
      ko: city.nameKo,
      vi: city.nameVi,
      en: city.name,
      ja: city.nameJa ?? city.name,
      zh: city.nameZh ?? city.name,
    };
    return langMap[currentLanguage] ?? city.name;
  }, [address, coordinates, selectedCityId, cities, currentLanguage]);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getUIText("address", lang)}
          <span className="text-red-500 text-xs ml-1">*</span>
        </label>
        <div className="pb-1">
          <p className="text-xs font-bold text-gray-500 mb-2">{getUIText("listingFindAddrBtn", lang)}</p>
        </div>
        {(!address || !coordinates) && (
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="w-full px-4 py-3.5 rounded-xl flex items-center justify-center gap-2 font-medium bg-blue-500 text-white hover:bg-blue-600"
          >
            <MapPin className="w-5 h-5" />
            <span>{getUIText("listingFindAddrBtn", lang)}</span>
          </button>
        )}
        {address && coordinates && (
          <div
            className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl cursor-pointer hover:bg-green-100"
            onClick={onOpenAddressModal}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-700 mb-1">{getUIText("listingAddrPinnedHint", lang)}</p>
                <p className="text-sm font-semibold text-gray-900">{address}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAddress();
                }}
                className="p-1.5 hover:bg-green-200 rounded-full"
                aria-label={getUIText("listingAddrRemoveAria", lang)}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">{getUIText("labelCity", lang)}</label>
          <div
            className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm ${address && coordinates ? "bg-gray-100 border-gray-200 text-gray-700" : "bg-gray-100 border-gray-200 text-gray-400"}`}
          >
            {selectedCityLabel ? selectedCityLabel : getUIText("listingCityAutoHint", lang)}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">{getUIText("labelDistrict", lang)}</label>
          <select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            disabled={!address || !coordinates}
            className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 ${
              address && coordinates
                ? "bg-gray-50 border-gray-200"
                : "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <option value="">{getUIText("selectLabel", lang)}</option>
            {districts.map((d) => {
              const langMap: Record<string, string> = {
                ko: d.nameKo,
                vi: d.nameVi,
                en: d.name,
                ja: d.nameJa ?? d.name,
                zh: d.nameZh ?? d.name,
              };
              return (
                <option key={d.id} value={d.id}>
                  {langMap[currentLanguage] ?? d.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">{getUIText("listingUnitBlockTitle", lang)}</label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{getUIText("listingWing", lang)}</label>
            <input
              type="text"
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
              placeholder={getUIText("listingWingPh", lang)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{getUIText("listingRoomNo", lang)}</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder={getUIText("listingRoomPh", lang)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 flex items-start gap-1">
          <span className="text-blue-600">ℹ️</span>
          <span>{getUIText("listingUnitPrivacyGuest", lang)}</span>
        </p>
      </div>
    </>
  );
}
