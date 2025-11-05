"use client";
import { useState, useEffect, useRef } from "react";
import ArtistModal from "./ArtistModal";

export default function UserTopArtists({ accessToken, userId, onLoadingChange }) {
    const [artistsCache, setArtistsCache] = useState({
        short_term: [],
        medium_term: [],
        long_term: [],
        all_time: []
    });
    const [playCountsCache, setPlayCountsCache] = useState({
        short_term: {},
        medium_term: {},
        long_term: {},
        all_time: {}
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
                // Fetch all three time ranges in parallel from Spotify API (no all_time from Spotify)
                const [shortTerm, mediumTerm, longTerm] = await Promise.all([
                    fetch(`https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=25`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=25`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    fetch(`https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=25`, {
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

                const formattedArtists = {
                    short_term: formatArtists(shortData),
                    medium_term: formatArtists(mediumData),
                    long_term: formatArtists(longData),
                    all_time: [] // Will be populated from database
                };

                setArtistsCache(formattedArtists);

                // Fetch play counts from database for all time ranges INCLUDING all_time
                if (userId) {
                    const [shortPlayCounts, mediumPlayCounts, longPlayCounts, allTimePlayCounts] = await Promise.all([
                        fetch(`/api/stats/top-artists?userId=${userId}&timeRange=short_term&limit=25`).then(res => res.json()),
                        fetch(`/api/stats/top-artists?userId=${userId}&timeRange=medium_term&limit=25`).then(res => res.json()),
                        fetch(`/api/stats/top-artists?userId=${userId}&timeRange=long_term&limit=25`).then(res => res.json()),
                        fetch(`/api/stats/top-artists?userId=${userId}&timeRange=all_time&limit=25`).then(res => res.json())
                    ]);

                    // Create lookup maps by artistId AND artistName (fallback)
                    const createPlayCountMap = (data) => {
                        const map = {};
                        if (data.artists) {
                            console.log(`📊 Processing ${data.artists.length} artists from database`);
                            data.artists.forEach(artist => {
                                // Map by artistId if available
                                if (artist.artistId) {
                                    map[artist.artistId] = artist.playCount;
                                }
                                // Also map by artistName as fallback (case-insensitive)
                                if (artist.artistName) {
                                    map[artist.artistName.toLowerCase()] = artist.playCount;
                                }
                            });
                            console.log(`📊 Created play count map with ${Object.keys(map).length} entries`);
                        }
                        return map;
                    };

                    setPlayCountsCache({
                        short_term: createPlayCountMap(shortPlayCounts),
                        medium_term: createPlayCountMap(mediumPlayCounts),
                        long_term: createPlayCountMap(longPlayCounts),
                        all_time: createPlayCountMap(allTimePlayCounts)
                    });

                    // For all_time, populate artists from database response
                    if (allTimePlayCounts.artists && allTimePlayCounts.artists.length > 0) {
                        console.log(`📊 Processing ${allTimePlayCounts.artists.length} all-time artists from database`);

                        // OPTIMIZATION: Create lookup map from medium_term artists to avoid redundant API calls
                        const mediumTermLookup = new Map();
                        formattedArtists.medium_term.forEach(artist => {
                            if (artist.name) {
                                mediumTermLookup.set(artist.name.toLowerCase(), {
                                    id: artist.id,
                                    image: artist.image
                                });
                            }
                        });
                        console.log(`✅ Created medium_term lookup with ${mediumTermLookup.size} artists`);

                        // Search for artist IDs by name ONLY for artists not in medium_term
                        const fetchArtistDataByNames = async () => {
                            const artistDataMap = {}; // Map artistName (lowercase) -> {id, image}
                            let cachedCount = 0;
                            let apiCallCount = 0;

                            try {
                                // Process each artist
                                for (const artist of allTimePlayCounts.artists.slice(0, 25)) {
                                    if (!artist.artistName) continue;

                                    const artistNameLower = artist.artistName.toLowerCase();

                                    // Check if artist exists in medium_term first
                                    if (mediumTermLookup.has(artistNameLower)) {
                                        artistDataMap[artistNameLower] = mediumTermLookup.get(artistNameLower);
                                        cachedCount++;
                                        console.log(`💾 Using cached data for "${artist.artistName}"`);
                                        continue;
                                    }

                                    // Only make API call if not found in medium_term
                                    try {
                                        const searchQuery = encodeURIComponent(artist.artistName);
                                        const response = await fetch(
                                            `https://api.spotify.com/v1/search?q=${searchQuery}&type=artist&limit=1`,
                                            { headers: { Authorization: `Bearer ${accessToken}` } }
                                        );

                                        if (response.ok) {
                                            const data = await response.json();
                                            if (data.artists?.items?.[0]) {
                                                const spotifyArtist = data.artists.items[0];
                                                artistDataMap[artistNameLower] = {
                                                    id: spotifyArtist.id,
                                                    image: spotifyArtist.images[0]?.url || ''
                                                };
                                                apiCallCount++;
                                                console.log(`🔍 API call for "${artist.artistName}"`);
                                            }
                                        }

                                        // Rate limiting: wait 100ms between requests
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                    } catch (err) {
                                        console.error(`❌ Error searching for "${artist.artistName}":`, err);
                                    }
                                }

                                console.log(`✅ Optimization results: ${cachedCount} cached, ${apiCallCount} API calls`);
                                return artistDataMap;
                            } catch (err) {
                                console.error('❌ Error fetching artist data:', err);
                                return {};
                            }
                        };

                        const artistDataMap = await fetchArtistDataByNames();

                        const allTimeArtists = allTimePlayCounts.artists.map((artist, index) => {
                            const spotifyData = artistDataMap[artist.artistName?.toLowerCase()];
                            return {
                                id: spotifyData?.id || artist.artistId || `no-id-${artist.artistName}-${index}`,
                                name: artist.artistName || '',
                                image: spotifyData?.image || ''
                            };
                        });

                        console.log(`📊 Created ${allTimeArtists.length} all-time artists, ${allTimeArtists.filter(a => a.image).length} with images`);

                        setArtistsCache(prev => ({
                            ...prev,
                            all_time: allTimeArtists
                        }));
                    }
                }
            } catch (err) {
                console.error("Error fetching artists:", err);
            } finally {
                setIsLoading(false);
                if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
            }
        };

        fetchAllTimeRanges();
    }, [accessToken, userId]);

    // Get current artists based on selected time range (no loading!)
    const currentArtists = artistsCache[timeRange];
    const currentPlayCounts = playCountsCache[timeRange];

    // Get play count for an artist (try by ID first, then by name)
    const getPlayCount = (artistId, artistName) => {
        if (!currentPlayCounts) return null;

        // Try by artistId first
        if (artistId && currentPlayCounts[artistId]) {
            return currentPlayCounts[artistId];
        }

        // Fallback to artistName (case-insensitive)
        if (artistName && currentPlayCounts[artistName.toLowerCase()]) {
            return currentPlayCounts[artistName.toLowerCase()];
        }

        return null;
    };

    // Format play count for display
    const formatPlayCount = (count) => {
        if (!count) return "N/A";
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    if (isLoading && onLoadingChange) {
        return null; // Return null while loading if parent handles overlay
    }

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            {/* Header (not inside overflow). No jump, always on top of this card */}
            <div className="z-10 px-4 lg:px-6 pt-6 pb-5">
                <p className="text-white text-2xl font-bold mb-4">Top Artists</p>
                <div className="flex justify-start gap-2 flex-wrap">
                    {["short_term", "medium_term", "long_term", "all_time"].map((range) => (
                        <button
                            key={range}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                timeRange === range
                                    ? "bg-[#1DB954] text-black"
                                    : "bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)]"
                            }`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range === "short_term" ? "4 Weeks" : range === "medium_term" ? "6 Months" : range === "long_term" ? "12 Months" : "All Time"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Horizontal scrollable container */}
            <div className="flex-1 min-h-0 overflow-x-auto horizontal-scrollbar px-4 lg:px-6 pb-6">
                {currentArtists.length > 0 ? (
                    <div className="flex gap-4 min-w-min pb-2">
                        {currentArtists.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex-shrink-0 w-40 lg:w-44 bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(29,185,84,0.3)] active:scale-95 lg:active:scale-100"
                                onClick={() => setSelectedArtist(item)}
                            >
                                {/* Artist Image */}
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-28 h-28 mx-auto rounded-full object-cover shadow-[0_8px_24px_rgba(29,185,84,0.3)] mb-4"
                                    />
                                ) : (
                                    <div className="w-28 h-28 mx-auto rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shadow-[0_8px_24px_rgba(29,185,84,0.3)] mb-4">
                                        <span className="text-white text-3xl font-bold">
                                            {item.name?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}

                                {/* Rank */}
                                <p className="text-[#1db954] text-[11px] font-bold uppercase tracking-wider mb-2 text-center">
                                    TOP #{index + 1}
                                </p>

                                {/* Artist Name */}
                                <p className="text-white font-semibold text-[15px] text-center mb-2 truncate">
                                    {item.name}
                                </p>

                                {/* Play Count Stats */}
                                <div className="flex items-center justify-center gap-1 text-[12px] text-[#b3b3b3]">
                                    <span className="text-[#1db954]">↑</span>
                                    <span>{formatPlayCount(getPlayCount(item.id, item.name))} plays</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-white text-center py-8">No data available.</p>
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
