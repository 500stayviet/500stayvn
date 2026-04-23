import { calculateDistanceKm } from "@/components/map/grabMapUtils";

export interface MapPropertyPoint {
  id: string;
  lat: number;
  lng: number;
}

export interface PropertyCluster<T extends MapPropertyPoint> {
  properties: T[];
  center: { lat: number; lng: number };
}

/**
 * 지도 마커 중첩 완화를 위한 근거리 클러스터링.
 * 매물 수가 작으면 단순 비교, 많으면 그리드 기반으로 성능을 유지한다.
 */
export function clusterNearbyProperties<T extends MapPropertyPoint>(
  properties: T[],
  thresholdMeters = 0.01,
): PropertyCluster<T>[] {
  if (!properties || properties.length === 0) return [];

  if (properties.length <= 10) {
    const clusters: PropertyCluster<T>[] = [];
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

      const cluster: T[] = [property];
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

        const distance = calculateDistanceKm(
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
          cluster.reduce((sum, p) => sum + Number(p.lat), 0) / cluster.length;
        const avgLng =
          cluster.reduce((sum, p) => sum + Number(p.lng), 0) / cluster.length;
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

  const gridSize = thresholdMeters * 2;
  const gridMap = new Map<string, T[]>();

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
    const gridLat = Math.floor(property.lat / gridSize);
    const gridLng = Math.floor(property.lng / gridSize);
    const gridKey = `${gridLat},${gridLng}`;

    if (!gridMap.has(gridKey)) gridMap.set(gridKey, []);
    gridMap.get(gridKey)!.push(property);
  });

  const clusters: PropertyCluster<T>[] = [];
  const processed = new Set<string>();

  gridMap.forEach((gridProperties, gridKey) => {
    const [gridLat, gridLng] = gridKey.split(",").map(Number);

    gridProperties.forEach((property) => {
      if (processed.has(property.id)) return;

      const cluster: T[] = [property];
      processed.add(property.id);

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

            const distance = calculateDistanceKm(
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
          cluster.reduce((sum, p) => sum + Number(p.lat), 0) / cluster.length;
        const avgLng =
          cluster.reduce((sum, p) => sum + Number(p.lng), 0) / cluster.length;
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
}
