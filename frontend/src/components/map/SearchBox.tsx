'use client';

import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { getUIText } from '@/utils/i18n';
import { cleanDisplayName, cleanSubAddress } from '@/hooks/useLocationSearch';
import { Suggestion } from '@/types/map';
import { SupportedLanguage } from '@/lib/api/translation';

interface SearchBoxProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  isSearching: boolean;
  currentLanguage: SupportedLanguage;
}

export default function SearchBox({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  onSelectSuggestion,
  isSearching,
  currentLanguage,
}: SearchBoxProps) {
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
  }, [setShowSuggestions]);

  return (
    <form onSubmit={onSearchSubmit} className="absolute top-2 left-4 right-4 z-10 max-w-md">
      <div className="relative" ref={searchContainerRef}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#E63946]" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => {
            // 검색창 클릭 시 드롭다운 닫기
            setShowSuggestions(false);
          }}
          placeholder={getUIText('searchPlaceholderCityDistrict', currentLanguage)}
          className="w-full pl-12 pr-10 py-2.5 text-base rounded-lg bg-white border border-[#FED7AA] focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent shadow-lg transition-all"
        />
        {searchValue && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#E63946]"></div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 검색 결과 목록 (임차인 최적화 UI) */}
        {/* 이름/명칭을 크게, 주소는 보조 정보로 표시 */}
        {/* ============================================================ */}
        {searchValue && showSuggestions && suggestions.length > 0 && (
          <div 
            className="suggestions-list absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
            style={{ zIndex: 9999 }}
          >
            {suggestions.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                {getUIText('noResultsFound', currentLanguage)}
              </div>
            ) : (
              suggestions.map((suggestion, index) => {
                const displayText = suggestion.Text || '';
                
                // 이름과 주소 분리 (쉼표 기준)
                const parts = displayText.split(',');
                const rawMainName = parts[0]?.trim() || displayText;
                const rawSubAddress = parts.slice(1).join(',').trim();
                
                // 텍스트 정리 (공통 훅에서 가져온 함수 사용)
                const mainName = cleanDisplayName(rawMainName);
                const subAddress = cleanSubAddress(rawSubAddress);
                
                // 배지 설정 (단순화: 도시/구/명소만)
                let badgeText = '';
                let badgeColor = '';
                let badgeIcon = '';
                
                if (suggestion.isRegion) {
                  // 1순위: 도시 / 2순위: 구
                  if (suggestion.regionType === 'city') {
                    const text = { ko: '도시', vi: 'Thành phố', en: 'City', ja: '都市', zh: '城市' };
                    badgeText = text[currentLanguage] || text.en;
                    badgeColor = 'bg-[#E63946]';
                    badgeIcon = '🏙️';
                  } else {
                    const text = { ko: '구/군', vi: 'Quận', en: 'District', ja: '区/郡', zh: '区/县' };
                    badgeText = text[currentLanguage] || text.en;
                    badgeColor = 'bg-[#FF6B35]';
                    badgeIcon = '📍';
                  }
                } else {
                  // 3순위: 대표 명소
                  const text = { ko: '명소', vi: 'Địa danh', en: 'Landmark', ja: '名所', zh: '景点' };
                  badgeText = text[currentLanguage] || text.en;
                  badgeColor = 'bg-[#FFB627]';
                  badgeIcon = '⭐';
                }
                
                return (
                  <button
                    key={suggestion.PlaceId || index}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSelectSuggestion(suggestion);
                      setShowSuggestions(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      suggestion.isRegion ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 아이콘 (이모지) */}
                      <span className="text-lg flex-shrink-0 mt-0.5">{badgeIcon}</span>
                      
                      <div className="flex-1 min-w-0">
                        {/* 배지 + 메인 이름 */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor} text-white font-medium flex-shrink-0`}>
                            {badgeText}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {mainName}
                          </p>
                        </div>
                        
                        {/* 보조 주소 (흐릿하게 표시) */}
                        {subAddress && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {subAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </form>
  );
}