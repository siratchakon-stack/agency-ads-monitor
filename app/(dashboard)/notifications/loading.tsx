import { NotificationSkeleton } from "@/components/ui/PageSkeleton";

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="skeleton h-5 w-36 rounded" />
      </div>
      <div className="p-6 space-y-5">
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="skeleton w-9 h-9 rounded-xl" />
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-6 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
        <NotificationSkeleton count={6} />
      </div>
    </div>
  );
}
