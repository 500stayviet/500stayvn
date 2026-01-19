/**
 * HeroSection 컴포넌트 (인기 앱 스타일)
 * 
 * Airbnb/직방 스타일의 Hero 섹션
 * - 큰 배경 이미지
 * - 중앙 검색창 (행정구역 + 대표 명소 검색)
 * - 지도로 매물 찾기 버튼
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';
import { 
  useLocationSearch, 
  getSuggestionBadge, 
  cleanDisplayName, 
  cleanSubAddress,
  LocationSuggestion 
} from '@/hooks/useLocationSearch';

interface HeroSectionProps {
  currentLanguage: SupportedLanguage;
}

export default function HeroSection({ currentLanguage }: HeroSectionProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 공통 검색 훅 사용 (행정구역 + 대표 명소)
  const { suggestions, isSearching, search, clearSuggestions } = useLocationSearch(currentLanguage);

  // 검색창 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // suggestions가 변경되면 (언어 변경으로 인한 재검색 등) 드롭다운 표시
  useEffect(() => {
    if (suggestions.length > 0 && searchValue.trim()) {
      setShowSuggestions(true);
    }
  }, [suggestions, searchValue]);

  // 주소 입력 시 추천 목록 가져오기
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (!value.trim()) {
      clearSuggestions();
      setShowSuggestions(false);
      return;
    }

    // 검색 실행
    await search(value);
    setShowSuggestions(true);
  };

  // 추천 선택 → 해당 지역으로 매물 검색 페이지 이동
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const text = suggestion.Text || '';
    setSearchValue(text);
    setShowSuggestions(false);
    
    // 검색 페이지로 이동 (매물 검색)
    router.push(`/search?q=${encodeURIComponent(text)}`);
  };

  // 엔터 키로 검색 실행
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    if (searchValue.trim()) {
      // 추천 결과가 있으면 첫 번째 결과로 이동
      if (suggestions.length > 0) {
        const firstSuggestion = suggestions[0];
        const text = firstSuggestion.Text || searchValue;
        router.push(`/search?q=${encodeURIComponent(text)}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(searchValue)}`);
      }
    }
  };

  // 위치 동의 토큰 키
  const LOCATION_PERMISSION_KEY = 'locationPermission';
  
  // 토큰 만료 기간 (1달 = 30일)
  const TOKEN_EXPIRY_DAYS = 30;

  // 위치 동의 토큰 타입
  interface LocationPermissionToken {
    status: 'granted' | 'denied';
    expiresAt: number; // 타임스탬프 (밀리초)
  }

  // 위치 동의 토큰 가져오기 (만료 확인 포함)
  const getLocationPermissionToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const tokenStr = localStorage.getItem(LOCATION_PERMISSION_KEY);
      if (!tokenStr) return null;

      const token: LocationPermissionToken = JSON.parse(tokenStr);
      const now = Date.now();

      // 만료 시간 확인
      if (now > token.expiresAt) {
        // 만료되었으면 토큰 삭제
        localStorage.removeItem(LOCATION_PERMISSION_KEY);
        return null;
      }

      return token.status;
    } catch (error) {
      // 파싱 오류 시 토큰 삭제
      localStorage.removeItem(LOCATION_PERMISSION_KEY);
      return null;
    }
  };

  // 위치 동의 토큰 저장 (만료 시간 포함)
  const saveLocationPermissionToken = (status: 'granted' | 'denied') => {
    if (typeof window === 'undefined') return;
    
    const expiresAt = Date.now() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000); // 30일 후
    const token: LocationPermissionToken = {
      status,
      expiresAt,
    };
    
    localStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify(token));
  };

  // 위치 가져오기 및 지도로 이동 (모달 없이 바로 실행)
  const requestLocationAndNavigate = async () => {
    if (!navigator.geolocation) {
      router.push('/map?denied=true');
      return;
    }

    // 지도 페이지로 먼저 이동 (사용자 경험 개선)
    router.push('/map?loading=true');

    // 백그라운드에서 위치 가져오기
    setRequestingLocation(true);

    try {
      // 위치 권한 요청 (최적화: enableHighAccuracy false, timeout 5초)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // WiFi/셀룰러 사용 (더 빠름)
          timeout: 5000, // 5초로 단축
          maximumAge: 60000, // 1분 이내 캐시된 위치 사용 가능
        });
      });

      // 위치 좌표를 URL 파라미터로 전달하고 지도 페이지로 이동
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      router.push(`/map?lat=${lat}&lng=${lng}`);
    } catch (error: any) {
      // 사용자가 거부하거나 오류 발생
      router.push('/map?denied=true');
    } finally {
      setRequestingLocation(false);
    }
  };

  // 지도로 매물 찾기 버튼 클릭
  const handleMapView = () => {
    const token = getLocationPermissionToken();

    if (token === 'granted') {
      // 이미 동의한 경우: 모달 없이 바로 위치 가져오고 지도로 이동
      requestLocationAndNavigate();
    } else if (token === 'denied') {
      // 이미 거부한 경우: 모달 없이 바로 호치민 중심으로 이동
      router.push('/map?denied=true');
    } else {
      // 토큰이 없는 경우: 모달 표시
      setShowLocationPermissionModal(true);
    }
  };

  // 위치 권한 요청 (모달에서 동의 버튼 클릭 시)
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
      saveLocationPermissionToken('denied');
      router.push('/map?denied=true');
      return;
    }

    setRequestingLocation(true);

    // 모달 닫고 지도 페이지로 먼저 이동 (사용자 경험 개선)
    setShowLocationPermissionModal(false);
    router.push('/map?loading=true');

    try {
      // 위치 권한 요청 (최적화: enableHighAccuracy false, timeout 5초)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // WiFi/셀룰러 사용 (더 빠름)
          timeout: 5000, // 5초로 단축
          maximumAge: 60000, // 1분 이내 캐시된 위치 사용 가능
        });
      });

      // 위치 좌표를 URL 파라미터로 전달
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // 토큰 저장 (동의)
      saveLocationPermissionToken('granted');
      
      // 위치 정보와 함께 지도 페이지로 이동
      router.push(`/map?lat=${lat}&lng=${lng}`);
    } catch (error: any) {
      // 사용자가 거부하거나 오류 발생
      // 토큰 저장 (거부)
      saveLocationPermissionToken('denied');
      router.push('/map?denied=true');
    } finally {
      setRequestingLocation(false);
    }
  };

  // 위치 권한 거부하고 지도로 이동 (호치민 중심)
  const handleSkipLocation = () => {
    // 토큰 저장 (거부)
    saveLocationPermissionToken('denied');
    setShowLocationPermissionModal(false);
    router.push('/map?denied=true');
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
          <div className="relative" ref={searchContainerRef}>
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
              placeholder={getUIText('searchPlaceholder', currentLanguage)}
              className="w-full pl-12 pr-4 py-3.5 text-base rounded-full bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-xl transition-all"
            />
            
            {/* 추천 결과 드롭다운 (도시/구/명소) */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {suggestions.map((suggestion, index) => {
                  const badge = getSuggestionBadge(suggestion, currentLanguage);
                  const displayText = suggestion.Text || '';
                  const parts = displayText.split(',');
                  const mainName = cleanDisplayName(parts[0]?.trim() || displayText);
                  const subAddress = cleanSubAddress(parts.slice(1).join(',').trim());
                  
                  return (
                    <button
                      key={suggestion.PlaceId || index}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        suggestion.isRegion ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* 아이콘 */}
                        <span className="text-lg flex-shrink-0 mt-0.5">{badge.icon}</span>
                        
                        <div className="flex-1 min-w-0">
                          {/* 배지 + 메인 이름 */}
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color} text-white font-medium flex-shrink-0`}>
                              {badge.text}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {mainName}
                            </p>
                          </div>
                          
                          {/* 보조 주소 */}
                          {subAddress && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {subAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* 검색 중 표시 */}
            {isSearching && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">
                    {currentLanguage === 'ko' ? '검색 중...' : currentLanguage === 'vi' ? 'Đang tìm kiếm...' : 'Searching...'}
                  </span>
                </div>
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
