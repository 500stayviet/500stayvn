'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';
import { getAvailableProperties, subscribeToProperties, getProperty } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchRegions, regionToSuggestion, getDistrictIdForCoord } from '@/lib/data/vietnam-regions';
import { searchLandmarksScored, landmarkToSuggestion, ALL_LANDMARKS } from '@/lib/data/vietnam-landmarks';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PropertyModal from '@/components/map/PropertyModal';
import SearchBox from '@/components/map/SearchBox';
import { Suggestion } from '@/types/map';
import { 
  formatPrice, 
} from '@/lib/utils/propertyUtils';
import { getUIText } from '@/utils/i18n';

interface Property {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  image?: string;
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
}

// 호치민 초기 좌표 상수 (지도는 항상 이 값으로 시작, 절대 null 전달 금지)
const HO_CHI_MINH_CENTER = {
  lat: 10.776,
  lng: 106.701,
} as const;

// 베트남 경계 확인 (대략적인 범위)
const isInVietnam = (lat: number, lng: number): boolean => {
  // 베트남 대략적인 경계: 위도 8.5~23.5, 경도 102~110
  return lat >= 8.5 && lat <= 23.5 && lng >= 102 && lng <= 110;
};

interface GrabMapComponentProps {
  onPropertiesChange?: (properties: Property[]) => void;
  onPropertySelect?: (index: number) => void;
  selectedProperty?: Property | null;
  onPropertyPriorityChange?: (property: Property) => void;
  initialLocation?: { lat: number; lng: number } | null; // 초기 위치 (URL 파라미터에서 전달)
  locationDenied?: boolean; // 위치 권한 거부 여부
  locationLoading?: boolean; // 위치 로딩 중 여부
}

export default function GrabMapComponent({ 
  onPropertiesChange,
  onPropertySelect,
  selectedProperty,
  onPropertyPriorityChange,
  initialLocation,
  locationDenied = false,
  locationLoading = false,
}: GrabMapComponentProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const propertyMarkersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const allPropertiesRef = useRef<Property[]>([]); // ref로 최신 값 유지 (무한 루프 방지)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardSliderRef = useRef<HTMLDivElement>(null);
  const mapMoveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchValueRef = useRef<string>(''); // 마지막 검색어 저장 (언어 변경 시 재검색용)
  const onPropertyPriorityChangeRef = useRef(onPropertyPriorityChange);
  const updateVisiblePropertiesRef = useRef<(() => void) | undefined>(undefined);
  const hasRequestedLocationRef = useRef(false); // 위치 요청 여부 추적
  const isInitializingRef = useRef(false); // 지도 초기화 진행 중 여부 추적 (싱글톤 패턴)
  const [showLocationConsentModal, setShowLocationConsentModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedPropertyData, setSelectedPropertyData] = useState<PropertyData | null>(null);
  /** 명소/구 선택 시 해당 구 매물만 필터 (districtId) */
  const [selectedDistrictIdFilter, setSelectedDistrictIdFilter] = useState<string | null>(null);
  const landmarkMarkersRef = useRef<maplibregl.Marker[]>([]);

  const { currentLanguage } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  
  // allProperties 변경 시 ref도 업데이트
  useEffect(() => {
    allPropertiesRef.current = allProperties;
  }, [allProperties]);
  
  // 콜백 ref 업데이트
  useEffect(() => {
    onPropertyPriorityChangeRef.current = onPropertyPriorityChange;
  }, [onPropertyPriorityChange]);

  // 언어 변경 시 현재 보이는 매물 마커 다시 그리기 (팝업 번역 업데이트)
  useEffect(() => {
    if (updateVisiblePropertiesRef.current) {
      updateVisiblePropertiesRef.current();
    }
    
    // 검색 중이라면 검색 결과도 다시 번역
    if (searchValue.trim()) {
      handleSearchChange(searchValue);
    }
  }, [currentLanguage]);

  // 매물 클릭 시 모달 열기
  const handlePropertyClick = async (propertyId: string) => {
    try {
      const propertyData = await getProperty(propertyId);
      if (propertyData) {
        setSelectedPropertyData(propertyData);
        setShowPropertyModal(true);
      }
    } catch (error) {
      console.error('매물 데이터 로드 실패:', error);
    }
  };

  // 이전 매물로 이동 (지도 내 표시된 매물 기준)
  const handlePrevPropertyInModal = async () => {
    if (!selectedPropertyData || nearbyProperties.length <= 1) return;
    const currentIndex = nearbyProperties.findIndex(p => p.id === selectedPropertyData.id);
    const prevIndex = currentIndex <= 0 ? nearbyProperties.length - 1 : currentIndex - 1;
    const prevProperty = nearbyProperties[prevIndex];
    if (prevProperty) {
      try {
        const propertyData = await getProperty(prevProperty.id);
        if (propertyData) {
          setSelectedPropertyData(propertyData);
        }
      } catch (error) {
        console.error('매물 데이터 로드 실패:', error);
      }
    }
  };

  // 다음 매물로 이동 (지도 내 표시된 매물 기준)
  const handleNextPropertyInModal = async () => {
    if (!selectedPropertyData || nearbyProperties.length <= 1) return;
    const currentIndex = nearbyProperties.findIndex(p => p.id === selectedPropertyData.id);
    const nextIndex = currentIndex >= nearbyProperties.length - 1 ? 0 : currentIndex + 1;
    const nextProperty = nearbyProperties[nextIndex];
    if (nextProperty) {
      try {
        const propertyData = await getProperty(nextProperty.id);
        if (propertyData) {
          setSelectedPropertyData(propertyData);
        }
      } catch (error) {
        console.error('매물 데이터 로드 실패:', error);
      }
    }
  };

  // 현재 매물 인덱스 (모달용)
  const getCurrentPropertyIndexInModal = () => {
    if (!selectedPropertyData) return 0;
    return nearbyProperties.findIndex(p => p.id === selectedPropertyData.id);
  };

  // PropertyData를 Property로 변환하는 함수 (좌표 정확도 개선)
  const convertPropertyDataToProperty = (propertyData: PropertyData): Property | null => {
    // 좌표가 유효한 경우만 변환
    if (!propertyData.coordinates) {
      console.warn('Property missing coordinates object:', propertyData.id, propertyData.title);
      return null;
    }
    
    // 좌표 추출 (다양한 형식 지원)
    let lat: number | undefined;
    let lng: number | undefined;
    
    // 좌표 객체 타입 확인
    const coords = propertyData.coordinates as any;
    
    // 형식 1: coordinates.lat, coordinates.lng (기본 형식)
    if (coords.lat !== undefined && coords.lng !== undefined) {
      lat = Number(coords.lat);
      lng = Number(coords.lng);
    }
    // 형식 2: coordinates.latitude, coordinates.longitude (대체 형식)
    else if (coords.latitude !== undefined && coords.longitude !== undefined) {
      lat = Number(coords.latitude);
      lng = Number(coords.longitude);
    }
    // 형식 3: coordinates[0], coordinates[1] (배열 형식)
    else if (Array.isArray(coords) && coords.length >= 2) {
      lat = Number(coords[0]);
      lng = Number(coords[1]);
    }
    // 형식 4: coordinates.x, coordinates.y (다른 가능한 형식)
    else if (coords.x !== undefined && coords.y !== undefined) {
      lat = Number(coords.x);
      lng = Number(coords.y);
    }
    
    // 좌표 유효성 검사
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      console.warn('Property has invalid coordinates:', propertyData.id, propertyData.title, propertyData.coordinates);
      return null;
    }
    
    // 좌표 범위 검사 (베트남 내부인지 확인)
    if (!isInVietnam(lat, lng)) {
      console.warn('Property coordinates outside Vietnam:', propertyData.id, lat, lng);
      // 베트남 밖이어도 표시는 하지만 경고 로그 출력
    }
    
    // 디버깅: 좌표 정보 출력 (첫 번째 매물만)
    if (propertyData.id && (propertyData.id.includes('test') || Math.random() < 0.1)) {
      console.log('Property coordinates converted:', {
        id: propertyData.id,
        title: propertyData.title,
        original: propertyData.coordinates,
        converted: { lat, lng },
        inVietnam: isInVietnam(lat, lng)
      });
    }
    
    return {
      id: propertyData.id || '',
      name: propertyData.title || '',
      price: propertyData.price || 0,
      lat: lat,
      lng: lng,
      image: propertyData.images && propertyData.images.length > 0 ? propertyData.images[0] : undefined,
      address: propertyData.address || '',
      priceUnit: propertyData.priceUnit,
      checkInDate: propertyData.checkInDate,
    };
  };

  // 실제 등록된 매물 로드 (지도와 병렬 처리)
  useEffect(() => {
    let isInitialLoad = true;
    
    // 지도 로드와 병렬로 매물 데이터 로드 (지도가 먼저 표시되도록)
    const loadProperties = async () => {
      try {
        // 약간의 지연을 두어 지도가 먼저 렌더링되도록
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const propertiesData = await getAvailableProperties();
        const convertedProperties = propertiesData
          .map(convertPropertyDataToProperty)
          .filter((p): p is Property => p !== null); // null 제거
        
        setAllProperties(convertedProperties);
        isInitialLoad = false; // 초기 로드 완료
      } catch (error) {
        console.log('Error loading properties:', error);
        setAllProperties([]);
        isInitialLoad = false;
      }
    };

    loadProperties();

    // 실시간 업데이트 구독 (초기 로드 후에만 실행)
    const unsubscribe = subscribeToProperties((propertiesData) => {
      // 초기 로드가 완료된 후에만 업데이트 (중복 방지)
      if (!isInitialLoad) {
        const convertedProperties = propertiesData
          .map(convertPropertyDataToProperty)
          .filter((p): p is Property => p !== null); // null 제거
        
        setAllProperties(convertedProperties);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 현재 위치 마커 업데이트 (파란색 점) - 지도 이동 없이 마커만 추가/업데이트
  const updateUserLocationMarker = useCallback((location: { lat: number; lng: number }) => {
    if (!map.current) return;

    const safeLat = Number(location.lat);
    const safeLng = Number(location.lng);

    if (!safeLat || !safeLng || isNaN(safeLat) || isNaN(safeLng)) {
      console.warn('Invalid location for marker:', location);
      return;
    }

    if (marker.current) {
      marker.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.style.zIndex = '1000';

    marker.current = new maplibregl.Marker({ element: el })
      .setLngLat([safeLng, safeLat])
      .addTo(map.current);
  }, []);

  // 위치 가져오기 함수 (동의 모달에서 호출) - 좌표 범위 체크 강화
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      setShowLocationConsentModal(false);
      hasRequestedLocationRef.current = true;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid coordinates from geolocation');
          setShowLocationConsentModal(false);
          hasRequestedLocationRef.current = true;
          return;
        }

        // 좌표 범위 체크: 베트남 밖이면 지도를 움직이지 말고 호치민 고정
        if (!isInVietnam(lat, lng)) {
          // 호치민 고정 (지도 이동 안 함, 마커도 표시 안 함)
          setShowLocationConsentModal(false);
          hasRequestedLocationRef.current = true;
          return;
        }

        const location = { lat, lng };
        setUserLocation(location);

        // 지도 중심 이동 및 마커 표시
        if (map.current && map.current.loaded()) {
          const safeLng = Number(location.lng);
          const safeLat = Number(location.lat);
          if (!isNaN(safeLng) && !isNaN(safeLat)) {
            map.current.flyTo({
              center: [safeLng, safeLat],
              zoom: 13,
              duration: 1000,
            });
            updateUserLocationMarker(location);
          }
        }

        setShowLocationConsentModal(false);
        hasRequestedLocationRef.current = true;
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setShowLocationConsentModal(false);
        hasRequestedLocationRef.current = true;
      },
      {
        enableHighAccuracy: false, // WiFi/셀룰러 사용 (더 빠름)
        timeout: 5000, // 5초로 단축
        maximumAge: 60000, // 1분 이내 캐시된 위치 사용 가능
      }
    );
  }, [updateUserLocationMarker]);

  // 권한 상태 조용히 확인 함수 (Permissions API) - 무음 권한 확인 우선
  const checkLocationPermission = useCallback(() => {
    // 이미 요청했으면 다시 요청하지 않음 (위치 동의 로직 고정)
    if (hasRequestedLocationRef.current) {
      return;
    }

    if (!navigator.geolocation) {
      hasRequestedLocationRef.current = true;
      return;
    }

    // 무음 권한 확인 우선: navigator.permissions.query 먼저 실행
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          // 플래그 설정 (한 번만 실행되도록 보장)
          hasRequestedLocationRef.current = true;

          if (permissionStatus.state === 'granted') {
            // 이미 동의한 경우: 팝업 없이 조용히 위치 가져와서 지도 이동
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat = Number(position.coords.latitude);
                const lng = Number(position.coords.longitude);

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                  return;
                }

                // 좌표 범위 체크: 베트남 밖이면 지도를 움직이지 말고 호치민 고정
                if (!isInVietnam(lat, lng)) {
                  // 호치민 고정 (지도 이동 안 함, 마커도 표시 안 함)
                  return;
                }

                const location = { lat, lng };
                setUserLocation(location);

                if (map.current && map.current.loaded()) {
                  const safeLng = Number(location.lng);
                  const safeLat = Number(location.lat);
                  if (!isNaN(safeLng) && !isNaN(safeLat)) {
                    map.current.flyTo({
                      center: [safeLng, safeLat],
                      zoom: 13,
                      duration: 1000,
                    });
                    updateUserLocationMarker(location);
                  }
                }
              },
              (error) => {
                console.warn('Geolocation error:', error);
              },
              {
                enableHighAccuracy: false, // WiFi/셀룰러 사용 (더 빠름)
                timeout: 5000, // 5초로 단축
                maximumAge: 60000, // 1분 이내 캐시된 위치 사용 가능
              }
            );
          } else if (permissionStatus.state === 'prompt') {
            // 아직 동의 안 함: 동의 모달 딱 한 번만 표시
            setShowLocationConsentModal(true);
          } else {
            // denied: 다시 묻지 말고 호치민 유지
            console.log('Location permission denied - keeping Ho Chi Minh City map');
          }
        })
        .catch(() => {
          hasRequestedLocationRef.current = true;
        });
    } else {
      // Permissions API 미지원 시 플래그만 설정
      hasRequestedLocationRef.current = true;
    }
  }, [updateUserLocationMarker]);

  // initialLocation과 locationDenied를 ref로 저장 (초기화 시에만 사용)
  const initialLocationRef = useRef(initialLocation);
  const locationDeniedRef = useRef(locationDenied);
  const locationLoadingRef = useRef(locationLoading || false);
  
  // props가 변경되면 ref 업데이트 (하지만 지도는 재초기화하지 않음)
  useEffect(() => {
    initialLocationRef.current = initialLocation;
    locationDeniedRef.current = locationDenied;
    locationLoadingRef.current = locationLoading || false;
  }, [initialLocation, locationDenied, locationLoading]);

  // 검색으로 도시/구 선택 시 initialLocation이 바뀌면 지도 해당 위치로 이동
  useEffect(() => {
    if (!initialLocation || !map.current?.loaded?.()) return;
    const safeLat = Number(initialLocation.lat);
    const safeLng = Number(initialLocation.lng);
    if (isNaN(safeLat) || isNaN(safeLng) || !isInVietnam(safeLat, safeLng)) return;
    map.current.flyTo({
      center: [safeLng, safeLat],
      zoom: 15,
      duration: 1000,
    });
    setUserLocation(initialLocation);
    updateUserLocationMarker(initialLocation);
  }, [initialLocation?.lat, initialLocation?.lng]);

  // 지도 초기화 (싱글톤 패턴 - 한 번만 생성)
  useEffect(() => {
    if (!mapContainer.current) {
      console.error('Map container is not available');
      return;
    }
    if (map.current) {
      console.log('Map instance already exists, skipping initialization.');
      return;
    }
    if (isInitializingRef.current) {
      console.log('Map initialization already in progress, skipping...');
      return;
    }

    isInitializingRef.current = true;

    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-southeast-1';
    const mapName = process.env.NEXT_PUBLIC_AWS_MAP_NAME || 'MyGrabMap';
    const apiKey = process.env.NEXT_PUBLIC_AWS_API_KEY || '';

    if (!apiKey) {
      console.error('NEXT_PUBLIC_AWS_API_KEY is not set');
      setMapLoading(false);
      setMapError('AWS API Key가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      isInitializingRef.current = false;
      return;
    }

    if (!mapName) {
      console.error('NEXT_PUBLIC_AWS_MAP_NAME is not set');
      setMapLoading(false);
      setMapError('AWS Map Name이 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      isInitializingRef.current = false;
      return;
    }

    if (!mapContainer.current) {
      console.error('Map container is not available');
      isInitializingRef.current = false;
      return;
    }

    // AWS Location Service Map 스타일 URL 구성
    // 형식: https://maps.geo.{region}.amazonaws.com/maps/v0/maps/{mapName}/style-descriptor?key={apiKey}
    const styleUrl = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${encodeURIComponent(apiKey)}`;

    console.log('Initializing map with URL:', styleUrl.replace(apiKey, '***'));

    try {
      // 초기 위치 결정: ref에서 가져온 initialLocation이 있으면 사용, 없으면 호치민 중심
      const initLocation = initialLocationRef.current;
      const initDenied = locationDeniedRef.current;
      const initialCenter = initLocation 
        ? [initLocation.lng, initLocation.lat] 
        : [HO_CHI_MINH_CENTER.lng, HO_CHI_MINH_CENTER.lat];
      const initialZoom = initLocation ? 15 : 14; // 위치가 있으면 더 확대, 없으면 호치민 중심도 확대
      
      // 호치민 초기 중심 좌표 (무조건 숫자 리터럴 직접 사용)
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: initialCenter as [number, number], // [경도, 위도] 순서
        zoom: initialZoom,
        attributionControl: true as any,
      });

      // 네비게이션 컨트롤 추가
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // 지도 로드 완료 이벤트
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoading(false);
        setMapError(null);
        isInitializingRef.current = false; // 초기화 완료 플래그 해제
        
        // ref에서 최신 값 가져오기
        const initLocation = initialLocationRef.current;
        const initDenied = locationDeniedRef.current;
        const initLoading = locationLoadingRef.current;
        
        // 초기 위치 설정 (검색 기록 복원 없이 항상 초기화)
        if (initLocation) {
          // initialLocation이 있으면 해당 위치로 이동하고 마커 표시
          const safeLat = Number(initLocation.lat);
          const safeLng = Number(initLocation.lng);
          
          if (!isNaN(safeLat) && !isNaN(safeLng) && isInVietnam(safeLat, safeLng)) {
            setUserLocation(initLocation);
            map.current!.flyTo({
              center: [safeLng, safeLat],
              zoom: 15,
              duration: 1000,
            });
            updateUserLocationMarker(initLocation);
            hasRequestedLocationRef.current = true; // 위치 요청 완료로 표시
          }
        } else if (initDenied) {
          // 위치 권한 거부 시 호치민 중심으로 확대
          hasRequestedLocationRef.current = true; // 위치 요청 완료로 표시
        } else if (initLoading) {
          // If loading, don't check permission immediately, wait for URL update
          console.log('Location is loading, map initialized to default. Waiting for location update...');
        } else {
          // initialLocation이 없고 locationDenied도 false면 기존 로직 (자동 위치 확인)
          // 지도 로드 후 권한 상태 조용히 확인 (위치 요청은 하지 않음)
          checkLocationPermission();
        }
        
        // 지도 이동/확대 시 현재 화면 내 매물 필터링
        if (updateVisiblePropertiesRef.current) {
          updateVisiblePropertiesRef.current();
        }

        // 명소 핀 추가 (카테고리별 색상: 랜드마크=빨강, 쇼핑=파랑, 거주=초록, 관광=보라)
        const categoryColor: Record<string, string> = {
          landmark: '#dc2626',
          shopping: '#2563eb',
          residential: '#16a34a',
          tourism: '#9333ea',
        };
        landmarkMarkersRef.current.forEach(m => m.remove());
        landmarkMarkersRef.current = [];
        for (const lm of ALL_LANDMARKS) {
          const el = document.createElement('div');
          el.className = 'landmark-marker';
          el.style.width = '12px';
          el.style.height = '12px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = categoryColor[lm.category] || '#6b7280';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';
          const m = new maplibregl.Marker({ element: el })
            .setLngLat([lm.lng, lm.lat])
            .setPopup(new maplibregl.Popup({ offset: 15 }).setText(lm.name))
            .addTo(map.current!);
          landmarkMarkersRef.current.push(m);
        }
      });

      // 지도 이동/확대/축소 이벤트 (디바운싱 적용)
      map.current.on('moveend', () => {
        // 이전 타이머 취소
        if (mapMoveDebounceRef.current) {
          clearTimeout(mapMoveDebounceRef.current);
        }
        
        // 300ms 후에 매물 필터링 (지도 이동이 완전히 끝난 후)
        mapMoveDebounceRef.current = setTimeout(() => {
          if (updateVisiblePropertiesRef.current) {
            updateVisiblePropertiesRef.current();
          }
        }, 300);
      });

      // 줌 변경 시 마커 다시 그리기 (클러스터 분리/병합)
      map.current.on('zoomend', () => {
        if (updateVisiblePropertiesRef.current) {
          updateVisiblePropertiesRef.current();
        }
      });

      // 지도 에러 처리 (AWS 타일 데이터 null 에러 필터링)
      map.current.on('error', (e: any) => {
        // AWS 타일 데이터의 null 관련 에러는 무시 (지도는 정상 작동)
        if (e.error && e.error.message) {
          const errorMessage = e.error.message;
          // "Expected value to be of type number, but found null" 에러는 무시
          if (errorMessage.includes('Expected value to be of type number, but found null')) {
            // Silent: 에러를 콘솔에 출력하지 않고 무시
            return;
          }
        }

        // 다른 에러는 정상적으로 처리
        console.error('Map error:', e);
        setMapLoading(false);
        
        // 다양한 에러 형식 처리
        let errorMessage = '지도를 로드하는 중 오류가 발생했습니다.';
        
        if (e.error) {
          errorMessage = e.error.message || errorMessage;
        } else if (e.message) {
          errorMessage = e.message;
        }
        
        // AWS API 관련 에러 메시지 구체화
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = '네트워크 연결 오류. AWS 서비스에 접근할 수 없습니다.';
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = 'AWS API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.';
        } else if (errorMessage.includes('404')) {
          errorMessage = '지도 리소스를 찾을 수 없습니다. Map 이름을 확인해주세요.';
        }
        
        setMapError(errorMessage);
      });

      // 스타일 로드 에러 처리
      map.current.on('style.load', () => {
        console.log('Map style loaded');
      });

      map.current.on('style.error', (e) => {
        console.error('Style error:', e);
        setMapLoading(false);
        setMapError('지도 스타일을 로드하는 중 오류가 발생했습니다. API Key와 Map 리소스 이름을 확인해주세요.');
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      isInitializingRef.current = false; // 에러 발생 시에도 초기화 플래그 해제
    }

    return () => {
      isInitializingRef.current = false; // 초기화 플래그 해제
      
      // 타이머 정리
      if (mapMoveDebounceRef.current) {
        clearTimeout(mapMoveDebounceRef.current);
      }
      
      // 모든 마커 제거
      propertyMarkersRef.current.forEach(m => m.remove());
      propertyMarkersRef.current = [];
      
      // 모든 팝업 제거
      popupsRef.current.forEach(p => p.remove());
      popupsRef.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열 비움 - 지도는 한 번만 초기화


  // 두 좌표 간 거리 계산 (km) - 최적화된 버전 (50m 이내 클러스터링용)
  // 근거리에서는 간단한 유클리드 거리 사용 (더 빠름)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    // 매우 근거리(50m 이내)에서는 간단한 유클리드 거리 사용
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // 대략적인 km 변환 (1도 ≈ 111km)
    
    // 50m 이내면 간단한 계산으로 충분
    if (distanceKm < 0.1) {
      return distanceKm;
    }
    
    // 더 먼 거리는 정확한 Haversine 공식 사용
    const R = 6371; // 지구 반지름 (km)
    const dLatRad = (dLat * Math.PI) / 180;
    const dLngRad = (dLng * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLngRad / 2) *
        Math.sin(dLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);


  // 주변 매물 필터링 및 표시 (초기 로드용)
  const filterAndDisplayProperties = (location: { lat: number; lng: number }) => {
    // 초기 로드 시 모든 매물 표시 (allProperties 사용)
    setNearbyProperties(allProperties);
    
    // 상위 컴포넌트에 매물 데이터 전달
    if (onPropertiesChange) {
      onPropertiesChange(allProperties);
    }
    
    // 지도에 마커 표시
    displayPropertyMarkers(allProperties);
    
    // 현재 화면 내 매물 필터링
    setTimeout(() => {
      updateVisibleProperties();
    }, 100);
  };

  // allProperties가 변경되면 지도 업데이트 (디바운싱 적용)
  useEffect(() => {
    if (map.current && allProperties.length > 0) {
      // 지도가 로드된 후에만 업데이트
      if (map.current.loaded()) {
        // 디바운싱: 빠른 연속 업데이트 방지 (무한 루프 방지)
        const timer = setTimeout(() => {
          if (updateVisiblePropertiesRef.current) {
            updateVisiblePropertiesRef.current();
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [allProperties]);

  // 근거리 매물 클러스터링 (약 10m 이내) - 정확한 위치 표시를 위해 임계값 축소
  const clusterProperties = useCallback((properties: Property[], thresholdMeters: number = 0.01): Array<{ properties: Property[]; center: { lat: number; lng: number } }> => {
    // 빈 배열이면 빈 클러스터 반환
    if (!properties || properties.length === 0) {
      return [];
    }

    // 매물이 적으면(10개 이하) 기존 방식 사용 (오버헤드가 더 클 수 있음)
    if (properties.length <= 10) {
      const clusters: Array<{ properties: Property[]; center: { lat: number; lng: number } }> = [];
      const processed = new Set<string>();

      properties.forEach((property) => {
        if (!property || property.lat == null || property.lng == null || isNaN(property.lat) || isNaN(property.lng)) {
          return;
        }
        if (processed.has(property.id)) return;

        const cluster: Property[] = [property];
        processed.add(property.id);

        properties.forEach((other) => {
          if (!other || other.lat == null || other.lng == null || isNaN(other.lat) || isNaN(other.lng)) {
            return;
          }
          if (processed.has(other.id)) return;
          
          const distance = calculateDistance(property.lat, property.lng, other.lat, other.lng);
          if (distance <= thresholdMeters) {
            cluster.push(other);
            processed.add(other.id);
          }
        });

        if (cluster.length > 0) {
          const avgLat = cluster.reduce((sum, p) => sum + Number(p.lat), 0) / cluster.length;
          const avgLng = cluster.reduce((sum, p) => sum + Number(p.lng), 0) / cluster.length;
          if (!isNaN(avgLat) && !isNaN(avgLng)) {
            clusters.push({ properties: cluster, center: { lat: avgLat, lng: avgLng } });
          }
        }
      });

      return clusters;
    }

    // 그리드 기반 클러스터링 (매물이 많을 때 효율적)
    // 그리드 크기: 약 100m (thresholdMeters * 2)
    const gridSize = thresholdMeters * 2;
    const gridMap = new Map<string, Property[]>();

    // 1단계: 그리드에 매물 배치
    properties.forEach((property) => {
      if (!property || property.lat == null || property.lng == null || isNaN(property.lat) || isNaN(property.lng)) {
        return;
      }

      // 그리드 좌표 계산
      const gridLat = Math.floor(property.lat / gridSize);
      const gridLng = Math.floor(property.lng / gridSize);
      const gridKey = `${gridLat},${gridLng}`;

      if (!gridMap.has(gridKey)) {
        gridMap.set(gridKey, []);
      }
      gridMap.get(gridKey)!.push(property);
    });

    // 2단계: 인접 그리드만 확인하여 클러스터링 (O(n)에 가까움)
    const clusters: Array<{ properties: Property[]; center: { lat: number; lng: number } }> = [];
    const processed = new Set<string>();

    gridMap.forEach((gridProperties, gridKey) => {
      const [gridLat, gridLng] = gridKey.split(',').map(Number);

      gridProperties.forEach((property) => {
        if (processed.has(property.id)) return;

        const cluster: Property[] = [property];
        processed.add(property.id);

        // 인접 그리드만 확인 (9개 그리드: 자신 + 8방향)
        for (let dLat = -1; dLat <= 1; dLat++) {
          for (let dLng = -1; dLng <= 1; dLng++) {
            const neighborKey = `${gridLat + dLat},${gridLng + dLng}`;
            const neighborProperties = gridMap.get(neighborKey) || [];

            neighborProperties.forEach((other) => {
              if (processed.has(other.id)) return;
              if (!other || other.lat == null || other.lng == null || isNaN(other.lat) || isNaN(other.lng)) {
                return;
              }

              const distance = calculateDistance(property.lat, property.lng, other.lat, other.lng);
              if (distance <= thresholdMeters) {
                cluster.push(other);
                processed.add(other.id);
              }
            });
          }
        }

        if (cluster.length > 0) {
          const avgLat = cluster.reduce((sum, p) => sum + Number(p.lat), 0) / cluster.length;
          const avgLng = cluster.reduce((sum, p) => sum + Number(p.lng), 0) / cluster.length;
          if (!isNaN(avgLat) && !isNaN(avgLng)) {
            clusters.push({ properties: cluster, center: { lat: avgLat, lng: avgLng } });
          }
        }
      });
    });

    return clusters;
  }, [calculateDistance]);

  // 매물 마커 표시 (클러스터링 지원) - 최적화
  const displayPropertyMarkers = useCallback((properties: Property[]) => {
    if (!map.current || !map.current.loaded()) return; // 지도가 완전히 로드된 후에만 마커 표시

    // 빈 배열이면 마커만 제거하고 종료
    if (!properties || properties.length === 0) {
      propertyMarkersRef.current.forEach(m => m.remove());
      propertyMarkersRef.current = [];
      popupsRef.current.forEach(p => p.remove());
      popupsRef.current = [];
      return;
    }

    // 기존 마커 제거 (배치 처리)
    propertyMarkersRef.current.forEach(m => m.remove());
    propertyMarkersRef.current = [];
    popupsRef.current.forEach(p => p.remove());
    popupsRef.current = [];

    // 현재 줌 레벨 가져오기 (확대 시 매물 정보 표시용)
    const currentZoom = map.current.getZoom();
    const isZoomedIn = currentZoom >= 15; // 줌 15 이상이면 확대된 것으로 간주
    
    // 클러스터링
    const clusters = clusterProperties(properties);

    // 클러스터가 없으면 종료
    if (!clusters || clusters.length === 0) {
      return;
    }

    clusters.forEach((cluster) => {
      const isCluster = cluster.properties.length > 1;
      const clusterProperties = cluster.properties;

      // 클러스터 마커 생성
      const el = document.createElement('div');
      el.className = 'property-marker';
      
      if (isCluster) {
        // 여러 매물이 있는 경우: 숫자 표시
        el.innerHTML = `
          <div style="
            background-color: #FF6B35;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              color: white;
              font-size: 18px;
              font-weight: bold;
            ">${clusterProperties.length}</div>
          </div>
        `;
      } else {
        // 단일 매물: 집 아이콘 (확대 시 더 크게 표시)
        const markerSize = isZoomedIn ? 50 : 40;
        const iconSize = isZoomedIn ? 22 : 18;
        el.innerHTML = `
          <div style="
            background-color: #FF6B35;
            width: ${markerSize}px;
            height: ${markerSize}px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: ${iconSize}px;
              font-weight: bold;
            ">🏠</div>
          </div>
        `;
      }
      el.style.cursor = 'pointer';

      // 클러스터 중심 좌표 유효성 검증
      const centerLat = Number(cluster.center.lat);
      const centerLng = Number(cluster.center.lng);
      
      if (!centerLat || !centerLng || isNaN(centerLat) || isNaN(centerLng)) {
        console.warn('Invalid cluster center coordinates:', cluster.center);
        return;
      }

      // 마커 생성
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([centerLng, centerLat])
        .addTo(map.current!);

      // 확대 시 클러스터 내 각 매물의 정확한 위치에 작은 마커 표시
      if (isCluster && isZoomedIn) {
        clusterProperties.forEach((property) => {
          // 좌표 유효성 검증
          if (!property || property.lat == null || property.lng == null || isNaN(property.lat) || isNaN(property.lng)) {
            return;
          }

          const propLat = Number(property.lat);
          const propLng = Number(property.lng);
          
          if (!propLat || !propLng || isNaN(propLat) || isNaN(propLng)) {
            return;
          }

          // 중심점과 다른 위치에 있는 매물만 표시
          const distance = calculateDistance(
            centerLat,
            centerLng,
            propLat,
            propLng
          );
          
          // 5m 이상 떨어진 매물은 개별 마커로 표시
          if (distance > 0.005) {
            const smallMarkerEl = document.createElement('div');
            smallMarkerEl.className = 'property-marker-small';
            smallMarkerEl.innerHTML = `
              <div style="
                background-color: #FF6B35;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  color: white;
                  font-size: 12px;
                  font-weight: bold;
                ">🏠</div>
              </div>
            `;
            smallMarkerEl.style.cursor = 'pointer';
            
            const smallMarker = new maplibregl.Marker({ element: smallMarkerEl })
              .setLngLat([propLng, propLat])
              .addTo(map.current!);
            
            // 작은 마커 클릭 시 모달로 매물 상세 표시
            smallMarkerEl.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              
              // 매물 모달 열기
              handlePropertyClick(property.id);
              
              if (onPropertyPriorityChangeRef.current) {
                onPropertyPriorityChangeRef.current(property);
              }
            });
            
            propertyMarkersRef.current.push(smallMarker);
          }
        });
      }

      // 팝업 생성
      let popupContent = '';
      if (isCluster) {
        // 클러스터 팝업: 여러 매물 목록 (각 매물의 위치 정보 포함)
        popupContent = `
          <div style="padding: 8px; max-width: 280px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #FF6B35;">
              ${clusterProperties.length}${getUIText('propertiesCount', currentLanguage)}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              ${getUIText('zoomInToSeeExactLocation', currentLanguage)}
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
              ${clusterProperties
                .filter(p => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng))
                .map((p, idx, filtered) => {
                  const distance = calculateDistance(
                    centerLat,
                    centerLng,
                    Number(p.lat),
                    Number(p.lng)
                  );
                  const price = p.price && !isNaN(Number(p.price)) ? Number(p.price) : 0;
                  return `
                <div style="padding: 6px 0; border-bottom: ${idx < filtered.length - 1 ? '1px solid #e5e7eb' : 'none'};">
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">${p.name || ''}</div>
                  <div style="color: #FF6B35; font-size: 14px; font-weight: bold; margin-bottom: 2px;">
                    ${formatPrice(price, 'vnd')}
                  </div>
                  <div style="font-size: 10px; color: #9ca3af;">
                    📍 ${getUIText('distanceFromCenter', currentLanguage)} ${(distance * 1000).toFixed(0)}m
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          </div>
        `;
      } else {
        // 단일 매물 팝업 - 클릭하면 바로 모달 열기
        const property = clusterProperties[0];
        if (!property) return;
        
        const price = property.price && !isNaN(Number(property.price)) ? Number(property.price) : 0;
        popupContent = `
          <div style="padding: 8px; cursor: pointer;" class="property-popup" data-property-id="${property.id}">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${property.name || ''}</div>
            <div style="color: #FF6B35; font-size: 16px; font-weight: bold;">
              ${formatPrice(price, 'vnd')}
            </div>
            <div style="font-size: 11px; color: #3b82f6; margin-top: 6px; text-align: center;">
              ${getUIText('tapToViewDetails', currentLanguage)}
            </div>
          </div>
        `;
      }

      const popup = new maplibregl.Popup({ offset: 25, closeOnClick: false })
        .setHTML(popupContent);
      
      // 팝업 내 매물 클릭 이벤트 (단일 매물인 경우)
      popup.on('open', () => {
        if (!isCluster) {
          const popupElement = popup.getElement();
          const propertyPopup = popupElement?.querySelector('.property-popup');
          if (propertyPopup) {
            propertyPopup.addEventListener('click', () => {
              const propertyId = propertyPopup.getAttribute('data-property-id');
              if (propertyId) {
                handlePropertyClick(propertyId);
              }
            });
          }
        }
      });

      // 마커 클릭 시 팝업 표시 및 매물 우선순위 변경
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // 다른 팝업 닫기
        popupsRef.current.forEach(p => p.remove());
        
        // 단일 매물인 경우 바로 모달 열기
        if (!isCluster && clusterProperties.length === 1) {
          handlePropertyClick(clusterProperties[0].id);
          return;
        }
        
        // 현재 팝업 표시 (클러스터인 경우)
        marker.setPopup(popup);
        
        // 클러스터인 경우 해당 위치로 확대 (개별 매물 위치 확인 용이)
        if (isCluster && map.current) {
          const currentZoom = map.current.getZoom();
          // 줌 레벨이 낮으면 확대 (최대 16레벨까지)
          if (currentZoom < 15) {
            const safeLng = Number(cluster.center.lng);
            const safeLat = Number(cluster.center.lat);
            if (!isNaN(safeLng) && !isNaN(safeLat)) {
              map.current.flyTo({
                center: [safeLng, safeLat],
                zoom: 15, // 확대 시 개별 위치 확인 가능한 레벨
                duration: 500,
              });
            }
          }
        }
        
        // 클러스터인 경우 첫 번째 매물을 우선순위로 설정
        const firstProperty = clusterProperties[0];
        
        // 선택된 매물 우선순위 변경 알림
        if (onPropertyPriorityChangeRef.current) {
          onPropertyPriorityChangeRef.current(firstProperty);
        }
      });

      propertyMarkersRef.current.push(marker);
      popupsRef.current.push(popup);
    });
  }, [calculateDistance, clusterProperties]);

  // 현재 지도 화면에 보이는 매물 필터링 및 정렬 (구 필터·bounds 적용)
  const updateVisibleProperties = useCallback(() => {
    if (!map.current || !map.current.loaded()) return;

    let currentProperties = allPropertiesRef.current;
    // 명소/구 선택 시 해당 구 매물만 표시
    if (selectedDistrictIdFilter) {
      currentProperties = currentProperties.filter(
        p => p?.lat != null && p?.lng != null && getDistrictIdForCoord(Number(p.lat), Number(p.lng)) === selectedDistrictIdFilter
      );
    }

    // 지도의 현재 경계(bounds) 가져오기
    const bounds = map.current.getBounds();
    const center = map.current.getCenter();
    const centerLat = center.lat;
    const centerLng = center.lng;

    // bounds의 경계값 미리 계산 (contains 호출 최적화)
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const minLat = sw.lat;
    const maxLat = ne.lat;
    const minLng = sw.lng;
    const maxLng = ne.lng;

    // bounds 내의 매물 필터링 (최적화: bounds.contains 대신 직접 비교)
    const visibleProperties: Property[] = [];
    for (let i = 0; i < currentProperties.length; i++) {
      const property = currentProperties[i];
      
      // 좌표 유효성 검증
      if (property.lat == null || property.lng == null || isNaN(property.lat) || isNaN(property.lng)) {
        continue;
      }

      // 빠른 경계 체크 (contains보다 빠름)
      if (property.lat >= minLat && property.lat <= maxLat && 
          property.lng >= minLng && property.lng <= maxLng) {
        visibleProperties.push(property);
      }
    }

    // 지도 중심점에서 가까운 순으로 정렬 (최대 100개만 정렬)
    const sortedProperties = visibleProperties
      .map(property => ({
        property,
        distance: calculateDistance(centerLat, centerLng, property.lat, property.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 100) // 최대 100개만 표시 (성능 최적화)
      .map(item => item.property);

    setNearbyProperties(sortedProperties);
    
    // 상위 컴포넌트에 필터링된 매물 데이터 전달
    if (onPropertiesChange) {
      onPropertiesChange(sortedProperties);
    }
    
    // 지도에 마커 표시 (보이는 매물만)
    displayPropertyMarkers(sortedProperties);
  }, [onPropertiesChange, calculateDistance, displayPropertyMarkers, selectedDistrictIdFilter]);

  // updateVisibleProperties ref 업데이트
  useEffect(() => {
    updateVisiblePropertiesRef.current = updateVisibleProperties;
  }, [updateVisibleProperties]);

  // 선택된 매물로 지도 중심 이동
  useEffect(() => {
    if (selectedProperty && map.current) {
      const safeLat = Number(selectedProperty.lat);
      const safeLng = Number(selectedProperty.lng);
      
      if (!safeLat || !safeLng || isNaN(safeLat) || isNaN(safeLng)) {
        console.warn('Invalid coordinates for selected property:', selectedProperty);
        return;
      }

      map.current.flyTo({
        center: [safeLng, safeLat],
        zoom: 15,
        duration: 500,
      });

      // 해당 마커의 팝업 표시
      const markerIndex = propertyMarkersRef.current.findIndex(
        (_, i) => nearbyProperties[i]?.id === selectedProperty.id
      );
      if (markerIndex !== -1) {
        const marker = propertyMarkersRef.current[markerIndex];
        const popup = popupsRef.current[markerIndex];
        if (marker && popup) {
          // 다른 팝업 닫기
          popupsRef.current.forEach(p => p.remove());
          // 현재 팝업 표시
          marker.setPopup(popup);
        }
      }
    }
  }, [selectedProperty]);

  // 카드 너비 계산 (반응형)
  const getCardWidth = () => {
    if (typeof window === 'undefined') return 350;
    const isMobile = window.innerWidth < 640; // sm breakpoint
    return isMobile ? window.innerWidth - 32 : 350; // 모바일: 화면 너비 - padding(16px * 2), 데스크톱: 350px
  };

  // 카드 슬라이더 스크롤
  const scrollToCard = (index: number) => {
    if (cardSliderRef.current) {
      const cardWidth = getCardWidth() + 16; // 카드 너비 + gap
      cardSliderRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
    }
  };

  // 스크롤 이벤트로 현재 인덱스 추적
  useEffect(() => {
    const container = cardSliderRef.current;
    if (!container || nearbyProperties.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = getCardWidth() + 16;
      const index = Math.round(scrollLeft / cardWidth);
      const normalizedIndex = Math.max(0, Math.min(index, nearbyProperties.length - 1));
      setSelectedPropertyIndex(normalizedIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nearbyProperties.length]);

  // 이전 카드로 이동 (무한 루프)
  const handlePrevCard = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = getCardWidth() + 16;
      
      if (selectedPropertyIndex === 0) {
        // 첫 번째에서 왼쪽으로 가면 마지막으로
        const targetIndex = nearbyProperties.length - 1;
        container.scrollTo({ left: targetIndex * cardWidth, behavior: 'smooth' });
        setSelectedPropertyIndex(targetIndex);
        
        // 지도 중심 이동
        const property = nearbyProperties[targetIndex];
        if (map.current && property) {
          const safeLat = Number(property.lat);
          const safeLng = Number(property.lng);
          if (!isNaN(safeLat) && !isNaN(safeLng)) {
            map.current.flyTo({
              center: [safeLng, safeLat],
              zoom: 15,
              duration: 500,
            });
          }
        }
      } else {
        const newIndex = selectedPropertyIndex - 1;
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        setSelectedPropertyIndex(newIndex);
        
        // 지도 중심 이동
        const property = nearbyProperties[newIndex];
        if (map.current && property) {
          const safeLat = Number(property.lat);
          const safeLng = Number(property.lng);
          if (!isNaN(safeLat) && !isNaN(safeLng)) {
            map.current.flyTo({
              center: [safeLng, safeLat],
              zoom: 15,
              duration: 500,
            });
          }
        }
      }
    }
  };

  // 다음 카드로 이동 (무한 루프)
  const handleNextCard = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = getCardWidth() + 16;
      
      if (selectedPropertyIndex >= nearbyProperties.length - 1) {
        // 마지막에서 오른쪽으로 가면 첫 번째로
        container.scrollTo({ left: 0, behavior: 'smooth' });
        setSelectedPropertyIndex(0);
        
        // 지도 중심 이동
        const property = nearbyProperties[0];
        if (map.current && property) {
          const safeLat = Number(property.lat);
          const safeLng = Number(property.lng);
          if (!isNaN(safeLat) && !isNaN(safeLng)) {
            map.current.flyTo({
              center: [safeLng, safeLat],
              zoom: 15,
              duration: 500,
            });
          }
        }
      } else {
        const newIndex = selectedPropertyIndex + 1;
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        setSelectedPropertyIndex(newIndex);
        
        // 지도 중심 이동
        const property = nearbyProperties[newIndex];
        if (map.current && property) {
          const safeLat = Number(property.lat);
          const safeLng = Number(property.lng);
          if (!isNaN(safeLat) && !isNaN(safeLng)) {
            map.current.flyTo({
              center: [safeLng, safeLat],
              zoom: 15,
              duration: 500,
            });
          }
        }
      }
    }
  };


  // ============================================================================
  // 단순화된 검색 로직: 행정 구역 + 대표 명소만
  // 목적: 사용자가 보고 싶은 지역으로 지도를 빠르게 이동
  // 3단계 우선순위: 1순위(City) > 2순위(District) > 3순위(대표 명소)
  // 아파트, 호텔, 상점, 은행 등 모든 POI 제외
  // ============================================================================
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    lastSearchValueRef.current = value; // 마지막 검색어 저장

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      lastSearchValueRef.current = '';
      return;
    }

    // 디바운싱: 250ms 후 검색 (도시·구·명소 하드코딩, 5개국어·키워드·toLowerCase·1글자 자동완성)
    debounceTimerRef.current = setTimeout(() => {
      try {
        setIsSearching(true);

        const regionResults = searchRegions(value);
        const regionSuggestions: Suggestion[] = regionResults.map(region =>
          regionToSuggestion(region, currentLanguage) as Suggestion
        );
        const cityResults = regionSuggestions.filter(r => r.regionType === 'city');
        const districtResults = regionSuggestions.filter(r => r.regionType === 'district');

        const landmarkScored = searchLandmarksScored(value);
        const landmarkResults: Suggestion[] = landmarkScored
          .slice(0, 5)
          .map(({ landmark }) => ({ ...landmarkToSuggestion(landmark, currentLanguage), zoom: 16 } as Suggestion));

        const combinedResults = [
          ...cityResults,
          ...districtResults,
          ...landmarkResults,
        ].slice(0, 10);

        setSuggestions(combinedResults);
        setShowSuggestions(combinedResults.length > 0);
      } catch (error) {
        console.error('❌ 검색 오류:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // ============================================================================
  // 검색 결과 선택 및 지도 이동
  // 줌 레벨: 도시/구는 z=13 (넓게), 명소/아파트는 z=16 (건물 단위)
  // ============================================================================
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (!map.current) return;

    // 보기 선택 직후 드롭다운이 즉시 사라지도록 동기 반영 (지도 가림 방지)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    flushSync(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    });
    const displayText = suggestion.Text || '';
    setSearchValue(displayText);
    setIsSearching(true);

    // 도시 선택 → 구 필터 해제
    if (suggestion.isRegion && suggestion.regionType === 'city') {
      setSelectedDistrictIdFilter(null);
    }
    // 구 선택 → 해당 구 필터 활성화
    if (suggestion.isRegion && suggestion.regionType === 'district' && suggestion.PlaceId) {
      const districtId = suggestion.PlaceId.replace(/^region-/, '');
      setSelectedDistrictIdFilter(districtId);
    }
    // 명소 선택 → 해당 명소 구 필터 활성화 + FlyTo
    if (suggestion.isLandmark && suggestion.districtId) {
      setSelectedDistrictIdFilter(suggestion.districtId);
    }

    const point = suggestion.Place?.Geometry?.Point;
    if (point && point.length >= 2) {
      const [longitude, latitude] = point;
      const safeLat = Number(latitude);
      const safeLng = Number(longitude);
      if (!isNaN(safeLat) && !isNaN(safeLng)) {
        const zoomLevel = suggestion.isRegion ? (suggestion.zoom ?? 13) : 16;
        map.current.flyTo({
          center: [safeLng, safeLat],
          zoom: zoomLevel,
          duration: 1200,
          essential: true,
        });

        if (marker.current) marker.current.remove();
        if (!suggestion.isRegion) {
          marker.current = new maplibregl.Marker({
            color: suggestion.isLandmark && suggestion.landmarkCategory === 'landmark' ? '#dc2626'
              : suggestion.isLandmark && suggestion.landmarkCategory === 'shopping' ? '#2563eb'
              : suggestion.isLandmark && suggestion.landmarkCategory === 'residential' ? '#16a34a'
              : suggestion.isLandmark && suggestion.landmarkCategory === 'tourism' ? '#9333ea'
              : '#FF6B35',
            scale: 1.2,
          })
            .setLngLat([safeLng, safeLat])
            .addTo(map.current);
        } else {
          marker.current = null;
        }

        map.current.once('moveend', () => {
          if (updateVisiblePropertiesRef.current) updateVisiblePropertiesRef.current();
        });
      }
    }
    setIsSearching(false);
  };

  // 검색창 초기화 (구 필터도 해제)
  const handleClearSearch = () => {
    setSearchValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedDistrictIdFilter(null);
  };

  // 엔터 키로 검색 (첫 번째 결과로 이동)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    if (searchValue.trim() && suggestions.length > 0) {
      // 첫 번째 추천 결과로 지도 이동
      handleSelectSuggestion(suggestions[0]);
    }
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100%' }}>
      {/* 검색창 */}
      <SearchBox 
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
        isSearching={isSearching}
        currentLanguage={currentLanguage}
      />

      {/* 지도 컨테이너 */}
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          position: 'absolute',
          top: 0,
          left: 0,
          backgroundColor: '#f3f4f6', // 로딩 중 배경색
        }} 
      />


      {/* 에러 메시지 */}
      {mapError && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800 text-sm font-medium">오류</p>
          <p className="text-red-600 text-sm mt-1">{mapError}</p>
          <p className="text-red-500 text-xs mt-2">
            환경 변수(NEXT_PUBLIC_AWS_API_KEY, NEXT_PUBLIC_AWS_MAP_NAME)를 확인해주세요.
          </p>
        </div>
      )}

      {/* 위치 동의 모달 (상태가 'prompt'일 때만 표시) */}
      {showLocationConsentModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 w-full">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {getUIText('locationPermissionTitle', currentLanguage)}
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              {getUIText('locationPermissionDesc', currentLanguage)}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLocationConsentModal(false);
                  hasRequestedLocationRef.current = true;
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {getUIText('deny', currentLanguage)}
              </button>
              <button
                onClick={requestLocation}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {getUIText('allow', currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 매물 상세 모달 */}
      {showPropertyModal && selectedPropertyData && (
        <PropertyModal
          propertyData={selectedPropertyData}
          currentLanguage={currentLanguage}
          onClose={() => setShowPropertyModal(false)}
          onPrev={handlePrevPropertyInModal}
          onNext={handleNextPropertyInModal}
          hasPrev={nearbyProperties.length > 1}
          hasNext={nearbyProperties.length > 1}
          currentIndex={getCurrentPropertyIndexInModal()}
          totalProperties={nearbyProperties.length}
        />
      )}

    </div>
  );
}