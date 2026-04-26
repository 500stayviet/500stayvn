"use client";

import { MapPin, Loader2, Clock } from "lucide-react";
import type { NewPropertyPageViewModel } from "../hooks/useNewPropertyPage";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

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
  } = vm;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">새 매물 등록</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매물명
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="예: 홍대점 301호, 판매용 A동"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (베트남어)
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
              주소 (베트남어)
              {geocoding && (
                <span className="ml-2 text-blue-600 text-xs flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  좌표 변환 중...
                </span>
              )}
              {coordinates && (
                <span className="ml-2 text-green-600 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  좌표 생성됨
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => void handleAddressChange(e.target.value)}
              placeholder="예: Quận 7, Thành phố Hồ Chí Minh"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {coordinates && (
              <p className="mt-2 text-sm text-gray-600">
                좌표: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격
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
                통화
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
                면적 (m²)
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
                침실
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
                욕실
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
                체크인 시간
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
                    {time} 이후
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                입주자가 체크인할 수 있는 시간
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                체크아웃 시간
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
                    {time} 이전
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                입주자가 체크아웃해야 하는 시간
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
