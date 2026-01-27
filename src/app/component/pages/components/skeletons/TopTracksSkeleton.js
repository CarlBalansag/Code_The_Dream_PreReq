"use client";

export default function TopTracksSkeleton() {
  return (
    <div className="w-full h-full overflow-hidden animate-pulse">
      {/* Header */}
      <div className="w-48 h-7 bg-zinc-800 rounded mb-4" />

      {/* Track List */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded">
            {/* Track Number */}
            <div className="w-6 h-6 bg-zinc-800 rounded" />

            {/* Album Art */}
            <div className="w-12 h-12 bg-zinc-800 rounded flex-shrink-0" />

            {/* Track Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="w-3/4 h-4 bg-zinc-800 rounded" />
              <div className="w-1/2 h-3 bg-zinc-800 rounded" />
            </div>

            {/* Duration */}
            <div className="w-10 h-4 bg-zinc-800 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
