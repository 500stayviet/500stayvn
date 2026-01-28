'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2, Check } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { searchPlaceIndexForSuggestions, getPlaceById, searchPlaceIndexForPosition, searchPlaceIndexForText } from '@/lib/api/aws-location';
import { useLanguage } from '@/contexts/LanguageContext';
import { SupportedLanguage } from '@/lib/api/translation';

interface AddressVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { 
    address: string; 
    lat: number; 
    lng: number;
    apartmentName?: string;
    blockNumber?: string;
  }) => void;
  currentLanguage?: SupportedLanguage;
  initialAddress?: string;
}

export default function AddressVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  currentLanguage: propCurrentLanguage,
  initialAddress = '',
}: AddressVerificationModalProps) {
  // LanguageContext에서 직접 언어 상태 가져오기 (우선순위)
  const languageContext = useLanguage();
  const currentLanguage = propCurrentLanguage ?? languageContext.currentLanguage;
  const [searchText, setSearchText] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [detailedAddress, setDetailedAddress] = useState<{ 
    fullAddress?: string; 
    title?: string; 
    subtitle?: string;
    apartmentName?: string;
    blockNumber?: string;
  } | null>(null);
  // 초기 좌표 강제 주입 (null 에러 방지) - 호치민 시청 좌표 (10.776, 106.701)
  const [mapCenter, setMapCenter] = useState({ lat: 10.776, lng: 106.701 });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false); // 지도 표시 여부 (기본값: false)
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reverseGeocodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);


  // 모달 열릴 때 검색창 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 지도 초기화 (초기 좌표 강제 주입으로 null 에러 방지) - Grab 앱 방식
  useEffect(() => {
    // 지도가 표시되지 않으면 초기화하지 않음
    if (!isOpen || !mapContainerRef.current || !isMapVisible) {
      return;
    }

    // 지도가 이미 초기화되어 있으면 재초기화하지 않음 (주소 변경 시 지도 유지)
    if (mapRef.current) {
      return; // 기존 지도 유지 - 재초기화 방지
    }

    // AWS Location Service 스타일 사용 (Grab Maps 스타일)
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-southeast-1';
    const mapName = process.env.NEXT_PUBLIC_AWS_MAP_NAME || 'MyGrabMap';
    const apiKey = process.env.NEXT_PUBLIC_AWS_API_KEY || '';

    if (!apiKey) {
      console.error('AWS API Key is not set');
      return;
    }

    const styleUrl = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${encodeURIComponent(apiKey)}`;

    // 데이터 유효성 검사 (Early Return): 지도 렌더링 전에 위도/경도가 유효한 숫자인지 체크
    // 강제 숫자 형변환 (Casting): 지도의 center에 들어가는 모든 값에 Number() 강제 적용
    const fallbackLat = 10.776;
    const fallbackLng = 106.701;
    
    // coordinates가 있으면 사용하고, 없으면 mapCenter(초기값) 사용
    const initialLat = coordinates ? Number(coordinates.lat) : Number(mapCenter.lat);
    const initialLng = coordinates ? Number(coordinates.lng) : Number(mapCenter.lng);
    
    // 유효성 검사: 값이 완벽하지 않으면 엔진에 아예 전달하지 않음
    if (isNaN(Number(initialLat)) || initialLat === null || initialLat === undefined ||
        isNaN(Number(initialLng)) || initialLng === null || initialLng === undefined) {
      // 유효하지 않은 좌표는 기본값 사용
      const finalSafeLat = Number(fallbackLat) || 10.776;
      const finalSafeLng = Number(fallbackLng) || 106.701;
      
      // 최종 검증: typeof 체크로 확실히 숫자인지 확인
      if (typeof finalSafeLat !== 'number' || typeof finalSafeLng !== 'number' ||
          isNaN(finalSafeLat) || isNaN(finalSafeLng) || !isFinite(finalSafeLat) || !isFinite(finalSafeLng)) {
        console.warn('⚠️ 지도 초기화 실패: 유효하지 않은 좌표');
        return; // 좌표가 완전히 유효하지 않으면 지도 초기화 중단
      }
    }
    
    // 강제 숫자 형변환: lat: Number(currentLat) || 10.791 패턴 적용
    const safeLat = Number(initialLat) || fallbackLat;
    const safeLng = Number(initialLng) || fallbackLng;
    
    // 좌표 유효성 검사 (Number Filter): typeof 체크로 확실히 숫자인지 확인
    // const safeLat = typeof lat === 'number' ? lat : 10.776; 패턴 적용
    const finalSafeLat = typeof safeLat === 'number' ? (isNaN(safeLat) || !isFinite(safeLat) ? fallbackLat : safeLat) : fallbackLat;
    const finalSafeLng = typeof safeLng === 'number' ? (isNaN(safeLng) || !isFinite(safeLng) ? fallbackLng : safeLng) : fallbackLng;
    
    // 최종 유효성 검사: 값이 완벽하지 않으면 엔진에 아예 전달하지 않음
    if (isNaN(Number(finalSafeLat)) || finalSafeLat === null || 
        isNaN(Number(finalSafeLng)) || finalSafeLng === null) {
      console.warn('⚠️ 지도 초기화 실패: 최종 좌표 검증 실패');
      return; // 좌표가 완전히 유효하지 않으면 지도 초기화 중단
    }
    
    // Props 가드: 지도의 center에 값을 넣을 때, Number 타입이 아닐 경우 기본 숫자를 반환
    // center={{ lat: Number(lat) || 10.776, lng: Number(lng) || 106.701 }} 패턴 적용
    const centerLat = Number(finalSafeLat) || fallbackLat;
    const centerLng = Number(finalSafeLng) || fallbackLng;
    
    // 조건부 렌더링 최적화: 위도와 경도가 둘 다 유효한 숫자일 때만 지도 초기화
    const finalCenterLat = (typeof centerLat === 'number' && !isNaN(centerLat) && isFinite(centerLat)) ? centerLat : fallbackLat;
    const finalCenterLng = (typeof centerLng === 'number' && !isNaN(centerLng) && isFinite(centerLng)) ? centerLng : fallbackLng;
    
    // 지도 초기화 (Props 가드 적용)
    // Props 가드: center 값을 넘길 때 Number(lat) || 10.791 처럼 강제로 숫자 보장
    const finalCenterLngForInit = Number(finalCenterLng) || fallbackLng;
    const finalCenterLatForInit = Number(finalCenterLat) || fallbackLat;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [finalCenterLngForInit, finalCenterLatForInit], // Props 가드: Number 타입 보장 (절대 null 불가)
      zoom: 17,
    });

    mapRef.current = map;

    // 전역 오류 핸들러로 지도 타일 로드 시 null 값 에러 무시 (Grab Maps 최적화)
    const originalWindowError = window.onerror;
    const mapErrorHandler = (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) => {
      const errorMessage = typeof message === 'string' ? message : error?.message || '';
      // null 값 관련 에러는 조용히 무시 (지도 타일 로드 시 발생)
      if (errorMessage.includes('Expected value to be of type number') && 
          (errorMessage.includes('null') || errorMessage.includes('but found null'))) {
        return true; // 오류를 처리했음을 표시 (기본 오류 핸들러 실행 방지)
      }
      // 다른 오류는 원래 핸들러로 전달
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error);
      }
      return false;
    };
    
    window.onerror = mapErrorHandler;

    // 아이콘 오류 방어: 누락된 이미지 조용히 처리 (Grab Maps 최적화)
    // Image "building_11" could not be loaded 같은 경고 완전 무시
    // 콘솔 경고를 완전히 차단하는 강력한 처리
    map.on('styleimagemissing', (e: any) => {
      // 이미지 로딩 경고 완전 무시
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault(); // 콘솔 경고 삭제 처리
      }
      // 추가로 콘솔 오류를 완전히 차단하기 위한 처리
      // 빈 이미지로 대체하여 MapLibre GL이 더 이상 요청하지 않도록
      try {
        // 1x1 투명 PNG 이미지 생성
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, 1, 1);
          const imageData = canvas.toDataURL();
          
          // 누락된 이미지를 빈 이미지로 대체
          if (e && e.id) {
            map.addImage(e.id, {
              width: 1,
              height: 1,
              data: new Uint8Array([0, 0, 0, 0]) // 완전 투명 픽셀
            });
          }
        }
      } catch (error) {
        // 이미지 추가 실패 시 조용히 무시
      }
    });
    
    // 지도 로드 전에 콘솔 오류 필터링 설정
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    // MapLibre GL JS 관련 경고 필터링
    const mapConsoleFilter = (args: any[]) => {
      const message = args[0] || '';
      if (typeof message === 'string') {
        // MapLibre GL 이미지 로드 오류 메시지 필터링
        if (message.includes('Image "') && message.includes('" could not be loaded')) {
          return true; // 이 메시지는 표시하지 않음
        }
        if (message.includes('could not be loaded') && message.includes('map.addImage()')) {
          return true; // 이 메시지는 표시하지 않음
        }
      }
      return false;
    };
    
    // 콘솔 오버라이드
    console.warn = (...args: any[]) => {
      if (!mapConsoleFilter(args)) {
        originalConsoleWarn.apply(console, args);
      }
    };
    
    console.error = (...args: any[]) => {
      if (!mapConsoleFilter(args)) {
        originalConsoleError.apply(console, args);
      }
    };
    
    // 컴포넌트 언마운트 시 원래 콘솔 함수 복원
    const restoreConsole = () => {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };

    // 지도 스타일 로드 에러 처리 (null 값 에러 완전 무시)
    map.on('error', (e: any) => {
      // null 값 관련 에러는 조용히 무시 (스타일 필터 문제)
      const errorMessage = e.error?.message || e.error?.toString() || '';
      if (errorMessage.includes('null') || 
          errorMessage.includes('Expected value to be of type number') ||
          errorMessage.includes('Image could not be loaded') ||
          errorMessage.includes('but found null')) {
        // 조용히 처리 (스타일 필터의 null 값 문제 및 아이콘 로드 에러 무시)
        return;
      }
      // 다른 오류만 로그 출력
      console.error('Map error:', e.error);
    });

    // 지도 로드 완료 시 정확한 위치로 이동 (Grab 앱 방식)
    map.on('load', () => {
      // 데이터 유효성 검사 (Early Return): 좌표가 유효한 숫자인지 체크
      const fallbackLat = 10.776;
      const fallbackLng = 106.701;
      
      // null 방어: coordinates가 있으면 사용하고, 없으면 mapCenter 사용
      const currentLat = coordinates ? Number(coordinates.lat) : Number(mapCenter.lat);
      const currentLng = coordinates ? Number(coordinates.lng) : Number(mapCenter.lng);
      
      // 유효성 검사: 값이 완벽하지 않으면 엔진에 아예 전달하지 않음
      if (isNaN(Number(currentLat)) || currentLat === null || currentLat === undefined ||
          isNaN(Number(currentLng)) || currentLng === null || currentLng === undefined) {
        // 유효하지 않은 좌표는 기본값 사용 (Number 강제 적용)
        const finalSafeLat = Number(fallbackLat) || 10.776;
        const finalSafeLng = Number(fallbackLng) || 106.701;
        // Props 가드: center 값을 넘길 때 Number(lat) || 10.791 처럼 강제로 숫자 보장
        map.setCenter([Number(finalSafeLng) || 106.701, Number(finalSafeLat) || 10.776]);
        map.setZoom(17);
        return;
      }
      
      // 강제 숫자 형변환: lat: Number(currentLat) || 10.791 패턴 적용
      const safeLat = Number(currentLat) || fallbackLat;
      const safeLng = Number(currentLng) || fallbackLng;
      
      // 좌표 유효성 검사 (Number Filter): typeof 체크로 확실히 숫자인지 확인
      // const safeLat = typeof lat === 'number' ? lat : 10.776; 패턴 적용
      const finalSafeLat = typeof safeLat === 'number' ? (isNaN(safeLat) || !isFinite(safeLat) ? fallbackLat : safeLat) : fallbackLat;
      const finalSafeLng = typeof safeLng === 'number' ? (isNaN(safeLng) || !isFinite(safeLng) ? fallbackLng : safeLng) : fallbackLng;
      
      // Props 가드: 지도의 center에 값을 넣을 때, Number 타입이 아닐 경우 기본 숫자를 반환
      // center={{ lat: Number(lat) || 10.776, lng: Number(lng) || 106.701 }} 패턴 적용
      const centerLat = Number(finalSafeLat) || fallbackLat;
      const centerLng = Number(finalSafeLng) || fallbackLng;
      
      // 조건부 렌더링 최적화: 위도와 경도가 둘 다 유효한 숫자일 때만 map.setCenter 호출
      if (typeof centerLat === 'number' && typeof centerLng === 'number' && 
          !isNaN(centerLat) && !isNaN(centerLng) && 
          isFinite(centerLat) && isFinite(centerLng) &&
          centerLat !== null && centerLng !== null &&
          centerLat !== undefined && centerLng !== undefined) {
        // 지도가 켜짐과 동시에 좌표로 setCenter 실행 (null 불가 - 강제 형변환)
        // Props 가드: Number 타입 보장된 좌표만 사용
        const finalCenterLngForSet = Number(centerLng) || fallbackLng;
        const finalCenterLatForSet = Number(centerLat) || fallbackLat;
        map.setCenter([finalCenterLngForSet, finalCenterLatForSet]);
        map.setZoom(17);
      }

      // 지도 드래그 시 좌표 즉시 업데이트 및 줌 레벨 유지 (null 방어)
      map.on('move', () => {
        try {
          // 줌 레벨 고정: 건물 모양이 계속 잘 보이도록 17로 깔끔하게 고정
          const currentZoom = map.getZoom();
          if (Math.abs(currentZoom - 17) > 0.01) {
            map.setZoom(17); // 소수점 변경 방지
          }
          
          // 좌표 즉시 업데이트 (강제 형변환으로 null 에러 방지)
          // 좌표 유효성 검사 (Number Filter): typeof 체크로 확실히 숫자인지 확인
          const center = map.getCenter();
          if (center) {
            const rawLat = center.lat;
            const rawLng = center.lng;
            // 타입 체크 강화: typeof lat !== 'number' || typeof lng !== 'number' 체크
            // const safeLat = typeof lat === 'number' ? lat : 10.776; 패턴 적용
            if (typeof rawLat !== 'number' || typeof rawLng !== 'number') {
              return; // 숫자가 아니면 업데이트하지 않음
            }
            // 강제 형변환: Number(lat) || fallbackValue로 null 에러 원천 봉쇄
            const safeLat = typeof rawLat === 'number' ? (isNaN(rawLat) || !isFinite(rawLat) ? fallbackLat : rawLat) : fallbackLat;
            const safeLng = typeof rawLng === 'number' ? (isNaN(rawLng) || !isFinite(rawLng) ? fallbackLng : rawLng) : fallbackLng;
            // 추가 검증: NaN, Infinity, null 체크
            if (typeof safeLat === 'number' && typeof safeLng === 'number' && 
                !isNaN(safeLat) && !isNaN(safeLng) && isFinite(safeLat) && isFinite(safeLng) && 
                safeLat !== null && safeLng !== null && safeLat !== undefined && safeLng !== undefined) {
              setCoordinates({ lat: safeLat, lng: safeLng });
            }
          }
        } catch (error) {
          // 좌표 업데이트 오류는 조용히 무시
        }
      });
      
      // 줌 변경 시에도 17로 고정 (사용자가 줌 아웃 시 또는 미세한 소수점 변경 방지)
      map.on('zoom', () => {
        try {
          const currentZoom = map.getZoom();
          // 줌 레벨을 17로 깔끔하게 고정 (소수점 변경 방지)
          if (Math.abs(currentZoom - 17) > 0.01) {
            map.setZoom(17);
          }
        } catch (error) {
          // 줌 설정 오류는 조용히 무시
        }
      });

      // 지도 이동이 멈췄을 때 좌표 추출 및 Reverse Geocoding 실행 (onCameraIdle 동작)
      map.on('moveend', async () => {
        try {
          // 지도 중심 좌표 추출 (null 에러 방지 강화)
          const center = map.getCenter();
          
          // null 방어: 좌표를 숫자로 변환하고 기본값 적용 (절대 null 불가)
          const fallbackLat = 10.776;
          const fallbackLng = 106.701;
          
          // center가 null이거나 undefined인 경우 fallback 사용
          let lat = fallbackLat;
          let lng = fallbackLng;
          
          if (center) {
            const rawLat = center.lat;
            const rawLng = center.lng;
            
            // Number 변환 및 유효성 검사 (null, undefined, NaN, Infinity 모두 방어)
            const numLat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
            const numLng = typeof rawLng === 'number' ? rawLng : Number(rawLng);
            
            if (!isNaN(numLat) && isFinite(numLat) && numLat !== null && numLat !== undefined) {
              lat = numLat;
            }
            
            if (!isNaN(numLng) && isFinite(numLng) && numLng !== null && numLng !== undefined) {
              lng = numLng;
            }
          }
          
          // 좌표 추출 완료 로그 (디버깅용)
          console.log('🗺️ 지도 이동 완료 - 좌표 추출:', { lat, lng });
          
          // 데이터 유효성 검사 (Early Return): 좌표가 유효한 숫자인지 체크
          // 값이 완벽하지 않으면 엔진에 아예 전달하지 않음
          if (isNaN(Number(lat)) || lat === null || lat === undefined ||
              isNaN(Number(lng)) || lng === null || lng === undefined) {
            console.warn('⚠️ 유효하지 않은 좌표 - Reverse Geocoding 건너뜀:', { lat, lng });
            return;
          }
          
          // null 방어 코드 (강력하게): 좌표가 완벽한 숫자일 때만 실행
          if (!lat || !lng || isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
            console.warn('⚠️ 유효하지 않은 좌표 - Reverse Geocoding 건너뜀:', { lat, lng });
            return;
          }
          
          // 지도 상태 업데이트 최적화: 좌표가 확실히 숫자일 때만 실행
          if (typeof lat !== 'number' || typeof lng !== 'number' || 
              isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
            return; // 좌표가 유효하지 않으면 업데이트하지 않음
          }
          
          // 강제 숫자 형변환: Number()를 사용해서 확실한 숫자 타입임을 보장
          // lat: Number(currentLat) || 10.791 패턴 적용
          const finalLat = Number(lat) || 10.776;
          const finalLng = Number(lng) || 106.701;
          
          // 절대 null이 들어가지 않도록 보장된 좌표만 사용
          setMapCenter({ lat: finalLat, lng: finalLng });
          setCoordinates({ lat: finalLat, lng: finalLng });

          // Reverse Geocoding 즉시 실행 (지도가 멈춘 즉시 좌표로 주소 가져오기)
          // 디바운스 제거하여 즉시 실행
          if (reverseGeocodeTimerRef.current) {
            clearTimeout(reverseGeocodeTimerRef.current);
            reverseGeocodeTimerRef.current = null;
          }

          // 즉시 Reverse Geocoding 실행
          (async () => {
            try {
              // null 방어 강화: API 호출 전 최종 검증
              if (!lat || !lng || isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
                console.warn('⚠️ API 호출 전 좌표 검증 실패:', { lat, lng });
                return;
              }
              
              const language = 'vi';
              console.log('📍 Reverse Geocoding 시작:', { lat, lng });
              
              // null 방어된 좌표로 API 호출
              const reverseResults = await searchPlaceIndexForPosition(lat, lng, language);
              
              // 베트남(VNM) 내 지역만 필터링
              const vietnamResults = reverseResults.filter((item: any) => {
                const country = item.Place?.Country || item.Place?.Address?.Country || item.Country || '';
                return country === 'VNM';
              });
              
              if (vietnamResults.length > 0) {
                const result = vietnamResults[0];
                const label = result.Place?.Label || result.Label || '';
                
                if (label) {
                  // 텍스트 가공 (부동산 전용): 첫 번째 콤마(,) 기준으로 상호명 제거
                  // 무조건 첫 번째 콤마(,) 기준으로 잘라서 도로명 주소부터 표시
                  // 예: "상호명, 1A 1B Nguyễn Đình Chiểu..." → "1A 1B Nguyễn Đình Chiểu..."
                  const firstCommaIndex = label.indexOf(',');
                  let processedAddress = label;
                  
                  // 첫 번째 콤마가 있고, 콤마 앞 부분이 상호명일 가능성이 있는 경우
                  if (firstCommaIndex > 0 && firstCommaIndex < label.length - 1) {
                    const beforeComma = label.substring(0, firstCommaIndex).trim();
                    const afterComma = label.substring(firstCommaIndex + 1).trim();
                    
                    // 콤마 앞 부분이 상호명인지 판단 (길이, 하이픈, 키워드 등)
                    const isBusinessName = (
                      beforeComma.length < 30 && // 길이가 짧음
                      (!/^\d/.test(beforeComma)) && // 숫자로 시작하지 않음
                      (beforeComma.includes('-') || beforeComma.includes('–') || beforeComma.includes('—') ||
                       /^(Cửa hàng|Cafe|Coffee|Nhà hàng|Quán|Shop|Store|Restaurant|Văn phòng|Office|Phòng|Bảo hiểm|Ngân hàng|Bank|Hotel|Vhernier)/i.test(beforeComma) ||
                       /\b(Coffee|Cafe|Shop|Store|Restaurant|Hotel|Rex)\b/i.test(beforeComma))
                    );
                    
                    // 상호명이면 콤마 뒤 부분만 사용 (도로명 주소부터)
                    if (isBusinessName) {
                      processedAddress = afterComma; // 도로명 주소만 표시
                    }
                  }
                  
                  // 추가 가공: 순수 주소로 가공 (상호명 제외, 도로명/번지수만) - 부동산 앱 최적화
                  const addressParts = processedAddress.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
                  
                  // 첫 번째 부분 검증: 숫자로 시작하지 않거나 너무 길면 상호명으로 간주하고 삭제
                  const firstPart = addressParts[0] || '';
                  const startsWithNumber = /^\d/.test(firstPart); // 숫자로 시작하는지 확인
                  const isTooLong = firstPart.length > 30; // 너무 긴 경우 (상호명일 가능성)
                  const hasHyphen = firstPart.includes('-') || firstPart.includes('–') || firstPart.includes('—');
                  
                  // 상호명 판단: 첫 번째 항목이 숫자로 시작하지 않거나 너무 길면 상호명으로 간주
                  const stillIsBusinessName = addressParts.length > 2 && (
                    !startsWithNumber || // 숫자로 시작하지 않으면 상호명
                    isTooLong || // 너무 길면 상호명
                    hasHyphen || // 하이픈 포함은 상호명 (예: "Vhernier - Rex Hotel")
                    /^(Cửa hàng|Cafe|Coffee|Nhà hàng|Quán|Shop|Store|Restaurant|Văn phòng|Office|Phòng|Bảo hiểm|Ngân hàng|Bank|Gù|Gù Coffee|Hotel|Vhernier)/i.test(firstPart) ||
                    /\b(Coffee|Cafe|Shop|Store|Restaurant|Hotel|Rex)\b/i.test(firstPart)
                  );
                  
                  // 순수 주소만 추출 (상호명 제외, 도로명과 번지수만)
                  // 첫 번째 항목이 숫자로 시작하지 않거나 너무 길면 삭제
                  const pureAddressParts = stillIsBusinessName ? addressParts.slice(1) : addressParts;
                  const pureAddress = pureAddressParts.join(', ');
                  
                  // 렌더링 방어막: 주소 텍스트 업데이트와 지도 좌표 업데이트 분리
                  // 역지오코딩 결과(주소 문자열)가 업데이트될 때, 지도 엔진이 잠시 좌표를 놓치지 않도록
                  // 주소 상태 업데이트 (실시간 반영) - Address Input에 즉시 반영
                  // 중요: 좌표는 건드리지 않고 주소만 업데이트 (prev => ({...prev, address: newAddr}))
                  console.log('📍 Reverse Geocoding 결과:', pureAddress);
                  
                  // 주소 텍스트만 업데이트 (좌표는 건드리지 않음 - 지도 엔진이 좌표를 놓치지 않도록)
                  setSearchText(pureAddress);
                  setSelectedAddress(pureAddress);
                  
                  // 좌표는 업데이트하지 않음 (기존 좌표 유지 - 지도가 죽지 않도록)
                  
                  // 상세 주소 정보 저장
                  // 상태 업데이트 일관성: 기존 좌표 상태값이 유실되지 않도록 함수형 업데이트 사용
                  const title = pureAddressParts[0] || pureAddress;
                  const subtitle = pureAddressParts.slice(1).join(', ');
                  
                  // 함수형 업데이트: prev => ({...prev, address: newAddr}) 패턴
                  setDetailedAddress((prev) => ({
                    ...prev, // 기존 상태 유지 (좌표 정보 등)
                    fullAddress: pureAddress,
                    title: title,
                    subtitle: subtitle,
                  }));
                }
              }
            } catch (error) {
              console.error('Error reverse geocoding:', error);
            }
          })(); // 즉시 실행 (디바운스 제거)
        } catch (error) {
          // 좌표 업데이트 오류는 조용히 무시
        }
      });
    });

    return () => {
      // 전역 오류 핸들러 복원
      window.onerror = originalWindowError;
      
      // Reverse Geocoding 타이머 정리
      if (reverseGeocodeTimerRef.current) {
        clearTimeout(reverseGeocodeTimerRef.current);
        reverseGeocodeTimerRef.current = null;
      }
      
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          // 지도 제거 오류는 조용히 무시
        }
        mapRef.current = null;
      }
    };
    // 의존성 배열 크기 유지 (React 요구사항: 배열 크기는 일정해야 함)
    // 지도가 이미 초기화되어 있으면 재초기화하지 않도록 내부에서 가드 처리
  }, [isOpen, isMapVisible, mapCenter]);


  // 건물 수식어 다국어 변환 함수 (부수적 키워드만 현지화, 고유 명사는 원문 유지)
  const translateBuildingTerms = (text: string, language: SupportedLanguage): string => {
    if (language === 'vi') {
      // 베트남어는 원문 그대로
      return text;
    }
    
    // Tòa [명칭] 패턴 변환: 순서 조정
    // 예: "Tòa Park 2" → 한국어: "Park 2동", 영어: "Park 2 Building"
    // 고유 명사(Park 2, Landmark 4)는 원문 그대로 유지
    const toaPattern = /^Tòa\s+(.+)$/i;
    const toaMatch = text.match(toaPattern);
    if (toaMatch) {
      const name = toaMatch[1]; // 고유 명사(예: Park 2, Landmark 4)는 원문 그대로
      if (language === 'ko') {
        return `${name}동`; // Park 2동
      } else if (language === 'en') {
        return `${name} Building`; // Park 2 Building
      } else if (language === 'ja') {
        return `${name}棟`;
      } else if (language === 'zh') {
        return `${name}栋`;
      }
    }
    
    // Tòa nhà [명칭] 패턴 변환
    const toaNhaPattern = /^Tòa nhà\s+(.+)$/i;
    const toaNhaMatch = text.match(toaNhaPattern);
    if (toaNhaMatch) {
      const name = toaNhaMatch[1];
      if (language === 'ko') {
        return `${name}동`;
      } else if (language === 'en') {
        return `${name} Building`;
      } else if (language === 'ja') {
        return `${name}棟`;
      } else if (language === 'zh') {
        return `${name}栋`;
      }
    }
    
    // Khu [명칭] 패턴 변환
    const khuPattern = /^Khu\s+(.+)$/i;
    const khuMatch = text.match(khuPattern);
    if (khuMatch) {
      const name = khuMatch[1]; // 고유 명사는 원문 그대로
      if (language === 'ko') {
        return `${name}단지`;
      } else if (language === 'en') {
        return `${name} Zone`;
      } else if (language === 'ja') {
        return `${name}地区`;
      } else if (language === 'zh') {
        return `${name}社区`;
      }
    }
    
    // Sảnh [명칭] 패턴 변환
    const sanhPattern = /^Sảnh\s+(.+)$/i;
    const sanhMatch = text.match(sanhPattern);
    if (sanhMatch) {
      const name = sanhMatch[1];
      if (language === 'ko') {
        return `${name}로비/홀`;
      } else if (language === 'en') {
        return `${name} Lobby`;
      } else if (language === 'ja') {
        return `${name}ロビー`;
      } else if (language === 'zh') {
        return `${name}大厅`;
      }
    }
    
    // Căn hộ [명칭] 패턴 변환
    const canhoPattern = /^Căn hộ\s+(.+)$/i;
    const canhoMatch = text.match(canhoPattern);
    if (canhoMatch) {
      const name = canhoMatch[1];
      if (language === 'ko') {
        return `${name}호`;
      } else if (language === 'en') {
        return `${name} Apt`;
      } else if (language === 'ja') {
        return `${name}号室`;
      } else if (language === 'zh') {
        return `${name}单元`;
      }
    }
    
    // 원문 그대로 반환 (변환 패턴이 없으면, 고유 명사는 그대로 유지)
    return text;
  };

  // 주소 포맷팅 (부동산 전문 처리: 단지명 - 동 정보 형식)
  const formatAddress = (item: any): { title: string; subtitle: string } => {
    // item.Text를 우선 사용, 없으면 item.text나 item.label 사용
    const fullLabel = item.Text || item.text || item.Label || item.label || '';
    
    if (!fullLabel) {
      return {
        title: '',
        subtitle: '',
      };
    }
    
    // 하이픈(-) 기준으로 분리
    if (fullLabel.includes(' - ')) {
      const parts = fullLabel.split(' - ').map((p: string) => p.trim());
      
      // 제목: [단지명] - [가공된 동 정보] (명칭만)
      // 예: "Vinhomes Central Park - Tòa Park 2, Nguyễn Hữu Cảnh..." 
      // → 제목: "Vinhomes Central Park - Park 2동"
      // → 부제목: "Nguyễn Hữu Cảnh, P.Thạnh Mỹ Tây, TP.Hồ Chí Minh"
      if (parts.length >= 2) {
        const complexName = parts[0]; // 단지명 (고유 명사, 원문 그대로)
        const secondPart = parts[1]; // 동 정보 + 주소가 섞여 있을 수 있음
        
        // 두 번째 부분을 쉼표로 나누어서 동 정보와 주소 분리
        const secondPartCommas = secondPart.split(',').map((p: string) => p.trim());
        
        // 첫 번째 쉼표 앞부분이 동 정보인지 확인 (Tòa, Park, Landmark 등)
        const firstCommaPart = secondPartCommas[0];
        const isBuildingInfo = /^(Tòa|Park|Landmark|Central|Aqua|Sảnh|Block)/i.test(firstCommaPart);
        
        let title = '';
        let subtitle = '';
        
        if (isBuildingInfo) {
          // 첫 번째 쉼표 앞부분이 동 정보
          let buildingInfo = firstCommaPart;
          buildingInfo = translateBuildingTerms(buildingInfo, currentLanguage);
          
          // 제목: [단지명] - [가공된 동 정보] (명칭만)
          title = `${complexName} - ${buildingInfo}`;
          
          // 부제목: 나머지 주소 정보 (도로명, 행정 구역)
          subtitle = secondPartCommas.slice(1).join(', ');
          
          // 하이픈 뒤에 더 많은 부분이 있으면 부제목에 추가
          if (parts.length > 2) {
            subtitle = subtitle ? `${subtitle}, ${parts.slice(2).join(', ')}` : parts.slice(2).join(', ');
          }
        } else {
          // 첫 번째 쉼표 앞부분이 주소인 경우
          // 제목: [단지명]만
          title = complexName;
          
          // 부제목: 두 번째 부분 전체 (주소)
          subtitle = secondPart;
          
          // 하이픈 뒤에 더 많은 부분이 있으면 부제목에 추가
          if (parts.length > 2) {
            subtitle = `${subtitle}, ${parts.slice(2).join(', ')}`;
          }
        }
        
        return {
          title: title.trim(),
          subtitle: subtitle.trim(),
        };
      }
    }
    
    // 하이픈이 없으면 쉼표 기준으로 분리
    const parts = fullLabel.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    
    if (parts.length === 0) {
      return {
        title: fullLabel,
        subtitle: '',
      };
    }
    
    // 첫 번째 부분이 명칭(단지명, 동 정보)인지 주소인지 확인
    const firstPart = parts[0];
    const isBuildingInfo = /^(Tòa|Park|Landmark|Central|Aqua|Sảnh|Block|Vinhomes)/i.test(firstPart) ||
                          /[A-Z][a-z]+\s+[A-Z]/.test(firstPart); // 대문자로 시작하는 단어들 (단지명)
    
    let title = '';
    let subtitle = '';
    
    if (isBuildingInfo) {
      // 첫 번째 부분이 명칭이면 제목으로 (다국어 변환 적용)
      title = translateBuildingTerms(firstPart, currentLanguage);
      
      // 부제목: 나머지 주소 정보 (도로명, 행정 구역)
      subtitle = parts.slice(1).join(', ');
    } else {
      // 첫 번째 부분이 주소(번지수로 시작)면 제목으로
      title = firstPart;
      
      // 부제목: 나머지 주소 정보
      subtitle = parts.slice(1).join(', ');
    }
    
    return {
      title: title.trim(),
      subtitle: subtitle.trim(),
    };
  };

  // 주소 검색 (디바운싱) - 새 주소 입력 시 suggestions 표시
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

    // 새 주소를 입력하면 suggestions 표시 (선택된 주소와 다를 때)
    const isNewAddress = !selectedAddress || searchText.trim() !== selectedAddress.trim();
    
    if (!isNewAddress) {
      // 선택된 주소와 같으면 suggestions 숨김
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const language = 'vi';
        const results = await searchPlaceIndexForSuggestions(searchText.trim(), language);
        
        // Grab 데이터 그대로 사용 (좌표 null 체크 제거, 필터링 제거)
        // Text가 있으면 무조건 리스트에 표시
        const validResults = results.filter((item: any) => {
          const text = item.Text || item.text || item.Label || item.label || '';
          return text && text.trim().length > 0;
        });
        
        if (validResults.length > 0) {
          setSuggestions(validResults);
          setShowSuggestions(true); // 새 주소 입력 시 suggestions 표시
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
  }, [searchText, selectedAddress]);

  // 주소 선택 및 지도 이동 (PlaceId 기반 - Grab 앱 방식)
  const handleSelectSuggestion = async (suggestion: any) => {
    const text = suggestion.Text || suggestion.text || suggestion.label || '';
    const placeId = suggestion.PlaceId || '';
    
    setSearchText(text);
    setSelectedAddress(text);
    setShowSuggestions(false);
    setIsValidating(true);

    try {
      const language = 'vi';
      
      // PlaceId로 상세 정보 조회 (Grab 앱 방식)
      if (!placeId) {
        alert(
          currentLanguage === 'ko'
            ? '주소 정보를 가져올 수 없습니다.'
            : currentLanguage === 'vi'
            ? 'Không thể lấy thông tin địa chỉ.'
            : 'Cannot fetch address information.'
        );
        setIsValidating(false);
        return;
      }

      const placeDetails = await getPlaceById(placeId, language);
      
      if (!placeDetails) {
        alert(
          currentLanguage === 'ko'
            ? '주소 상세 정보를 찾을 수 없습니다.'
            : currentLanguage === 'vi'
            ? 'Không tìm thấy thông tin chi tiết địa chỉ.'
            : 'Address details not found.'
        );
        setIsValidating(false);
        return;
      }

      // 베트남(VNM) 지역인지 확인
      const country = placeDetails.Country || placeDetails.Address?.Country || '';
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

      // 좌표 추출 (null 방어 및 숫자 변환)
      const position = placeDetails.Geometry?.Point || [];
      
      if (!position || !Array.isArray(position) || position.length < 2) {
        alert(
          currentLanguage === 'ko'
            ? '좌표 정보를 찾을 수 없습니다.'
            : currentLanguage === 'vi'
            ? 'Không tìm thấy thông tin tọa độ.'
            : 'Coordinates not found.'
        );
        setIsValidating(false);
        return;
      }

      // null 방어 및 숫자 변환: 기본값은 호치민 시청 (10.776, 106.701)
      const fallbackLat = 10.776;
      const fallbackLng = 106.701;
      
      const rawLat = position[1];
      const rawLng = position[0];
      
      const lat = Number(rawLat) || fallbackLat;
      const lng = Number(rawLng) || fallbackLng;
      
      // 유효성 검사: 숫자이고 유한한 값인지 확인
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        alert(
          currentLanguage === 'ko'
            ? '유효하지 않은 좌표입니다.'
            : currentLanguage === 'vi'
            ? 'Tọa độ không hợp lệ.'
            : 'Invalid coordinates.'
        );
        setIsValidating(false);
        return;
      }

      // 상세 주소 정보 저장
      const label = placeDetails.Label || text;
      const labelParts = label.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
      const title = labelParts[0] || label;
      const subtitle = labelParts.slice(1).join(', ');
      
      setDetailedAddress({
        fullAddress: label,
        title: title,
        subtitle: subtitle,
      });

      // 좌표 확인 후 지도 표시 및 이동 (Grab 앱 방식)
      // mapCenter 업데이트 (초기 좌표 강제 주입)
      setMapCenter({ lat, lng });
      setCoordinates({ lat, lng });
      setIsMapVisible(true); // 좌표를 받은 후에만 지도 표시
      
      // 지도가 이미 초기화되어 있으면 flyTo로 이동 (Grab 앱 방식)
      if (mapRef.current) {
        try {
          const fallbackLat = 10.776;
          const fallbackLng = 106.701;
          const safeLat = Number(lat) || fallbackLat;
          const safeLng = Number(lng) || fallbackLng;
          
          // flyTo로 부드럽게 이동 (Grab 앱 방식 - 강제 형변환으로 null 에러 방지)
          // Props 가드: center 값을 넘길 때 Number(lat) || 10.791 처럼 강제로 숫자 보장
          const finalSafeLng = Number(safeLng) || fallbackLng;
          const finalSafeLat = Number(safeLat) || fallbackLat;
          mapRef.current.flyTo({
            center: [Number(finalSafeLng) || fallbackLng, Number(finalSafeLat) || fallbackLat], // Number 캐스팅으로 null 에러 원천 봉쇄
            zoom: 17,
            duration: 1000, // 1초 동안 부드럽게 이동
          });
        } catch (error) {
          // flyTo 오류는 조용히 무시
        }
      }
      
    } catch (error) {
      console.error('Error getting place details:', error);
      alert(
        currentLanguage === 'ko'
          ? '주소 정보를 가져오는 중 오류가 발생했습니다.'
          : currentLanguage === 'vi'
          ? 'Đã xảy ra lỗi khi lấy thông tin địa chỉ.'
          : 'An error occurred while fetching address information.'
      );
    } finally {
      setIsValidating(false);
    }
  };

  // 위치 확정 (사용자가 선택한 최종 좌표 저장)
  const handleConfirm = () => {
    if (!selectedAddress) {
      alert(
        currentLanguage === 'ko'
          ? '주소를 선택해주세요.'
          : currentLanguage === 'vi'
          ? 'Vui lòng chọn địa chỉ.'
          : 'Please select an address.'
      );
      return;
    }

    // 사용자가 드래그하여 선택한 최종 좌표 또는 지도 중심 좌표 사용 (null 에러 방지)
    const fallbackLat = 10.776;
    const fallbackLng = 106.701;
    
    let finalCoordinates = coordinates || mapCenter; // mapCenter가 항상 값이 있으므로 null 불가
    
    // 지도에서 직접 좌표를 가져올 수 있는 경우 우선 사용 (null 방어 강화)
    if (mapRef.current) {
      try {
        const center = mapRef.current.getCenter();
        if (center) {
          const rawLat = center.lat;
          const rawLng = center.lng;
          
          // Number 변환 및 유효성 검사 (null, undefined, NaN, Infinity 모두 방어)
          const numLat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
          const numLng = typeof rawLng === 'number' ? rawLng : Number(rawLng);
          
          if (!isNaN(numLat) && isFinite(numLat) && numLat !== null && numLat !== undefined &&
              !isNaN(numLng) && isFinite(numLng) && numLng !== null && numLng !== undefined) {
            finalCoordinates = { lat: numLat, lng: numLng };
          }
        }
      } catch (error) {
        console.error('Error getting map center:', error);
      }
    }
    
    // 최종 좌표 null 방어 (mapCenter가 항상 값이 있으므로 실제로는 실행되지 않을 수 있음)
    if (!finalCoordinates) {
      finalCoordinates = { lat: fallbackLat, lng: fallbackLng };
    }
    
    // 좌표 유효성 최종 검사 및 null 방어 (절대 null이 DB에 저장되지 않도록)
    const safeLat = Number(finalCoordinates.lat) || fallbackLat;
    const safeLng = Number(finalCoordinates.lng) || fallbackLng;
    
    if (isNaN(safeLat) || isNaN(safeLng) || !isFinite(safeLat) || !isFinite(safeLng)) {
      alert(
        currentLanguage === 'ko'
          ? '지도에서 위치를 확인해주세요.'
          : currentLanguage === 'vi'
          ? 'Vui lòng xác nhận vị trí trên bản đồ.'
          : 'Please verify the location on the map.'
      );
      return;
    }
    
    // 최종 좌표는 항상 유효한 숫자임을 보장
    finalCoordinates = { lat: safeLat, lng: safeLng };

    // Grab Maps가 제공하는 전체 주소 문자열 그대로 사용
    let finalAddress = selectedAddress;
    if (detailedAddress && detailedAddress.fullAddress) {
      finalAddress = detailedAddress.fullAddress;
    }

    // 사용자가 선택한 최종 좌표만 저장
    onConfirm({
      address: finalAddress,
      lat: finalCoordinates.lat,
      lng: finalCoordinates.lng,
      apartmentName: detailedAddress?.apartmentName,
      blockNumber: detailedAddress?.blockNumber,
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
      setIsMapVisible(false); // 모달이 열릴 때 지도 숨김
    }
  }, [isOpen, initialAddress]);

  // 언어 변경 시 suggestions 재포맷팅 (제목/부제목이 언어에 따라 변경되도록)
  useEffect(() => {
    // suggestions가 있고 모달이 열려있으면 재포맷팅을 위해 강제 리렌더링
    // formatAddress는 렌더링 시 호출되므로 자동으로 최신 currentLanguage 사용
    if (isOpen && suggestions.length > 0) {
      // suggestions 상태를 업데이트하여 재렌더링 트리거
      // 실제 데이터는 그대로 두고, 포맷팅만 다시 적용되도록 함
      setSuggestions([...suggestions]);
    }
  }, [currentLanguage, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-y-auto">
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
                const newValue = e.target.value;
                setSearchText(newValue);
                // 새 주소를 입력하면 suggestions 다시 표시
                if (newValue.trim() !== selectedAddress.trim()) {
                  // 주소가 변경되면 suggestions 표시 (검색 로직이 자동으로 처리)
                }
              }}
              onFocus={() => {
                // 포커스 시 새 주소를 입력 중이면 suggestions 표시
                if (searchText.trim() !== selectedAddress.trim() && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // 리스트 클릭을 위해 약간의 지연
                setTimeout(() => {
                  // 선택된 주소와 같으면 suggestions 숨김
                  if (searchText.trim() === selectedAddress.trim()) {
                    setShowSuggestions(false);
                  }
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

          {/* 선택된 주소 표시 (지도가 표시되면 표시) - 실시간 업데이트 */}
          {isMapVisible && selectedAddress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {/* 전체 주소 표시 (드래그 시 실시간 업데이트) */}
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {selectedAddress}
                  </p>
                  {/* 상세 주소 정보 (subtitle) */}
                  {detailedAddress && detailedAddress.subtitle && (
                    <p className="text-xs font-medium text-blue-700 mb-1">
                      {detailedAddress.subtitle}
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

        {/* 지도 영역 (지도가 표시되어야 할 때만 표시) */}
        {/* 리렌더링 방지: key를 좌표 기반으로 변경하여 주소 변경 시 지도가 unmount되지 않도록 */}
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
          <div className="relative min-h-[200px] flex-shrink-0 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl m-4">
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
        <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0 bg-white sticky bottom-0">
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
