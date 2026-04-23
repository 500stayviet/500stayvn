import { useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getDistrictIdForCoord } from "@/lib/data/vietnam-regions";
import { getUIText } from "@/utils/i18n";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { clusterNearbyProperties } from "@/components/map/propertyCluster";
import { calculateDistanceKm } from "@/components/map/grabMapUtils";

export interface GrabMapProperty {
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

interface UseGrabMapMarkersParams {
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  propertyMarkersRef: React.MutableRefObject<maplibregl.Marker[]>;
  popupsRef: React.MutableRefObject<maplibregl.Popup[]>;
  selectedPropertyRef: React.MutableRefObject<GrabMapProperty | null>;
  nearbyPropertiesRef: React.MutableRefObject<GrabMapProperty[]>;
  updateVisiblePropertiesRef: React.MutableRefObject<(() => void) | undefined>;
  onPropertyPriorityChangeRef: React.MutableRefObject<
    ((property: GrabMapProperty) => void) | undefined
  >;
  allPropertiesRef: React.MutableRefObject<GrabMapProperty[]>;
  selectedDistrictIdFilter: string | null;
  currentLanguage: SupportedLanguage;
  onPropertiesChange?: (properties: GrabMapProperty[]) => void;
  onVisiblePropertiesChange: (properties: GrabMapProperty[]) => void;
  handlePropertyClick: (propertyId: string) => void;
}

export function useGrabMapMarkers({
  mapRef,
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
  onVisiblePropertiesChange,
  handlePropertyClick,
}: UseGrabMapMarkersParams) {
  const clusterProperties = useCallback(
    (properties: GrabMapProperty[], thresholdMeters = 0.01) =>
      clusterNearbyProperties(properties, thresholdMeters),
    [],
  );

  const displayPropertyMarkers = useCallback(
    (properties: GrabMapProperty[]) => {
      const map = mapRef.current;
      if (!map || !map.loaded()) return;

      if (!properties || properties.length === 0) {
        propertyMarkersRef.current.forEach((m) => m.remove());
        propertyMarkersRef.current = [];
        popupsRef.current.forEach((p) => p.remove());
        popupsRef.current = [];
        return;
      }

      propertyMarkersRef.current.forEach((m) => m.remove());
      propertyMarkersRef.current = [];
      popupsRef.current.forEach((p) => p.remove());
      popupsRef.current = [];

      const currentZoom = map.getZoom();
      const isZoomedIn = currentZoom >= 15;
      const clusters = clusterProperties(properties);
      if (!clusters || clusters.length === 0) return;

      clusters.forEach((cluster) => {
        const isCluster = cluster.properties.length > 1;
        const clusterItems = cluster.properties;
        const singlePropId = !isCluster && clusterItems[0] ? clusterItems[0].id : null;
        const isSelected =
          singlePropId && selectedPropertyRef.current?.id === singlePropId;
        const isClusterSelected =
          isCluster && clusterItems.some((p) => p.id === selectedPropertyRef.current?.id);

        const el = document.createElement("div");
        el.className = "property-marker";

        if (isCluster) {
          const clusterBorder = isClusterSelected ? "3px solid #E63946" : "2px solid white";
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
            ">${clusterItems.length}</div>
          </div>
        `;
        } else {
          const borderStyle = isSelected ? "3px solid #E63946" : "2px solid white";
          const singleProperty = clusterItems[0];
          const markerPrice = singleProperty?.price ? Number(singleProperty.price) : 0;
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

        const centerLat = Number(cluster.center.lat);
        const centerLng = Number(cluster.center.lng);
        if (!centerLat || !centerLng || isNaN(centerLat) || isNaN(centerLng)) return;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([centerLng, centerLat])
          .addTo(map);

        if (isCluster && isZoomedIn) {
          clusterItems.forEach((property) => {
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
            if (!propLat || !propLng || isNaN(propLat) || isNaN(propLng)) return;

            const distance = calculateDistanceKm(centerLat, centerLng, propLat, propLng);
            if (distance <= 0.005) return;

            const smallIsSelected = selectedPropertyRef.current?.id === property.id;
            const smallBorder = smallIsSelected ? "2px solid #E63946" : "1.5px solid white";
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

            const smallMarker = new maplibregl.Marker({ element: smallMarkerEl })
              .setLngLat([propLng, propLat])
              .addTo(map);

            smallMarkerEl.addEventListener("click", (e) => {
              e.stopPropagation();
              e.preventDefault();
              if (selectedPropertyRef.current?.id === property.id) {
                handlePropertyClick(property.id);
                return;
              }
              onPropertyPriorityChangeRef.current?.(property);
              selectedPropertyRef.current = property;
              updateVisiblePropertiesRef.current?.();
              if (!isNaN(propLat) && !isNaN(propLng)) {
                map.flyTo({ center: [propLng, propLat], zoom: 15, duration: 500 });
              }
            });

            propertyMarkersRef.current.push(smallMarker);
          });
        }

        let popupContent = "";
        if (isCluster) {
          popupContent = `
          <div style="padding: 8px; max-width: 280px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #FF6B35;">
              ${clusterItems.length}${getUIText("propertiesCount", currentLanguage)}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              ${getUIText("zoomInToSeeExactLocation", currentLanguage)}
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
              ${clusterItems
                .filter((p) => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng))
                .map((p, idx, filtered) => {
                  const distance = calculateDistanceKm(
                    centerLat,
                    centerLng,
                    Number(p.lat),
                    Number(p.lng),
                  );
                  const price = p.price && !isNaN(Number(p.price)) ? Number(p.price) : 0;
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
          const property = clusterItems[0];
          if (!property) return;
          const price = property.price && !isNaN(Number(property.price)) ? Number(property.price) : 0;
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

        const popup = new maplibregl.Popup({ offset: 25, closeOnClick: false }).setHTML(
          popupContent,
        );

        popup.on("open", () => {
          if (isCluster) return;
          const popupElement = popup.getElement();
          const propertyPopup = popupElement?.querySelector(".property-popup");
          if (!propertyPopup) return;

          propertyPopup.addEventListener("click", () => {
            const propertyId = propertyPopup.getAttribute("data-property-id");
            if (!propertyId) return;

            const prop = nearbyPropertiesRef.current.find((p) => p.id === propertyId);
            if (selectedPropertyRef.current?.id === propertyId) {
              handlePropertyClick(propertyId);
              return;
            }
            if (!prop) return;

            onPropertyPriorityChangeRef.current?.(prop);
            selectedPropertyRef.current = prop;
            updateVisiblePropertiesRef.current?.();
            const lat = Number(prop.lat);
            const lng = Number(prop.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              map.flyTo({ center: [lng, lat], zoom: 15, duration: 500 });
            }
          });
        });

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          popupsRef.current.forEach((p) => p.remove());

          if (!isCluster && clusterItems.length === 1) {
            const prop = clusterItems[0];
            if (selectedPropertyRef.current?.id === prop.id) {
              handlePropertyClick(prop.id);
              return;
            }
            onPropertyPriorityChangeRef.current?.(prop);
            selectedPropertyRef.current = prop;
            updateVisiblePropertiesRef.current?.();
            if (!isNaN(centerLat) && !isNaN(centerLng)) {
              map.flyTo({ center: [centerLng, centerLat], zoom: 15, duration: 500 });
            }
            marker.setPopup(popup);
            return;
          }

          const firstProperty = clusterItems[0];
          onPropertyPriorityChangeRef.current?.(firstProperty);
          selectedPropertyRef.current = firstProperty;
          updateVisiblePropertiesRef.current?.();
          if (!isNaN(centerLat) && !isNaN(centerLng)) {
            map.flyTo({ center: [centerLng, centerLat], zoom: 15, duration: 500 });
          }
          marker.setPopup(popup);
        });

        propertyMarkersRef.current.push(marker);
        popupsRef.current.push(popup);
      });
    },
    [
      clusterProperties,
      currentLanguage,
      handlePropertyClick,
      mapRef,
      nearbyPropertiesRef,
      onPropertyPriorityChangeRef,
      popupsRef,
      propertyMarkersRef,
      selectedPropertyRef,
      updateVisiblePropertiesRef,
    ],
  );

  const updateVisibleProperties = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    let currentProperties = allPropertiesRef.current;
    if (selectedDistrictIdFilter) {
      currentProperties = currentProperties.filter(
        (p) =>
          p?.lat != null &&
          p?.lng != null &&
          getDistrictIdForCoord(Number(p.lat), Number(p.lng)) === selectedDistrictIdFilter,
      );
    }

    const bounds = map.getBounds();
    const center = map.getCenter();
    const centerLat = center.lat;
    const centerLng = center.lng;

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const minLat = sw.lat;
    const maxLat = ne.lat;
    const minLng = sw.lng;
    const maxLng = ne.lng;

    const visibleProperties: GrabMapProperty[] = [];
    for (let i = 0; i < currentProperties.length; i++) {
      const property = currentProperties[i];
      if (
        property.lat == null ||
        property.lng == null ||
        isNaN(property.lat) ||
        isNaN(property.lng)
      ) {
        continue;
      }
      if (
        property.lat >= minLat &&
        property.lat <= maxLat &&
        property.lng >= minLng &&
        property.lng <= maxLng
      ) {
        visibleProperties.push(property);
      }
    }

    const sortedProperties = visibleProperties
      .map((property) => ({
        property,
        distance: calculateDistanceKm(centerLat, centerLng, property.lat, property.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 100)
      .map((item) => item.property);

    onVisiblePropertiesChange(sortedProperties);
    onPropertiesChange?.(sortedProperties);
    displayPropertyMarkers(sortedProperties);
  }, [
    allPropertiesRef,
    displayPropertyMarkers,
    mapRef,
    onPropertiesChange,
    onVisiblePropertiesChange,
    selectedDistrictIdFilter,
  ]);

  return {
    displayPropertyMarkers,
    updateVisibleProperties,
  };
}
