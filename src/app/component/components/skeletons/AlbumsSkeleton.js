"use client";

export default function AlbumsSkeleton() {
  return (
    <div className="w-full h-full overflow-hidden animate-pulse">
      {/* Header */}
      <div className="w-40 h-7 bg-zinc-800 rounded mb-4" />

      {/* Album Grid */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded">
            {/* Album Cover */}
            <div className="w-16 h-16 bg-zinc-800 rounded flex-shrink-0" />

            {/* Album Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="w-full h-4 bg-zinc-800 rounded" />
              <div className="w-2/3 h-3 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
