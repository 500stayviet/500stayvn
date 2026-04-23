"use client";

import TopBar from "@/components/TopBar";
import GrabMapComponent from "@/components/GrabMapComponent";
import Property3DCardSlider from "@/components/Property3DCardSlider";
import { getUIText } from "@/utils/i18n";
import { useMapPageState } from "@/hooks/map/useMapPageState";

export default function MapPageContent() {
  const {
    router,
    currentLanguage,
    setCurrentLanguage,
    nearbyProperties,
    setNearbyProperties,
    selectedPropertyIndex,
    selectedProperty,
    initialLocation,
    locationDenied,
    locationLoading,
    handlePropertySelect,
    handlePropertyPriorityChange,
  } = useMapPageState();

  return (
    <div className="h-screen overflow-hidden bg-gray-100 flex justify-center">
      <div
        className="map-page-scroll w-full max-w-[430px] h-screen bg-white shadow-2xl flex flex-col relative overflow-y-auto overscroll-y-auto"
        style={{
          scrollbarGutter: "stable",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />
        <main className="flex-1 relative flex flex-col min-h-0 bg-white">
          <div className="h-[40vh] min-h-[220px] max-h-[40vh] relative flex-shrink-0 overflow-hidden w-full">
            <GrabMapComponent
              onPropertiesChange={setNearbyProperties}
              onPropertySelect={handlePropertySelect}
              selectedProperty={selectedProperty}
              onPropertyPriorityChange={handlePropertyPriorityChange}
              initialLocation={initialLocation}
              locationDenied={locationDenied}
              locationLoading={locationLoading}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[320px] bg-white flex-shrink-0 w-full">
            <div className="flex-shrink-0 px-4 pt-4 pb-2 sm:px-6 sm:pt-5 sm:pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words leading-tight">
                {getUIText("popularStaysNearby", currentLanguage)}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {nearbyProperties.length}{" "}
                {getUIText("propertiesCount", currentLanguage)}
              </p>
            </div>

            <div className="flex-1 h-auto relative px-2 pb-2">
              <Property3DCardSlider
                properties={nearbyProperties}
                selectedIndex={selectedPropertyIndex}
                onSelectIndex={(index) => {
                  handlePropertySelect(index);
                }}
                onCardClick={(property, index) => {
                  handlePropertySelect(index, property);
                  router.push(`/properties/${property.id}`);
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
