export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="skeleton h-7 w-16 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
            <div className="skeleton w-10 h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-3">
        <div className="skeleton h-9 flex-1 max-w-sm rounded-lg" />
        <div className="skeleton h-9 w-24 rounded-lg ml-auto" />
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="skeleton h-4 w-4 rounded" />
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-4 flex-1 rounded" />
            <div className="skeleton h-4 w-20 rounded hidden md:block" />
            <div className="skeleton h-4 w-20 rounded hidden lg:block" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map((j) => <div key={j} className="skeleton h-14 rounded-lg" />)}
          </div>
          <div className="skeleton h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function NotificationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex items-start gap-3">
          <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton h-5 w-12 rounded-full" />
            </div>
            <div className="skeleton h-3 w-64 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
