"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const BASE_INTERVAL = 30000; // 30s baseline
const QUIET_MAX_INTERVAL = 60000; // back off to 60s when nothing changes
const RATE_LIMIT_INTERVAL = 120000; // hard back off when Spotify rate limits

export default function RecentlyPlayedList({ accessToken, name, onLoadingChange }) {
  const [recentTracks, setRecentTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pollInterval, setPollInterval] = useState(BASE_INTERVAL);
  const [hasChanges, setHasChanges] = useState(true);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const isFetchingRef = useRef(false);
  const lastTrackIdRef = useRef(null);
  const timerRef = useRef(null);
  const visibilityRef = useRef(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );

  // Keep the latest callback reference for loading state changes
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
  }, [onLoadingChange]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchRecentlyPlayed = useCallback(
    async (isInitialLoad = false) => {
      if (!accessToken || isFetchingRef.current || !visibilityRef.current) return;

      isFetchingRef.current = true;

      if (isInitialLoad) {
        setIsLoading(true);
        if (onLoadingChangeRef.current) onLoadingChangeRef.current(true);
      }

      try {
        const res = await fetch(
          `https://api.spotify.com/v1/me/player/recently-played?limit=50`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (res.status === 429) {
          console.warn("Rate limited when fetching recently played; backing off");
          setHasChanges(false);
          setPollInterval(RATE_LIMIT_INTERVAL);
          return;
        }

        if (!res.ok) {
          console.error(`Error fetching recently played: ${res.status}`);
          return;
        }

        const data = await res.json();
        const formatted = data.items.map(({ track }) => ({
          name: track.name,
          id: track.id,
          image: track.album?.images[0]?.url || "",
          artists: track.artists.map((a) => a.name).join(", "),
        }));

        const firstTrackId = formatted[0]?.id || null;
        const changed = firstTrackId && firstTrackId !== lastTrackIdRef.current;

        lastTrackIdRef.current = firstTrackId;
        setHasChanges(Boolean(changed));
        setRecentTracks(formatted);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
          if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
        }
        isFetchingRef.current = false;
      }
    },
    [accessToken]
  );

  // Adjust polling interval based on recent changes and rate limiting
  useEffect(() => {
    setPollInterval((prev) => {
      if (!hasChanges) {
        // Gradually back off up to the quiet max unless already in a rate-limit state
        if (prev >= RATE_LIMIT_INTERVAL) return prev;
        const next = Math.min(
          Math.max(Math.floor(prev * 1.5), BASE_INTERVAL),
          QUIET_MAX_INTERVAL
        );
        return next;
      }

      // When changes resume, reset to baseline unless we are in a rate-limit wait
      if (prev > BASE_INTERVAL && prev < RATE_LIMIT_INTERVAL) {
        return BASE_INTERVAL;
      }

      return prev;
    });
  }, [hasChanges]);

  // Pause/resume polling when the tab visibility changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      visibilityRef.current = document.visibilityState === "visible";
      if (visibilityRef.current) {
        fetchRecentlyPlayed(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchRecentlyPlayed]);

  // Start polling with adaptive backoff and clear on unmount
  useEffect(() => {
    if (!accessToken) return undefined;

    const scheduleNext = () => {
      clearTimer();
      timerRef.current = setTimeout(async () => {
        if (!visibilityRef.current) {
          scheduleNext();
          return;
        }

        await fetchRecentlyPlayed(false);
        scheduleNext();
      }, pollInterval);
    };

    fetchRecentlyPlayed(true).finally(scheduleNext);

    return () => {
      clearTimer();
    };
  }, [accessToken, pollInterval, fetchRecentlyPlayed, clearTimer]);

  if (isLoading && onLoadingChange) {
    return null; // Return null while loading if parent handles overlay
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      {/* Header (fixed within card, not in scroll) */}
      <div className="z-10 px-4 lg:px-6 pt-6 pb-5">
        <div className="flex items-baseline justify-between">
          <p className="text-white text-2xl font-bold">Recently Played</p>
          {recentTracks.length > 0 && (
            <p className="text-[#1DB954] text-xs font-medium">
              {Math.min(recentTracks.length, 25)} tracks
            </p>
          )}
        </div>
        {name && <p className="text-gray-200 text-sm mt-1">For {name}</p>}
      </div>

      {/* Horizontal scrolling container - 25 most recent with scrollbar */}
      <div className="flex-1 min-h-0 overflow-x-auto horizontal-scrollbar scroll-fade-horizontal px-4 lg:px-6 pb-6">
        {recentTracks.length > 0 ? (
          <div className="flex gap-3 lg:gap-4 min-w-min pb-2">
            {recentTracks.slice(0, 25).map((item, index) => (
              <div
                key={item.id + index}
                className="flex-shrink-0 w-36 sm:w-40 bg-[rgba(255,255,255,0.03)] rounded-lg p-3 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(29,185,84,0.3)] active:scale-95 hover:bg-[rgba(255,255,255,0.05)]"
              >
                {/* Album cover */}
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full aspect-square rounded-md object-cover mb-2.5"
                />

                {/* Track Name */}
                <p className="text-white font-semibold text-[13px] leading-tight mb-1 line-clamp-2">
                  {item.name}
                </p>

                {/* Artist Name */}
                <p className="text-gray-200 text-[11px] truncate">{item.artists}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white text-center py-8">No data available.</p>
        )}
      </div>
    </div>
  );
}
