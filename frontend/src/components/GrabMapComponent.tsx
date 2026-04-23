"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Plus, Minus } from "lucide-react";
import {
  getAvailableProperties,
  subscribeToProperties,
} from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  searchRegions,
  regionToSuggestion,
  getDistrictIdForCoord,
} from "@/lib/data/vietnam-regions";
import {
  searchLandmarksScored,
  landmarkToSuggestion,
  ALL_LANDMARKS,
} from "@/lib/data/vietnam-landmarks";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SearchBox from "@/components/map/SearchBox";
import { Suggestion } from "@/types/map";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getUIText } from "@/utils/i18n";

interface Property {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  images?: string[];
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
}

/**
 * 기본 지도 중심: 호치민 1군 (HCMC_DISTRICTS `hcmc-d1` 와 동일).
 * — URL 좌표 없음, 위치 미동의, 베트남 밖 GPS, 위치 오류 등
 */
const DEFAULT_MAP_CENTER_HCMC_D1 = {
  lat: 10.7756,
  lng: 106.7019,
} as const;
const DEFAULT_MAP_FALLBACK_ZOOM = 14;

function flyToHcmcDistrict1(
  mapInstance: maplibregl.Map | null,
  duration = 1000,
): void {
  if (!mapInstance?.loaded()) return;
  mapInstance.flyTo({
    center: [DEFAULT_MAP_CENTER_HCMC_D1.lng, DEFAULT_MAP_CENTER_HCMC_D1.lat],
    zoom: DEFAULT_MAP_FALLBACK_ZOOM,
    duration,
  });
}

/**
 * 위치 미동의(모달 거부) 시각 저장.
 * 재노출: 같은 달력 날짜가 아니면 다시 모달 (자정이 지난 뒤, 아래 타임존 기준).
 * 서버와 맞추려면 `NEXT_PUBLIC_APP_TIMEZONE`(예: UTC, Asia/Seoul) 설정.
 */
const GEO_CONSENT_DISMISS_KEY = "mapGeoConsentDismissedAt";
const GEO_CONSENT_CALENDAR_TZ =
  process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Asia/Ho_Chi_Minh";

function calendarYmdInZone(ms: number, timeZone: string): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone });
}

function readGeoConsentDismissTime(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(GEO_CONSENT_DISMISS_KEY);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeGeoConsentDismissTime(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GEO_CONSENT_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function clearGeoConsentDismissTime(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GEO_CONSENT_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

/** 미동의(거부) 사용자: 마지막 거부일과 오늘(달력)이 다르면 다시 모달 */
function shouldShowGeoConsentModal(): boolean {
  const t = readGeoConsentDismissTime();
  if (t === null) return true;
  const dismissedDay = calendarYmdInZone(t, GEO_CONSENT_CALENDAR_TZ);
  const today = calendarYmdInZone(Date.now(), GEO_CONSENT_CALENDAR_TZ);
  return dismissedDay !== today;
}

// 베트남 경계 확인 (대략적인 범위)
const isInVietnam = (lat: number, lng: number): boolean => {
  // 베트남 대략적인 경계: 위도 8.5~23.5, 경도 102~110
  return lat >= 8.5 && lat <= 23.5 && lng >= 102 && lng <= 110;
};

const ZOOM_MIN = 10;
const ZOOM_MAX = 18;
const RULER_HEIGHT = 120;
const THUMB_SIZE = 12;

function escapeHtmlLandmarkName(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 동작 정리: 카드 좌우 이동 시 selectedProperty만 변경 → 지도 크기/줌 유지, 선택된 마커만 파란색으로 갱신.
// 지도 위 마커를 클릭했을 때만 해당 매물 좌표 기준으로 줌인(flyTo) 허용.
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
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const allPropertiesRef = useRef<Property[]>([]); // ref로 최신 값 유지 (무한 루프 방지)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardSliderRef = useRef<HTMLDivElement>(null);
  const mapMoveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchValueRef = useRef<string>(""); // 마지막 검색어 저장 (언어 변경 시 재검색용)
  const onPropertyPriorityChangeRef = useRef(onPropertyPriorityChange);
  const selectedPropertyRef = useRef<Property | null>(null);
  const nearbyPropertiesRef = useRef<Property[]>([]);
  const updateVisiblePropertiesRef = useRef<(() => void) | undefined>(
    undefined,
  );
  const hasRequestedLocationRef = useRef(false); // 위치 요청 여부 추적
  const isInitializingRef = useRef(false); // 지도 초기화 진행 중 여부 추적 (싱글톤 패턴)
  const [showLocationConsentModal, setShowLocationConsentModal] =
    useState(false);
  const [rulerZoom, setRulerZoom] = useState(14);
  /** 명소/구 선택 시 해당 구 매물만 필터 (districtId) */
  const [selectedDistrictIdFilter, setSelectedDistrictIdFilter] = useState<
    string | null
  >(null);
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

  // 선택된 매물 ref 동기화 (마커/팝업 클릭 시 "이미 선택됐으면 모달, 아니면 줌" 판단용)
  useEffect(() => {
    nearbyPropertiesRef.current = nearbyProperties;
  }, [nearbyProperties]);

  // 선택 즉시 마커(단일·클러스터) 테두리 파란색: 페인트 전에 ref 갱신 + 마커 다시 그리기
  useLayoutEffect(() => {
    selectedPropertyRef.current = selectedProperty ?? null;
    if (updateVisiblePropertiesRef.current)
      updateVisiblePropertiesRef.current();
  }, [selectedProperty]);

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

  // 매물 클릭 시 /properties/[id] 로 이동 (인터셉팅 라우트에서 모달처럼 표시)
  const handlePropertyClick = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  // PropertyData를 Property로 변환하는 함수 (좌표 정확도 개선)
  const convertPropertyDataToProperty = (
    propertyData: PropertyData,
  ): Property | null => {
    // 좌표가 유효한 경우만 변환
    if (!propertyData.coordinates) {
      console.warn(
        "Property missing coordinates object:",
        propertyData.id,
        propertyData.title,
      );
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
      console.warn(
        "Property has invalid coordinates:",
        propertyData.id,
        propertyData.title,
        propertyData.coordinates,
      );
      return null;
    }

    // 좌표 범위 검사 (베트남 내부인지 확인)
    if (!isInVietnam(lat, lng)) {
      console.warn(
        "Property coordinates outside Vietnam:",
        propertyData.id,
        lat,
        lng,
      );
      // 베트남 밖이어도 표시는 하지만 경고 로그 출력
    }

    // 디버깅: 좌표 정보 출력 (첫 번째 매물만)
    if (
      propertyData.id &&
      (propertyData.id.includes("test") || Math.random() < 0.1)
    ) {
      console.log("Property coordinates converted:", {
        id: propertyData.id,
        title: propertyData.title,
        original: propertyData.coordinates,
        converted: { lat, lng },
        inVietnam: isInVietnam(lat, lng),
      });
    }

    return {
      id: propertyData.id || "",
      name: propertyData.address || "", // 임차인 비공개: 표시는 주소만
      price: propertyData.price || 0,
      lat: lat,
      lng: lng,
      images: propertyData.images || [],
      address: propertyData.address || "",
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
        await new Promise((resolve) => setTimeout(resolve, 100));

        const propertiesData = await getAvailableProperties();
        const convertedProperties = propertiesData
          .map(convertPropertyDataToProperty)
          .filter((p): p is Property => p !== null); // null 제거

        setAllProperties(convertedProperties);
        isInitialLoad = false; // 초기 로드 완료
      } catch (error) {
        console.log("Error loading properties:", error);
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
  const updateUserLocationMarker = useCallback(
    (location: { lat: number; lng: number }) => {
      if (!map.current) return;

      const safeLat = Number(location.lat);
      const safeLng = Number(location.lng);

      if (!safeLat || !safeLng || isNaN(safeLat) || isNaN(safeLng)) {
        console.warn("Invalid location for marker:", location);
        return;
      }

      if (marker.current) {
        marker.current.remove();
      }

      const userMarkerSizePx = 12; // 명소(8px)보다 조금 더 크게
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.style.width = `${userMarkerSizePx}px`;
      el.style.height = `${userMarkerSizePx}px`;
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#E63946";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 2px 6px rgba(230, 57, 70, 0.4)";
      el.style.cursor = "pointer";
      el.style.zIndex = "1000";

      marker.current = new maplibregl.Marker({ element: el })
        .setLngLat([safeLng, safeLat])
        .addTo(map.current);
    },
    [],
  );

  // 위치 가져오기 함수 (동의 모달에서 호출) - 좌표 범위 체크 강화
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported");
      if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
      setShowLocationConsentModal(false);
      hasRequestedLocationRef.current = true;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          console.warn("Invalid coordinates from geolocation");
          if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
          setShowLocationConsentModal(false);
          hasRequestedLocationRef.current = true;
          return;
        }

        clearGeoConsentDismissTime();

        if (!isInVietnam(lat, lng)) {
          setUserLocation(null);
          if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
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
        console.warn("Geolocation error:", error);
        const code = (error as GeolocationPositionError)?.code;
        if (code === 1) {
          writeGeoConsentDismissTime();
        }
        if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
        setShowLocationConsentModal(false);
        hasRequestedLocationRef.current = true;
      },
      {
        enableHighAccuracy: false, // WiFi/셀룰러 사용 (더 빠름)
        timeout: 5000, // 5초로 단축
        maximumAge: 60000, // 1분 이내 캐시된 위치 사용 가능
      },
    );
  }, [updateUserLocationMarker]);

  // 권한 상태 조용히 확인 함수 (Permissions API) - 무음 권한 확인 우선
  const checkLocationPermission = useCallback(() => {
    // 이미 요청했으면 다시 요청하지 않음 (위치 동의 로직 고정)
    if (hasRequestedLocationRef.current) {
      return;
    }

    const finishPermissionCheck = () => {
      hasRequestedLocationRef.current = true;
    };

    if (!navigator.geolocation) {
      finishPermissionCheck();
      return;
    }

    // 무음 권한 확인 우선: navigator.permissions.query 먼저 실행
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === "granted") {
            clearGeoConsentDismissTime();
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat = Number(position.coords.latitude);
                const lng = Number(position.coords.longitude);

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                  if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
                  return;
                }

                if (!isInVietnam(lat, lng)) {
                  setUserLocation(null);
                  if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
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
                console.warn("Geolocation error:", error);
                if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
              },
              {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000,
              },
            );
            finishPermissionCheck();
            return;
          }

          const canPromptModal = shouldShowGeoConsentModal();

          if (permissionStatus.state === "prompt") {
            if (canPromptModal) {
              setShowLocationConsentModal(true);
            }
            finishPermissionCheck();
            return;
          }

          // denied: 브라우저에서 거부됨 — 미동의 사용자만 하루 단위로 안내 모달 재표시
          console.log(
            "Location permission denied - defaulting to Ho Chi Minh District 1",
          );
          if (map.current?.loaded()) flyToHcmcDistrict1(map.current, 1000);
          if (canPromptModal) {
            setShowLocationConsentModal(true);
          }
          finishPermissionCheck();
        })
        .catch(() => {
          if (shouldShowGeoConsentModal()) {
            setShowLocationConsentModal(true);
          }
          finishPermissionCheck();
        });
    } else {
      if (shouldShowGeoConsentModal()) {
        setShowLocationConsentModal(true);
      }
      finishPermissionCheck();
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

  // 검색/URL로 initialLocation이 바뀐 경우에만 지도 이동. 카드 선택(좌우 이동)과 무관하게 유지.
  const lastAppliedInitialLocationRef = useRef<{
    lat: number;
    lng: number;
  } | null>(null);
  useEffect(() => {
    if (!initialLocation || !map.current?.loaded?.()) return;
    const safeLat = Number(initialLocation.lat);
    const safeLng = Number(initialLocation.lng);
    if (isNaN(safeLat) || isNaN(safeLng) || !isInVietnam(safeLat, safeLng)) {
      setUserLocation(null);
      flyToHcmcDistrict1(map.current, 1000);
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      return;
    }
    const last = lastAppliedInitialLocationRef.current;
    if (last && last.lat === safeLat && last.lng === safeLng) return;
    lastAppliedInitialLocationRef.current = { lat: safeLat, lng: safeLng };
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
      console.error("Map container is not available");
      return;
    }
    if (map.current) {
      console.log("Map instance already exists, skipping initialization.");
      return;
    }
    if (isInitializingRef.current) {
      console.log("Map initialization already in progress, skipping...");
      return;
    }

    isInitializingRef.current = true;

    const region = process.env.NEXT_PUBLIC_AWS_REGION || "ap-southeast-1";
    const mapName = process.env.NEXT_PUBLIC_AWS_MAP_NAME || "MyGrabMap";
    const apiKey = process.env.NEXT_PUBLIC_AWS_API_KEY || "";

    if (!apiKey) {
      console.error("NEXT_PUBLIC_AWS_API_KEY is not set");
      setMapLoading(false);
      setMapError(
        "AWS API Key가 설정되지 않았습니다. .env.local 파일을 확인해주세요.",
      );
      isInitializingRef.current = false;
      return;
    }

    if (!mapName) {
      console.error("NEXT_PUBLIC_AWS_MAP_NAME is not set");
      setMapLoading(false);
      setMapError(
        "AWS Map Name이 설정되지 않았습니다. .env.local 파일을 확인해주세요.",
      );
      isInitializingRef.current = false;
      return;
    }

    if (!mapContainer.current) {
      console.error("Map container is not available");
      isInitializingRef.current = false;
      return;
    }

    // AWS Location Service Map 스타일 URL 구성
    // 형식: https://maps.geo.{region}.amazonaws.com/maps/v0/maps/{mapName}/style-descriptor?key={apiKey}
    const styleUrl = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${encodeURIComponent(apiKey)}`;

    console.log("Initializing map with URL:", styleUrl.replace(apiKey, "***"));

    try {
      // 초기 위치: 베트남 내 URL 좌표만 그대로, 그 외(없음·밖·무효)는 호치민 1군
      const initLocation = initialLocationRef.current;
      const initDenied = locationDeniedRef.current;
      let initialCenter: [number, number];
      let initialZoom: number;
      if (initLocation) {
        const slat = Number(initLocation.lat);
        const slng = Number(initLocation.lng);
        if (!isNaN(slat) && !isNaN(slng) && isInVietnam(slat, slng)) {
          initialCenter = [slng, slat];
          initialZoom = 15;
        } else {
          initialCenter = [
            DEFAULT_MAP_CENTER_HCMC_D1.lng,
            DEFAULT_MAP_CENTER_HCMC_D1.lat,
          ];
          initialZoom = DEFAULT_MAP_FALLBACK_ZOOM;
        }
      } else {
        initialCenter = [
          DEFAULT_MAP_CENTER_HCMC_D1.lng,
          DEFAULT_MAP_CENTER_HCMC_D1.lat,
        ];
        initialZoom = DEFAULT_MAP_FALLBACK_ZOOM;
      }

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: true as any,
      });

      // 지도 로드 완료 이벤트
      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapLoading(false);
        setMapError(null);
        isInitializingRef.current = false; // 초기화 완료 플래그 해제
        if (map.current) setRulerZoom(Math.round(map.current.getZoom()));

        // ref에서 최신 값 가져오기
        const initLocation = initialLocationRef.current;
        const initDenied = locationDeniedRef.current;
        const initLoading = locationLoadingRef.current;

        // 초기 위치 설정 (검색 기록 복원 없이 항상 초기화)
        if (initLocation) {
          const safeLat = Number(initLocation.lat);
          const safeLng = Number(initLocation.lng);

          if (
            !isNaN(safeLat) &&
            !isNaN(safeLng) &&
            isInVietnam(safeLat, safeLng)
          ) {
            setUserLocation(initLocation);
            map.current!.flyTo({
              center: [safeLng, safeLat],
              zoom: 15,
              duration: 1000,
            });
            updateUserLocationMarker(initLocation);
            hasRequestedLocationRef.current = true;
          } else {
            // 베트남 밖·무효 URL: 호치민 1군 기준(초기 center와 동일하게 맞춤)
            setUserLocation(null);
            flyToHcmcDistrict1(map.current!, 1000);
            hasRequestedLocationRef.current = true;
          }
        } else if (initDenied) {
          flyToHcmcDistrict1(map.current!, 1000);
          hasRequestedLocationRef.current = true;
        } else if (initLoading) {
          // If loading, don't check permission immediately, wait for URL update
          console.log(
            "Location is loading, map initialized to default. Waiting for location update...",
          );
        } else {
          // initialLocation이 없고 locationDenied도 false면 기존 로직 (자동 위치 확인)
          // 지도 로드 후 권한 상태 조용히 확인 (위치 요청은 하지 않음)
          checkLocationPermission();
        }

        // 지도 이동/확대 시 현재 화면 내 매물 필터링
        if (updateVisiblePropertiesRef.current) {
          updateVisiblePropertiesRef.current();
        }

        // 명소 핀 추가 (카테고리별 색상: 랜드마크=시그니처빨강, 쇼핑=시그니처오렌지, 거주=성공초록)
        const categoryColor: Record<string, string> = {
          landmark: "#E63946",
          shopping: "#FF6B35",
          residential: "#10B981",
        };
        landmarkMarkersRef.current.forEach((m) => m.remove());
        landmarkMarkersRef.current = [];
        const landmarkSizePx = 8;
        for (const lm of ALL_LANDMARKS) {
          const el = document.createElement("div");
          el.className = "landmark-marker";
          el.style.width = `${landmarkSizePx}px`;
          el.style.height = `${landmarkSizePx}px`;
          el.style.borderRadius = "50%";
          el.style.backgroundColor = categoryColor[lm.category] || "#6b7280";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
          el.style.cursor = "pointer";
          const m = new maplibregl.Marker({ element: el })
            .setLngLat([lm.lng, lm.lat])
            .setPopup(
              new maplibregl.Popup({
                offset: 15,
                className: "landmark-popup-card",
                closeButton: true,
                maxWidth: "240px",
              }).setHTML(
                `<div class="landmark-popup-title">${escapeHtmlLandmarkName(lm.name)}</div>`,
              ),
            )
            .addTo(map.current!);
          landmarkMarkersRef.current.push(m);
        }
      });

      // 지도 이동/확대/축소 이벤트 (디바운싱 적용)
      map.current.on("moveend", () => {
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

      // 줌 변경 시 마커 다시 그리기 + 세로 룰러 포인터 동기화
      map.current.on("zoomend", () => {
        if (map.current) setRulerZoom(Math.round(map.current.getZoom()));
        if (updateVisiblePropertiesRef.current) {
          updateVisiblePropertiesRef.current();
        }
      });

      // 지도 에러 처리 (AWS 타일 데이터 null 에러 필터링)
      map.current.on("error", (e: any) => {
        // AWS 타일 데이터의 null 관련 에러는 무시 (지도는 정상 작동)
        if (e.error && e.error.message) {
          const errorMessage = e.error.message;
          // "Expected value to be of type number, but found null" 에러는 무시
          if (
            errorMessage.includes(
              "Expected value to be of type number, but found null",
            )
          ) {
            // Silent: 에러를 콘솔에 출력하지 않고 무시
            return;
          }
        }

        // 다른 에러는 정상적으로 처리
        console.error("Map error:", e);
        setMapLoading(false);

        // 다양한 에러 형식 처리
        let errorMessage = "지도를 로드하는 중 오류가 발생했습니다.";

        if (e.error) {
          errorMessage = e.error.message || errorMessage;
        } else if (e.message) {
          errorMessage = e.message;
        }

        // AWS API 관련 에러 메시지 구체화
        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")
        ) {
          errorMessage = "네트워크 연결 오류. AWS 서비스에 접근할 수 없습니다.";
        } else if (
          errorMessage.includes("401") ||
          errorMessage.includes("403")
        ) {
          errorMessage =
            "AWS API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.";
        } else if (errorMessage.includes("404")) {
          errorMessage =
            "지도 리소스를 찾을 수 없습니다. Map 이름을 확인해주세요.";
        }

        setMapError(errorMessage);
      });

      // 스타일 로드 에러 처리
      map.current.on("style.load", () => {
        console.log("Map style loaded");
      });

      map.current.on("style.error", (e) => {
        console.error("Style error:", e);
        setMapLoading(false);
        setMapError(
          "지도 스타일을 로드하는 중 오류가 발생했습니다. API Key와 Map 리소스 이름을 확인해주세요.",
        );
      });
    } catch (error) {
      console.error("Failed to initialize map:", error);
      isInitializingRef.current = false; // 에러 발생 시에도 초기화 플래그 해제
    }

    return () => {
      isInitializingRef.current = false; // 초기화 플래그 해제

      // 타이머 정리
      if (mapMoveDebounceRef.current) {
        clearTimeout(mapMoveDebounceRef.current);
      }

      // 모든 마커 제거
      propertyMarkersRef.current.forEach((m) => m.remove());
      propertyMarkersRef.current = [];

      // 모든 팝업 제거
      popupsRef.current.forEach((p) => p.remove());
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
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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
    },
    [],
  );

  // 주변 매물 필터링 및 표시 (초기 로드용)
  const filterAndDisplayProperties = (location: {
    lat: number;
    lng: number;
  }) => {
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
  const clusterProperties = useCallback(
    (
      properties: Property[],
      thresholdMeters: number = 0.01,
    ): Array<{
      properties: Property[];
      center: { lat: number; lng: number };
    }> => {
      // 빈 배열이면 빈 클러스터 반환
      if (!properties || properties.length === 0) {
        return [];
      }

      // 매물이 적으면(10개 이하) 기존 방식 사용 (오버헤드가 더 클 수 있음)
      if (properties.length <= 10) {
        const clusters: Array<{
          properties: Property[];
          center: { lat: number; lng: number };
        }> = [];
        const processed = new Set<string>();

        properties.forEach((property) => {
          if (
            !property ||
            property.lat == null ||
            property.lng == null ||
            isNaN(property.lat) ||
            isNaN(property.lng)
          ) {
            return;
          }
          if (processed.has(property.id)) return;

          const cluster: Property[] = [property];
          processed.add(property.id);

          properties.forEach((other) => {
            if (
              !other ||
              other.lat == null ||
              other.lng == null ||
              isNaN(other.lat) ||
              isNaN(other.lng)
            ) {
              return;
            }
            if (processed.has(other.id)) return;

            const distance = calculateDistance(
              property.lat,
              property.lng,
              other.lat,
              other.lng,
            );
            if (distance <= thresholdMeters) {
              cluster.push(other);
              processed.add(other.id);
            }
          });

          if (cluster.length > 0) {
            const avgLat =
              cluster.reduce((sum, p) => sum + Number(p.lat), 0) /
              cluster.length;
            const avgLng =
              cluster.reduce((sum, p) => sum + Number(p.lng), 0) /
              cluster.length;
            if (!isNaN(avgLat) && !isNaN(avgLng)) {
              clusters.push({
                properties: cluster,
                center: { lat: avgLat, lng: avgLng },
              });
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
        if (
          !property ||
          property.lat == null ||
          property.lng == null ||
          isNaN(property.lat) ||
          isNaN(property.lng)
        ) {
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
      const clusters: Array<{
        properties: Property[];
        center: { lat: number; lng: number };
      }> = [];
      const processed = new Set<string>();

      gridMap.forEach((gridProperties, gridKey) => {
        const [gridLat, gridLng] = gridKey.split(",").map(Number);

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
                if (
                  !other ||
                  other.lat == null ||
                  other.lng == null ||
                  isNaN(other.lat) ||
                  isNaN(other.lng)
                ) {
                  return;
                }

                const distance = calculateDistance(
                  property.lat,
                  property.lng,
                  other.lat,
                  other.lng,
                );
                if (distance <= thresholdMeters) {
                  cluster.push(other);
                  processed.add(other.id);
                }
              });
            }
          }

          if (cluster.length > 0) {
            const avgLat =
              cluster.reduce((sum, p) => sum + Number(p.lat), 0) /
              cluster.length;
            const avgLng =
              cluster.reduce((sum, p) => sum + Number(p.lng), 0) /
              cluster.length;
            if (!isNaN(avgLat) && !isNaN(avgLng)) {
              clusters.push({
                properties: cluster,
                center: { lat: avgLat, lng: avgLng },
              });
            }
          }
        });
      });

      return clusters;
    },
    [calculateDistance],
  );

  // 매물 마커 표시 (클러스터링 지원) - 최적화
  const displayPropertyMarkers = useCallback(
    (properties: Property[]) => {
      if (!map.current || !map.current.loaded()) return; // 지도가 완전히 로드된 후에만 마커 표시

      // 빈 배열이면 마커만 제거하고 종료
      if (!properties || properties.length === 0) {
        propertyMarkersRef.current.forEach((m) => m.remove());
        propertyMarkersRef.current = [];
        popupsRef.current.forEach((p) => p.remove());
        popupsRef.current = [];
        return;
      }

      // 기존 마커 제거 (배치 처리)
      propertyMarkersRef.current.forEach((m) => m.remove());
      propertyMarkersRef.current = [];
      popupsRef.current.forEach((p) => p.remove());
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
        const singlePropId =
          !isCluster && clusterProperties[0] ? clusterProperties[0].id : null;
        const isSelected =
          singlePropId && selectedPropertyRef.current?.id === singlePropId;
        // 클러스터가 선택됐는지: 하단 카드에서 선택한 매물이 이 클러스터에 포함될 때
        const isClusterSelected =
          isCluster &&
          clusterProperties.some(
            (p) => p.id === selectedPropertyRef.current?.id,
          );

        const el = document.createElement("div");
        el.className = "property-marker";

        if (isCluster) {
          // 여러 매물: 숫자 표시. 선택 시 내부는 주황 유지, 테두리만 파란색
          const clusterBorder = isClusterSelected
            ? "3px solid #E63946"
            : "2px solid white";
          el.innerHTML = `
          <div style="
            background-color: #FF6B35;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: ${clusterBorder};
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              color: white;
              font-size: 13px;
              font-weight: 700;
              line-height: 1;
            ">${clusterProperties.length}</div>
          </div>
        `;
        } else {
          // 단일 매물: 텍스트 가격 마커 (k/M 포맷). 선택 시 테두리 강조.
          const borderStyle = isSelected
            ? "3px solid #E63946"
            : "2px solid white";
          const singleProperty = clusterProperties[0];
          const markerPrice = singleProperty?.price
            ? Number(singleProperty.price)
            : 0;
          const markerPriceText = formatCurrency(markerPrice);
          const markerMinWidth = Math.max(
            isZoomedIn ? 58 : 52,
            markerPriceText.length * (isZoomedIn ? 8 : 7) + (isZoomedIn ? 24 : 20),
          );
          el.innerHTML = `
          <div style="
            background-color: #FF6B35;
            min-width: ${markerMinWidth}px;
            height: ${isZoomedIn ? 28 : 26}px;
            padding: 0 ${isZoomedIn ? 9 : 7}px;
            border-radius: 999px;
            border: ${borderStyle};
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${isZoomedIn ? 12 : 11}px;
            font-weight: 700;
            line-height: 1;
            letter-spacing: 0.1px;
          ">
            ${markerPriceText}
          </div>
        `;
        }
        el.style.cursor = "pointer";

        // 클러스터 중심 좌표 유효성 검증
        const centerLat = Number(cluster.center.lat);
        const centerLng = Number(cluster.center.lng);

        if (!centerLat || !centerLng || isNaN(centerLat) || isNaN(centerLng)) {
          console.warn("Invalid cluster center coordinates:", cluster.center);
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
            if (
              !property ||
              property.lat == null ||
              property.lng == null ||
              isNaN(property.lat) ||
              isNaN(property.lng)
            ) {
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
              propLng,
            );

            // 5m 이상 떨어진 매물은 개별 마커로 표시
            if (distance > 0.005) {
              const smallIsSelected =
                selectedPropertyRef.current?.id === property.id;
              const smallBorder = smallIsSelected
                ? "2px solid #E63946"
                : "1.5px solid white";
              const smallMarkerEl = document.createElement("div");
              smallMarkerEl.className = "property-marker-small";
              smallMarkerEl.innerHTML = `
              <div style="
                background-color: #FF6B35;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: ${smallBorder};
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 10.5L12 3l9 7.5"/>
                  <path d="M5 10v8a1 1 0 001 1h12a1 1 0 001-1v-8"/>
                </svg>
              </div>
            `;
              smallMarkerEl.style.cursor = "pointer";

              const smallMarker = new maplibregl.Marker({
                element: smallMarkerEl,
              })
                .setLngLat([propLng, propLat])
                .addTo(map.current!);

              // 작은 마커 클릭: 선택 먼저 반영(파란 테두리) → 줌인. 이미 선택된 매물이면 모달
              smallMarkerEl.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (selectedPropertyRef.current?.id === property.id) {
                  handlePropertyClick(property.id);
                  return;
                }
                if (onPropertyPriorityChangeRef.current) {
                  onPropertyPriorityChangeRef.current(property);
                }
                selectedPropertyRef.current = property;
                if (updateVisiblePropertiesRef.current)
                  updateVisiblePropertiesRef.current();
                if (map.current && !isNaN(propLat) && !isNaN(propLng)) {
                  map.current.flyTo({
                    center: [propLng, propLat],
                    zoom: 15,
                    duration: 500,
                  });
                }
              });

              propertyMarkersRef.current.push(smallMarker);
            }
          });
        }

        // 팝업 생성
        let popupContent = "";
        if (isCluster) {
          // 클러스터 팝업: 여러 매물 목록 (각 매물의 위치 정보 포함)
          popupContent = `
          <div style="padding: 8px; max-width: 280px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #FF6B35;">
              ${clusterProperties.length}${getUIText("propertiesCount", currentLanguage)}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              ${getUIText("zoomInToSeeExactLocation", currentLanguage)}
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
              ${clusterProperties
                .filter(
                  (p) =>
                    p &&
                    p.lat != null &&
                    p.lng != null &&
                    !isNaN(p.lat) &&
                    !isNaN(p.lng),
                )
                .map((p, idx, filtered) => {
                  const distance = calculateDistance(
                    centerLat,
                    centerLng,
                    Number(p.lat),
                    Number(p.lng),
                  );
                  const price =
                    p.price && !isNaN(Number(p.price)) ? Number(p.price) : 0;
                  return `
                <div style="padding: 6px 0; border-bottom: ${idx < filtered.length - 1 ? "1px solid #e5e7eb" : "none"};">
                  <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">${p.name || ""}</div>
                  <div style="color: #FF6B35; font-size: 14px; font-weight: bold; margin-bottom: 2px;">
                    ${formatCurrency(price)}
                  </div>
                  <div style="font-size: 10px; color: #9ca3af;">
                    📍 ${getUIText("distanceFromCenter", currentLanguage)} ${(distance * 1000).toFixed(0)}m
                  </div>
                </div>
              `;
                })
                .join("")}
            </div>
          </div>
        `;
        } else {
          // 단일 매물 팝업 - 클릭하면 바로 모달 열기
          const property = clusterProperties[0];
          if (!property) return;

          const price =
            property.price && !isNaN(Number(property.price))
              ? Number(property.price)
              : 0;
          popupContent = `
          <div style="padding: 8px; cursor: pointer;" class="property-popup" data-property-id="${property.id}">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${property.name || ""}</div>
            <div style="color: #FF6B35; font-size: 16px; font-weight: bold;">
              ${formatCurrency(price)}
            </div>
            <div style="font-size: 11px; color: #3b82f6; margin-top: 6px; text-align: center;">
              ${getUIText("tapToViewDetails", currentLanguage)}
            </div>
          </div>
        `;
        }

        const popup = new maplibregl.Popup({
          offset: 25,
          closeOnClick: false,
        }).setHTML(popupContent);

        // 팝업 내 매물 클릭 이벤트 (단일 매물): 이미 줌된 매물이면 모달, 아니면 줌
        popup.on("open", () => {
          if (!isCluster) {
            const popupElement = popup.getElement();
            const propertyPopup =
              popupElement?.querySelector(".property-popup");
            if (propertyPopup) {
              propertyPopup.addEventListener("click", () => {
                const propertyId =
                  propertyPopup.getAttribute("data-property-id");
                if (!propertyId) return;
                const prop = nearbyPropertiesRef.current.find(
                  (p) => p.id === propertyId,
                );
                if (selectedPropertyRef.current?.id === propertyId) {
                  handlePropertyClick(propertyId);
                  return;
                }
                if (prop) {
                  if (onPropertyPriorityChangeRef.current) {
                    onPropertyPriorityChangeRef.current(prop);
                  }
                  selectedPropertyRef.current = prop;
                  if (updateVisiblePropertiesRef.current)
                    updateVisiblePropertiesRef.current();
                  if (map.current) {
                    const lat = Number(prop.lat);
                    const lng = Number(prop.lng);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      map.current.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                        duration: 500,
                      });
                    }
                  }
                }
              });
            }
          }
        });

        // 마커 클릭 시: 선택 먼저 반영(파란 테두리 즉시) → 그다음 줌인. 이미 선택된 매물이면 모달.
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          // 다른 팝업 닫기
          popupsRef.current.forEach((p) => p.remove());

          if (!isCluster && clusterProperties.length === 1) {
            const prop = clusterProperties[0];
            if (selectedPropertyRef.current?.id === prop.id) {
              handlePropertyClick(prop.id);
              return;
            }
            // 선택 먼저 반영 → 파란 테두리와 줌이 동시에 보이도록
            if (onPropertyPriorityChangeRef.current) {
              onPropertyPriorityChangeRef.current(prop);
            }
            selectedPropertyRef.current = prop;
            if (updateVisiblePropertiesRef.current)
              updateVisiblePropertiesRef.current();
            if (map.current && !isNaN(centerLat) && !isNaN(centerLng)) {
              map.current.flyTo({
                center: [centerLng, centerLat],
                zoom: 15,
                duration: 500,
              });
            }
            marker.setPopup(popup);
            return;
          }

          const firstProperty = clusterProperties[0];
          if (onPropertyPriorityChangeRef.current) {
            onPropertyPriorityChangeRef.current(firstProperty);
          }
          selectedPropertyRef.current = firstProperty;
          if (updateVisiblePropertiesRef.current)
            updateVisiblePropertiesRef.current();
          if (map.current && !isNaN(centerLat) && !isNaN(centerLng)) {
            map.current.flyTo({
              center: [centerLng, centerLat],
              zoom: 15,
              duration: 500,
            });
          }
          marker.setPopup(popup);
        });

        propertyMarkersRef.current.push(marker);
        popupsRef.current.push(popup);
      });
    },
    [calculateDistance, clusterProperties],
  );

  // 현재 지도 화면에 보이는 매물 필터링 및 정렬 (구 필터·bounds 적용)
  const updateVisibleProperties = useCallback(() => {
    if (!map.current || !map.current.loaded()) return;

    let currentProperties = allPropertiesRef.current;
    // 명소/구 선택 시 해당 구 매물만 표시
    if (selectedDistrictIdFilter) {
      currentProperties = currentProperties.filter(
        (p) =>
          p?.lat != null &&
          p?.lng != null &&
          getDistrictIdForCoord(Number(p.lat), Number(p.lng)) ===
            selectedDistrictIdFilter,
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
      if (
        property.lat == null ||
        property.lng == null ||
        isNaN(property.lat) ||
        isNaN(property.lng)
      ) {
        continue;
      }

      // 빠른 경계 체크 (contains보다 빠름)
      if (
        property.lat >= minLat &&
        property.lat <= maxLat &&
        property.lng >= minLng &&
        property.lng <= maxLng
      ) {
        visibleProperties.push(property);
      }
    }

    // 지도 중심점에서 가까운 순으로 정렬 (최대 100개만 정렬)
    const sortedProperties = visibleProperties
      .map((property) => ({
        property,
        distance: calculateDistance(
          centerLat,
          centerLng,
          property.lat,
          property.lng,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 100) // 최대 100개만 표시 (성능 최적화)
      .map((item) => item.property);

    setNearbyProperties(sortedProperties);

    // 상위 컴포넌트에 필터링된 매물 데이터 전달
    if (onPropertiesChange) {
      onPropertiesChange(sortedProperties);
    }

    // 지도에 마커 표시 (보이는 매물만)
    displayPropertyMarkers(sortedProperties);
  }, [
    onPropertiesChange,
    calculateDistance,
    displayPropertyMarkers,
    selectedDistrictIdFilter,
  ]);

  // updateVisibleProperties ref 업데이트
  useEffect(() => {
    updateVisiblePropertiesRef.current = updateVisibleProperties;
  }, [updateVisibleProperties]);

  // 카드 너비 계산 (반응형)
  const getCardWidth = () => {
    if (typeof window === "undefined") return 350;
    const isMobile = window.innerWidth < 640; // sm breakpoint
    return isMobile ? window.innerWidth - 32 : 350; // 모바일: 화면 너비 - padding(16px * 2), 데스크톱: 350px
  };

  // 카드 슬라이더 스크롤
  const scrollToCard = (index: number) => {
    if (cardSliderRef.current) {
      const cardWidth = getCardWidth() + 16; // 카드 너비 + gap
      cardSliderRef.current.scrollTo({
        left: index * cardWidth,
        behavior: "smooth",
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
      const normalizedIndex = Math.max(
        0,
        Math.min(index, nearbyProperties.length - 1),
      );
      setSelectedPropertyIndex(normalizedIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [nearbyProperties.length]);

  // 이전 카드로 이동 (무한 루프) — 스크롤만, 지도 줌 없음 (선택 시에만 줌)
  const handlePrevCard = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = getCardWidth() + 16;

      if (selectedPropertyIndex === 0) {
        const targetIndex = nearbyProperties.length - 1;
        container.scrollTo({
          left: targetIndex * cardWidth,
          behavior: "smooth",
        });
        setSelectedPropertyIndex(targetIndex);
      } else {
        const newIndex = selectedPropertyIndex - 1;
        container.scrollBy({ left: -cardWidth, behavior: "smooth" });
        setSelectedPropertyIndex(newIndex);
      }
    }
  };

  // 다음 카드로 이동 (무한 루프) — 스크롤만, 지도 줌 없음 (선택 시에만 줌)
  const handleNextCard = () => {
    if (cardSliderRef.current && nearbyProperties.length > 0) {
      const container = cardSliderRef.current;
      const cardWidth = getCardWidth() + 16;

      if (selectedPropertyIndex >= nearbyProperties.length - 1) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        setSelectedPropertyIndex(0);
      } else {
        const newIndex = selectedPropertyIndex + 1;
        container.scrollBy({ left: cardWidth, behavior: "smooth" });
        setSelectedPropertyIndex(newIndex);
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
      lastSearchValueRef.current = "";
      return;
    }

    // 디바운싱: 250ms 후 검색 (도시·구·명소 하드코딩, 5개국어·키워드·toLowerCase·1글자 자동완성)
    debounceTimerRef.current = setTimeout(() => {
      try {
        setIsSearching(true);

        const regionResults = searchRegions(value);
        const regionSuggestions: Suggestion[] = regionResults.map(
          (region) => regionToSuggestion(region, currentLanguage) as Suggestion,
        );
        const cityResults = regionSuggestions.filter(
          (r) => r.regionType === "city",
        );
        const districtResults = regionSuggestions.filter(
          (r) => r.regionType === "district",
        );

        const landmarkScored = searchLandmarksScored(value);
        const landmarkResults: Suggestion[] = landmarkScored.slice(0, 5).map(
          ({ landmark }) =>
            ({
              ...landmarkToSuggestion(landmark, currentLanguage),
              zoom: 16,
            }) as Suggestion,
        );

        const combinedResults = [
          ...cityResults,
          ...districtResults,
          ...landmarkResults,
        ].slice(0, 10);

        setSuggestions(combinedResults);
        setShowSuggestions(combinedResults.length > 0);
      } catch (error) {
        console.error("❌ 검색 오류:", error);
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
    const displayText = suggestion.Text || "";
    setSearchValue(displayText);
    setIsSearching(true);

    // 도시 선택 → 구 필터 해제
    if (suggestion.isRegion && suggestion.regionType === "city") {
      setSelectedDistrictIdFilter(null);
    }
    // 구 선택 → 해당 구 필터 활성화
    if (
      suggestion.isRegion &&
      suggestion.regionType === "district" &&
      suggestion.PlaceId
    ) {
      const districtId = suggestion.PlaceId.replace(/^region-/, "");
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
            color:
              suggestion.isLandmark &&
              suggestion.landmarkCategory === "landmark"
                ? "#dc2626"
                : suggestion.isLandmark &&
                    suggestion.landmarkCategory === "shopping"
                  ? "#2563eb"
                  : suggestion.isLandmark &&
                      suggestion.landmarkCategory === "residential"
                    ? "#16a34a"
                    : suggestion.isLandmark &&
                        suggestion.landmarkCategory === "tourism"
                      ? "#9333ea"
                      : "#FF6B35",
            scale: 1.2,
          })
            .setLngLat([safeLng, safeLat])
            .addTo(map.current);
        } else {
          marker.current = null;
        }

        map.current.once("moveend", () => {
          if (updateVisiblePropertiesRef.current)
            updateVisiblePropertiesRef.current();
        });
      }
    }
    setIsSearching(false);
  };

  // 검색창 초기화 (구 필터도 해제)
  const handleClearSearch = () => {
    setSearchValue("");
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

  const thumbTop = Math.max(
    0,
    Math.min(
      RULER_HEIGHT - THUMB_SIZE,
      ((ZOOM_MAX - rulerZoom) / (ZOOM_MAX - ZOOM_MIN)) *
        (RULER_HEIGHT - THUMB_SIZE),
    ),
  );

  const applyZoomDelta = useCallback((delta: number) => {
    const m = map.current;
    if (!m) return;
    const z = m.getZoom();
    m.easeTo({
      zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta)),
      duration: 220,
    });
  }, []);

  const handleZoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      applyZoomDelta(1);
    },
    [applyZoomDelta],
  );

  const handleZoomOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      applyZoomDelta(-1);
    },
    [applyZoomDelta],
  );

  const handleZoomTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const m = map.current;
    if (!m) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const span = RULER_HEIGHT - THUMB_SIZE;
    const t = Math.max(0, Math.min(1, y / span));
    const nextZoom = Math.round(ZOOM_MAX - t * (ZOOM_MAX - ZOOM_MIN));
    m.easeTo({
      zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZoom)),
      duration: 240,
    });
  }, []);

  return (
    <div className="relative w-full h-full" style={{ minHeight: "100%" }}>
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

      {/* 지도 컨테이너: touch-action pan-y로 세로 터치를 페이지 스크롤에 넘겨 스크롤이 끊기지 않도록 함 */}
      <div
        ref={mapContainer}
        className="w-full h-full map-touch-scroll-passthrough"
        style={{
          width: "100vw", // 사이드바 표시를 덮기 위해 전체 너비 사용
          height: "100%",
          minHeight: "400px",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1, // 사이드바 표시 위에 표시
          backgroundColor: "#f3f4f6", // 로딩 중 배경색
          touchAction: "pan-y",
        }}
      />

      {/* 우측 세로 줌 룰러: + / 세로 트랙(클릭 시 해당 줌) / - */}
      <div
        className="zoom-ruler-wrap absolute right-0 top-1/2 z-20 -translate-y-1/2 flex flex-col items-center pointer-events-none select-none gap-1"
        style={{ height: RULER_HEIGHT + 44 }}
      >
        <div
          className="pointer-events-auto flex flex-col items-center gap-1"
          role="group"
          aria-label="Map zoom"
        >
          <button
            type="button"
            onClick={handleZoomIn}
            className="zoom-ruler-btn flex items-center justify-center w-8 h-8 rounded-lg bg-white text-[#E63946] shadow-md border-0 cursor-pointer touch-manipulation"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4 pointer-events-none" strokeWidth={3} />
          </button>
          <div
            className="zoom-ruler-track w-1.5 rounded-full bg-gray-300/80 flex-shrink-0 relative cursor-pointer touch-manipulation"
            style={{ height: RULER_HEIGHT, backgroundColor: "#E5E7EB" }}
            onClick={handleZoomTrackClick}
            aria-label="Set zoom by position"
          >
            {/* 동그라미 포인터: 현재 줌 위치 */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#E63946] border-2 border-white shadow-md pointer-events-none"
              style={{
                top: thumbTop,
                width: THUMB_SIZE + 2,
                height: THUMB_SIZE + 2,
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleZoomOut}
            className="zoom-ruler-btn flex items-center justify-center w-8 h-8 rounded-lg bg-white text-[#E63946] shadow-md border-0 cursor-pointer touch-manipulation"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4 pointer-events-none" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {mapError && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800 text-sm font-medium">오류</p>
          <p className="text-red-600 text-sm mt-1">{mapError}</p>
          <p className="text-red-500 text-xs mt-2">
            환경 변수(NEXT_PUBLIC_AWS_API_KEY, NEXT_PUBLIC_AWS_MAP_NAME)를
            확인해주세요.
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
                {getUIText("locationPermissionTitle", currentLanguage)}
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              {getUIText("locationPermissionDesc", currentLanguage)}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  writeGeoConsentDismissTime();
                  setShowLocationConsentModal(false);
                  hasRequestedLocationRef.current = true;
                  setUserLocation(null);
                  flyToHcmcDistrict1(map.current, 1000);
                  if (marker.current) {
                    marker.current.remove();
                    marker.current = null;
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {getUIText("deny", currentLanguage)}
              </button>
              <button
                onClick={requestLocation}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {getUIText("allow", currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
