"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";
import {
  getAvailableProperties,
  subscribeToProperties,
} from "@/lib/api/properties";
import { PropertyData } from "@/types/property";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import SearchBox from "@/components/map/SearchBox";
import MapZoomRuler from "@/components/map/MapZoomRuler";
import { getUIText, type BaseUITextKey } from "@/utils/i18n";
import { useGrabMapMarkers } from "@/hooks/map/useGrabMapMarkers";
import { useGrabMapSearch } from "@/hooks/map/useGrabMapSearch";
import {
  clearGeoConsentDismissTime,
  DEFAULT_MAP_CENTER_HCMC_D1,
  DEFAULT_MAP_FALLBACK_ZOOM,
  flyToHcmcDistrict1,
  isInVietnam,
  replaceLandmarkMarkers,
  RULER_HEIGHT,
  shouldShowGeoConsentModal,
  THUMB_SIZE,
  writeGeoConsentDismissTime,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/components/map/grabMapUtils";

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
  const [, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<{
    key: BaseUITextKey;
    detail?: string;
  } | null>(null);
  const [, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const allPropertiesRef = useRef<Property[]>([]); // ref로 최신 값 유지 (무한 루프 방지)
  const mapMoveDebounceRef = useRef<NodeJS.Timeout | null>(null);
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
  const currentLanguageRef = useRef(currentLanguage);
  currentLanguageRef.current = currentLanguage;
  const router = useRouter();

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
    const coords = propertyData.coordinates as unknown;

    // 형식 1/2/4: 객체 좌표
    if (coords && !Array.isArray(coords) && typeof coords === "object") {
      const coordObject = coords as Record<string, unknown>;
      if (coordObject.lat !== undefined && coordObject.lng !== undefined) {
        lat = Number(coordObject.lat);
        lng = Number(coordObject.lng);
      } else if (
        coordObject.latitude !== undefined &&
        coordObject.longitude !== undefined
      ) {
        lat = Number(coordObject.latitude);
        lng = Number(coordObject.longitude);
      } else if (coordObject.x !== undefined && coordObject.y !== undefined) {
        lat = Number(coordObject.x);
        lng = Number(coordObject.y);
      }
    }
    // 형식 3: 배열 좌표
    else if (Array.isArray(coords) && coords.length >= 2) {
      lat = Number(coords[0]);
      lng = Number(coords[1]);
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
  }, [initialLocation, updateUserLocationMarker]);

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
      setMapError({ key: "mapErrAwsApiKeyMissing" });
      isInitializingRef.current = false;
      return;
    }

    if (!mapName) {
      console.error("NEXT_PUBLIC_AWS_MAP_NAME is not set");
      setMapLoading(false);
      setMapError({ key: "mapErrAwsMapNameMissing" });
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
        attributionControl: {},
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

        landmarkMarkersRef.current = replaceLandmarkMarkers(
          map.current!,
          currentLanguageRef.current,
          landmarkMarkersRef.current,
        );
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
      map.current.on("error", (e: maplibregl.ErrorEvent) => {
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

        const fallbackEventMessageRaw = (e as unknown as { message?: unknown })
          .message;
        const fallbackEventMessage =
          typeof fallbackEventMessageRaw === "string"
            ? fallbackEventMessageRaw
            : undefined;

        let rawMessage = "";
        if (e.error?.message) {
          rawMessage = e.error.message;
        } else if (fallbackEventMessage) {
          rawMessage = fallbackEventMessage;
        }

        let errKey: BaseUITextKey = "mapErrLoadGeneric";
        if (
          rawMessage.includes("Failed to fetch") ||
          rawMessage.includes("NetworkError")
        ) {
          errKey = "mapErrNetworkAws";
        } else if (
          rawMessage.includes("401") ||
          rawMessage.includes("403")
        ) {
          errKey = "mapErrAwsKeyInvalid";
        } else if (rawMessage.includes("404")) {
          errKey = "mapErrMapNotFound";
        }

        setMapError({ key: errKey });
      });

      // 스타일 로드 에러 처리
      map.current.on("style.load", () => {
        console.log("Map style loaded");
      });

      map.current.on("style.error", (e) => {
        console.error("Style error:", e);
        setMapLoading(false);
        setMapError({ key: "mapErrStyleLoad" });
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

  const { updateVisibleProperties } = useGrabMapMarkers({
    mapRef: map,
    propertyMarkersRef,
    popupsRef,
    selectedPropertyRef,
    nearbyPropertiesRef,
    updateVisiblePropertiesRef,
    onPropertyPriorityChangeRef,
    allPropertiesRef,
    selectedDistrictIdFilter,
    currentLanguage,
    onPropertiesChange,
    onVisiblePropertiesChange: setNearbyProperties,
    handlePropertyClick,
  });

  // allProperties가 변경되면 지도 업데이트 (디바운싱 적용)
  useEffect(() => {
    if (map.current && allProperties.length > 0 && map.current.loaded()) {
      const timer = setTimeout(() => {
        updateVisiblePropertiesRef.current?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [allProperties]);

  // updateVisibleProperties ref 업데이트
  useEffect(() => {
    updateVisiblePropertiesRef.current = updateVisibleProperties;
  }, [updateVisibleProperties]);

  const {
    searchValue,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    isSearching,
    handleSearchChange,
    handleSelectSuggestion,
    handleClearSearch,
    handleSearchSubmit,
  } = useGrabMapSearch({
    mapRef: map,
    markerRef: marker,
    currentLanguage,
    updateVisiblePropertiesRef,
    setSelectedDistrictIdFilter,
  });

  // 언어 변경 시 명소 팝업·매물 마커·검색 제안 갱신
  useEffect(() => {
    if (map.current?.loaded()) {
      landmarkMarkersRef.current = replaceLandmarkMarkers(
        map.current,
        currentLanguage,
        landmarkMarkersRef.current,
      );
    }
    if (updateVisiblePropertiesRef.current) {
      updateVisiblePropertiesRef.current();
    }
    if (searchValue.trim()) {
      handleSearchChange(searchValue);
    }
  }, [currentLanguage, handleSearchChange, searchValue]);

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

      <MapZoomRuler
        rulerHeight={RULER_HEIGHT}
        thumbSize={THUMB_SIZE}
        thumbTop={thumbTop}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onTrackClick={handleZoomTrackClick}
      />

      {/* 에러 메시지 */}
      {mapError && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800 text-sm font-medium">
            {getUIText("mapErrorHeading", currentLanguage)}
          </p>
          <p className="text-red-600 text-sm mt-1">
            {getUIText(mapError.key, currentLanguage)}
          </p>
          {mapError.detail ? (
            <p className="text-red-500 text-xs mt-1 font-mono break-all">
              {mapError.detail}
            </p>
          ) : null}
          <p className="text-red-500 text-xs mt-2">
            {getUIText("mapErrCheckEnvHint", currentLanguage)}
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
