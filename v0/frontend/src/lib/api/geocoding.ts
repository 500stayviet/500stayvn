/**
 * Geocoding API (AWS Location Service 기반)
 *
 * 주소 ↔ 좌표 변환 서비스
 */

import {
  searchPlaceIndexForText,
  searchPlaceIndexForPosition,
  getLocationServiceLanguage,
} from "./aws-location";
import { SupportedLanguage } from "./translation";

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
}

/**
 * 주소를 좌표로 변환 (Geocoding)
 *
 * @param address - 검색할 주소
 * @param language - 언어 코드
 * @returns 좌표 및 주소 정보
 */
export async function geocodeAddress(
  address: string,
  language: SupportedLanguage = "vi",
): Promise<GeocodingResult> {
  try {
    const locationLanguage = getLocationServiceLanguage(language);
    const results = await searchPlaceIndexForText(
      address,
      locationLanguage as any,
    );

    if (results.length > 0) {
      const result = results[0];
      const position = result.Place?.Geometry?.Point || [];

      return {
        lat: position[1] || 0, // 위도
        lng: position[0] || 0, // 경도
        formattedAddress: result.Place?.Label || address,
        placeId: result.Place?.PlaceId,
      };
    } else {
      throw new Error("No results found");
    }
  } catch (error) {
    throw new Error(
      `Geocoding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * 좌표를 주소로 변환 (Reverse Geocoding)
 *
 * @param lat - 위도
 * @param lng - 경도
 * @param language - 언어 코드
 * @returns 주소 문자열
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  language: SupportedLanguage = "vi",
): Promise<string> {
  try {
    const locationLanguage = getLocationServiceLanguage(language);
    const results = await searchPlaceIndexForPosition(
      lat,
      lng,
      locationLanguage as any,
    );

    if (results.length > 0) {
      return results[0].Place?.Label || "";
    } else {
      throw new Error("No results found");
    }
  } catch (error) {
    throw new Error(
      `Reverse geocoding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
