'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, MapPin, X, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchPlaceIndexForSuggestions, searchPlaceIndexForText } from '@/lib/api/aws-location';
import { getAllProperties, subscribeToProperties, PropertyData } from '@/lib/api/properties';

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

// 가상의 매물 데이터 5개 (호치민 지역)
const mockProperties: Property[] = [
  { 
    id: '1', 
    name: 'Modern Apartment in District 1', 
    price: 15000000, 
    lat: 10.7769, 
    lng: 106.7009,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    address: 'District 1, Ho Chi Minh City'
  },
  { 
    id: '2', 
    name: 'Cozy Studio in District 3', 
    price: 8000000, 
    lat: 10.7830, 
    lng: 106.6900,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
    address: 'District 3, Ho Chi Minh City'
  },
  { 
    id: '3', 
    name: 'Luxury Condo in District 7', 
    price: 25000000, 
    lat: 10.7314, 
    lng: 106.7214,
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&h=300&fit=crop',
    address: 'District 7, Ho Chi Minh City'
  },
  { 
    id: '4', 
    name: 'Budget Room in Binh Thanh', 
    price: 5000000, 
    lat: 10.8022, 
    lng: 106.7147,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    address: 'Binh Thanh District, Ho Chi Minh City'
  },
  { 
    id: '5', 
    name: 'Family House in District 2', 
    price: 20000000, 
    lat: 10.7872, 
    lng: 106.7493,
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    address: 'District 2, Ho Chi Minh City'
  },
];

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
  const updateVisiblePropertiesRef = useRef<() => void>();
  
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
        
        console.log('Loaded properties:', {
          total: propertiesData.length,
          withCoordinates: convertedProperties.length,
          properties: convertedProperties.map(p => ({
            id: p.id,
            name: p.name,
            lat: p.lat,
            lng: p.lng
          }))
        });
        
        // mockProperties와 실제 매물 합치기 (실제 매물이 우선)
        const combinedProperties = [
          ...convertedProperties,
          ...mockProperties.filter(mock => 
            !convertedProperties.some(real => real.id === mock.id)
          )
        ];
        
        setAllProperties(combinedProperties);
      } catch (error) {
        console.error('Error loading properties:', error);
        // 에러 발생 시 mockProperties만 사용
        setAllProperties(mockProperties);
      }
    };

    loadProperties();

    // 실시간 업데이트 구독
    const unsubscribe = subscribeToProperties((propertiesData) => {
      const convertedProperties = propertiesData
        .map(convertPropertyDataToProperty)
        .filter((p): p is Property => p !== null); // null 제거
      
      // mockProperties와 실제 매물 합치기
      const combinedProperties = [
        ...convertedProperties,
        ...mockProperties.filter(mock => 
          !convertedProperties.some(real => real.id === mock.id)
        )
      ];
      
      setAllProperties(combinedProperties);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
      // 호치민 초기 중심 좌표 (10.776, 106.701)
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [106.701, 10.776], // [경도, 위도] 순서
        zoom: 12,
        attributionControl: true,
      });

      // 네비게이션 컨트롤 추가
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // 지도 로드 완료 이벤트
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoading(false);
        setMapError(null);
        
        // 사용자 위치 가져오기
        getCurrentLocation();
        
        // 지도 이동/확대 시 현재 화면 내 매물 필터링
        if (updateVisiblePropertiesRef.current) {
          updateVisiblePropertiesRef.current();
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
    }

    return () => {
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
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      // 위치 서비스 미지원 시 호치민 기준으로 설정
      const hoChiMinhLocation = { lat: 10.776, lng: 106.701 };
      setUserLocation(hoChiMinhLocation);
      filterAndDisplayProperties(hoChiMinhLocation);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // 베트남 이외 지역이면 호치민 기준으로 변경
        const location = isInVietnam(lat, lng) 
          ? { lat, lng } 
          : { lat: 10.776, lng: 106.701 };
        
        setUserLocation(location);
        filterAndDisplayProperties(location);
        
        // 지도 중심 이동
        if (map.current) {
          map.current.flyTo({
            center: [location.lng, location.lat],
            zoom: 13,
            duration: 1000,
          });
        }
      },
      (error) => {
        // 위치 가져오기 실패 시 호치민 기준으로 설정
        const hoChiMinhLocation = { lat: 10.776, lng: 106.701 };
        setUserLocation(hoChiMinhLocation);
        filterAndDisplayProperties(hoChiMinhLocation);
      }
    );
  };

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
    const clusters: Array<{ properties: Property[]; center: { lat: number; lng: number } }> = [];
    const processed = new Set<string>();

    properties.forEach((property) => {
      if (processed.has(property.id)) return;

      const cluster: Property[] = [property];
      processed.add(property.id);

      // 근거리 매물 찾기
      properties.forEach((other) => {
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

      // 클러스터 중심점 계산
      const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;

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

    // 기존 마커 제거
    propertyMarkersRef.current.forEach(m => m.remove());
    propertyMarkersRef.current = [];
    popupsRef.current.forEach(p => p.remove());
    popupsRef.current = [];

    // 클러스터링
    const clusters = clusterProperties(properties);

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
        // 단일 매물: 집 아이콘
        el.innerHTML = `
          <div style="
            background-color: #FF6B35;
            width: 40px;
            height: 40px;
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
              font-size: 18px;
              font-weight: bold;
            ">🏠</div>
          </div>
        `;
      }
      el.style.cursor = 'pointer';

      // 마커 생성
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cluster.center.lng, cluster.center.lat])
        .addTo(map.current!);

      // 팝업 생성
      let popupContent = '';
      if (isCluster) {
        // 클러스터 팝업: 여러 매물 목록
        popupContent = `
          <div style="padding: 8px; max-width: 250px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
              ${clusterProperties.length}개의 매물
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
              ${clusterProperties.map((p, idx) => `
                <div style="padding: 6px 0; border-bottom: ${idx < clusterProperties.length - 1 ? '1px solid #e5e7eb' : 'none'};">
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">${p.name}</div>
                  <div style="color: #FF6B35; font-size: 14px; font-weight: bold;">
                    ${(p.price / 1000000).toFixed(1)}M VND
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        // 단일 매물 팝업
        const property = clusterProperties[0];
        popupContent = `
          <div style="padding: 8px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${property.name}</div>
            <div style="color: #FF6B35; font-size: 16px; font-weight: bold;">
              ${(property.price / 1000000).toFixed(1)}M VND
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
        
        // 클러스터인 경우 첫 번째 매물을 우선순위로 설정
        const firstProperty = clusterProperties[0];
        console.log('마커 클릭됨:', isCluster ? `클러스터 (${clusterProperties.length}개)` : '단일 매물', firstProperty);
        
        // 선택된 매물 우선순위 변경 알림
        if (onPropertyPriorityChangeRef.current) {
          onPropertyPriorityChangeRef.current(firstProperty);
        }
      });

      propertyMarkersRef.current.push(marker);
      popupsRef.current.push(popup);
    });
  };

  // 사용자 위치 변경 시 매물 다시 필터링
  useEffect(() => {
    if (userLocation && map.current) {
      filterAndDisplayProperties(userLocation);
    }
  }, [userLocation]);

  // 선택된 매물로 지도 중심 이동
  useEffect(() => {
    if (selectedProperty && map.current) {
      map.current.flyTo({
        center: [selectedProperty.lng, selectedProperty.lat],
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
          map.current.flyTo({
            center: [property.lng, property.lat],
            zoom: 15,
            duration: 500,
          });
        }
      } else {
        const newIndex = selectedPropertyIndex - 1;
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        setSelectedPropertyIndex(newIndex);
        
        // 지도 중심 이동
        const property = nearbyProperties[newIndex];
        if (map.current && property) {
          map.current.flyTo({
            center: [property.lng, property.lat],
            zoom: 15,
            duration: 500,
          });
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
          map.current.flyTo({
            center: [property.lng, property.lat],
            zoom: 15,
            duration: 500,
          });
        }
      } else {
        const newIndex = selectedPropertyIndex + 1;
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        setSelectedPropertyIndex(newIndex);
        
        // 지도 중심 이동
        const property = nearbyProperties[newIndex];
        if (map.current && property) {
          map.current.flyTo({
            center: [property.lng, property.lat],
            zoom: 15,
            duration: 500,
          });
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

        // 지도 중심 이동
        map.current.flyTo({
          center: [longitude, latitude],
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
          .setLngLat([longitude, latitude])
          .addTo(map.current);
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

    </div>
  );
}
