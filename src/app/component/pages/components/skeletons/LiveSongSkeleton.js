"use client";

export default function LiveSongSkeleton() {
  return (
    <div className="relative w-full max-w-[550px] mx-auto md:mx-0 md:ml-[2vw] flex flex-col items-center p-4 rounded-xl animate-pulse">
      {/* Album Art Skeleton */}
      <div className="w-[500px] h-[400px] bg-zinc-800 rounded-xl" />

      {/* Song Title Skeleton */}
      <div className="w-3/4 h-8 bg-zinc-800 rounded mt-4" />

      {/* Artist Name Skeleton */}
      <div className="w-1/2 h-6 bg-zinc-800 rounded mt-3" />

      {/* Control Buttons Skeleton */}
      <div className="mt-5 mb-5 flex gap-9">
        <div className="w-12 h-12 bg-zinc-800 rounded-full" />
        <div className="w-16 h-16 bg-zinc-800 rounded-full" />
        <div className="w-12 h-12 bg-zinc-800 rounded-full" />
      </div>
    </div>
  );
}
