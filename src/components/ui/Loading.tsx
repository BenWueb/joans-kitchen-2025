export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className || ""}`} />
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg h-28 sm:h-32 bg-gray-700 animate-pulse" />
  );
}

export function RecipeCarouselSkeleton() {
  return (
    <div className="relative w-full aspect-video md:aspect-21/9 rounded-lg shadow-lg overflow-hidden mb-8 bg-gray-200 animate-pulse">
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading recipes...</p>
      </div>
    </div>
  );
}

