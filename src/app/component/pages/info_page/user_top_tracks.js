"use client";
import { useState, useEffect, useRef } from "react";
import CirclePlayButton from "../components/circle_play_button";

export default function UserTopTracks({ accessToken, setShowInfoPage, onLoadingChange, onPlayClick }) {
    const [topTracks, setTopTracks] = useState([]);
    const [timeRange, setTimeRange] = useState("short_term");
    const [currentTrackId, setCurrentTrackId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const onLoadingChangeRef = useRef(onLoadingChange);
    const isFetchingRef = useRef(false);

    // Keep ref up to date
    useEffect(() => {
        onLoadingChangeRef.current = onLoadingChange;
    }, [onLoadingChange]);

    useEffect(() => {
        if (!accessToken || isFetchingRef.current) return;

        const fetchTopTracks = async () => {
            isFetchingRef.current = true;
            setIsLoading(true);
            if (onLoadingChangeRef.current) onLoadingChangeRef.current(true);

            try {
                const res = await fetch(
                    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (!res.ok) {
                    console.error("Error fetching top tracks:", res.status);
                    return;
                }
                const data = await res.json();
                const formatted = data.items.map((track) => ({
                    id: track.id,
                    name: track.name,
                    uri: track.uri,
                    image: track.album?.images[0]?.url || "",
                    artists: track.artists.map((a) => a.name).join(", "),
                }));
                setTopTracks(formatted);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsLoading(false);
                isFetchingRef.current = false;
                if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
            }
        };

        fetchTopTracks();
    }, [accessToken, timeRange]);

    if (isLoading && onLoadingChange) {
        return null; // Return null while loading if parent handles overlay
    }

    return (
        <div className="w-full h-full min-h-0 rounded-xl bg-[#121212] flex flex-col">
            {/* Header (fixed within card, not in scroll) */}
            <div className="z-10 px-4 pt-5 pb-4 text-center shadow-md">
                <p className="text-[#1DB954] text-xl font-semibold">Top Tracks</p>
                <div className="flex justify-center gap-2 mt-3">
                    {["short_term", "medium_term", "long_term"].map((range) => (
                        <button
                            key={range}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
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
                {topTracks.length > 0 ? (
                    <ul className="space-y-4 mt-3">
                        {topTracks.map((item, index) => (
                            <li key={item.id} className="bg-[#212121] rounded-lg p-3">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 rounded-md object-cover flex-none"
                                    />
                                    <div className="flex-grow min-w-0">
                                        <p className="text-white font-semibold text-md truncate">
                                            {index + 1}. {item.name}
                                        </p>
                                        <p className="text-gray-400 text-sm truncate">By {item.artists}</p>
                                    </div>
                                    <div className="flex-none pr-10">
                                        <CirclePlayButton
                                            size={35}
                                            trackUri={item.uri}
                                            accessToken={accessToken}
                                            setCurrentTrackId={setCurrentTrackId}
                                            currentTrackId={currentTrackId}
                                            trackId={item.id}
                                            setShowInfoPage={setShowInfoPage}
                                            onPlayClick={onPlayClick}
                                        />
                                    </div>
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