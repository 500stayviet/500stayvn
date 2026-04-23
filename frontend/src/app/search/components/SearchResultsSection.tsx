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
    <div className="p-4" data-testid="search-results-section">
      {loading ? (
        <div className="text-center py-12 text-gray-500" data-testid="search-results-loading">
          {getUIText("searching", currentLanguage)}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12 text-gray-500" data-testid="search-results-empty">
          {getUIText("noResultsFound", currentLanguage)}
        </div>
      ) : (
        <div className="space-y-4" data-testid="search-results-list">
          <div className="text-sm text-gray-600 mb-4" data-testid="search-results-count">
            {filteredProperties.length}
            {getUIText("propertiesFound", currentLanguage)}
          </div>
          {filteredProperties.map((property) => (
            <button
              key={property.id}
              type="button"
              data-testid={`search-result-item-${property.id}`}
              onClick={() => onPropertyClick(property)}
              className="cursor-pointer"
            >
              <PropertyCard
                property={property}
                isSelected={false}
                onClick={() => onPropertyClick(property)}
                currentLanguage={currentLanguage}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
