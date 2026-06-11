export default function SettingsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="skeleton h-5 w-24 rounded" />
      </div>
      <div className="p-6 grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton h-4 w-32 rounded" />
              </div>
              <div className="skeleton h-10 w-full rounded-lg" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
        {/* Right column — sync history */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-4">
                <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-40 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
