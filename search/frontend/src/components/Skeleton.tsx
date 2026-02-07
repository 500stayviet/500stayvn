/**
 * Skeleton UI 컴포넌트
 * 
 * 데이터 로딩 중 표시되는 스켈레톤 UI
 * 33m2 스타일의 깔끔한 로딩 상태
 */

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden animate-pulse">
      {/* 이미지 스켈레톤 */}
      <div className="w-full h-48 bg-gray-200" />

      {/* 콘텐츠 스켈레톤 */}
      <div className="p-4 space-y-3">
        {/* 제목 스켈레톤 */}
        <div className="h-6 bg-gray-200 rounded w-3/4" />

        {/* 설명 스켈레톤 */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        {/* 가격 스켈레톤 */}
        <div className="h-8 bg-gray-200 rounded w-1/3" />

        {/* 상세 정보 스켈레톤 */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function PropertyListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
