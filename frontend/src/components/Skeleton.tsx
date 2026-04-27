/**
 * Skeleton placeholders for loading states (listing cards and lists).
 */

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-200" />

      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />

        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        <div className="h-8 bg-gray-200 rounded w-1/3" />

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
