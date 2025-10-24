"use client";
import { useState, useEffect, useRef } from "react";
import ArtistModal from "./ArtistModal";

export default function UserTopArtists({ accessToken, userId, onLoadingChange }) {
    const [artistsCache, setArtistsCache] = useState({
        short_term: [],
        medium_term: [],
        long_term: []
    });
    const [timeRange, setTimeRange] = useState("short_term");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedArtist, setSelectedArtist] = useState(null);
    const onLoadingChangeRef = useRef(onLoadingChange);
    const hasFetchedRef = useRef(false);

    // Keep ref up to date
    useEffect(() => {
        onLoadingChangeRef.current = onLoadingChange;
    }, [onLoadingChange]);

    useEffect(() => {
        if (!accessToken || hasFetchedRef.current) return;

        const fetchAllTimeRanges = async () => {
            hasFetchedRef.current = true;
            setIsLoading(true);
            if (onLoadingChangeRef.current) onLoadingChangeRef.current(true);

            try {
                // Fetch all three time ranges in parallel from Spotify API
                const [shortTerm, mediumTerm, longTerm] = await Promise.all([
                    fetch(`https://api.spotify.com/v1/me/top/artists?time_range=short_term`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/artists?time_range=long_term`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })
                ]);

                // Process all responses
                const formatArtists = (data) =>
                    data.items.map((artist) => ({
                        id: artist.id,
                        name: artist.name,
                        image: artist.images[0]?.url || "",
                    }));

                const [shortData, mediumData, longData] = await Promise.all([
                    shortTerm.json(),
                    mediumTerm.json(),
                    longTerm.json()
                ]);

                setArtistsCache({
                    short_term: formatArtists(shortData),
                    medium_term: formatArtists(mediumData),
                    long_term: formatArtists(longData)
                });
            } catch (err) {
                console.error("Error fetching artists:", err);
            } finally {
                setIsLoading(false);
                if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
            }
        };

        fetchAllTimeRanges();
    }, [accessToken]);

    // Get current artists based on selected time range (no loading!)
    const currentArtists = artistsCache[timeRange];

    if (isLoading && onLoadingChange) {
        return null; // Return null while loading if parent handles overlay
    }

    return (
        <div className="w-full h-full min-h-0 rounded-xl flex flex-col">
            {/* Header (not inside overflow). No jump, always on top of this card */}
            <div className="z-10 px-4 pt-5 pb-4 text-center shadow-md">
                <p className="text-[#1DB954] text-xl font-semibold">Top Artists</p>
                <div className="flex justify-center gap-2 mt-3">
                    {["short_term", "medium_term", "long_term"].map((range) => (
                        <button
                            key={range}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                timeRange === range
                                    ? "bg-[#1DB954] text-black font-medium"
                                    : "bg-[#282828] text-white font-medium hover:bg-[#333333]"
                            }`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range === "short_term" ? "4 Weeks" : range === "medium_term" ? "6 Months" : "12 Months"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable content area */}
            <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                {currentArtists.length > 0 ? (
                    <ul className="space-y-4 mt-3">
                        {currentArtists.map((item, index) => (
                            <li
                                key={item.id}
                                className="bg-[#18181B] border-1 border-[#0A0A0C] rounded-lg p-3 flex items-center gap-4 cursor-pointer hover:bg-[#282828] transition-colors"
                                onClick={() => setSelectedArtist(item)}
                            >
                                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover flex-none" />
                                <div className="flex-grow min-w-0">
                                    <p className="text-white font-semibold text-md truncate">
                                        {index + 1}. {item.name}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-white">No data available.</p>
                )}
            </div>

            {/* Artist Modal */}
            {selectedArtist && (
                <ArtistModal
                    artist={selectedArtist}
                    userId={userId}
                    onClose={() => setSelectedArtist(null)}
                />
            )}
        </div>
    );
}