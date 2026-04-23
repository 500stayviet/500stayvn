import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";
import PropertyCard from "@/components/PropertyCard";
import type { PropertyData } from "@/types/property";

type SearchResultsSectionProps = {
  loading: boolean;
  filteredProperties: PropertyData[];
  currentLanguage: SupportedLanguage;
  onPropertyClick: (property: PropertyData) => void;
};

export function SearchResultsSection({
  loading,
  filteredProperties,
  currentLanguage,
  onPropertyClick,
}: SearchResultsSectionProps) {
  return (
    <div className="p-4">
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          {getUIText("searching", currentLanguage)}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {getUIText("noResultsFound", currentLanguage)}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            {filteredProperties.length}
            {getUIText("propertiesFound", currentLanguage)}
          </div>
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={false}
              onClick={() => onPropertyClick(property)}
              currentLanguage={currentLanguage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
