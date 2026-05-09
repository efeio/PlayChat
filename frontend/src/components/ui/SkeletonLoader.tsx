export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-elevated border border-border rounded-lg animate-pulse ${className}`} />
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <SkeletonLoader className="h-5 w-32" />
        <SkeletonLoader className="h-4 w-16" />
      </div>
      <SkeletonLoader className="h-4 w-24 mb-4" />
      <div className="flex items-center justify-between">
        <SkeletonLoader className="h-4 w-20" />
        <SkeletonLoader className="h-9 w-20" />
      </div>
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <SkeletonLoader className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <SkeletonLoader className="h-4 w-24 mb-1" />
            <SkeletonLoader className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GameAreaSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <SkeletonLoader className="w-64 h-64 rounded-xl" />
        <SkeletonLoader className="h-5 w-48" />
        <SkeletonLoader className="h-4 w-32" />
      </div>
    </div>
  );
}
