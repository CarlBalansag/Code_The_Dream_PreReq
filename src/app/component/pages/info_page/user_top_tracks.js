"use client";
import { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";

export default function UserTopTracks({ accessToken, setShowInfoPage, onLoadingChange, onPlayClick }) {
    const [tracksCache, setTracksCache] = useState({
        short_term: [],
        medium_term: [],
        long_term: []
    });
    const [timeRange, setTimeRange] = useState("short_term");
    const [hoveredTrackId, setHoveredTrackId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
                // Fetch all three time ranges in parallel
                const [shortTerm, mediumTerm, longTerm] = await Promise.all([
                    fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })
                ]);

                // Process all responses
                const formatTracks = (data) => 
                    data.items.map((track) => ({
                        id: track.id,
                        name: track.name,
                        uri: track.uri,
                        image: track.album?.images[0]?.url || "",
                        artists: track.artists.map((a) => a.name).join(", "),
                    }));

                const [shortData, mediumData, longData] = await Promise.all([
                    shortTerm.json(),
                    mediumTerm.json(),
                    longTerm.json()
                ]);

                setTracksCache({
                    short_term: formatTracks(shortData),
                    medium_term: formatTracks(mediumData),
                    long_term: formatTracks(longData)
                });
            } catch (error) {
                console.error("Error fetching tracks:", error);
            } finally {
                setIsLoading(false);
                if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
            }
        };

        fetchAllTimeRanges();
    }, [accessToken]);

    // Get current tracks based on selected time range (no loading!)
    const currentTracks = tracksCache[timeRange];

    if (isLoading && onLoadingChange) {
        return null;
    }

    const handlePlayTrack = async (trackUri, trackId) => {
        try {
            const deviceRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const deviceData = await deviceRes.json();
            const activeDevice = deviceData.devices.find((d) => d.is_active);

            if (!activeDevice) {
                alert("No active Spotify device found. Open Spotify on a device and try again.");
                return;
            }

            if (onPlayClick) {
                onPlayClick(trackId, setShowInfoPage);
            }

            const playRes = await fetch(
                `https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ uris: [trackUri] }),
                }
            );

            if (playRes.status === 204) {
                console.log("✅ Track started playing");
            } else {
                const errorText = await playRes.text();
                console.error("❌ Failed to play track. Response:", errorText);
            }
        } catch (error) {
            console.error("🔥 Exception during playback:", error);
        }
    };

    return (
        <div className="w-full h-full min-h-0 rounded-xl bg-[#121212] flex flex-col">
            {/* Header (fixed within card, not in scroll) */}
            <div className="z-10 px-4 pt-5 pb-4 text-center shadow-md">
                <p className="text-[#1DB954] text-xl font-semibold">Top Tracks</p>
                <div className="flex justify-center gap-2 mt-3">
                    {["short_term", "medium_term", "long_term"].map((range) => (
                        <button
                            key={range}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                timeRange === range
                                    ? "bg-[#1DB954] text-white"
                                    : "bg-white hover:bg-gray-200 text-black"
                            }`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range === "short_term"
                                ? "4 Weeks"
                                : range === "medium_term"
                                ? "6 Months"
                                : "12 Months"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable list */}
            <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                {currentTracks.length > 0 ? (
                    <ul className="space-y-4 mt-3">
                        {currentTracks.map((item, index) => (
                            <li
                                key={item.id}
                                className="bg-[#212121] hover:bg-[#2a2a2a] rounded-lg p-3 flex items-center space-x-4 cursor-pointer transition-colors group"
                                onMouseEnter={() => setHoveredTrackId(item.id)}
                                onMouseLeave={() => setHoveredTrackId(null)}
                                onClick={() => handlePlayTrack(item.uri, item.id)}
                                data-tour={index === 0 ? "play-button" : undefined}
                            >
                                {/* Track number / Play icon */}
                                <div className="w-8 flex items-center justify-center text-gray-400 flex-shrink-0">
                                    {hoveredTrackId === item.id ? (
                                        <Play size={20} className="text-[#1DB954] fill-[#1DB954]" />
                                    ) : (
                                        <span className="text-sm font-medium">{index + 1}</span>
                                    )}
                                </div>

                                {/* Album cover */}
                                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />

                                {/* Track info */}
                                <div className="flex-grow min-w-0">
                                    <p className="text-white font-semibold text-md truncate group-hover:text-[#1DB954] transition-colors">
                                        {item.name}
                                    </p>
                                    <p className="text-sm text-gray-400 truncate">{item.artists}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-white">No data available.</p>
                )}
            </div>
        </div>
    );
}