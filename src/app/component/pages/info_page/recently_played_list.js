"use client";
import { useState, useEffect, useRef } from "react";

export default function RecentlyPlayedList({ accessToken, name, onLoadingChange }) {
    const [recentTracks, setRecentTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const onLoadingChangeRef = useRef(onLoadingChange);
    const isFetchingRef = useRef(false);

    // Keep ref up to date
    useEffect(() => {
        onLoadingChangeRef.current = onLoadingChange;
    }, [onLoadingChange]);

    useEffect(() => {
        if (!accessToken || isFetchingRef.current) return;

        const fetchRecentlyPlayed = async () => {
            isFetchingRef.current = true;
            setIsLoading(true);
            if (onLoadingChangeRef.current) onLoadingChangeRef.current(true);

            try {
                const res = await fetch(
                    `https://api.spotify.com/v1/me/player/recently-played?limit=30`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
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
                setRecentTracks(formatted);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setIsLoading(false);
                isFetchingRef.current = false;
                if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
            }
        };

        fetchRecentlyPlayed();
    }, [accessToken]);

    if (isLoading && onLoadingChange) {
        return null; // Return null while loading if parent handles overlay
    }

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            {/* Header (fixed within card, not in scroll) */}
            <div className="z-10 px-4 lg:px-6 pt-6 pb-5">
                <p className="text-white text-2xl font-bold">
                    Recently Played
                </p>
                {name && <p className="text-[#b3b3b3] text-sm mt-1">For {name}</p>}
            </div>

            {/* Horizontal scrollable container */}
            <div className="flex-1 min-h-0 overflow-x-auto horizontal-scrollbar px-4 lg:px-6 pb-6">
                {recentTracks.length > 0 ? (
                    <div className="flex gap-3 lg:gap-4 min-w-min pb-2">
                        {recentTracks.map((item, index) => (
                            <div
                                key={item.id + index}
                                className="flex-shrink-0 w-36 lg:w-40 bg-[rgba(255,255,255,0.03)] rounded-lg p-3 cursor-pointer transition-all active:scale-95"
                            >
                                {/* Album cover */}
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full aspect-square rounded-md object-cover mb-2.5"
                                />

                                {/* Track Name */}
                                <p className="text-white font-semibold text-[13px] leading-tight mb-1 line-clamp-2">
                                    {item.name}
                                </p>

                                {/* Artist Name */}
                                <p className="text-[#b3b3b3] text-[11px] truncate">
                                    {item.artists}
                                </p>
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
