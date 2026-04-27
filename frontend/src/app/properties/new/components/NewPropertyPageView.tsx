"use client";

import { MapPin, Loader2, Clock } from "lucide-react";
import type { NewPropertyPageViewModel } from "../hooks/useNewPropertyPage";
import { getUIText } from "@/utils/i18n";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

type Props = { vm: NewPropertyPageViewModel };

export function NewPropertyPageView({ vm }: Props) {
  const {
    router,
    loading,
    geocoding,
    formData,
    setFormData,
    coordinates,
    handleAddressChange,
    handleSubmit,
    currentLanguage,
  } = vm;

  const t = (key: Parameters<typeof getUIText>[0]) =>
    getUIText(key, currentLanguage);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t("legacyNewPropertyPageTitle")}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("legacyNewPropertyFieldTitle")}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder={t("legacyNewPropertyTitlePh")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("legacyNewPropertyDescVi")}
            </label>
            <textarea
              value={formData.original_description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  original_description: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("legacyNewPropertyAddrVi")}
              {geocoding && (
                <span className="ml-2 text-blue-600 text-xs flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t("legacyNewPropertyGeocoding")}
                </span>
              )}
              {coordinates && (
                <span className="ml-2 text-green-600 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {t("legacyNewPropertyCoordsOk")}
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => void handleAddressChange(e.target.value)}
              placeholder={t("legacyNewPropertyAddrPh")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {coordinates && (
              <p className="mt-2 text-sm text-gray-600">
                {interpolate(t("legacyNewPropertyCoordsLine"), {
                  lat: coordinates.lat.toFixed(6),
                  lng: coordinates.lng.toFixed(6),
                })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("legacyNewPropertyPrice")}
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("legacyNewPropertyCurrency")}
              </label>
              <select
                value={formData.priceUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priceUnit: e.target.value as "vnd" | "usd",
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vnd">VND</option>
                <option value="usd">USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("legacyNewPropertyArea")}
              </label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, area: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("legacyNewPropertyBedrooms")}
              </label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bedrooms: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("legacyNewPropertyBathrooms")}
              </label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bathrooms: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                {t("legacyNewPropertyCheckIn")}
              </label>
              <select
                value={formData.checkInTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    checkInTime: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`checkin-${time}`} value={time}>
                    {interpolate(t("legacyNewPropertyTimeAfter"), { time })}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {t("legacyNewPropertyCheckInHelp")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                {t("legacyNewPropertyCheckOut")}
              </label>
              <select
                value={formData.checkOutTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    checkOutTime: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`checkout-${time}`} value={time}>
                    {interpolate(t("legacyNewPropertyTimeBefore"), { time })}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {t("legacyNewPropertyCheckOutHelp")}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("legacyNewPropertyCancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? t("legacyNewPropertySubmitting")
                : t("legacyNewPropertySubmit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
