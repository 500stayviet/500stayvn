"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

/** /map?lat=&lng= 및 위치 권한 플래그 쿼리 */
export function useMapUrlLocation() {
  const searchParams = useSearchParams();
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const deniedParam = searchParams.get("denied");
  const loadingParam = searchParams.get("loading");

  const initialLocation = useMemo(
    () =>
      latParam && lngParam
        ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
        : null,
    [latParam, lngParam],
  );

  return {
    initialLocation,
    locationDenied: deniedParam === "true",
    locationLoading: loadingParam === "true",
  };
}
