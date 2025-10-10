"use client";
import { useEffect, useState, useRef } from "react";
import CirclePlayButton from "../components/circle_play_button";

export default function PremiumTopTracks({ artistId, accessToken, onLoadingChange }) {
    const [tracks, setTracks] = useState([]);
    const [artistName, setArtistName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const onLoadingChangeRef = useRef(onLoadingChange);
    const previousArtistIdRef = useRef(null);
    const isFetchingRef = useRef(false);

    // Keep ref up to date
    useEffect(() => {
        onLoadingChangeRef.current = onLoadingChange;
    }, [onLoadingChange]);

    useEffect(() => {
        // Prevent duplicate fetches
        if (!artistId || !accessToken || isFetchingRef.current) {
            return;
        }

        // Only fetch if artistId actually changed
        if (previousArtistIdRef.current === artistId) {
            return;
        }

        const fetchData = async () => {
            isFetchingRef.current = true;
            previousArtistIdRef.current = artistId;
            
            setIsLoading(true);
            // Notify parent that we're loading
            if (onLoadingChangeRef.current) onLoadingChangeRef.current(true);

            try {
                // Fetch top tracks
                const tracksRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (tracksRes.ok) {
                    const tracksData = await tracksRes.json();
                    const formattedTracks = tracksData.tracks.map((track) => ({
                        id: track.id,
                        name: track.name,
                        album: track.album.name,
                        image: track.album.images[0]?.url || "",
                        preview_url: track.preview_url,
                    }));
                    setTracks(formattedTracks);
                } else {
                    console.error("Error fetching artist's top tracks:", tracksRes.status);
                }

                // Fetch artist name
                const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (artistRes.ok) {
                    const artistData = await artistRes.json();
                    setArtistName(artistData.name);
                } else {
                    console.error("Error fetching artist name:", artistRes.status);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
                isFetchingRef.current = false;
                // Notify parent that we're done loading
                if (onLoadingChangeRef.current) onLoadingChangeRef.current(false);
            }
        };

        fetchData();
    }, [artistId, accessToken]);

    if (isLoading) {
        return null; // Return null while loading, parent will show overlay
    }

    if (!tracks || tracks.length === 0) {
        return <p className="text-white">No recommendations available.</p>;
    }

    return (
        <div className="custom-scrollbar p-4 rounded-md overflow-y-auto w-full max-w-lg" style={{ maxHeight: "800px" }}>
            <p className="text-[#1DB954] text-xl font-semibold mb-2 text-center">
                Top Tracks for {artistName}
            </p>
            <ul className="space-y-4">
                {tracks.map((track, index) => (
                    <li key={track.id} className="bg-[#212121] rounded-lg p-3 flex items-center space-x-4">
                        <img src={track.image} alt={track.name} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex items-center w-full">
                            <div className="flex-grow">
                                <p className="text-white font-semibold text-md">{index + 1}. {track.name}</p>
                                <p className="text-sm text-gray-400">{track.album}</p>
                            </div>
                            <div className="ml-auto">
                                {/* <CirclePlayButton /> */}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}