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

  // 베트남 컬러 팔레트
  const VN = {
    green: '#2D6A4F',
    greenDark: '#1B4332',
    gold: '#D4A017',
    goldLight: '#D4A01718',
    terracotta: '#C2703E',
    text: '#1A2E1A',
    textSub: '#3D5C3D',
    muted: '#8A9E8A',
    cream: '#FBF8F3',
    surface: '#FFFFFF',
    border: '#E8E0D4',
    inputBg: '#F5F0E8',
  };

  // 인사말
  const getGreeting = (lang: SupportedLanguage): string => {
    const greetings: Record<SupportedLanguage, string> = {
      ko: '베트남에서\n나의 집을 찾아보세요',
      vi: 'Tim nha cua ban\ntai Viet Nam',
      en: 'Find your home\nin Vietnam',
      ja: 'ベトナムで\nあなたの家を見つけよう',
      zh: '在越南\n找到你的家',
    };
    return greetings[lang] || greetings.en;
  };

  const getSubtitle = (lang: SupportedLanguage): string => {
    const subtitles: Record<SupportedLanguage, string> = {
      ko: '호치민, 하노이, 다낭 등 베트남 전역의 매물',
      vi: 'Bat dong san khap Viet Nam',
      en: 'Properties across Vietnam',
      ja: 'ベトナム全土の物件',
      zh: '越南各地的房产',
    };
    return subtitles[lang] || subtitles.en;
  };

  return (
    <section style={{ backgroundColor: VN.cream }}>
      {/* 배경 이미지 영역 - 베트남 풍경 */}
      <div className="relative h-[180px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=600&fit=crop)',
          }}
        >
          {/* 따뜻한 녹색-황금빛 오버레이 */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(27,67,50,0.3) 0%, rgba(27,67,50,0.55) 100%)' }}></div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-end px-5 pb-5">
          <h2 className="text-xl font-extrabold leading-tight whitespace-pre-line text-white drop-shadow-md text-balance">
            {getGreeting(currentLanguage)}
          </h2>
          <p className="text-xs mt-1.5 font-medium drop-shadow-sm" style={{ color: '#E8E0D4' }}>
            {getSubtitle(currentLanguage)}
          </p>
        </div>
      </div>

      {/* 검색 카드 - 이미지와 겹침 */}
      <div className="relative z-10 px-4 -mt-6 pb-4">
        <div className="rounded-2xl p-4 shadow-md" style={{ backgroundColor: VN.surface, border: `1px solid ${VN.border}` }}>
          {/* 검색창 */}
          <form onSubmit={handleSearch}>
            <div className="relative" ref={searchContainerRef}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="h-[16px] w-[16px]" style={{ color: VN.muted }} />
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
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl transition-all"
                style={{ 
                  backgroundColor: VN.inputBg, 
                  border: '1.5px solid transparent',
                  color: VN.text,
                  outline: 'none',
                }}
                onFocusCapture={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = VN.green;
                  (e.target as HTMLInputElement).style.backgroundColor = VN.surface;
                }}
                onBlurCapture={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'transparent';
                  (e.target as HTMLInputElement).style.backgroundColor = VN.inputBg;
                }}
              />
              
              {/* 추천 결과 드롭다운 */}
              {searchValue && showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1.5 rounded-xl shadow-xl max-h-72 overflow-y-auto" style={{ backgroundColor: VN.surface, border: `1px solid ${VN.border}` }}>
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
                        className="w-full text-left px-4 py-3 transition-colors border-b last:border-b-0"
                        style={{ borderColor: VN.border, backgroundColor: suggestion.isRegion ? VN.cream : 'transparent' }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-base flex-shrink-0 mt-0.5">{badge.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.color} text-white font-semibold flex-shrink-0`}>
                                {badge.text}
                              </span>
                              <p className="text-sm font-medium truncate" style={{ color: VN.text }}>
                                {mainName}
                              </p>
                            </div>
                            {subAddress && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: VN.muted }}>
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
                <div className="absolute z-50 w-full mt-1.5 rounded-xl shadow-xl p-4" style={{ backgroundColor: VN.surface, border: `1px solid ${VN.border}` }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: VN.green }}></div>
                    <span className="text-sm" style={{ color: VN.muted }}>
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
              backgroundColor: VN.green, 
              color: VN.cream,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
          <div className="rounded-2xl shadow-2xl max-w-sm w-full p-6" style={{ backgroundColor: VN.surface }}>
            <div className="text-center mb-5">
              <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: VN.inputBg }}>
                <MapPin className="w-6 h-6" style={{ color: VN.green }} />
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: VN.text }}>
                {getUIText('useCurrentLocation', currentLanguage)}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: VN.muted }}>
                {getUIText('locationPermissionDesc', currentLanguage)}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRequestLocationPermission}
                disabled={requestingLocation}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: VN.green, color: VN.cream }}
              >
                {requestingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: VN.cream }}></div>
                    <span>{getUIText('requesting', currentLanguage)}</span>
                  </>
                ) : (
                  <span>{getUIText('allowLocationAccess', currentLanguage)}</span>
                )}
              </button>
              <button
                onClick={handleSkipLocation}
                disabled={requestingLocation}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                style={{ backgroundColor: VN.inputBg, color: VN.textSub }}
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
