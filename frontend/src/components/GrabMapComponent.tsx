'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, MapPin, X, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchPlaceIndexForSuggestions, searchPlaceIndexForText } from '@/lib/api/aws-location';
import { getAllProperties, subscribeToProperties, PropertyData } from '@/lib/api/properties';
import { useLanguage } from '@/contexts/LanguageContext';

interface Suggestion {
  PlaceId: string;
  Text: string;
}

interface Property {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  image?: string;
  address?: string;
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
}

export default function GrabMapComponent({ 
  onPropertiesChange,
  onPropertySelect,
  selectedProperty,
  onPropertyPriorityChange
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardSliderRef = useRef<HTMLDivElement>(null);
  const mapMoveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const onPropertyPriorityChangeRef = useRef(onPropertyPriorityChange);
  const updateVisiblePropertiesRef = useRef<(() => void) | undefined>(undefined);
  const hasRequestedLocationRef = useRef(false); // 위치 요청 여부 추적
  const isInitializingRef = useRef(false); // 지도 초기화 진행 중 여부 추적 (싱글톤 패턴)
  const [showLocationConsentModal, setShowLocationConsentModal] = useState(false);
  const { currentLanguage } = useLanguage();
  
  // 콜백 ref 업데이트
  useEffect(() => {
    onPropertyPriorityChangeRef.current = onPropertyPriorityChange;
  }, [onPropertyPriorityChange]);

  // PropertyData를 Property로 변환하는 함수
  const convertPropertyDataToProperty = (propertyData: PropertyData): Property | null => {
    // 좌표가 유효한 경우만 변환
    if (!propertyData.coordinates || !propertyData.coordinates.lat || !propertyData.coordinates.lng) {
      console.warn('Property missing coordinates:', propertyData.id, propertyData.title);
      return null;
    }
    
    return {
      id: propertyData.id || '',
      name: propertyData.title || '',
      price: propertyData.price || 0,
      lat: propertyData.coordinates.lat,
      lng: propertyData.coordinates.lng,
      image: propertyData.images && propertyData.images.length > 0 ? propertyData.images[0] : undefined,
      address: propertyData.address || '',
    };
  };

  // 실제 등록된 매물 로드
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const propertiesData = await getAllProperties();
        const convertedProperties = propertiesData
          .map(convertPropertyDataToProperty)
          .filter((p): p is Property => p !== null); // null 제거
        
        setAllProperties(convertedProperties);
      } catch (error) {
        console.error('Error loading properties:', error);
        setAllProperties([]);
      }
    };

    loadProperties();

    // 실시간 업데이트 구독
    const unsubscribe = subscribeToProperties((propertiesData) => {
      const convertedProperties = propertiesData
        .map(convertPropertyDataToProperty)
        .filter((p): p is Property => p !== null); // null 제거
      
      setAllProperties(convertedProperties);
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
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
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
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0,
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
      return;
    }

    if (!mapName) {
      console.error('NEXT_PUBLIC_AWS_MAP_NAME is not set');
      setMapLoading(false);
      setMapError('AWS Map Name이 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      return;
    }

    if (!mapContainer.current) {
      console.error('Map container is not available');
      return;
    }

    // AWS Location Service Map 스타일 URL 구성
    // 형식: https://maps.geo.{region}.amazonaws.com/maps/v0/maps/{mapName}/style-descriptor?key={apiKey}
    const styleUrl = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${encodeURIComponent(apiKey)}`;

    console.log('Initializing map with URL:', styleUrl.replace(apiKey, '***'));

    try {
      // 호치민 초기 중심 좌표 (무조건 숫자 리터럴 직접 사용)
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [HO_CHI_MINH_CENTER.lng, HO_CHI_MINH_CENTER.lat], // [경도, 위도] 순서
        zoom: 12,
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
        
        // 지도 이동/확대 시 현재 화면 내 매물 필터링
        if (updateVisiblePropertiesRef.current) {
          updateVisiblePropertiesRef.current();
        }
        
        // 지도 로드 후 권한 상태 조용히 확인 (위치 요청은 하지 않음)
        checkLocationPermission();
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

      // 지도 에러 처리
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapLoading(false);
        if (e.error) {
          const errorMessage = e.error.message || '지도를 로드하는 중 오류가 발생했습니다.';
          setMapError(errorMessage);
          console.error('Error details:', e.error.message);
        } else {
          setMapError('지도를 로드하는 중 오류가 발생했습니다.');
        }
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
  }, [checkLocationPermission]);


  // 두 좌표 간 거리 계산 (km)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 현재 지도 화면에 보이는 매물 필터링 및 정렬
  const updateVisibleProperties = useCallback(() => {
    if (!map.current) return;

    // 지도의 현재 경계(bounds) 가져오기
    const bounds = map.current.getBounds();
    const center = map.current.getCenter();
    const centerLat = center.lat;
    const centerLng = center.lng;

    // bounds 내의 매물 필터링 (allProperties 사용)
    const visibleProperties = allProperties.filter(property => {
      // 좌표가 유효한 경우만 필터링 (0도 유효한 좌표일 수 있으므로 null/undefined만 체크)
      if (property.lat == null || property.lng == null) {
        console.warn('Property missing coordinates:', property.id, property.name);
        return false;
      }
      // 좌표가 범위를 벗어난 경우도 체크
      if (isNaN(property.lat) || isNaN(property.lng)) {
        console.warn('Property has invalid coordinates:', property.id, property.name);
        return false;
      }
      return bounds.contains([property.lng, property.lat]);
    });

    // 지도 중심점에서 가까운 순으로 정렬
    const sortedProperties = visibleProperties.sort((a, b) => {
      const distanceA = calculateDistance(centerLat, centerLng, a.lat, a.lng);
      const distanceB = calculateDistance(centerLat, centerLng, b.lat, b.lng);
      return distanceA - distanceB;
    });

    setNearbyProperties(sortedProperties);
    
    // 상위 컴포넌트에 필터링된 매물 데이터 전달
    if (onPropertiesChange) {
      onPropertiesChange(sortedProperties);
    }
    
    // 지도에 마커 표시 (보이는 매물만)
    displayPropertyMarkers(sortedProperties);
  }, [allProperties, onPropertiesChange]);

  // updateVisibleProperties ref 업데이트
  useEffect(() => {
    updateVisiblePropertiesRef.current = updateVisibleProperties;
  }, [updateVisibleProperties]);

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

  // allProperties가 변경되면 지도 업데이트
  useEffect(() => {
    if (map.current && allProperties.length > 0) {
      // 지도가 로드된 후에만 업데이트
      if (map.current.loaded()) {
        if (updateVisiblePropertiesRef.current) {
          updateVisiblePropertiesRef.current();
        }
      }
    }
  }, [allProperties]);

  // 근거리 매물 클러스터링 (약 50m 이내)
  const clusterProperties = (properties: Property[], thresholdMeters: number = 0.05): Array<{ properties: Property[]; center: { lat: number; lng: number } }> => {
    // 빈 배열이면 빈 클러스터 반환
    if (!properties || properties.length === 0) {
      return [];
    }

    const clusters: Array<{ properties: Property[]; center: { lat: number; lng: number } }> = [];
    const processed = new Set<string>();

    properties.forEach((property) => {
      // 좌표 유효성 검증
      if (!property || property.lat == null || property.lng == null || isNaN(property.lat) || isNaN(property.lng)) {
        console.warn('Property with invalid coordinates skipped:', property?.id);
        return;
      }

      if (processed.has(property.id)) return;

      const cluster: Property[] = [property];
      processed.add(property.id);

      // 근거리 매물 찾기
      properties.forEach((other) => {
        // 좌표 유효성 검증
        if (!other || other.lat == null || other.lng == null || isNaN(other.lat) || isNaN(other.lng)) {
          return;
        }

        if (processed.has(other.id)) return;
        
        const distance = calculateDistance(
          property.lat,
          property.lng,
          other.lat,
          other.lng
        );

        // 50m 이내면 같은 클러스터로
        if (distance <= thresholdMeters) {
          cluster.push(other);
          processed.add(other.id);
        }
      });

      // 클러스터 중심점 계산 (유효한 좌표만 사용)
      const validProperties = cluster.filter(p => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng));
      if (validProperties.length === 0) {
        return;
      }

      const avgLat = validProperties.reduce((sum, p) => sum + Number(p.lat), 0) / validProperties.length;
      const avgLng = validProperties.reduce((sum, p) => sum + Number(p.lng), 0) / validProperties.length;

      // 계산된 좌표 유효성 검증
      if (isNaN(avgLat) || isNaN(avgLng)) {
        console.warn('Invalid cluster center calculated:', { avgLat, avgLng });
        return;
      }

      clusters.push({
        properties: cluster,
        center: { lat: avgLat, lng: avgLng }
      });
    });

    return clusters;
  };

  // 매물 마커 표시 (클러스터링 지원)
  const displayPropertyMarkers = (properties: Property[]) => {
    if (!map.current) return;

    // 빈 배열이면 마커만 제거하고 종료
    if (!properties || properties.length === 0) {
      propertyMarkersRef.current.forEach(m => m.remove());
      propertyMarkersRef.current = [];
      popupsRef.current.forEach(p => p.remove());
      popupsRef.current = [];
      return;
    }

    // 기존 마커 제거
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
            
            // 작은 마커 클릭 시 해당 매물 정보 표시
            smallMarkerEl.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              
              const propertyPopup = new maplibregl.Popup({ offset: 15, closeOnClick: false })
                .setHTML(`
                  <div style="padding: 8px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${property.name}</div>
                    <div style="color: #FF6B35; font-size: 16px; font-weight: bold;">
                      ${property.price && !isNaN(Number(property.price)) ? (Number(property.price) / 1000000).toFixed(1) : '0.0'}M VND
                    </div>
                    ${property.address ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${property.address}</div>` : ''}
                  </div>
                `);
              
              smallMarker.setPopup(propertyPopup);
              
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
              ${clusterProperties.length}개의 매물
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              확대하면 각 매물의 정확한 위치를 확인할 수 있습니다
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
                    ${(price / 1000000).toFixed(1)}M VND
                  </div>
                  <div style="font-size: 10px; color: #9ca3af;">
                    📍 중심에서 ${(distance * 1000).toFixed(0)}m
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          </div>
        `;
      } else {
        // 단일 매물 팝업
        const property = clusterProperties[0];
        if (!property) return;
        
        const price = property.price && !isNaN(Number(property.price)) ? Number(property.price) : 0;
        popupContent = `
          <div style="padding: 8px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${property.name || ''}</div>
            <div style="color: #FF6B35; font-size: 16px; font-weight: bold;">
              ${(price / 1000000).toFixed(1)}M VND
            </div>
          </div>
        `;
      }

      const popup = new maplibregl.Popup({ offset: 25, closeOnClick: false })
        .setHTML(popupContent);

      // 마커 클릭 시 팝업 표시 및 매물 우선순위 변경
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // 다른 팝업 닫기
        popupsRef.current.forEach(p => p.remove());
        
        // 현재 팝업 표시
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
  };


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

  // 주소 자동완성 검색
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 디바운싱: 300ms 후 검색
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const suggestionsList = await searchPlaceIndexForSuggestions(value, 'vi');
        setSuggestions(suggestionsList);
        setShowSuggestions(suggestionsList.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // 주소 선택 및 지도 이동
  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    if (!map.current) return;

    setSearchValue(suggestion.Text);
    setShowSuggestions(false);
    setIsSearching(true);

    try {
      // PlaceId를 사용하여 정확한 위치 정보 가져오기
      const results = await searchPlaceIndexForText(suggestion.Text, 'vi');

      if (results.length > 0 && results[0].Place?.Geometry?.Point) {
        const [longitude, latitude] = results[0].Place.Geometry.Point;
        
        const safeLat = Number(latitude);
        const safeLng = Number(longitude);
        
        if (!isNaN(safeLat) && !isNaN(safeLng)) {
          // 지도 중심 이동
          map.current.flyTo({
            center: [safeLng, safeLat],
            zoom: 15,
            duration: 1000,
          });

        // 기존 마커 제거
        if (marker.current) {
          marker.current.remove();
        }

          // 새 마커 추가
          marker.current = new maplibregl.Marker({
            color: '#FF6B35', // Grab 스타일 오렌지 색상
            scale: 1.2,
          })
            .setLngLat([safeLng, safeLat])
            .addTo(map.current);
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 검색창 초기화
  const handleClearSearch = () => {
    setSearchValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100%' }}>
      {/* 검색창 */}
      <div className="absolute top-4 left-4 right-4 z-10 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="주소를 검색하세요..."
            className="w-full pl-12 pr-10 py-3 text-base rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* 자동완성 제안 목록 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.PlaceId || index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {suggestion.Text}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* 로딩 오버레이 */}
      {mapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">지도를 불러오는 중...</p>
          </div>
        </div>
      )}

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
                {currentLanguage === 'ko' && '위치 권한 요청'}
                {currentLanguage === 'vi' && 'Yêu cầu quyền truy cập vị trí'}
                {currentLanguage === 'en' && 'Location Permission Request'}
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              {currentLanguage === 'ko' && '지도에서 내 위치를 표시하기 위해 위치 권한이 필요합니다. 위치 정보는 지도에 내 위치 마커를 표시하는 데만 사용됩니다.'}
              {currentLanguage === 'vi' && 'Chúng tôi cần quyền truy cập vị trí để hiển thị vị trí của bạn trên bản đồ. Thông tin vị trí chỉ được sử dụng để hiển thị điểm đánh dấu vị trí của bạn trên bản đồ.'}
              {currentLanguage === 'en' && 'We need location permission to show your location on the map. Location information is only used to display your location marker on the map.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLocationConsentModal(false);
                  hasRequestedLocationRef.current = true;
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {currentLanguage === 'ko' && '거부'}
                {currentLanguage === 'vi' && 'Từ chối'}
                {currentLanguage === 'en' && 'Deny'}
              </button>
              <button
                onClick={requestLocation}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {currentLanguage === 'ko' && '동의'}
                {currentLanguage === 'vi' && 'Đồng ý'}
                {currentLanguage === 'en' && 'Allow'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
