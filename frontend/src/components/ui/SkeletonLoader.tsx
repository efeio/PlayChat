export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-card border border-border-subtle rounded-xl animate-pulse ${className}`} />
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="bg-bg-surface/60 border border-border-default rounded-[20px] p-6 min-h-[240px] flex flex-col justify-between backdrop-blur-sm">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <SkeletonLoader className="w-10 h-10 !rounded-xl" />
            <div>
              <SkeletonLoader className="h-4 w-28 mb-2" />
              <SkeletonLoader className="h-3 w-16" />
            </div>
          </div>
          <SkeletonLoader className="h-5 w-14 !rounded-full" />
        </div>
        <div className="flex -space-x-2 mb-6">
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} className="w-7 h-7 !rounded-full ring-2 ring-bg-surface" />
          ))}
        </div>
      </div>
      <SkeletonLoader className="h-[46px] w-full !rounded-2xl" />
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <SkeletonLoader className="w-8 h-8 !rounded-full" />
          <div className="flex-1">
            <SkeletonLoader className="h-3.5 w-24 mb-1.5" />
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
      <div className="flex flex-col items-center gap-5">
        <SkeletonLoader className="w-16 h-16 !rounded-2xl" />
        <SkeletonLoader className="h-4 w-40" />
        <SkeletonLoader className="h-3 w-28" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} className="w-28 h-28 !rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
