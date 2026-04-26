import { Suspense } from "react";
import SearchPageContent from "./components/SearchPageContent";
import { SearchPageSuspenseFallback } from "./components/SearchPageSuspenseFallback";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSuspenseFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
