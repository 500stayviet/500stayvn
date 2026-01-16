'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2, Check } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { searchPlaceIndexForSuggestions, searchPlaceIndexForText, searchPlaceIndexForPosition } from '@/lib/api/aws-location';

interface AddressVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { address: string; lat: number; lng: number }) => void;
  currentLanguage: string;
  initialAddress?: string;
}

export default function AddressVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  currentLanguage,
  initialAddress = '',
}: AddressVerificationModalProps) {
  const [searchText, setSearchText] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [detailedAddress, setDetailedAddress] = useState<{ ward?: string; district?: string; city?: string } | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);


  // 모달 열릴 때 검색창 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 지도 초기화 (주소가 선택된 후에만) - [등록 전용: 정밀 줌 레벨 18]
  useEffect(() => {
    // 주소가 선택되지 않았으면 지도를 초기화하지 않음
    if (!isOpen || !mapContainerRef.current || !selectedAddress || !coordinates) {
      return;
    }

    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-southeast-1';
    const mapName = process.env.NEXT_PUBLIC_AWS_MAP_NAME || 'MyGrabMap';
    const apiKey = process.env.NEXT_PUBLIC_AWS_API_KEY || '';

    if (!apiKey) {
      console.error('AWS API Key is not set');
      return;
    }

    // 이미 지도가 있으면 재초기화하지 않음
    if (mapRef.current) {
      return;
    }

    const styleUrl = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${encodeURIComponent(apiKey)}`;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [coordinates.lng, coordinates.lat],
      zoom: 18, // [등록 전용] 정밀 줌 레벨 18 (건물 형체 명확히 보이는 수준)
    });

    mapRef.current = map;

    // 지도 로드 완료 시
    map.on('load', () => {
      // 지도 드래그로 마커 위치 미세 조정 가능
      const updateCoordinates = () => {
        const center = map.getCenter();
        setCoordinates({ lat: center.lat, lng: center.lng });
      };

      // 지도 이동 시마다 좌표 업데이트 (드래그로 미세 조정 가능)
      map.on('moveend', updateCoordinates);
      map.on('move', updateCoordinates);
      updateCoordinates();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, selectedAddress, coordinates]);


  // 주소 포맷팅 (구글 맵 스타일 2줄 구조)
  const formatAddress = (item: any): { title: string; subtitle: string } => {
    const fullLabel = item.label || item.Label || item.Text || item.text || '';
    const parts = fullLabel.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    
    // 제목: 첫 번째 조각 (번지 + 도로명)
    const title = parts[0] || fullLabel;
    
    // 부제목: 두 번째 조각부터 마지막 전까지 (Vietnam 제외)
    const subtitleParts: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      const lowerPart = part.toLowerCase();
      
      // Vietnam 제외
      if (lowerPart === 'vietnam' && i === parts.length - 1) {
        continue;
      }
      
      // 우편번호 필터링
      if (/^\d{5,6}$/.test(part) && parseInt(part) >= 10000) {
        continue;
      }
      
      // P. 삭제
      let cleanedPart = part.replace(/^(P\.|Phường|Phường\s+)/i, '').trim();
      
      // TP. 추가
      if (/hồ chí minh|ho chi minh/i.test(cleanedPart.toLowerCase()) && !/^TP\./i.test(cleanedPart)) {
        cleanedPart = `TP. ${cleanedPart}`;
      }
      
      // Quận 추가
      if (/^\d{1,2}$/.test(cleanedPart)) {
        cleanedPart = `Quận ${cleanedPart}`;
      }
      
      if (cleanedPart) {
        subtitleParts.push(cleanedPart);
      }
    }
    
    return {
      title: title.trim(),
      subtitle: subtitleParts.join(', '),
    };
  };

  // 주소 검색 (디바운싱)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchText || searchText.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const language = 'vi';
        const results = await searchPlaceIndexForSuggestions(searchText.trim(), language);
        
        // 베트남(VNM) 내 지역만 필터링
        const vietnamOnly = results.filter((item: any) => {
          const country = item.Place?.Country || item.Country || '';
          return country === 'VNM' || country === '';
        });
        
        if (vietnamOnly.length > 0) {
          setSuggestions(vietnamOnly);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText]);

  // 주소 선택 및 지도 이동 (2단계: Reverse Geocoding으로 상세 정보 추출)
  const handleSelectSuggestion = async (suggestion: any) => {
    const text = suggestion.Text || suggestion.text || suggestion.label || '';
    
    setSearchText(text);
    setSelectedAddress(text);
    setShowSuggestions(false);
    setIsValidating(true);

    try {
      const language = 'vi';
      
      // 1단계: 먼저 좌표 얻기
      const results = await searchPlaceIndexForText(text, language);
      let coordinates: { lat: number; lng: number } | null = null;

      if (results.length > 0) {
        const result = results[0];
        const position = result.Place?.Geometry?.Point || [];

        if (position.length >= 2) {
          coordinates = {
            lat: position[1],
            lng: position[0],
          };
          setCoordinates(coordinates);

          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [coordinates.lng, coordinates.lat],
              zoom: 18,
              duration: 1000,
            });
          }
        }
      }

      // 2단계: 좌표 기반 Reverse Geocoding으로 상세 정보 추출
      if (coordinates) {
        try {
          const reverseResults = await searchPlaceIndexForPosition(coordinates.lat, coordinates.lng, language);
          
          // API 응답 전체를 JSON 형태로 출력 (디버깅용)
          console.log('🔍 [Reverse Geocoding] 전체 응답 결과:', JSON.stringify(reverseResults, null, 2));
          
          if (reverseResults.length > 0) {
            const item = reverseResults[0];
            
            // 첫 번째 결과의 전체 구조 출력
            console.log('🔍 [Reverse Geocoding] 첫 번째 결과 전체:', JSON.stringify(item, null, 2));
            
            // Place 객체 전체 출력
            if (item.Place) {
              console.log('🔍 [Reverse Geocoding] Place 객체 전체:', JSON.stringify(item.Place, null, 2));
              
              // Address 키 존재 여부 확인
              console.log('🔍 [Reverse Geocoding] Place.Address 존재 여부:', item.Place.Address !== undefined);
              if (item.Place.Address) {
                console.log('🔍 [Reverse Geocoding] Place.Address 내용:', JSON.stringify(item.Place.Address, null, 2));
              }
              
              // SubDistrict 키 존재 여부 확인
              console.log('🔍 [Reverse Geocoding] Place.SubDistrict 존재 여부:', item.Place.SubDistrict !== undefined);
              if (item.Place.SubDistrict) {
                console.log('🔍 [Reverse Geocoding] Place.SubDistrict 값:', item.Place.SubDistrict);
              }
              
              // Place 객체의 모든 키 목록 출력
              console.log('🔍 [Reverse Geocoding] Place 객체의 모든 키:', Object.keys(item.Place));
            } else {
              console.log('⚠️ [Reverse Geocoding] Place 객체가 없습니다!');
            }
            
            // 베트남(VNM) 지역인지 확인
            const country = item.Place?.Country || item.Country || '';
            if (country && country !== 'VNM') {
              alert(
                currentLanguage === 'ko'
                  ? '베트남 내 지역만 선택할 수 있습니다.'
                  : currentLanguage === 'vi'
                  ? 'Chỉ có thể chọn khu vực trong Việt Nam.'
                  : 'Only areas within Vietnam can be selected.'
              );
              setIsValidating(false);
              return;
            }
            
            const place = item.Place || {};
            const address = place.Address || {};
            
            // 데이터 추출 경로 강제 지정
            let wardName = address.SubDistrict || place.Neighborhood || '';
            let districtName = address.District || place.SubRegion || '';
            let cityName = address.Municipality || '';
            
            // Phường 제거
            if (wardName) {
              wardName = wardName.replace(/^(P\.|Phường|Phường\s+)/i, '').trim();
            }
            
            // District 처리 (Quận 추가)
            if (districtName) {
              const rawDistrict = districtName.trim();
              if (/^\d{1,2}$/.test(rawDistrict)) {
                districtName = `Quận ${rawDistrict}`;
              } else if (!/^Q\.|^Quận/i.test(rawDistrict)) {
                districtName = `Quận ${rawDistrict}`;
              }
            }
            
            // Municipality 처리 (TP. 추가)
            if (cityName) {
              cityName = cityName.trim();
              if (!/^TP\./i.test(cityName)) {
                cityName = `TP. ${cityName}`;
              }
            }
            
            // Fallback: Place.Label 파싱 (필드가 비어있을 때)
            if (!wardName || !districtName || !cityName) {
              const label = place.Label || '';
              if (label) {
                const labelParts = label.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
                
                // 역순으로 매핑
                // 배열[-1]: Vietnam (버림)
                // 배열[-2]: 우편번호 (버림)
                // 배열[-3]: 시
                // 배열[-4]: 구
                // 배열[-5]: 동
                
                if (labelParts.length >= 3 && !cityName) {
                  const cityPart = labelParts[labelParts.length - 1];
                  if (!/vietnam/i.test(cityPart.toLowerCase()) && !/^\d{5,6}$/.test(cityPart)) {
                    cityName = cityPart;
                    if (!/^TP\./i.test(cityName)) {
                      cityName = `TP. ${cityName}`;
                    }
                  }
                }
                
                if (labelParts.length >= 4 && !districtName) {
                  const districtPart = labelParts[labelParts.length - 2];
                  if (!/^\d{5,6}$/.test(districtPart)) {
                    districtName = districtPart;
                    if (/^\d{1,2}$/.test(districtName)) {
                      districtName = `Quận ${districtName}`;
                    } else if (!/^Q\.|^Quận/i.test(districtName)) {
                      districtName = `Quận ${districtName}`;
                    }
                  }
                }
                
                if (labelParts.length >= 5 && !wardName) {
                  const wardPart = labelParts[labelParts.length - 3];
                  wardName = wardPart.replace(/^(P\.|Phường|Phường\s+)/i, '').trim();
                }
              }
            }
            
            // 상세 주소 정보 저장
            setDetailedAddress({
              ward: wardName || undefined,
              district: districtName || undefined,
              city: cityName || undefined,
            });
            
            console.log('✅ 추출된 상세 주소:', { ward: wardName, district: districtName, city: cityName });
          }
        } catch (error) {
          console.error('Reverse Geocoding 실패:', error);
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // 위치 확정
  const handleConfirm = () => {
    if (!coordinates || !selectedAddress) {
      alert(
        currentLanguage === 'ko'
          ? '주소를 선택하고 지도에서 위치를 확인해주세요.'
          : currentLanguage === 'vi'
          ? 'Vui lòng chọn địa chỉ và xác nhận vị trí trên bản đồ.'
          : 'Please select an address and verify the location on the map.'
      );
      return;
    }

    // 상세 주소 정보가 있으면 포함하여 전달
    let finalAddress = selectedAddress;
    if (detailedAddress && (detailedAddress.ward || detailedAddress.district || detailedAddress.city)) {
      const addressParts = [
        selectedAddress.split(',')[0], // 번지 + 도로명
        detailedAddress.ward,
        detailedAddress.district,
        detailedAddress.city,
      ].filter(Boolean);
      finalAddress = addressParts.join(', ');
    }

    onConfirm({
      address: finalAddress,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });
    
    onClose();
  };

  // 모달 닫기 시 초기화 (확정하지 않고 닫을 때만)
  const handleClose = () => {
    // 확정하지 않고 닫으면 초기화하지 않음 (사용자가 다시 열 수 있도록)
    onClose();
  };

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setSearchText(initialAddress || '');
      setSelectedAddress('');
      setDetailedAddress(null);
      setCoordinates(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen, initialAddress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              {currentLanguage === 'ko'
                ? '주소 찾기'
                : currentLanguage === 'vi'
                ? 'Tìm địa chỉ'
                : 'Find Address'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
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
                setSearchText(e.target.value);
              }}
              onFocus={() => {
                // 포커스 시 suggestions가 있으면 표시
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // 리스트 클릭을 위해 약간의 지연
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 200);
              }}
              placeholder={
                currentLanguage === 'ko'
                  ? '주소를 입력하세요 (예: 41 Hoang Sa)'
                  : currentLanguage === 'vi'
                  ? 'Nhập địa chỉ (VD: 41 Hoang Sa)'
                  : 'Enter address (e.g., 41 Hoang Sa)'
              }
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* 자동완성 목록 (구글 맵 스타일) */}
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
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {subtitle || 'TP. Hồ Chí Minh'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 선택된 주소 표시 (구글 맵 스타일) */}
          {selectedAddress && coordinates && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {/* 제목: 번지 + 도로명 */}
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {selectedAddress.split(',')[0]}
                  </p>
                  {/* 부제목: 동, 구, 시 (Reverse Geocoding 결과) */}
                  {detailedAddress && (detailedAddress.ward || detailedAddress.district || detailedAddress.city) && (
                    <p className="text-xs font-medium text-blue-700 mb-1">
                      {[
                        detailedAddress.ward,
                        detailedAddress.district,
                        detailedAddress.city,
                      ].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    {currentLanguage === 'ko' 
                      ? '지도를 드래그하여 마커 위치를 미세 조정한 후 "위치 확정" 버튼을 눌러주세요'
                      : currentLanguage === 'vi'
                      ? 'Kéo bản đồ để điều chỉnh vị trí marker, sau đó nhấn nút "Xác nhận vị trí"'
                      : 'Drag the map to fine-tune the marker position, then click "Confirm Location"'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 지도 영역 (주소 선택 후에만 표시) */}
        {selectedAddress && coordinates ? (
          <div 
            className="flex-1 relative min-h-[300px]"
            style={{ display: 'block' }}
          >
            <div ref={mapContainerRef} className="w-full h-full relative" style={{ display: 'block' }}>
              {/* 중앙 고정 마커 (지도 위에 오버레이) */}
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
                    {currentLanguage === 'ko'
                      ? '위치 확인 중...'
                      : currentLanguage === 'vi'
                      ? 'Đang xác nhận vị trí...'
                      : 'Verifying location...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 relative min-h-[200px] flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl m-4">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {currentLanguage === 'ko'
                  ? '주소를 검색하고 선택해주세요'
                  : currentLanguage === 'vi'
                  ? 'Vui lòng tìm kiếm và chọn địa chỉ'
                  : 'Please search and select an address'}
              </p>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            {currentLanguage === 'ko' ? '취소' : currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!coordinates || !selectedAddress}
            className="px-6 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            {currentLanguage === 'ko' ? '위치 확정' : currentLanguage === 'vi' ? 'Xác nhận vị trí' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
