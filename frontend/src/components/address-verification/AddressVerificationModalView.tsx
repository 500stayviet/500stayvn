'use client';

import { X, MapPin, Loader2, Check } from 'lucide-react';
import type { useAddressVerificationModalState } from './useAddressVerificationModalState';
import { getUIText } from '@/utils/i18n';

type Vm = ReturnType<typeof useAddressVerificationModalState>;

export function AddressVerificationModalView(p: Vm) {
  if (!p.isOpen) return null;
  const {
    currentLanguage,
    handleClose,
    searchInputRef,
    searchText,
    setSearchText,
    selectedAddress,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    suggestions,
    formatAddress,
    handleSelectSuggestion,
    isMapVisible,
    detailedAddress,
    mapContainerRef,
    mapCenter,
    isValidating,
    handleConfirm,
    coordinates,
  } = p;
  return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              {getUIText('listingFindAddrBtn', currentLanguage)}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={getUIText('close', currentLanguage)}
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 검색 영역 */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchText(newValue);
                if (newValue.trim() !== selectedAddress.trim()) {
                  // 검색 로직은 훅에서 처리
                }
              }}
              onFocus={() => {
                if (searchText.trim() !== selectedAddress.trim() && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (searchText.trim() === selectedAddress.trim()) {
                    setShowSuggestions(false);
                  }
                }, 200);
              }}
              placeholder={getUIText('listingAddrSearchPlaceholder', currentLanguage)}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {suggestions.map((suggestion, index) => {
                  const { title, subtitle } = formatAddress(suggestion);
                  return (
                    <button
                      key={suggestion.PlaceId || `suggestion-${index}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 active:bg-blue-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {title}
                          </p>
                          {subtitle && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isMapVisible && selectedAddress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {selectedAddress}
                  </p>
                  {detailedAddress && detailedAddress.subtitle && (
                    <p className="text-xs font-medium text-blue-700 mb-1">
                      {detailedAddress.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    {getUIText('listingAddrMapDragHint', currentLanguage)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isMapVisible ? (
          <div 
            className="relative h-[400px] flex-shrink-0 animate-in fade-in duration-300"
            style={{ display: 'block', height: '400px' }}
          >
            <div 
              key={`map-${mapCenter.lat}-${mapCenter.lng}`}
              ref={mapContainerRef} 
              className="w-full h-full relative" 
              style={{ display: 'block', width: '100%', height: '400px' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
                <div className="w-10 h-10 bg-[#FF6B35] rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-white text-lg">📍</span>
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-[#FF6B35] mx-auto"></div>
              </div>
            </div>
            {isValidating && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-600">
                    {getUIText('listingAddrVerifying', currentLanguage)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative min-h-[200px] flex-shrink-0 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl m-4">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {getUIText('listingAddrEmptyMapHint', currentLanguage)}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0 bg-white sticky bottom-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            {getUIText('cancel', currentLanguage)}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!coordinates || !selectedAddress}
            className="px-6 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            {getUIText('listingAddrConfirmPin', currentLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
}
