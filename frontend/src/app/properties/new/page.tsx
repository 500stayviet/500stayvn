'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { geocodeAddress } from '@/lib/api/geocoding';
import { addProperty } from '@/lib/api/properties';
import { MapPin, Loader2 } from 'lucide-react';

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    original_description: '',
    translated_description: '',
    price: '',
    priceUnit: 'vnd' as 'vnd' | 'usd',
    area: '',
    bedrooms: '',
    bathrooms: '',
    address: '',
  });

  // 좌표 상태
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // 주소 입력 시 자동으로 Geocoding 실행
  const handleAddressChange = async (address: string) => {
    setFormData((prev) => ({ ...prev, address }));

    if (address.trim().length > 5) {
      // 주소가 충분히 길면 Geocoding 실행
      setGeocoding(true);
      try {
        const result = await geocodeAddress(address, 'vi');
        // 좌표가 유효한 경우만 설정
        if (result.lat && result.lng && !isNaN(result.lat) && !isNaN(result.lng)) {
          setCoordinates({ lat: result.lat, lng: result.lng });
        } else {
          // 좌표가 유효하지 않으면 호치민 기본 좌표 사용
          setCoordinates({ lat: 10.776, lng: 106.701 });
        }
      } catch (error) {
        // Geocoding 실패 시에도 호치민 기본 좌표 사용 (항상 좌표 보장)
        setCoordinates({ lat: 10.776, lng: 106.701 });
      } finally {
        setGeocoding(false);
      }
    } else if (address.trim().length === 0) {
      // 주소가 비어있으면 좌표도 초기화
      setCoordinates(null);
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 좌표가 없으면 주소로 다시 geocoding 시도
    let finalCoordinates = coordinates;
    
    if (!finalCoordinates && formData.address.trim().length > 0) {
      setGeocoding(true);
      try {
        const result = await geocodeAddress(formData.address, 'vi');
        if (result.lat && result.lng && !isNaN(result.lat) && !isNaN(result.lng)) {
          finalCoordinates = { lat: result.lat, lng: result.lng };
          setCoordinates(finalCoordinates); // 상태도 업데이트
        } else {
          // 좌표가 유효하지 않으면 호치민 기본 좌표 사용
          finalCoordinates = { lat: 10.776, lng: 106.701 };
          setCoordinates(finalCoordinates);
        }
      } catch (error) {
        // Geocoding 실패 시에도 호치민 기본 좌표 사용 (항상 좌표 보장)
        finalCoordinates = { lat: 10.776, lng: 106.701 };
        setCoordinates(finalCoordinates);
      } finally {
        setGeocoding(false);
      }
    }
    
    // 여전히 좌표가 없으면 기본 좌표 사용 (주소도 없는 경우)
    if (!finalCoordinates) {
      finalCoordinates = { lat: 10.776, lng: 106.701 };
    }

    setLoading(true);
    try {
      await addProperty({
        title: formData.title,
        original_description: formData.original_description,
        translated_description: formData.translated_description,
        price: parseInt(formData.price),
        priceUnit: formData.priceUnit,
        area: parseInt(formData.area),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        coordinates: finalCoordinates,
        address: formData.address,
        status: 'active',
      });

      alert('매물이 성공적으로 등록되었습니다!');
      router.push('/');
    } catch (error) {
      alert('매물 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">새 매물 등록</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 (베트남어)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (베트남어)
            </label>
            <textarea
              value={formData.original_description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, original_description: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          {/* 주소 (Geocoding 자동 실행) */}
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
              onChange={(e) => handleAddressChange(e.target.value)}
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

          {/* 가격 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">가격</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">통화</label>
              <select
                value={formData.priceUnit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priceUnit: e.target.value as 'vnd' | 'usd' }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vnd">VND</option>
                <option value="usd">USD</option>
              </select>
            </div>
          </div>

          {/* 면적 및 방 정보 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">면적 (m²)</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">침실</label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">욕실</label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 제출 버튼 */}
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
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
