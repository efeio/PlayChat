export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-surface border border-border-default rounded-2xl animate-pulse ${className}`} />
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-6 min-h-[220px] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-5">
          <SkeletonLoader className="h-6 w-36" />
          <SkeletonLoader className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonLoader className="h-4 w-28 mb-8" />
        <div className="flex -space-x-2 mb-8">
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} className="w-8 h-8 rounded-full" />
          ))}
        </div>
      </div>
      <SkeletonLoader className="h-11 w-full rounded-lg" />
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
        <SkeletonLoader className="w-64 h-64 rounded-3xl" />
        <SkeletonLoader className="h-5 w-48 rounded-full" />
        <SkeletonLoader className="h-4 w-32 rounded-full" />
      </div>
    </div>
  );
}
