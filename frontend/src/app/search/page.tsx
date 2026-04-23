import { Suspense } from "react";
import SearchPageContent from "./components/SearchPageContent";

// 3. 빌드 에러 해결을 위한 외부 래퍼
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
