export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-sage-light/30 rounded-md mb-2"></div>
          <div className="h-4 w-64 bg-sage-light/20 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-sage-light/30 rounded-md"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 border-t-4 border-t-sage-light/40">
            <div className="h-3 w-20 bg-sage-light/20 rounded mb-4"></div>
            <div className="h-8 w-32 bg-sage-light/30 rounded mb-2"></div>
            <div className="h-3 w-24 bg-sage-light/20 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-sage-light/20 flex gap-4 bg-gray-50/50">
          <div className="h-10 flex-1 max-w-xs bg-sage-light/20 rounded-md"></div>
          <div className="h-10 w-32 bg-sage-light/20 rounded-md"></div>
        </div>
        
        {/* Table rows */}
        <div className="p-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border-b border-sage-light/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-sage-light/20 rounded-md"></div>
                <div>
                  <div className="h-4 w-40 bg-sage-light/30 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-sage-light/20 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="h-4 w-20 bg-sage-light/20 rounded hidden sm:block"></div>
                <div className="h-6 w-24 bg-sage-light/30 rounded-full hidden sm:block"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-sage-light/20 rounded"></div>
                  <div className="h-8 w-8 bg-sage-light/20 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
