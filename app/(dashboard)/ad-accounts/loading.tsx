import { TableSkeleton } from "@/components/ui/PageSkeleton";

export default function AdAccountsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="skeleton h-5 w-32 rounded" />
            <div className="skeleton h-3 w-48 rounded" />
          </div>
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="p-6 space-y-5">
        {/* Filter skeleton */}
        <div className="flex gap-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="skeleton h-9 w-24 rounded-xl" />
          ))}
          <div className="skeleton h-9 w-28 rounded-xl ml-auto" />
        </div>
        <TableSkeleton rows={10} />
      </div>
    </div>
  );
}
