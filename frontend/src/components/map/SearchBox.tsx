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
          onFocus={() => setShowSuggestions(false)}
          placeholder={getUIText('searchPlaceholderCityDistrict', currentLanguage)}
          className="w-full pl-12 pr-10 py-2.5 text-base rounded-lg bg-white border border-[#FED7AA] focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent shadow-lg transition-all"
        />
        {searchValue && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label={getUIText('searchClearInputAria', currentLanguage)}
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

        {searchValue && showSuggestions && suggestions.length > 0 && (
          <div 
            className="suggestions-list absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
            style={{ zIndex: 9999 }}
          >
            {suggestions.map((suggestion, index) => {
              const displayText = suggestion.Text || '';
              const parts = displayText.split(',');
              const rawMainName = parts[0]?.trim() || displayText;
              const rawSubAddress = parts.slice(1).join(',').trim();
              const mainName = cleanDisplayName(rawMainName);
              const subAddress = cleanSubAddress(rawSubAddress);

              let badgeText = '';
              let badgeColor = '';
              let badgeIcon = '';

              if (suggestion.isRegion) {
                if (suggestion.regionType === 'city') {
                  badgeText = getUIText('locationBadgeCity', currentLanguage);
                  badgeColor = 'bg-[#E63946]';
                  badgeIcon = '🏙️';
                } else {
                  badgeText = getUIText('locationBadgeDistrict', currentLanguage);
                  badgeColor = 'bg-[#FF6B35]';
                  badgeIcon = '📍';
                }
              } else {
                badgeText = getUIText('locationBadgeLandmark', currentLanguage);
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
                    <span className="text-lg flex-shrink-0 mt-0.5">{badgeIcon}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${badgeColor} text-white font-medium flex-shrink-0`}
                        >
                          {badgeText}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 truncate">{mainName}</p>
                      </div>

                      {subAddress && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{subAddress}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </form>
  );
}