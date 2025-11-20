"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";

export default function UserTopTracks({ accessToken, setShowInfoPage, onLoadingChange, onPlayClick }) {
    const [tracksCache, setTracksCache] = useState({
        short_term: [],
        medium_term: [],
        long_term: []
    });
    const [timeRange, setTimeRange] = useState("short_term");
    const [direction, setDirection] = useState(0);
    const [hoveredTrackId, setHoveredTrackId] = useState(null);
    const [playingTrackId, setPlayingTrackId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const onLoadingChangeRef = useRef(onLoadingChange);
    const hasFetchedRef = useRef(false);

    // Handle time range change with direction tracking
    const handleTimeRangeChange = (newRange) => {
        const ranges = ["short_term", "medium_term", "long_term"];
        const currentIndex = ranges.indexOf(timeRange);
        const newIndex = ranges.indexOf(newRange);
        setDirection(newIndex > currentIndex ? 1 : -1);
        setTimeRange(newRange);
    };

    // Animation variants for content with reduced motion support
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const contentVariants = {
        enter: (direction) => ({
            x: prefersReducedMotion ? 0 : (direction > 0 ? 300 : -300),
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: prefersReducedMotion ? 0 : (direction > 0 ? -300 : 300),
            opacity: 0,
        }),
    };

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
                    fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=30`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=30`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=30`, {
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

            // If clicking on the currently playing track, pause it
            if (playingTrackId === trackId) {
                const pauseRes = await fetch(
                    `https://api.spotify.com/v1/me/player/pause`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (pauseRes.status === 204) {
                    setPlayingTrackId(null);
                    console.log("⏸️ Track paused");
                }
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
                setPlayingTrackId(trackId);
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
        <div className="w-full h-full min-h-0 flex flex-col">
            {/* Header (fixed within card, not in scroll) */}
            <div className="z-10 px-4 lg:px-6 pt-6 pb-5">
                <p className="text-white text-2xl font-bold mb-4">Top Tracks</p>
                <div className="flex justify-start gap-2 relative">
                    {["short_term", "medium_term", "long_term"].map((range) => (
                        <button
                            key={range}
                            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors z-10 ${
                                timeRange === range
                                    ? "text-black"
                                    : "text-white hover:bg-[rgba(255,255,255,0.1)]"
                            }`}
                            onClick={() => handleTimeRangeChange(range)}
                        >
                            {timeRange === range && (
                                <motion.div
                                    layoutId="top-tracks-pill"
                                    className="absolute inset-0 bg-[#1DB954] rounded-lg"
                                    style={{ zIndex: -1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            {range === "short_term"
                                ? "4 Weeks"
                                : range === "medium_term"
                                ? "6 Months"
                                : "12 Months"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable list - Two columns on desktop, single column on mobile */}
            <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-4 lg:px-6 pb-6 max-h-[400px] lg:max-h-[402px]">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                    {currentTracks.length > 0 ? (
                        <motion.div
                            key={timeRange}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-3"
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            custom={direction}
                            transition={{ duration: 0.3 }}
                        >
                            {currentTracks.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-[rgba(255,255,255,0.03)] border border-transparent rounded-lg p-3 lg:p-4 flex items-center gap-3 lg:gap-4 transition-all hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] active:scale-[0.98] lg:active:scale-100 group"
                                onMouseEnter={() => setHoveredTrackId(item.id)}
                                onMouseLeave={() => setHoveredTrackId(null)}
                                data-tour={index === 0 ? "play-button" : undefined}
                            >
                                {/* Track number / Play/Pause icon */}
                                <button
                                    onClick={() => handlePlayTrack(item.uri, item.id)}
                                    className="w-12 h-12 lg:w-10 lg:h-10 flex items-center justify-center text-gray-200 flex-shrink-0 cursor-pointer"
                                    aria-label={playingTrackId === item.id ? `Pause ${item.name}` : `Play ${item.name}`}
                                >
                                    {playingTrackId === item.id ? (
                                        <Pause size={20} className="text-[#1DB954] fill-[#1DB954]" />
                                    ) : hoveredTrackId === item.id ? (
                                        <Play size={20} className="text-[#1DB954] fill-[#1DB954]" />
                                    ) : (
                                        <span className="text-base lg:text-lg font-semibold">{index + 1}</span>
                                    )}
                                </button>

                                {/* Album cover */}
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    loading="lazy"
                                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-md object-cover flex-shrink-0"
                                />

                                {/* Track info */}
                                <div className="flex-grow min-w-0">
                                    <p className="text-white font-semibold text-sm lg:text-base truncate">
                                        {item.name}
                                    </p>
                                    <p className="text-xs lg:text-sm text-gray-200 truncate">{item.artists}</p>
                                </div>
                            </div>
                        ))}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="no-data"
                            className="text-white text-center py-8"
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            custom={direction}
                            transition={{ duration: 0.3 }}
                        >
                            No data available.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
