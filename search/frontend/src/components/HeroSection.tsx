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

  const { suggestions, isSearching, search, clearSuggestions } = useLocationSearch(currentLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (suggestions.length > 0 && searchValue.trim()) {
      setShowSuggestions(true);
    }
  }, [suggestions, searchValue]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (!value.trim()) {
      clearSuggestions();
      setShowSuggestions(false);
      return;
    }
    await search(value);
    setShowSuggestions(true);
  };

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
    const params = new URLSearchParams({ q: text });
    if (cityId) params.set('cityId', cityId);
    if (districtId) params.set('districtId', districtId);
    router.push(`/search?${params.toString()}`);
  };

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

  const LOCATION_PERMISSION_KEY = 'locationPermission';
  const TOKEN_EXPIRY_DAYS = 30;

  interface LocationPermissionToken {
    status: 'granted' | 'denied';
    expiresAt: number;
  }

  const getLocationPermissionToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const tokenStr = localStorage.getItem(LOCATION_PERMISSION_KEY);
      if (!tokenStr) return null;
      const token: LocationPermissionToken = JSON.parse(tokenStr);
      if (Date.now() > token.expiresAt) {
        localStorage.removeItem(LOCATION_PERMISSION_KEY);
        return null;
      }
      return token.status;
    } catch {
      localStorage.removeItem(LOCATION_PERMISSION_KEY);
      return null;
    }
  };

  const saveLocationPermissionToken = (status: 'granted' | 'denied') => {
    if (typeof window === 'undefined') return;
    const expiresAt = Date.now() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    localStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({ status, expiresAt }));
  };

  const requestLocationAndNavigate = async () => {
    if (!navigator.geolocation) {
      router.push('/map?denied=true');
      return;
    }
    router.push('/map?loading=true');
    setRequestingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        });
      });
      router.push(`/map?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
    } catch {
      router.push('/map?denied=true');
    } finally {
      setRequestingLocation(false);
    }
  };

  const handleMapView = () => {
    const token = getLocationPermissionToken();
    if (token === 'granted') {
      requestLocationAndNavigate();
    } else if (token === 'denied') {
      router.push('/map?denied=true');
    } else {
      setShowLocationPermissionModal(true);
    }
  };

  const handleRequestLocationPermission = async () => {
    if (!navigator.geolocation) {
      alert(getUIText('locationNotSupported', currentLanguage));
      setShowLocationPermissionModal(false);
      saveLocationPermissionToken('denied');
      router.push('/map?denied=true');
      return;
    }
    setRequestingLocation(true);
    setShowLocationPermissionModal(false);
    router.push('/map?loading=true');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        });
      });
      saveLocationPermissionToken('granted');
      router.push(`/map?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
    } catch {
      saveLocationPermissionToken('denied');
      router.push('/map?denied=true');
    } finally {
      setRequestingLocation(false);
    }
  };

  const handleSkipLocation = () => {
    saveLocationPermissionToken('denied');
    setShowLocationPermissionModal(false);
    router.push('/map?denied=true');
  };

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
        
        {/* 메인 문구: 어디서 살고싶으신가요 */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-5">
          <h2 className="text-2xl font-bold text-white text-center drop-shadow-lg max-w-xs leading-snug text-balance">
            {getUIText('whereDoYouWantToLive', currentLanguage)}
          </h2>
        </div>
      </div>

      {/* 검색 영역 - 이미지와 겹치는 카드 형태 */}
      <div className="relative z-10 px-4 -mt-8 pb-5">
        <div className="bg-white rounded-2xl shadow-lg p-4" style={{ border: '1px solid #F3F4F6' }}>
          <form onSubmit={handleSearch}>
            <div className="relative" ref={searchContainerRef}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4" style={{ color: BRAND.muted }} />
              </div>
              <input
                ref={searchInputRef}
                name="search"
                type="text"
                value={searchValue}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(false)}
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

          <button
            onClick={handleMapView}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm mt-3 transition-all active:scale-[0.98]"
            style={{ backgroundColor: BRAND.primary, color: BRAND.surface }}
          >
            <MapPin className="w-4 h-4" />
            <span>{getUIText('findPropertiesOnMap', currentLanguage)}</span>
          </button>
        </div>
      </div>

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
