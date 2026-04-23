import { useEffect } from "react";
import { getAvailableProperties } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";

type UseSearchPageLifecycleParams = {
  query: string;
  cityIdParam: string;
  districtIdParam: string;
  properties: PropertyData[];
  filtersApplied: boolean;
  filterVersion: number;
  shouldAutoApplyFilters: boolean;
  applyFilters: () => void;
  syncFromUrlParams: (
    query: string,
    cityId: string,
    districtId: string,
  ) => void;
  applyRegionMatchFromQuery: (query: string) => boolean;
  setShouldAutoApplyFilters: (value: boolean) => void;
  setProperties: (properties: PropertyData[]) => void;
  setFilteredProperties: (properties: PropertyData[]) => void;
  setMinPrice: (value: number) => void;
  setMaxPrice: (value: number) => void;
  setLoading: (value: boolean) => void;
  setFiltersApplied: (value: boolean) => void;
};

export function useSearchPageLifecycle({
  query,
  cityIdParam,
  districtIdParam,
  properties,
  filtersApplied,
  filterVersion,
  shouldAutoApplyFilters,
  applyFilters,
  syncFromUrlParams,
  applyRegionMatchFromQuery,
  setShouldAutoApplyFilters,
  setProperties,
  setFilteredProperties,
  setMinPrice,
  setMaxPrice,
  setLoading,
  setFiltersApplied,
}: UseSearchPageLifecycleParams) {
  // URL 파라미터와 로컬 상태를 동기화한다.
  useEffect(() => {
    syncFromUrlParams(query, cityIdParam, districtIdParam);
    if (query || cityIdParam || districtIdParam) {
      setShouldAutoApplyFilters(true);
    }
  }, [
    query,
    cityIdParam,
    districtIdParam,
    syncFromUrlParams,
    setShouldAutoApplyFilters,
  ]);

  // q만 있는 진입에서는 검색어로 지역 매칭을 시도한다.
  useEffect(() => {
    if (!query.trim() || cityIdParam || districtIdParam) return;
    if (applyRegionMatchFromQuery(query)) {
      setShouldAutoApplyFilters(true);
    }
  }, [
    query,
    cityIdParam,
    districtIdParam,
    applyRegionMatchFromQuery,
    setShouldAutoApplyFilters,
  ]);

  // 매물 로드 후 초기 가격 범위 및 기본 목록을 설정한다.
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const allProperties = await getAvailableProperties();
        setProperties(allProperties);

        if (allProperties.length > 0) {
          const prices = allProperties
            .map((p) => p.price || 0)
            .filter((p) => p > 0);
          if (prices.length > 0) {
            setMinPrice(Math.min(...prices));
            setMaxPrice(Math.max(...prices));
          }
        }

        setFilteredProperties(allProperties);
      } catch (error) {
        console.error("Error loading properties:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [setFilteredProperties, setLoading, setMaxPrice, setMinPrice, setProperties]);

  // 필터 적용 상태와 버전에 맞춰 리스트를 재계산한다.
  useEffect(() => {
    if (!filtersApplied) {
      setFilteredProperties(properties);
    } else {
      applyFilters();
    }
  }, [
    properties,
    filtersApplied,
    filterVersion,
    applyFilters,
    setFilteredProperties,
  ]);

  // URL 파라미터 기반 자동 적용은 1회만 수행한다.
  useEffect(() => {
    if (properties.length > 0 && shouldAutoApplyFilters) {
      setFiltersApplied(true);
      applyFilters();
      setShouldAutoApplyFilters(false);
    }
  }, [
    properties,
    shouldAutoApplyFilters,
    applyFilters,
    setShouldAutoApplyFilters,
    setFiltersApplied,
  ]);
}
