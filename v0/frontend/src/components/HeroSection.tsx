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
import { ALL_REGIONS, VIETNAM_CITIES, getDistrictsByCityId } from '@/lib/data/vietnam-regions';
import type { VietnamRegion } from '@/lib/data/vietnam-regions';

interface HeroSectionProps {
  currentLanguage: SupportedLanguage;
}

// 5개국어에 따른 지역 표시명 (undefined 방지)
function getRegionDisplayName(region: VietnamRegion, lang: SupportedLanguage): string {
  if (lang === 'ko') return region.nameKo ?? region.name ?? '';
  if (lang === 'vi') return region.nameVi ?? region.name ?? '';
  if (lang === 'ja') return region.nameJa ?? region.name ?? '';
  if (lang === 'zh') return region.nameZh ?? region.name ?? '';
  return region.name ?? '';
}

export default function HeroSection({ currentLanguage }: HeroSectionProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const selectedCity = selectedCityId ? VIETNAM_CITIES.find(c => c.id === selectedCityId) ?? ALL_REGIONS.find(r => r.id === selectedCityId) : null;
  const districts = selectedCityId ? getDistrictsByCityId(selectedCityId) : [];
  const selectedDistrict = selectedDistrictId ? districts.find(d => d.id === selectedDistrictId) : null;

  // 공통 검색 훅: 베트남 도시·구만 검색 (하드코딩 데이터)
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

  // 추천 선택 → 검색 결과 페이지로 바로 이동
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const text = suggestion.Text || '';
    setSearchValue(text);
    setShowSuggestions(false);

    const regionId = (suggestion.PlaceId || '').replace(/^region-/, '');
    const region = ALL_REGIONS.find(r => r.id === regionId);
    if (!region) return;

    let cityId: string | null = null;
    let districtId: string | null = null;
    if (region.type === 'city') {
      cityId = region.id;
      districtId = null;
    } else {
      cityId = region.parentCity ?? null;
      districtId = region.id;
    }

    // 검색 결과 페이지로 바로 이동 (q, cityId, districtId 전달)
    const params = new URLSearchParams({ q: text });
    if (cityId) params.set('cityId', cityId);
    if (districtId) params.set('districtId', districtId);
    router.push(`/search?${params.toString()}`);
  };

  // 엔터 키로 검색 실행 (선택된 도시·구 또는 검색어로 이동)
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuggestions(false);

    let q = searchValue.trim();
    if (!q && selectedCity) {
      const cityName = getRegionDisplayName(selectedCity, currentLanguage);
      const districtName = selectedDistrict ? getRegionDisplayName(selectedDistrict, currentLanguage) : '';
      q = districtName ? `${districtName}, ${cityName}` : cityName;
    }
    if (q) {
      const params = new URLSearchParams({ q });
      if (selectedCityId) params.set('cityId', selectedCityId);
      if (selectedDistrictId) params.set('districtId', selectedDistrictId);
      router.push(`/search?${params.toString()}`);
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
      alert(getUIText('locationNotSupported', currentLanguage));
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

  // 브랜드 컬러 (하단바와 통일)
  const BRAND = {
    primary: '#E63946',
    primaryDark: '#C62D3A',
    text: '#1F2937',
    muted: '#9CA3AF',
    surface: '#FFFFFF',
    bgWarm: '#FFF8F6',
  };

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: BRAND.bgWarm }}>
      {/* 배경 이미지 영역 */}
      <div className="relative h-[200px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60"></div>
        </div>
        
        {/* 메인 문구 */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-5">
          <h2 className="text-2xl font-bold text-white text-center drop-shadow-lg max-w-xs leading-snug text-balance">
            {getUIText('whereDoYouWantToLive', currentLanguage)}
          </h2>
        </div>
      </div>

      {/* 검색 영역 - 이미지와 겹치는 카드 형태 */}
      <div className="relative z-10 px-4 -mt-8 pb-5">
        <div className="bg-white rounded-2xl shadow-lg p-4" style={{ border: '1px solid #F3F4F6' }}>
          {/* 검색창 */}
          <form onSubmit={handleSearch}>
            <div className="relative" ref={searchContainerRef}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="h-4.5 w-4.5" style={{ color: BRAND.muted }} />
              </div>
              <input
                ref={searchInputRef}
                name="search"
                type="text"
                value={searchValue}
                onChange={handleInputChange}
                onFocus={() => {
                  setShowSuggestions(false);
                }}
                placeholder={getUIText('searchPlaceholderCityDistrict', currentLanguage)}
                className="w-full pl-11 pr-4 py-3 text-sm rounded-xl transition-all"
                style={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1.5px solid #E5E7EB',
                  color: BRAND.text,
                  outline: 'none',
                }}
                onFocusCapture={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = BRAND.primary;
                }}
                onBlurCapture={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#E5E7EB';
                }}
              />
              
              {/* 추천 결과 드롭다운 */}
              {searchValue && showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg max-h-72 overflow-y-auto" style={{ border: '1px solid #E5E7EB' }}>
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
                        onClick={() => {
                          handleSelectSuggestion(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 transition-colors border-b border-gray-50 last:border-b-0"
                        style={{ backgroundColor: suggestion.isRegion ? '#FFF8F6' : 'transparent' }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0 mt-0.5">{badge.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color} text-white font-medium flex-shrink-0`}>
                                {badge.text}
                              </span>
                              <p className="text-sm font-semibold truncate" style={{ color: BRAND.text }}>
                                {mainName}
                              </p>
                            </div>
                            {subAddress && (
                              <p className="text-xs mt-1 truncate" style={{ color: BRAND.muted }}>
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
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg p-4" style={{ border: '1px solid #E5E7EB' }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: BRAND.primary }}></div>
                    <span className="text-sm" style={{ color: BRAND.muted }}>
                      {getUIText('searching', currentLanguage)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* 지도로 매물 찾기 버튼 */}
          <button
            onClick={handleMapView}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm mt-3 transition-all active:scale-[0.98]"
            style={{ 
              backgroundColor: BRAND.primary, 
              color: BRAND.surface,
            }}
          >
            <MapPin className="w-4 h-4" />
            <span>
              {getUIText('findPropertiesOnMap', currentLanguage)}
            </span>
          </button>
        </div>
      </div>

      {/* 위치 권한 요청 모달 */}
      {showLocationPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#E6394615' }}>
                <MapPin className="w-7 h-7" style={{ color: BRAND.primary }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: BRAND.text }}>
                {getUIText('useCurrentLocation', currentLanguage)}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: BRAND.muted }}>
                {getUIText('locationPermissionDesc', currentLanguage)}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleRequestLocationPermission}
                disabled={requestingLocation}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: BRAND.primary, color: '#FFFFFF' }}
              >
                {requestingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{getUIText('requesting', currentLanguage)}</span>
                  </>
                ) : (
                  <span>{getUIText('allowLocationAccess', currentLanguage)}</span>
                )}
              </button>
              <button
                onClick={handleSkipLocation}
                disabled={requestingLocation}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F3F4F6', color: BRAND.text }}
              >
                {getUIText('skip', currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
