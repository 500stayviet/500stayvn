import maplibregl from "maplibre-gl";

/**
 * 기본 지도 중심: 호치민 1군 (HCMC_DISTRICTS `hcmc-d1` 와 동일).
 * — URL 좌표 없음, 위치 미동의, 베트남 밖 GPS, 위치 오류 등
 */
export const DEFAULT_MAP_CENTER_HCMC_D1 = {
  lat: 10.7756,
  lng: 106.7019,
} as const;

export const DEFAULT_MAP_FALLBACK_ZOOM = 14;
export const ZOOM_MIN = 10;
export const ZOOM_MAX = 18;
export const RULER_HEIGHT = 120;
export const THUMB_SIZE = 12;

/**
 * 위치 미동의(모달 거부) 시각 저장.
 * 재노출: 같은 달력 날짜가 아니면 다시 모달 (자정이 지난 뒤, 아래 타임존 기준).
 */
const GEO_CONSENT_DISMISS_KEY = "mapGeoConsentDismissedAt";
const GEO_CONSENT_CALENDAR_TZ =
  process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Asia/Ho_Chi_Minh";

export function flyToHcmcDistrict1(
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

export function writeGeoConsentDismissTime(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GEO_CONSENT_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearGeoConsentDismissTime(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GEO_CONSENT_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

/** 미동의(거부) 사용자: 마지막 거부일과 오늘(달력)이 다르면 다시 모달 */
export function shouldShowGeoConsentModal(): boolean {
  const t = readGeoConsentDismissTime();
  if (t === null) return true;
  const dismissedDay = calendarYmdInZone(t, GEO_CONSENT_CALENDAR_TZ);
  const today = calendarYmdInZone(Date.now(), GEO_CONSENT_CALENDAR_TZ);
  return dismissedDay !== today;
}

// 베트남 경계 확인 (대략적인 범위)
export const isInVietnam = (lat: number, lng: number): boolean => {
  return lat >= 8.5 && lat <= 23.5 && lng >= 102 && lng <= 110;
};

export function escapeHtmlLandmarkName(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 두 좌표 간 거리 계산 (km) - 근거리 우선 최적화
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
  if (distanceKm < 0.1) {
    return distanceKm;
  }

  const R = 6371;
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
}
