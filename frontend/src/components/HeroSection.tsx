/**
 * HeroSection 컴포넌트 (인기 앱 스타일)
 * 
 * Airbnb/직방 스타일의 Hero 섹션
 * - 큰 배경 이미지
 * - 중앙 검색창
 * - 지도로 매물 찾기 버튼
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';
import { searchPlaceIndexForSuggestions, getLocationServiceLanguage } from '@/lib/api/aws-location';

interface HeroSectionProps {
  currentLanguage: SupportedLanguage;
}

export default function HeroSection({ currentLanguage }: HeroSectionProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 주소 입력 시 추천 목록 가져오기 (AWS Location Service)
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 디바운싱: 300ms 후 검색
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const language = getLocationServiceLanguage(currentLanguage);
        const results = await searchPlaceIndexForSuggestions(value, language);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  // 추천 주소 선택
  const handleSelectSuggestion = (suggestion: any) => {
    const text = suggestion.Text || '';
    setSearchValue(text);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(text)}`);
  };

  // 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  // 지도로 매물 찾기 버튼 클릭
  const handleMapView = () => {
    setShowLocationPermissionModal(true);
  };

  // 위치 권한 요청
  const handleRequestLocationPermission = async () => {
    if (!navigator.geolocation) {
      alert(
        currentLanguage === 'ko'
          ? '이 브라우저는 위치 서비스를 지원하지 않습니다.'
          : currentLanguage === 'vi'
          ? 'Trình duyệt này không hỗ trợ dịch vụ vị trí.'
          : 'This browser does not support location services.'
      );
      setShowLocationPermissionModal(false);
      router.push('/map');
      return;
    }

    setRequestingLocation(true);

    try {
      // 위치 권한 요청
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      // 위치 권한이 허용되면 지도 페이지로 이동
      setShowLocationPermissionModal(false);
      router.push('/map');
    } catch (error: any) {
      // 사용자가 거부하거나 오류 발생
      if (error.code === 1) {
        // PERMISSION_DENIED
        alert(
          currentLanguage === 'ko'
            ? '위치 권한이 거부되었습니다. 지도는 표시되지만 현재 위치는 사용할 수 없습니다.'
            : currentLanguage === 'vi'
            ? 'Quyền vị trí đã bị từ chối. Bản đồ sẽ hiển thị nhưng không thể sử dụng vị trí hiện tại.'
            : 'Location permission denied. Map will be shown but current location cannot be used.'
        );
      } else {
        alert(
          currentLanguage === 'ko'
            ? '위치를 가져오는 중 오류가 발생했습니다. 지도는 표시되지만 현재 위치는 사용할 수 없습니다.'
            : currentLanguage === 'vi'
            ? 'Đã xảy ra lỗi khi lấy vị trí. Bản đồ sẽ hiển thị nhưng không thể sử dụng vị trí hiện tại.'
            : 'An error occurred while getting location. Map will be shown but current location cannot be used.'
        );
      }
      setShowLocationPermissionModal(false);
      router.push('/map');
    } finally {
      setRequestingLocation(false);
    }
  };

  // 위치 권한 거부하고 지도로 이동
  const handleSkipLocation = () => {
    setShowLocationPermissionModal(false);
    router.push('/map');
  };

  return (
    <section className="relative h-[320px] overflow-hidden">
      {/* 배경 이미지 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop)',
        }}
      >
        {/* 오버레이 (더 밝게) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* 메인 문구 */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 drop-shadow-lg max-w-md">
          {currentLanguage === 'ko' 
            ? '어디에서 살고 싶으신가요?' 
            : currentLanguage === 'vi'
            ? 'Bạn muốn sống ở đâu?'
            : 'Where do you want to live?'}
        </h2>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="w-full max-w-lg mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              name="search"
              type="text"
              value={searchValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={getUIText('searchPlaceholder', currentLanguage)}
              className="w-full pl-12 pr-4 py-3.5 text-base rounded-full bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-xl transition-all"
            />
            
            {/* 추천 주소 드롭다운 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.PlaceId || index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.Text}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* 지도로 매물 찾기 버튼 */}
        <button
          onClick={handleMapView}
          className="w-full max-w-lg flex items-center justify-center gap-2 bg-white text-gray-900 py-3.5 px-6 rounded-full font-semibold text-base hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-xl hover:shadow-2xl active:scale-95"
        >
          <MapPin className="w-5 h-5 text-blue-600" />
          <span>
            {currentLanguage === 'ko'
              ? '지도로 매물 찾기'
              : currentLanguage === 'vi'
              ? 'Tìm bất động sản trên bản đồ'
              : 'Find Properties on Map'}
          </span>
        </button>
      </div>

      {/* 위치 권한 요청 모달 */}
      {showLocationPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko'
                  ? '현재 위치 사용'
                  : currentLanguage === 'vi'
                  ? 'Sử dụng vị trí hiện tại'
                  : 'Use Current Location'}
              </h3>
              <p className="text-gray-600 text-sm">
                {currentLanguage === 'ko'
                  ? '지도에서 현재 위치를 표시하고 주변 매물을 찾기 위해 위치 정보가 필요합니다.'
                  : currentLanguage === 'vi'
                  ? 'Chúng tôi cần thông tin vị trí để hiển thị vị trí hiện tại trên bản đồ và tìm bất động sản xung quanh.'
                  : 'We need location information to show your current location on the map and find nearby properties.'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRequestLocationPermission}
                disabled={requestingLocation}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {requestingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>
                      {currentLanguage === 'ko'
                        ? '요청 중...'
                        : currentLanguage === 'vi'
                        ? 'Đang yêu cầu...'
                        : 'Requesting...'}
                    </span>
                  </>
                ) : (
                  <span>
                    {currentLanguage === 'ko'
                      ? '위치 권한 허용'
                      : currentLanguage === 'vi'
                      ? 'Cho phép quyền vị trí'
                      : 'Allow Location Access'}
                  </span>
                )}
              </button>
              <button
                onClick={handleSkipLocation}
                disabled={requestingLocation}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentLanguage === 'ko'
                  ? '건너뛰기'
                  : currentLanguage === 'vi'
                  ? 'Bỏ qua'
                  : 'Skip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
