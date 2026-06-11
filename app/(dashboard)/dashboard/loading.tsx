import { StatsSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="skeleton h-5 w-28 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="p-6 space-y-5">
        <StatsSkeleton />

        {/* Chart + Status skeleton */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="card p-5 lg:col-span-2">
            <div className="skeleton h-4 w-48 rounded mb-2" />
            <div className="skeleton h-3 w-32 rounded mb-4" />
            <div className="skeleton h-48 w-full rounded-xl" />
          </div>
          <div className="card p-5 space-y-3">
            <div className="skeleton h-4 w-32 rounded mb-2" />
            {[1,2,3,4].map((i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        </div>

        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}
