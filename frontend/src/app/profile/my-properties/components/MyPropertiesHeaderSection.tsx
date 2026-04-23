import { ArrowLeft } from "lucide-react";
import { getUIText } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { HostInventoryTab } from "../hooks/useMyPropertiesPageState";

interface MyPropertiesHeaderSectionProps {
  currentLanguage: SupportedLanguage;
  activeTab: HostInventoryTab;
  tabCount: (tab: HostInventoryTab) => number;
  onGoBack: () => void;
  onGoTab: (tab: HostInventoryTab) => void;
}

export default function MyPropertiesHeaderSection({
  currentLanguage,
  activeTab,
  tabCount,
  onGoBack,
  onGoTab,
}: MyPropertiesHeaderSectionProps) {
  const tabItems = [
    { id: "live" as const, labelKey: "tabAdvertLive" as const },
    { id: "pending" as const, labelKey: "tabAdvertPending" as const },
    { id: "ended" as const, labelKey: "tabAdvertSuspended" as const },
  ];

  return (
    <div className="mb-6">
      <button onClick={onGoBack} className="flex items-center gap-1 text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> <span>{getUIText("back", currentLanguage)}</span>
      </button>
      <h1 className="text-2xl font-bold text-gray-900">{getUIText("myProperties", currentLanguage)}</h1>

      <div className="grid grid-cols-2 gap-2 mt-5 sm:grid-cols-4">
        {tabItems.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => onGoTab(id)}
            className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === id ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {getUIText(labelKey, currentLanguage)}
            <span className="ml-1 tabular-nums opacity-80">({tabCount(id)})</span>
          </button>
        ))}
      </div>

      {activeTab === "pending" ? (
        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
          {getUIText("minRentablePeriodHint", currentLanguage)}
        </p>
      ) : null}
    </div>
  );
}
