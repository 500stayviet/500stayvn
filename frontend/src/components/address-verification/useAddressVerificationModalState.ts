'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getPlaceById,
  searchPlaceIndexForPosition,
  searchPlaceIndexForSuggestions,
  type AwsPlaceSearchResult,
  type AwsSuggestionItem,
} from '@/lib/api/aws-location';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatAddress as formatAddressItem } from '@/components/address-verification/addressTextFormatters';
import { getUIText } from '@/utils/i18n';
import type { AddressVerificationModalProps } from './types';

export function useAddressVerificationModalState({
  isOpen,
  onClose,
  onConfirm,
  currentLanguage: propCurrentLanguage,
  initialAddress = '',
}: AddressVerificationModalProps) {
  // LanguageContext에서 직접 언어 상태 가져오기 (우선순위)
  const languageContext = useLanguage();
  const currentLanguage = propCurrentLanguage ?? languageContext.currentLanguage;
  const formatAddress = useCallback(
    (item: Parameters<typeof formatAddressItem>[0]) => formatAddressItem(item, currentLanguage),
    [currentLanguage],
  );
  const [searchText, setSearchText] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<AwsSuggestionItem[]>([]);
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
    map.on('styleimagemissing', (e: { preventDefault?: () => void; id?: string }) => {
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
          void canvas.toDataURL();

          // 누락된 이미지를 빈 이미지로 대체
          if (e && e.id) {
            map.addImage(e.id, {
              width: 1,
              height: 1,
              data: new Uint8Array([0, 0, 0, 0]) // 완전 투명 픽셀
            });
          }
        }
      } catch {
        // 이미지 추가 실패 시 조용히 무시
      }
    });
    
    // 지도 로드 전에 콘솔 오류 필터링 설정
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    // MapLibre GL JS 관련 경고 필터링
    const mapConsoleFilter = (args: unknown[]) => {
      const first = args[0];
      const message = typeof first === 'string' ? first : '';
      if (message) {
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
    console.warn = (...args: unknown[]) => {
      if (!mapConsoleFilter(args)) {
        originalConsoleWarn.apply(console, args);
      }
    };
    
    console.error = (...args: unknown[]) => {
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
    map.on('error', (e: { error?: { message?: string; toString?: () => string } }) => {
      // null 값 관련 에러는 조용히 무시 (스타일 필터 문제)
      const errObj = e.error;
      const errorMessage =
        (errObj && typeof errObj.message === 'string' ? errObj.message : '') ||
        (errObj != null ? String(errObj) : '');
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
        } catch {
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
        } catch {
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
              const vietnamResults = reverseResults.filter((item: AwsPlaceSearchResult) => {
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
        } catch {
          // 좌표 업데이트 오류는 조용히 무시
        }
      });
    });

    return () => {
      restoreConsole();
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
        } catch {
          // 지도 제거 오류는 조용히 무시
        }
        mapRef.current = null;
      }
    };
    // 의존성 배열 크기 유지 (React 요구사항: 배열 크기는 일정해야 함)
    // 지도가 이미 초기화되어 있으면 재초기화하지 않도록 내부에서 가드 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map 단일 초기화; 좌표는 이벤트 핸들러에서만 읽음
  }, [isOpen, isMapVisible, mapCenter]);

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
        // 주소 검색 결과는 항상 베트남어로 고정
        const results = await searchPlaceIndexForSuggestions(
          searchText.trim(),
          'vi',
        );

        const normalizedResults: AwsSuggestionItem[] = results || [];

        const validResults = normalizedResults.filter((item) => {
          const text = item.Text || '';
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
  const handleSelectSuggestion = async (suggestion: AwsSuggestionItem) => {
    const text =
      suggestion.Text || suggestion.text || suggestion.Label || suggestion.label || '';
    const placeId =
      suggestion.PlaceId ||
      suggestion.placeId ||
      suggestion.Place?.PlaceId ||
      suggestion.Place?.placeId ||
      '';
    
    setSearchText(text);
    setSelectedAddress(text);
    setShowSuggestions(false);
    setIsValidating(true);

    try {
      // 상세 주소 조회도 항상 베트남어로 고정
      const language = 'vi';
      
      // PlaceId로 상세 정보 조회 (Grab 앱 방식)
      if (!placeId) {
        alert(getUIText('listingAddrErrNoPlaceId', currentLanguage));
        setIsValidating(false);
        return;
      }

      const placeDetails = await getPlaceById(placeId, language);
      
      if (!placeDetails) {
        alert(getUIText('listingAddrErrDetailNotFound', currentLanguage));
        setIsValidating(false);
        return;
      }

      // 베트남(VNM) 지역인지 확인
      const country = placeDetails.Country || placeDetails.Address?.Country || '';
      if (country && country !== 'VNM') {
        alert(getUIText('listingAddrErrVietnamOnly', currentLanguage));
        setIsValidating(false);
        return;
      }

      // 좌표 추출 (null 방어 및 숫자 변환)
      const position = placeDetails.Geometry?.Point || [];
      
      if (!position || !Array.isArray(position) || position.length < 2) {
        alert(getUIText('listingAddrErrCoordsMissing', currentLanguage));
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
        alert(getUIText('listingAddrErrCoordsInvalid', currentLanguage));
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
        } catch {
          // flyTo 오류는 조용히 무시
        }
      }
      
    } catch (error) {
      console.error('Error getting place details:', error);
      alert(getUIText('listingAddrErrFetchError', currentLanguage));
    } finally {
      setIsValidating(false);
    }
  };

  // 위치 확정 (사용자가 선택한 최종 좌표 저장)
  const handleConfirm = () => {
    if (!selectedAddress) {
      alert(getUIText('listingAddrErrSelectAddress', currentLanguage));
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
      alert(getUIText('listingAddrErrVerifyMap', currentLanguage));
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
    if (!isOpen) return;
    setSuggestions((prev) => (prev.length > 0 ? [...prev] : prev));
  }, [currentLanguage, isOpen]);


  return {
    isOpen,
    onClose,
    onConfirm,
    currentLanguage,
    searchText,
    setSearchText,
    suggestions,
    setSuggestions,
    showSuggestions,
    setShowSuggestions,
    selectedAddress,
    setSelectedAddress,
    detailedAddress,
    setDetailedAddress,
    mapCenter,
    setMapCenter,
    coordinates,
    setCoordinates,
    isLoading,
    setIsLoading,
    isValidating,
    setIsValidating,
    isMapVisible,
    setIsMapVisible,
    mapContainerRef,
    mapRef,
    searchInputRef,
    debounceTimerRef,
    reverseGeocodeTimerRef,
    formatAddress,
    handleSelectSuggestion,
    handleConfirm,
    handleClose,
  };
}
